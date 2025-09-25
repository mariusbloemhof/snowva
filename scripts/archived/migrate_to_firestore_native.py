#!/usr/bin/env python3
"""
Firebase Admin Panel Timestamp Migration Script - Firestore Native Format
Converts timestamp fields to the exact format Firestore uses internally.
"""

import json
import os
import shutil
from datetime import datetime
from pathlib import Path


def timestamp_to_firestore_format(timestamp_obj):
    """Convert timestamp object to Firestore native timestamp format"""
    try:
        if isinstance(timestamp_obj, dict) and (
            "seconds" in timestamp_obj or "_seconds" in timestamp_obj
        ):
            # Get seconds and nanoseconds values
            seconds = timestamp_obj.get("seconds") or timestamp_obj.get("_seconds", 0)
            nanoseconds = timestamp_obj.get("nanoseconds") or timestamp_obj.get(
                "_nanoseconds", 0
            )

            if seconds:
                # Firestore native timestamp format - this is what Firestore exports
                return {"_seconds": seconds, "_nanoseconds": nanoseconds}
        elif (
            isinstance(timestamp_obj, str)
            and "T" in timestamp_obj
            and "Z" in timestamp_obj
        ):
            # Convert ISO string back to Firestore timestamp format
            try:
                dt = datetime.fromisoformat(timestamp_obj.replace("Z", "+00:00"))
                seconds = int(dt.timestamp())
                nanoseconds = int((dt.timestamp() % 1) * 1_000_000_000)

                return {"_seconds": seconds, "_nanoseconds": nanoseconds}
            except:
                pass
        elif isinstance(timestamp_obj, dict) and "__datatype__" in timestamp_obj:
            # Convert from previous __datatype__ format back to native format
            if (
                timestamp_obj.get("__datatype__") == "timestamp"
                and "value" in timestamp_obj
            ):
                return timestamp_obj["value"]

        return timestamp_obj
    except Exception as e:
        print(f"Error converting timestamp {timestamp_obj}: {e}")
        return timestamp_obj


def migrate_timestamps_in_object(obj, path=""):
    """Recursively find and migrate timestamp objects"""
    if isinstance(obj, dict):
        # Convert timestamp fields
        date_fields = [
            "effectiveDate",
            "date",
            "validUntil",
            "issueDate",
            "dueDate",
            "createdAt",
            "updatedAt",
        ]
        for field in date_fields:
            if field in obj:
                original_value = obj[field]
                converted_value = timestamp_to_firestore_format(original_value)
                if converted_value != original_value:
                    print(f"Converting {field} at {path}: Firebase native format")
                    obj[field] = converted_value

        # Recursively process all dictionary values
        for key, value in obj.items():
            migrate_timestamps_in_object(value, f"{path}.{key}")

    elif isinstance(obj, list):
        # Process all list items
        for i, item in enumerate(obj):
            migrate_timestamps_in_object(item, f"{path}[{i}]")


def migrate_file(file_path, backup_suffix=None):
    """Migrate a single JSON file"""
    if not os.path.exists(file_path):
        print(f"ℹ️ File not found: {file_path}")
        return False

    # Create backup
    if backup_suffix:
        backup_path = f"{file_path}.backup_{backup_suffix}"
        shutil.copy2(file_path, backup_path)
        print(f"✅ Backup created: {backup_path}")

    # Load and migrate data
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    migrate_timestamps_in_object(data)

    # Save migrated data
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    return True


def main():
    print("🚀 FIREBASE NATIVE TIMESTAMP MIGRATION")
    print("==================================================")
    print("Converting to Firestore native timestamp format (_seconds/_nanoseconds)...")

    # Get current timestamp for backup suffix
    backup_suffix = datetime.now().strftime("%Y%m%d_%H%M%S")

    # File paths
    products_file = "data/normalized/products.json"
    customers_file = "data/normalized/customers.json"
    quotes_file = "data/normalized/quotes.json"

    # Migrate products
    print(f"\n🔄 Migrating products file: {products_file}")
    if migrate_file(products_file, backup_suffix):
        print("✅ Products migration complete!")

    # Migrate customers
    print(f"\n🔄 Migrating customers file: {customers_file}")
    if migrate_file(customers_file, backup_suffix):
        print("✅ Customers migration complete!")

    # Migrate quotes (if exists)
    print(f"\n🔄 Checking for quotes file: {quotes_file}")
    if migrate_file(quotes_file, backup_suffix):
        print("✅ Quotes migration complete!")
    else:
        print("ℹ️ No quotes file found (this is okay)")

    print(f"\n🎉 FIRESTORE NATIVE MIGRATION COMPLETE!")
    print("==================================================")
    print("✅ All timestamps converted to Firestore native format")
    print('✅ Format: {"_seconds": X, "_nanoseconds": Y}')
    print("✅ Backups created for all modified files")
    print("✅ Data ready for Firebase admin panel upload")


if __name__ == "__main__":
    main()
