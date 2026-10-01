#!/usr/bin/env python3
"""
High-Resolution Image Upgrader for Clothing E-Commerce Platform
Downloads crisp 384x512 product photography from the high-resolution dataset
and ensures all catalog items and campaign banners have crystal clear assets.
"""

import json
import logging
import os
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image, ImageFilter
import io

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("image_upgrader")

FRONTEND_IMAGES_DIR = "/Users/milindverma/Desktop/Clothing/frontend/public/images"
PROCESSED_IMAGES_DIR = "/Users/milindverma/Desktop/Clothing/data/processed/images"
PRODUCTS_JSONL = "/Users/milindverma/Desktop/Clothing/data/processed/products.jsonl"

os.makedirs(FRONTEND_IMAGES_DIR, exist_ok=True)
os.makedirs(PROCESSED_IMAGES_DIR, exist_ok=True)

def load_target_products():
    with open(PRODUCTS_JSONL, "r", encoding="utf-8") as f:
        return [json.loads(line) for line in f]

def fetch_page_metadata(offset):
    url = f"https://datasets-server.huggingface.co/rows?dataset=ceyda%2Ffashion-products-small&config=default&split=train&offset={offset}&limit=100"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=20) as res:
            data = json.loads(res.read().decode("utf-8"))
            items = {}
            for r in data.get("rows", []):
                row = r["row"]
                pid = str(row["id"])
                img_src = row.get("image", {}).get("src")
                if img_src:
                    items[pid] = img_src
            return items
    except Exception as e:
        logger.error(f"Failed to fetch offset {offset}: {e}")
        return {}

def download_image(pid, url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            content = res.read()
            p1 = os.path.join(FRONTEND_IMAGES_DIR, f"{pid}.jpg")
            p2 = os.path.join(PROCESSED_IMAGES_DIR, f"{pid}.jpg")
            with open(p1, "wb") as f:
                f.write(content)
            with open(p2, "wb") as f:
                f.write(content)
            return pid, len(content), True
    except Exception as e:
        logger.error(f"Failed to download image for {pid}: {e}")
        return pid, 0, False

def enhance_fallback_image(pid):
    """
    If a product does not have a remote high-res image,
    apply high-quality Lanczos upsampling (4x) and unsharp masking
    to avoid pixelation and blurriness.
    """
    p1 = os.path.join(FRONTEND_IMAGES_DIR, f"{pid}.jpg")
    if not os.path.exists(p1):
        return
    try:
        im = Image.open(p1)
        if im.size[0] < 300 or im.size[1] < 400:
            # Upsample 60x80 to 384x512
            im_upscaled = im.resize((384, 512), Image.Resampling.LANCZOS)
            # Apply unsharp mask to restore edge contrast
            im_enhanced = im_upscaled.filter(ImageFilter.UnsharpMask(radius=2, percent=150, threshold=3))
            p2 = os.path.join(PROCESSED_IMAGES_DIR, f"{pid}.jpg")
            im_enhanced.save(p1, "JPEG", quality=95)
            im_enhanced.save(p2, "JPEG", quality=95)
            logger.info(f"Enhanced fallback image for {pid} -> 384x512")
    except Exception as e:
        logger.error(f"Failed to enhance image {pid}: {e}")

def main():
    products = load_target_products()
    target_ids = {str(p["externalProductId"]) for p in products}
    logger.info(f"Loaded {len(target_ids)} target product IDs.")

    # 1. Fetch metadata across first 5 pages (500 products) in parallel
    logger.info("Fetching high-resolution image index from Hugging Face...")
    id_to_url = {}
    with ThreadPoolExecutor(max_workers=5) as ex:
        futures = [ex.submit(fetch_page_metadata, offset) for offset in range(0, 500, 100)]
        for f in as_completed(futures):
            id_to_url.update(f.result())

    matched_ids = target_ids.intersection(id_to_url.keys())
    logger.info(f"Found {len(matched_ids)} / {len(target_ids)} matched high-res URLs.")

    # 2. Download matched high-resolution images in parallel
    logger.info("Downloading high-resolution product photography (384x512)...")
    success_count = 0
    with ThreadPoolExecutor(max_workers=16) as ex:
        futures = [ex.submit(download_image, pid, id_to_url[pid]) for pid in matched_ids]
        for f in as_completed(futures):
            pid, size, ok = f.result()
            if ok:
                success_count += 1
                if success_count % 25 == 0 or success_count == len(matched_ids):
                    logger.info(f"Downloaded {success_count}/{len(matched_ids)} high-res images...")

    # 3. For any remaining IDs, apply high-quality Lanczos enhancement
    unmatched_ids = target_ids - matched_ids
    logger.info(f"Applying high-quality enhancement for {len(unmatched_ids)} remaining items...")
    for pid in unmatched_ids:
        enhance_fallback_image(pid)

    logger.info("Image upgrade completed successfully!")

if __name__ == "__main__":
    main()
