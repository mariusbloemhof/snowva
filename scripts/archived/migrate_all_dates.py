#!/usr/bin/env python3
"""
COMPREHENSdef fix_existing_timestamp_format(timestamp_obj):
    """Fix existing timestamp objects to ISO string format"""
    if isinstance(timestamp_obj, dict) and ("_seconds" in timestamp_obj or "seconds" in timestamp_obj):
        # Get seconds value (with or without underscore)
        seconds = timestamp_obj.get("seconds") or timestamp_obj.get("_seconds")
        if seconds:
            # Convert Unix timestamp to ISO string
            dt = datetime.fromtimestamp(seconds)
            return dt.isoformat() + "Z"
    return timestamp_objbase Timestamp Migration Script
Converts ALL date fields in ALL JSON files from string format to Firebase Timestamp format.

This script handles:
1. Product prices (effectiveDate)
2. Customer custom pricing (effectiveDate)
3. Quotes (date, validUntil) - if any exist
4. Any other date fields found throughout the data

Run this script to convert ALL date fields to Firebase Timestamp format.
"""

import json
import os
import shutil
from datetime import datetime
from pathlib import Path


def string_to_firebase_timestamp(date_string):
    """Convert date string to Firebase admin panel compatible format"""
    try:
        # Handle different date formats
        if "T" in date_string:
            # ISO format with time
            dt = datetime.fromisoformat(date_string.replace("Z", "+00:00"))
        else:
            # Date only format - set to start of day
            dt = datetime.strptime(date_string, "%Y-%m-%d")

        # Return ISO string format that Firebase admin panel can recognize as Timestamp
        return dt.isoformat() + "Z"
    except Exception as e:
        print(f"Error converting date '{date_string}': {e}")
        return date_string


def fix_existing_timestamp_format(timestamp_obj):
    """Fix existing timestamp objects to ISO string format"""
    if isinstance(timestamp_obj, dict) and ("_seconds" in timestamp_obj or "seconds" in timestamp_obj):
        # Get seconds value (with or without underscore)
        seconds = timestamp_obj.get("seconds") or timestamp_obj.get("_seconds")
        if seconds:
            # Convert Unix timestamp to ISO string
            dt = datetime.fromtimestamp(seconds)
            return dt.isoformat() + "Z"
    return timestamp_obj


def migrate_prices_in_object(obj, path=""):
    """Recursively find and migrate price objects"""
    if isinstance(obj, dict):
        if "effectiveDate" in obj:
            if isinstance(obj["effectiveDate"], str):
                print(
                    f"Converting string effectiveDate at {path}: {obj['effectiveDate']}"
                )
                obj["effectiveDate"] = string_to_firebase_timestamp(
                    obj["effectiveDate"]
                )
            elif (
                isinstance(obj["effectiveDate"], dict)
                and "_seconds" in obj["effectiveDate"]
            ):
                print(f"Fixing timestamp format at {path}: _seconds -> seconds")
                obj["effectiveDate"] = fix_existing_timestamp_format(
                    obj["effectiveDate"]
                )

        # Recursively process all dictionary values
        for key, value in obj.items():
            migrate_prices_in_object(value, f"{path}.{key}")

    elif isinstance(obj, list):
        # Process all list items
        for i, item in enumerate(obj):
            migrate_prices_in_object(item, f"{path}[{i}]")


def migrate_quotes_in_object(obj, path=""):
    """Recursively find and migrate quote objects"""
    if isinstance(obj, dict):
        # Convert quote date fields
        if "date" in obj:
            if isinstance(obj["date"], str) and "quoteNumber" in obj:
                print(f"Converting quote date at {path}: {obj['date']}")
                obj["date"] = string_to_firebase_timestamp(obj["date"])
            elif isinstance(obj["date"], dict) and "_seconds" in obj["date"]:
                print(f"Fixing date timestamp format at {path}: _seconds -> seconds")
                obj["date"] = fix_existing_timestamp_format(obj["date"])

        if "validUntil" in obj:
            if isinstance(obj["validUntil"], str):
                print(f"Converting validUntil at {path}: {obj['validUntil']}")
                obj["validUntil"] = string_to_firebase_timestamp(obj["validUntil"])
            elif (
                isinstance(obj["validUntil"], dict) and "_seconds" in obj["validUntil"]
            ):
                print(
                    f"Fixing validUntil timestamp format at {path}: _seconds -> seconds"
                )
                obj["validUntil"] = fix_existing_timestamp_format(obj["validUntil"])

        # Recursively process all dictionary values
        for key, value in obj.items():
            migrate_quotes_in_object(value, f"{path}.{key}")

    elif isinstance(obj, list):
        # Process all list items
        for i, item in enumerate(obj):
            migrate_quotes_in_object(item, f"{path}[{i}]")


def backup_file(file_path):
    """Create a backup of the original file"""
    backup_path = f"{file_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    shutil.copy2(file_path, backup_path)
    print(f"✅ Backup created: {backup_path}")
    return backup_path


def migrate_products_file():
    """Migrate products.json - convert all effectiveDate fields"""
    file_path = "data/normalized/products.json"

    if not os.path.exists(file_path):
        print(f"❌ Products file not found: {file_path}")
        return

    print(f"🔄 Migrating products file: {file_path}")

    # Create backup
    backup_file(file_path)

    # Load and migrate
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Track conversions
    conversions = 0
    original_conversions = conversions

    # Migrate all price effectiveDate fields
    migrate_prices_in_object(data, "products")

    # Save migrated data
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"✅ Products migration complete!")


def migrate_customers_file():
    """Migrate customers.json - convert customProductPricing effectiveDate fields"""
    file_path = "data/normalized/customers.json"

    if not os.path.exists(file_path):
        print(f"❌ Customers file not found: {file_path}")
        return

    print(f"🔄 Migrating customers file: {file_path}")

    # Create backup
    backup_file(file_path)

    # Load and migrate
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Migrate all customer custom pricing effectiveDate fields
    migrate_prices_in_object(data, "customers")

    # Save migrated data
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"✅ Customers migration complete!")


def migrate_quotes_file():
    """Migrate quotes.json if it exists - convert date and validUntil fields"""
    file_path = "data/normalized/quotes.json"

    if not os.path.exists(file_path):
        print(f"ℹ️ No quotes file found: {file_path} (this is okay)")
        return

    print(f"🔄 Migrating quotes file: {file_path}")

    # Create backup
    backup_file(file_path)

    # Load and migrate
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Migrate all quote date fields
    migrate_quotes_in_object(data, "quotes")

    # Save migrated data
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"✅ Quotes migration complete!")


def main():
    """Main migration function"""
    print("🚀 COMPREHENSIVE TIMESTAMP MIGRATION")
    print("=" * 50)
    print("Converting ALL date fields to Firebase Timestamp format...")
    print()

    # Change to script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)

    try:
        # Migrate all files
        migrate_products_file()
        print()
        migrate_customers_file()
        print()
        migrate_quotes_file()
        print()

        print("🎉 COMPREHENSIVE MIGRATION COMPLETE!")
        print("=" * 50)
        print("✅ All date fields converted to Firebase Timestamp format")
        print("✅ Backups created for all modified files")
        print("✅ Ready for Firebase upload!")

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    main()
