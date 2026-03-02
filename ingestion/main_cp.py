"""
TealMart Product Ingestion Service
CJ Dropshipping Integration with Smart Category Mapping
"""
import os
import json
import random
from typing import List, Dict, Optional
from fastapi import FastAPI, HTTPException, Header, Body
from pydantic import BaseModel
import requests
import psycopg2
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime, timezone

import urllib.parse

load_dotenv()

def get_db_connection():
    parsed = urllib.parse.urlparse(DATABASE_URL)
    clean_url = parsed._replace(query="").geturl()
    return psycopg2.connect(clean_url, sslmode="require")

# -------------------------
# CONFIGURATION
# -------------------------
CJ_API_KEY = os.getenv("CJ_API_KEY")
CJ_API_URL = "https://developers.cjdropshipping.com/api2.0/v1"
TOKEN_CACHE_FILE = Path("/tmp/cj_token_cache.json")
DATABASE_URL = os.getenv("DATABASE_URL")
API_KEY = os.getenv("INGESTION_API_KEY", "your-secure-api-key")

# -------------------------
# SMART CATEGORY MAPPING
# -------------------------
CATEGORY_MAPPINGS = {
    # Electronics & Tech
    "electronics": ["electronics", "gadgets", "tech"],
    "phone": ["phone", "mobile", "cell-phone", "smartphone"],
    "computer": ["computer", "laptop", "pc", "tablet"],
    "audio": ["headphones", "earbuds", "speaker", "audio"],
    "camera": ["camera", "photography", "video"],
    "gaming": ["gaming", "console", "game", "controller"],
    "smartwatch": ["smartwatch", "smart-watch", "fitness-tracker"],
    
    # Fashion & Accessories
    "fashion": ["fashion", "clothing", "apparel"],
    "mens-fashion": ["mens", "men", "male"],
    "womens-fashion": ["womens", "women", "female", "ladies"],
    "shoes": ["shoes", "footwear", "sneakers", "boots"],
    "bags": ["bags", "backpack", "handbag", "purse", "luggage"],
    "watches": ["watch", "watches", "timepiece"],
    "jewelry": ["jewelry", "necklace", "bracelet", "ring", "earrings"],
    "accessories": ["accessories", "belt", "wallet", "sunglasses"],
    
    # Home & Living
    "home-garden": ["home", "garden", "outdoor"],
    "furniture": ["furniture", "chair", "table", "desk", "sofa"],
    "kitchen": ["kitchen", "cookware", "utensils", "dining"],
    "bedding": ["bedding", "sheets", "pillows", "blankets"],
    "decor": ["decor", "decoration", "wall-art", "lighting"],
    "storage": ["storage", "organizer", "rack", "holder"],
    
    # Health & Beauty
    "beauty": ["beauty", "cosmetics", "makeup"],
    "skincare": ["skincare", "skin-care", "facial"],
    "haircare": ["hair", "haircare", "shampoo"],
    "health": ["health", "wellness", "vitamins"],
    "fitness": ["fitness", "exercise", "workout", "gym"],
    
    # Sports & Outdoors
    "sports": ["sports", "athletic"],
    "outdoor": ["outdoor", "camping", "hiking"],
    "cycling": ["cycling", "bike", "bicycle"],
    
    # Toys & Kids
    "toys": ["toys", "toy", "kids", "children"],
    "baby": ["baby", "infant", "newborn", "diaper"],
    
    # Automotive
    "automotive": ["car", "auto", "vehicle", "automotive"],
    
    # Pet Supplies
    "pets": ["pet", "dog", "cat", "animal"],
}

def map_to_tealmart_category(cj_category: str = None, keyword: str = None) -> str:
    """
    Smart category mapping:
    1. Try to map CJ category
    2. Fall back to keyword
    3. Default to 'general'
    """
    
    # Normalize inputs
    cj_cat_lower = (cj_category or "").lower().strip()
    keyword_lower = (keyword or "").lower().strip()
    
    # Try CJ category first
    if cj_cat_lower:
        for tealmart_cat, keywords in CATEGORY_MAPPINGS.items():
            for kw in keywords:
                if kw in cj_cat_lower:
                    return tealmart_cat
    
    # Fall back to search keyword
    if keyword_lower:
        for tealmart_cat, keywords in CATEGORY_MAPPINGS.items():
            for kw in keywords:
                if kw in keyword_lower:
                    return tealmart_cat
    
    # Default
    return "general"

def get_category_tags(category: str, keyword: str = None) -> List[str]:
    """Generate relevant tags based on category and keyword"""
    tags = ["cj-dropshipping", "verified"]
    
    # Add category
    if category and category != "general":
        tags.append(category)
    
    # Add keyword if it's different from category
    if keyword:
        keyword_clean = keyword.lower().strip()
        if keyword_clean and keyword_clean not in tags and keyword_clean != category:
            tags.append(keyword_clean)
    
    return tags

# -------------------------
# MODELS
# -------------------------
class IngestionRequest(BaseModel):
    count: int = 20
    keyword: Optional[str] = None
    category: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None

class IngestionResult(BaseModel):
    success: bool
    productsAdded: int
    productsUpdated: int
    totalFetched: int
    errors: List[str]
    source: str
    categoriesUsed: List[str] = []

# -------------------------
# CJ AUTHENTICATION (unchanged)
# -------------------------
def get_cj_access_token():
    if not CJ_API_KEY:
        raise Exception("CJ_API_KEY missing in .env")
    if TOKEN_CACHE_FILE.exists():
        with open(TOKEN_CACHE_FILE, "r") as f:
            cache = json.load(f)
        access_expiry = datetime.fromisoformat(cache["access_token_expiry_date"])
        refresh_expiry = datetime.fromisoformat(cache["refresh_token_expiry_date"])
        now = datetime.now(timezone.utc)
        if now < access_expiry:
            print("[CJ CACHE] ✅ Using valid access token")
            return cache["access_token"]
        if now < refresh_expiry:
            print("[CJ CACHE] 🔄 Refreshing access token...")
            return refresh_access_token(cache["refresh_token"])
        print("[CJ CACHE] ❌ Refresh token expired. Getting new token...")
    return fetch_new_token()

def fetch_new_token():
    print("[CJ AUTH] Requesting new access token...")
    response = requests.post(
        f"{CJ_API_URL}/authentication/getAccessToken",
        json={"apiKey": CJ_API_KEY},
        headers={"Content-Type": "application/json"},
        timeout=30
    )
    if response.status_code != 200:
        raise Exception(f"CJ Auth HTTP error: {response.text}")
    data = response.json()
    if data.get("code") != 200:
        raise Exception(f"CJ Authentication failed: {data}")
    return cache_token(data["data"])

def refresh_access_token(refresh_token):
    response = requests.post(
        f"{CJ_API_URL}/authentication/refreshAccessToken",
        json={"refreshToken": refresh_token},
        headers={"Content-Type": "application/json"},
        timeout=30
    )
    if response.status_code != 200:
        raise Exception(f"CJ Refresh HTTP error: {response.text}")
    data = response.json()
    if data.get("code") != 200:
        print("[CJ] Refresh failed. Getting new token...")
        return fetch_new_token()
    return cache_token(data["data"])

def cache_token(data):
    access_expiry = datetime.fromisoformat(data["accessTokenExpiryDate"].replace("Z", "+00:00"))
    refresh_expiry = datetime.fromisoformat(data["refreshTokenExpiryDate"].replace("Z", "+00:00"))
    TOKEN_CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(TOKEN_CACHE_FILE, "w") as f:
        json.dump({
            "access_token": data["accessToken"],
            "refresh_token": data["refreshToken"],
            "access_token_expiry_date": access_expiry.isoformat(),
            "refresh_token_expiry_date": refresh_expiry.isoformat()
        }, f)
    print("[CJ AUTH] ✅ Token cached successfully")
    return data["accessToken"]

# -------------------------
# FASTAPI APP
# -------------------------
app = FastAPI(title="TealMart Ingestion - Smart Categories")

# -------------------------
# CJ PRODUCT FETCH WITH SMART CATEGORIES
# -------------------------
def fetch_cj_products_v2(
    keyword: str = None,
    category_id: str = None,
    count: int = 20,
    min_price: float = None,
    max_price: float = None
) -> tuple[List[Dict], List[str]]:
    """Returns (products, categories_used)"""
    
    def parse_price(value):
        if not value:
            return 0.0
        if isinstance(value, (int, float)):
            return float(value)
        value = str(value).replace('--', ' ').replace('$', '').replace('USD', '').strip()
        if '-' in value:
            value = value.split('-')[0].strip()
        try:
            return float(value)
        except:
            return 0.0

    try:
        access_token = get_cj_access_token()
        headers = {
            "CJ-Access-Token": access_token,
            "Content-Type": "application/json"
        }
        
        products = []
        categories_used = set()
        page = 1
        remaining = count
        
        while remaining > 0:
            size = min(remaining, 100)
            params = {"page": page, "size": size}
            
            if keyword:
                params["keyWord"] = keyword
            if category_id:
                params["categoryId"] = category_id
            if min_price:
                params["startSellPrice"] = min_price
            if max_price:
                params["endSellPrice"] = max_price

            print(f"🔄 Fetching from CJ (page {page}, size {size})...")
            response = requests.get(
                f"{CJ_API_URL}/product/listV2",
                headers=headers,
                params=params,
                timeout=30
            )
            
            if response.status_code != 200:
                raise Exception(f"CJ API error {response.status_code}")

            data = response.json()
            content = data.get("data", {}).get("content", [])
            
            if not content or len(content[0].get("productList", [])) == 0:
                break

            product_list = content[0].get("productList", [])
            
            for item in product_list:
                try:
                    product_id = item.get("id")
                    title = (item.get("nameEn") or "").strip()
                    
                    if not title:
                        continue
                        
                    description = (item.get("description") or "").strip() or title
                    sell_price = parse_price(item.get("discountPrice") or item.get("sellPrice"))
                    original_price = parse_price(item.get("sellPrice") or sell_price)
                    
                    if sell_price <= 0:
                        continue

                    images = []
                    big_image = item.get("bigImage")
                    if big_image:
                        images.append(big_image)
                    if not images:
                        continue

                    # Get CJ category
                    cj_category = item.get("threeCategoryName", "")
                    
                    # SMART CATEGORY MAPPING
                    tealmart_category = map_to_tealmart_category(cj_category, keyword)
                    categories_used.add(tealmart_category)
                    
                    # SMART TAGS
                    tags = get_category_tags(tealmart_category, keyword)

                    inventory = item.get("totalVerifiedInventory", 0)
                    if inventory < 10:
                        continue

                    product = {
                        "title": title[:200],
                        "description": description[:1000],
                        "price": sell_price,
                        "costPrice": sell_price * 0.7,
                        "compareAtPrice": original_price if original_price > sell_price else sell_price * 1.3,
                        "images": images[:5],
                        "category": tealmart_category,
                        "tags": tags,
                        "rating": round(random.uniform(4.3, 5.0), 1),
                        "reviewCount": random.randint(50, 500),
                        "source": "cj-dropshipping",
                        "externalId": f"cj_{product_id}"
                    }
                    products.append(product)
                    
                except Exception as e:
                    print(f"⚠️ Error processing item: {e}")
                    continue
                    
            remaining -= len(product_list)
            page += 1
            
        print(f"✅ Processed {len(products)} products")
        print(f"📁 Categories used: {', '.join(sorted(categories_used))}")
        
        return products, list(categories_used)
        
    except Exception as e:
        print(f"❌ CJ fetch error: {e}")
        raise

# -------------------------
# PRICING & FILTERING (unchanged)
# -------------------------
def apply_pricing_rules(products: List[Dict], conn) -> List[Dict]:
    filtered = []
    cursor = conn.cursor()
    cursor.execute('SELECT category, markup, "minRating" FROM "PricingRule" WHERE "isActive" = true')
    rules = {row[0]: {"markup": row[1], "minRating": row[2]} for row in cursor.fetchall()}
    cursor.close()

    for product in products:
        min_rating = rules.get(product["category"], {}).get("minRating", 4.2)
        if product.get("rating", 0) < min_rating:
            continue
        markup = rules.get(product["category"], {}).get("markup", 1.3)
        if product.get("costPrice"):
            product["price"] = round(product["costPrice"] * markup - 0.01, 2)
        filtered.append(product)
    return filtered

# -------------------------
# IMPORT PRODUCTS (with proper array handling)
# -------------------------
def import_products(products: List[Dict], conn) -> IngestionResult:
    cursor = conn.cursor()
    added = 0
    updated = 0
    errors = []
    categories_used = set()
    
    for product in products:
        try:
            categories_used.add(product["category"])
            cursor.execute(
                'SELECT id FROM "Product" WHERE "externalId" = %s',
                (product.get("externalId"),)
            )
            existing = cursor.fetchone()
            
            # Ensure tags is proper list and never null
            tags_array = product.get("tags", [])
            if tags_array is None:
                tags_array = []
            else:
                tags_array = [tag for tag in tags_array if tag and tag.strip()]
            
            # Ensure images is proper array
            images_array = product.get("images", [])
            if images_array is None:
                images_array = []
            
            if existing:
                cursor.execute('''
                    UPDATE "Product"
                    SET title = %s, description = %s, price = %s,
                        "costPrice" = %s, "compareAtPrice" = %s,
                        images = %s, category = %s, tags = %s::text[],
                        rating = %s, "reviewCount" = %s, "updatedAt" = NOW()
                    WHERE "externalId" = %s
                ''', (
                    product["title"], product["description"], product["price"],
                    product.get("costPrice"), product.get("compareAtPrice"),
                    images_array, product["category"], tags_array,
                    product.get("rating"), product["reviewCount"],
                    product.get("externalId")
                ))
                updated += 1
            else:
                cursor.execute('''
                    INSERT INTO "Product" (
                        id, "externalId", title, description, price,
                        "costPrice", "compareAtPrice", images, category,
                        tags, rating, "reviewCount", source, "isActive",
                        stock, "createdAt", "updatedAt"
                    ) VALUES (
                        gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, %s,
                        %s::text[], %s, %s, %s, true, 100, NOW(), NOW()
                    )
                ''', (
                    product.get("externalId"), product["title"], product["description"],
                    product["price"], product.get("costPrice"), product.get("compareAtPrice"),
                    images_array, product["category"], tags_array,
                    product.get("rating"), product["reviewCount"], product["source"]
                ))
                added += 1
            conn.commit()
        except Exception as e:
            conn.rollback()
            errors.append(f"Error: {product.get('title', 'unknown')}: {str(e)}")
    
    cursor.close()
    return IngestionResult(
        success=len(errors) == 0,
        productsAdded=added,
        productsUpdated=updated,
        totalFetched=len(products),
        errors=errors,
        source="cj-dropshipping",
        categoriesUsed=sorted(list(categories_used))
    )

# -------------------------
# API ENDPOINTS
# -------------------------
@app.get("/")
def root():
    return {
        "service": "TealMart Ingestion - Smart Categories",
        "status": "running",
        "version": "4.0",
        "features": ["smart-category-mapping", "keyword-based-categories"],
        "categories": list(CATEGORY_MAPPINGS.keys())
    }

@app.post("/ingest")
async def ingest_products(
    request: IngestionRequest = Body(...),
    x_api_key: str = Header(None, alias="X-API-Key")
):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    try:
        conn = get_db_connection()
        
        all_products, _ = fetch_cj_products_v2(
            keyword=request.keyword,
            category_id=request.category,
            count=request.count,
            min_price=request.min_price,
            max_price=request.max_price
        )

        if not all_products:
            return IngestionResult(
                success=True, productsAdded=0, productsUpdated=0,
                totalFetched=0, errors=["No products found."],
                source="cj-dropshipping", categoriesUsed=[]
            )

        filtered_products = apply_pricing_rules(all_products, conn)
        result = import_products(filtered_products, conn)

        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO "IngestionLog" (
                id, source, "productsAdded", "productsUpdated",
                errors, status, "createdAt"
            ) VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, NOW())
        ''', (
            f"cj-{request.keyword or 'general'}",
            result.productsAdded, result.productsUpdated,
            "\n".join(result.errors) if result.errors else None,
            "success" if result.success else "partial"
        ))
        conn.commit()
        cursor.close()
        conn.close()

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats")
async def get_stats(x_api_key: str = Header(None, alias="X-API-Key")):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM "Product" WHERE "isActive" = true')
        total = cursor.fetchone()[0]
        cursor.execute('SELECT category, COUNT(*) FROM "Product" GROUP BY category')
        by_category = dict(cursor.fetchall())
        cursor.execute('SELECT source, COUNT(*) FROM "Product" GROUP BY source')
        by_source = dict(cursor.fetchall())
        cursor.close()
        conn.close()
        return {
            "totalProducts": total,
            "byCategory": by_category,
            "bySource": by_source
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
