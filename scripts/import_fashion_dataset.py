#!/usr/bin/env python3
"""
Fashion Product Dataset Import & Processing Script
==================================================

Processes the local Hugging Face dataset (ashraq/fashion-product-images-small)
stored in Parquet format, validates metadata and image bytes, extracts
images into data/processed/images/{id}.jpg, and generates structured,
deduplicated product metadata ready for PostgreSQL / Spring Boot ingestion.

Usage:
    # Run full import (validates schema, extracts images, exports products.jsonl)
    python scripts/import_fashion_dataset.py

    # Dry-run validation only (no images written)
    python scripts/import_fashion_dataset.py --dry-run

    # Process first 500 records as test
    python scripts/import_fashion_dataset.py --limit 500

    # Process metadata without extracting images
    python scripts/import_fashion_dataset.py --skip-images
"""

import argparse
import csv
import json
import logging
import math
import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

import pyarrow.parquet as pq

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("fashion_importer")

REQUIRED_COLUMNS: Set[str] = {
    "id",
    "gender",
    "masterCategory",
    "subCategory",
    "articleType",
    "baseColour",
    "season",
    "year",
    "usage",
    "productDisplayName",
    "image",
}


def discover_parquet_files(dataset_dir: Path) -> List[Path]:
    """Recursively discover all Parquet files in the dataset directory."""
    if not dataset_dir.exists():
        raise FileNotFoundError(f"Dataset directory not found: {dataset_dir}")

    parquet_files = sorted(dataset_dir.rglob("*.parquet"))
    if not parquet_files:
        raise FileNotFoundError(
            f"No .parquet files found in directory: {dataset_dir}"
        )

    logger.info(f"Discovered {len(parquet_files)} Parquet file(s):")
    for pf in parquet_files:
        logger.info(f"  - {pf} ({pf.stat().st_size / (1024 * 1024):.2f} MB)")
    return parquet_files


def validate_schema(parquet_files: List[Path]) -> Tuple[Set[str], Set[str]]:
    """
    Validate that all required columns are present in each Parquet file.
    Reports missing columns and logs unexpected columns without failing unnecessarily.
    """
    first_schema = pq.read_schema(parquet_files[0])
    present_columns = set(first_schema.names)

    missing = REQUIRED_COLUMNS - present_columns
    if missing:
        raise ValueError(
            f"Dataset validation error: Missing required column(s): {sorted(missing)}"
        )

    unexpected = present_columns - REQUIRED_COLUMNS
    if unexpected:
        logger.warning(f"Detected unexpected column(s) (will be preserved): {sorted(unexpected)}")

    logger.info("Schema validation passed. All required columns present:")
    for col in sorted(REQUIRED_COLUMNS):
        logger.info(f"  ✓ {col}")

    return present_columns, unexpected


def clean_string(val: Optional[str]) -> Optional[str]:
    """Strip whitespace and normalize empty strings to None."""
    if val is None:
        return None
    cleaned = str(val).strip()
    return cleaned if cleaned else None


def clean_year(val: Optional[float]) -> Optional[int]:
    """Convert float64 year to integer if valid, else None."""
    if val is None:
        return None
    try:
        if math.isnan(val) or math.isinf(val):
            return None
        year_int = int(round(val))
        # Basic sanity check for fashion catalog year
        if 1900 <= year_int <= 2100:
            return year_int
        return year_int
    except (ValueError, TypeError, OverflowError):
        return None


def process_dataset(
    dataset_dir: Path,
    output_dir: Path,
    extract_images: bool = True,
    dry_run: bool = False,
    limit: Optional[int] = None,
    batch_size: int = 1000,
) -> Dict[str, any]:
    """
    Extract, clean, validate, and write processed product data and images.
    """
    parquet_files = discover_parquet_files(dataset_dir)
    validate_schema(parquet_files)

    images_dir = output_dir / "images"
    if not dry_run:
        output_dir.mkdir(parents=True, exist_ok=True)
        if extract_images:
            images_dir.mkdir(parents=True, exist_ok=True)

    seen_ids: Set[int] = set()
    records_processed = 0
    records_extracted = 0
    duplicate_count = 0
    missing_image_count = 0
    invalid_name_count = 0

    master_categories: Dict[str, int] = {}
    genders: Dict[str, int] = {}
    sub_categories: Dict[str, int] = {}
    article_types: Dict[str, int] = {}

    jsonl_path = output_dir / "products.jsonl"
    csv_path = output_dir / "products.csv"
    summary_path = output_dir / "summary.json"

    jsonl_file = None
    csv_file = None
    csv_writer = None

    if not dry_run:
        jsonl_file = open(jsonl_path, "w", encoding="utf-8")
        csv_file = open(csv_path, "w", encoding="utf-8", newline="")
        csv_writer = csv.writer(csv_file)
        # Header matching our database staging schema
        csv_writer.writerow([
            "externalProductId",
            "name",
            "gender",
            "masterCategory",
            "subCategory",
            "articleType",
            "baseColour",
            "season",
            "releaseYear",
            "usage",
            "imageFileName",
            "imageRelativePath",
        ])

    try:
        for pfile in parquet_files:
            if limit and records_extracted >= limit:
                break

            logger.info(f"Reading file: {pfile.name}")
            table = pq.read_table(pfile)
            num_rows = table.num_rows
            logger.info(f"File contains {num_rows} records. Processing batches...")

            for batch in table.to_batches(max_chunksize=batch_size):
                if limit and records_extracted >= limit:
                    break

                batch_dict = batch.to_pydict()
                ids = batch_dict["id"]
                genders_raw = batch_dict["gender"]
                master_cats = batch_dict["masterCategory"]
                sub_cats = batch_dict["subCategory"]
                art_types = batch_dict["articleType"]
                base_colours = batch_dict["baseColour"]
                seasons = batch_dict["season"]
                years = batch_dict["year"]
                usages = batch_dict["usage"]
                names = batch_dict["productDisplayName"]
                images = batch_dict["image"]

                for i in range(len(ids)):
                    if limit and records_extracted >= limit:
                        break

                    records_processed += 1
                    raw_id = ids[i]

                    # Deduplication check
                    if raw_id in seen_ids:
                        duplicate_count += 1
                        continue
                    seen_ids.add(raw_id)

                    # Value normalization
                    product_id = int(raw_id)
                    name = clean_string(names[i])
                    gender = clean_string(genders_raw[i])
                    master_cat = clean_string(master_cats[i])
                    sub_cat = clean_string(sub_cats[i])
                    art_type = clean_string(art_types[i])
                    color = clean_string(base_colours[i])
                    season = clean_string(seasons[i])
                    usage = clean_string(usages[i])
                    release_year = clean_year(years[i])

                    # Basic validation
                    if not name:
                        invalid_name_count += 1
                        name = f"{art_type or 'Item'} #{product_id}"

                    # Tally category analytics
                    if master_cat:
                        master_categories[master_cat] = master_categories.get(master_cat, 0) + 1
                    if gender:
                        genders[gender] = genders.get(gender, 0) + 1
                    if sub_cat:
                        sub_categories[sub_cat] = sub_categories.get(sub_cat, 0) + 1
                    if art_type:
                        article_types[art_type] = article_types.get(art_type, 0) + 1

                    # Image extraction
                    img_struct = images[i]
                    img_bytes = img_struct.get("bytes") if isinstance(img_struct, dict) else None
                    image_filename = f"{product_id}.jpg"
                    image_relative_path = f"images/{image_filename}"

                    if not img_bytes:
                        missing_image_count += 1
                    elif extract_images and not dry_run:
                        img_dest = images_dir / image_filename
                        if not img_dest.exists():
                            with open(img_dest, "wb") as img_f:
                                img_f.write(img_bytes)

                    # Prepare processed record
                    processed_record = {
                        "externalProductId": product_id,
                        "name": name,
                        "gender": gender,
                        "masterCategory": master_cat,
                        "subCategory": sub_cat,
                        "articleType": art_type,
                        "baseColour": color,
                        "season": season,
                        "releaseYear": release_year,
                        "usage": usage,
                        "imageFileName": image_filename if img_bytes else None,
                        "imageRelativePath": image_relative_path if img_bytes else None,
                    }

                    if not dry_run:
                        jsonl_file.write(json.dumps(processed_record, ensure_ascii=False) + "\n")
                        csv_writer.writerow([
                            processed_record["externalProductId"],
                            processed_record["name"],
                            processed_record["gender"],
                            processed_record["masterCategory"],
                            processed_record["subCategory"],
                            processed_record["articleType"],
                            processed_record["baseColour"],
                            processed_record["season"],
                            processed_record["releaseYear"],
                            processed_record["usage"],
                            processed_record["imageFileName"],
                            processed_record["imageRelativePath"],
                        ])

                    records_extracted += 1

                    if records_extracted % 5000 == 0:
                        logger.info(f"Processed and staged {records_extracted} products...")

    finally:
        if jsonl_file:
            jsonl_file.close()
        if csv_file:
            csv_file.close()

    summary = {
        "datasetDirectory": str(dataset_dir),
        "totalRowsRead": records_processed,
        "uniqueProductsExtracted": records_extracted,
        "duplicateIdsRemoved": duplicate_count,
        "missingImagesCount": missing_image_count,
        "invalidNamesHandled": invalid_name_count,
        "masterCategoriesCount": len(master_categories),
        "genders": genders,
        "topMasterCategories": sorted(master_categories.items(), key=lambda x: x[1], reverse=True),
        "topSubCategories": sorted(sub_categories.items(), key=lambda x: x[1], reverse=True)[:15],
        "topArticleTypes": sorted(article_types.items(), key=lambda x: x[1], reverse=True)[:15],
        "dryRun": dry_run,
        "imagesExtracted": extract_images and not dry_run,
    }

    if not dry_run:
        with open(summary_path, "w", encoding="utf-8") as sum_f:
            json.dump(summary, sum_f, indent=2)

    logger.info("=" * 60)
    logger.info("IMPORT & PROCESSING SUMMARY")
    logger.info("=" * 60)
    logger.info(f"Total Rows Examined:       {records_processed}")
    logger.info(f"Unique Products Extracted: {records_extracted}")
    logger.info(f"Duplicate IDs:             {duplicate_count}")
    logger.info(f"Missing Image Bytes:       {missing_image_count}")
    logger.info(f"Categories Breakdown:      {master_categories}")
    logger.info(f"Gender Breakdown:          {genders}")
    if not dry_run:
        logger.info(f"Outputs generated:")
        logger.info(f"  - Metadata JSONL: {jsonl_path}")
        logger.info(f"  - Metadata CSV:   {csv_path}")
        logger.info(f"  - Summary JSON:   {summary_path}")
        if extract_images:
            logger.info(f"  - Images Directory: {images_dir}/")
    logger.info("=" * 60)

    return summary


def main():
    parser = argparse.ArgumentParser(
        description="Process and stage the local Fashion Product Images dataset."
    )
    parser.add_argument(
        "--dataset-dir",
        type=Path,
        default=Path("fashion-product-images"),
        help="Directory containing local Parquet dataset (default: fashion-product-images)",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("data/processed"),
        help="Directory to save processed metadata and extracted images (default: data/processed)",
    )
    parser.add_argument(
        "--skip-images",
        action="store_true",
        help="Skip extracting image binaries to disk (processes metadata only)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Validate schema, deduplicate, and show statistics without writing to disk",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit number of records to process (useful for quick verification)",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=1000,
        help="Batch size for reading Parquet tables (default: 1000)",
    )

    args = parser.parse_args()

    try:
        process_dataset(
            dataset_dir=args.dataset_dir,
            output_dir=args.output_dir,
            extract_images=not args.skip_images,
            dry_run=args.dry_run,
            limit=args.limit,
            batch_size=args.batch_size,
        )
    except Exception as e:
        logger.error(f"Import process failed: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
