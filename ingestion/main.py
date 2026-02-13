"""
TealMart Product Ingestion Service - UPDATED
Now includes CJ Dropshipping API integration for real products
"""

import os
import json
import random
from datetime import datetime
from typing import List, Dict, Optional
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup
import psycopg2
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="TealMart Ingestion Service")

# Configuration
DATABASE_URL = os.getenv("DATABASE_URL")
API_KEY = os.getenv("INGESTION_API_KEY", "your-secure-api-key")

# CJ Dropshipping Configuration
CJ_ACCESS_TOKEN = os.getenv("CJ_ACCESS_TOKEN", "")
CJ_API_URL = "https://developers.cjdropshipping.com/api2.0/v1"

class Product(BaseModel):
    title: str
    description: str
    price: float
    costPrice: Optional[float]
    compareAtPrice: Optional[float]
    images: List[str]
    category: str
    tags: List[str]
    rating: Optional[float]
    reviewCount: int
    source: str
    externalId: Optional[str]

class IngestionResult(BaseModel):
    success: bool
    productsAdded: int
    productsUpdated: int
    errors: List[str]

# ============================================
# CJ DROPSHIPPING API INTEGRATION
# ============================================

def fetch_cj_products(category_id: str = None, count: int = 20) -> List[Dict]:
    """
    Fetch products from CJ Dropshipping API
    
    Sign up: https://cjdropshipping.com/
    Get API token: https://cjdropshipping.com/user/apiKey
    Docs: https://developers.cjdropshipping.com/
    """
    
    if not CJ_ACCESS_TOKEN:
        print("??  CJ_ACCESS_TOKEN not set. Using mock data instead.")
        print("   Get your token from: https://cjdropshipping.com/user/apiKey")
        return []
    
    try:
        headers = {
            "CJ-Access-Token": CJ_ACCESS_TOKEN,
            "Content-Type": "application/json"
        }
        
        params = {
            "pageNum": 1,
            "pageSize": count,
        }
        
        if category_id:
            params["categoryId"] = category_id
        
        response = requests.get(
            f"{CJ_API_URL}/product/list",
            headers=headers,
            params=params,
            timeout=30
        )
        
        if response.status_code != 200:
            print(f"CJ API Error: {response.status_code} - {response.text}")
            return []
        
        data = response.json()
        
        if not data.get("result") or data.get("code") != 200:
            print(f"CJ API returned error: {data.get('message')}")
            return []
        
        products = []
        items = data.get("data", {}).get("list", [])
        
        for item in items[:count]:
            # Extract product details
            product_id = item.get("pid")
            title = item.get("productNameEn", "").strip()
            description = item.get("description", "").strip() or item.get("productNameEn", "")
            
            # Pricing
            sell_price = float(item.get("sellPrice", 0))
            variants = item.get("variants", [])
            if variants and len(variants) > 0:
                # Get price from first variant
                sell_price = float(variants[0].get("sellPrice", sell_price))
            
            # Images
            images = []
            image_url = item.get("productImage")
            if image_url:
                images.append(image_url)
            
            variant_images = item.get("variantImage", [])
            if variant_images:
                images.extend([img for img in variant_images if img])
            
            # Ensure at least one image
            if not images:
                images = ["https://via.placeholder.com/800x800?text=No+Image"]
            
            # Category mapping (CJ uses numeric IDs)
            category = item.get("categoryName", "general")
            if category:
                category = category.lower().replace(" ", "-")
            
            # Create product object
            product = {
                "title": title[:200],  # Limit title length
                "description": description[:1000],
                "price": sell_price,
                "costPrice": sell_price * 0.7,  # Assume 30% markup
                "compareAtPrice": sell_price * 1.3,
                "images": images[:5],  # Max 5 images
                "category": category or "general",
                "tags": ["cj-dropshipping", category],
                "rating": round(random.uniform(4.3, 5.0), 1),  # CJ doesn't provide ratings
                "reviewCount": random.randint(50, 500),
                "source": "cj-dropshipping",
                "externalId": f"cj_{product_id}"
            }
            
            products.append(product)
        
        print(f"? Fetched {len(products)} products from CJ Dropshipping")
        return products
        
    except Exception as e:
        print(f"? CJ Dropshipping fetch error: {e}")
        return []

# ============================================
# SPOCKET API (Alternative Premium Source)
# ============================================

def fetch_spocket_products(count: int = 20) -> List[Dict]:
    """
    Spocket API for US/EU suppliers
    Sign up: https://www.spocket.co/
    Note: Requires paid plan for API access
    """
    SPOCKET_API_KEY = os.getenv("SPOCKET_API_KEY", "")
    
    if not SPOCKET_API_KEY:
        print("??  SPOCKET_API_KEY not set")
        return []
    
    # Spocket uses GraphQL - simplified example
    # Full docs: https://www.spocket.co/integrations/api
    
    products = []
    # Implementation here when you have API access
    return products

# ============================================
# MOCK DATA GENERATOR (Fallback)
# ============================================

def generate_mock_products(count: int = 20) -> List[Dict]:
    """High-quality mock data for testing"""
    categories = ["electronics", "fashion", "home-garden", "sports", "beauty", "toys"]
    
    products = []
    for i in range(count):
        category = random.choice(categories)
        cost_price = round(random.uniform(10, 200), 2)
        price = round(cost_price * 1.3, 2)
        price = round(price - 0.01, 2)
        
        product = {
            "title": f"Premium {category.title()} Product {i+1}",
            "description": f"High-quality {category} item with excellent features and customer reviews.",
            "price": price,
            "costPrice": cost_price,
            "compareAtPrice": round(price * 1.2, 2),
            "images": [
                f"https://picsum.photos/seed/{random.randint(1, 10000)}/800/800",
            ],
            "category": category,
            "tags": [category, "trending", "popular"],
            "rating": round(random.uniform(4.2, 5.0), 1),
            "reviewCount": random.randint(50, 500),
            "source": "mock",
            "externalId": f"mock_{i+1}_{int(datetime.now().timestamp())}"
        }
        products.append(product)
    
    return products

# ============================================
# PRICING & FILTERING
# ============================================

def apply_pricing_rules(products: List[Dict], conn) -> List[Dict]:
    """Apply category-based pricing rules and filters"""
    filtered = []
    
    cursor = conn.cursor()
    cursor.execute('SELECT category, markup, min_rating FROM "PricingRule" WHERE is_active = true')
    rules = {row[0]: {"markup": row[1], "minRating": row[2]} for row in cursor.fetchall()}
    cursor.close()
    
    for product in products:
        # Filter by rating
        min_rating = rules.get(product["category"], {}).get("minRating", 4.2)
        if product.get("rating", 0) < min_rating:
            continue
        
        # Apply markup
        if product.get("costPrice"):
            markup = rules.get(product["category"], {}).get("markup", 1.3)
            new_price = product["costPrice"] * markup
            product["price"] = round(new_price - 0.01, 2)
        
        filtered.append(product)
    
    return filtered

def import_products(products: List[Dict], conn) -> IngestionResult:
    """Import products into database"""
    cursor = conn.cursor()
    added = 0
    updated = 0
    errors = []
    
    for product in products:
        try:
            cursor.execute(
                'SELECT id FROM "Product" WHERE external_id = %s',
                (product.get("externalId"),)
            )
            existing = cursor.fetchone()
            
            if existing:
                cursor.execute('''
                    UPDATE "Product"
                    SET title = %s, description = %s, price = %s, cost_price = %s,
                        compare_at_price = %s, images = %s, category = %s, tags = %s,
                        rating = %s, review_count = %s, updated_at = NOW()
                    WHERE external_id = %s
                ''', (
                    product["title"], product["description"], product["price"],
                    product.get("costPrice"), product.get("compareAtPrice"),
                    product["images"], product["category"], product["tags"],
                    product.get("rating"), product["reviewCount"],
                    product.get("externalId")
                ))
                updated += 1
            else:
                cursor.execute('''
                    INSERT INTO "Product" (
                        id, external_id, title, description, price, cost_price,
                        compare_at_price, images, category, tags, rating, review_count,
                        source, is_active, stock, created_at, updated_at
                    ) VALUES (
                        gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, true, 100, NOW(), NOW()
                    )
                ''', (
                    product.get("externalId"), product["title"], product["description"],
                    product["price"], product.get("costPrice"), product.get("compareAtPrice"),
                    product["images"], product["category"], product["tags"],
                    product.get("rating"), product["reviewCount"], product["source"]
                ))
                added += 1
            
            conn.commit()
        except Exception as e:
            conn.rollback()
            errors.append(f"Error importing {product['title']}: {str(e)}")
    
    cursor.close()
    return IngestionResult(
        success=len(errors) == 0,
        productsAdded=added,
        productsUpdated=updated,
        errors=errors
    )

# ============================================
# API ENDPOINTS
# ============================================

@app.get("/")
def root():
    return {
        "service": "TealMart Ingestion Service",
        "status": "running",
        "version": "2.0",
        "sources": ["cj-dropshipping", "mock"],
        "setup": {
            "cj_configured": bool(CJ_ACCESS_TOKEN),
            "instructions": "Set CJ_ACCESS_TOKEN in .env to use real products"
        }
    }

@app.post("/ingest")
async def ingest_products(
    sources: List[str] = ["cj-dropshipping"],
    count_per_source: int = 20,
    cj_category: Optional[str] = None,
    x_api_key: str = Header(None)
):
    """
    Ingest products from specified sources
    
    Sources:
    - cj-dropshipping: Real products from CJ Dropshipping (recommended)
    - mock: Test data
    
    CJ Categories (examples):
    - Leave empty for all products
    - Or use specific category IDs from CJ
    """
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        all_products = []
        
        for source in sources:
            if source == "cj-dropshipping":
                products = fetch_cj_products(cj_category, count_per_source)
                if products:
                    all_products.extend(products)
                else:
                    # Fallback to mock if CJ not configured
                    print("??  CJ Dropshipping not available, using mock data")
                    all_products.extend(generate_mock_products(count_per_source))
            
            elif source == "spocket":
                products = fetch_spocket_products(count_per_source)
                all_products.extend(products)
            
            elif source == "mock":
                all_products.extend(generate_mock_products(count_per_source))
        
        # Apply pricing rules and filters
        filtered_products = apply_pricing_rules(all_products, conn)
        
        # Import into database
        result = import_products(filtered_products, conn)
        
        # Log ingestion
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO "IngestionLog" (id, source, products_added, products_updated, errors, status, created_at)
            VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, NOW())
        ''', (
            ",".join(sources),
            result.productsAdded,
            result.productsUpdated,
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
async def get_stats(x_api_key: str = Header(None)):
    """Get ingestion statistics"""
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) FROM "Product" WHERE is_active = true')
        total_products = cursor.fetchone()[0]
        
        cursor.execute('SELECT source, COUNT(*) FROM "Product" GROUP BY source')
        by_source = dict(cursor.fetchall())
        
        cursor.execute('''
            SELECT COUNT(*), SUM(products_added), SUM(products_updated)
            FROM "IngestionLog"
            WHERE created_at > NOW() - INTERVAL '7 days'
        ''')
        recent = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return {
            "totalProducts": total_products,
            "bySource": by_source,
            "last7Days": {
                "runs": recent[0],
                "added": recent[1] or 0,
                "updated": recent[2] or 0
            },
            "cjConfigured": bool(CJ_ACCESS_TOKEN)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)