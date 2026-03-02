import os
import json
import time
import requests
from pathlib import Path
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from prisma import Prisma, Json
from dotenv import load_dotenv

load_dotenv()

CJ_API_KEY = os.getenv("CJ_API_KEY")
CJ_API_URL = "https://developers.cjdropshipping.com/api2.0/v1"
TOKEN_CACHE_FILE = Path("/tmp/cj_token_cache.json")
API_KEY = "Craigbes123"

app = FastAPI()
db = Prisma()


class IngestRequest(BaseModel):
    count: int = 10
    keyword: str | None = None


# =========================
# STARTUP / SHUTDOWN
# =========================

@app.on_event("startup")
async def startup():
    await db.connect()


@app.on_event("shutdown")
async def shutdown():
    await db.disconnect()


# =========================
# TOKEN CACHE
# =========================

def cache_token(data):
    try:
        access_exp = datetime.fromisoformat(
            data["accessTokenExpiryDate"].replace("Z", "+00:00")
        )
    except Exception:
        access_exp = datetime.now(timezone.utc)

    TOKEN_CACHE_FILE.write_text(json.dumps({
        "access_token": data["accessToken"],
        "access_token_expiry_date": access_exp.isoformat()
    }))

    print("🔑 Token cached until", access_exp)
    return data["accessToken"]


def get_cj_access_token():
    if TOKEN_CACHE_FILE.exists():
        try:
            cache = json.load(open(TOKEN_CACHE_FILE))
            exp = datetime.fromisoformat(cache["access_token_expiry_date"])
            if datetime.now(timezone.utc) < exp:
                return cache["access_token"]
        except Exception:
            pass

    return fetch_new_token()


def fetch_new_token():
    print("🔑 Fetching new CJ token...")
    resp = requests.post(
        f"{CJ_API_URL}/authentication/getAccessToken",
        json={"apiKey": CJ_API_KEY},
        timeout=30
    )

    data = resp.json()
    if data.get("code") != 200:
        raise Exception(f"CJ auth failed: {data}")

    return cache_token(data["data"])


# =========================
# FETCH PRODUCT LIST
# =========================

def fetch_cj_products_v2(keyword=None, count=10):
    token = get_cj_access_token()
    headers = {"CJ-Access-Token": token}

    page = 1
    remaining = count
    products = []

    while remaining > 0:
        size = min(remaining, 10)

        params = {"page": page, "size": size}
        if keyword:
            params["keyWord"] = keyword

        resp = requests.get(
            f"{CJ_API_URL}/product/listV2",
            headers=headers,
            params=params,
            timeout=30
        )

        data = resp.json()

        content = data.get("data", {}).get("content", [])
        if not content:
            break

        product_list = content[0].get("productList", [])
        if not product_list:
            break

        products.extend(product_list)
        remaining -= len(product_list)
        page += 1

    print(f"✅ Total fetched: {len(products)}")
    return products[:count]


# =========================
# FETCH PRODUCT DETAIL
# =========================

def fetch_product_detail(pid):
    token = get_cj_access_token()

    resp = requests.get(
        f"{CJ_API_URL}/product/query",
        headers={"CJ-Access-Token": token},
        params={"pid": pid},
        timeout=30
    )

    data = resp.json()

    if data.get("code") != 200:
        print("❌ Detail error:", data)
        return None

    return data.get("data")


# =========================
# HELPERS
# =========================

def safe_float(value):
    try:
        return float(value)
    except:
        return 0.0


# 🔥 CRITICAL FIX: HANDLE STRINGIFIED JSON IMAGE ARRAYS
def extract_images(detail):
    images = []

    raw_main = detail.get("productImage")
    raw_list = detail.get("productImageList")

    def parse_possible_json(value):
        if not value:
            return []

        if isinstance(value, list):
            return value

        if isinstance(value, str):
            value = value.strip()

            # if it's a JSON array string
            if value.startswith("["):
                try:
                    parsed = json.loads(value)
                    if isinstance(parsed, list):
                        return parsed
                except Exception:
                    return []

            # otherwise assume single URL
            return [value]

        return []

    images.extend(parse_possible_json(raw_main))
    images.extend(parse_possible_json(raw_list))

    # Keep only valid URLs
    cleaned = [
        img for img in images
        if isinstance(img, str) and img.startswith("http")
    ]

    cleaned = list(dict.fromkeys(cleaned))

    print("🖼 CLEANED IMAGES:", cleaned)
    return cleaned


def extract_variants(detail):
    sku_list = detail.get("skuList") or []
    variants = []

    for sku in sku_list:
        variants.append({
            "sku": sku.get("sku"),
            "price": safe_float(sku.get("sellPrice")),
            "stock": sku.get("inventory") or 0,
            "image": sku.get("skuImage"),
            "property": sku.get("property")
        })

    print(f"📦 Variants extracted: {len(variants)}")
    return variants


# =========================
# SAVE PRODUCT
# =========================

async def save_product(detail):
    pid = detail.get("pid")
    if not pid:
        return

    title = detail.get("productNameEn") or detail.get("productName") or "Untitled"
    description = detail.get("description") or ""

    images = extract_images(detail)
    variants = extract_variants(detail)

    price = safe_float(detail.get("sellPrice"))

    if variants:
        prices = [v["price"] for v in variants if v["price"] > 0]
        if prices:
            price = min(prices)

    print(f"💾 Saving: {title}")
    print(f"🖼 Image count: {len(images)}")
    print(f"📦 Variant count: {len(variants)}")
    print(f"💰 Price: {price}")

    await db.product.upsert(
        where={"externalId": pid},
        data={
            "create": {
                "externalId": pid,
                "title": title,
                "description": description,
                "price": price,
                "images": images,
                "category": detail.get("categoryName") or "general",
                "variants": Json(variants),
                "source": "CJ"
            },
            "update": {
                "title": title,
                "description": description,
                "price": price,
                "images": images,
                "category": detail.get("categoryName") or "general",
                "variants": Json(variants),
                "source": "CJ"
            }
        }
    )

    print("✅ Saved")


# =========================
# INGEST ENDPOINT
# =========================

@app.post("/ingest")
async def ingest(request: IngestRequest, x_api_key: str = Header(None)):
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401)

    base_products = fetch_cj_products_v2(
        keyword=request.keyword,
        count=request.count
    )

    if not base_products:
        return {"success": True, "message": "No products found"}

    saved = 0

    for p in base_products:
        pid = p.get("id")
        if not pid:
            continue

        detail = fetch_product_detail(pid)

        if detail:
            await save_product(detail)
            saved += 1
            time.sleep(1.1)  # rate limit safety

    return {"success": True, "saved": saved}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000)
