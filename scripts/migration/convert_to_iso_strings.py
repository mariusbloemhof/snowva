#!/usr/bin/env python3
"""
Convert all timestamp objects to ISO string format for Firebase admin panel.
The admin panel automatically converts ISO strings to Timestamp objects.
"""

import json
import os
import shutil
from datetime import datetime


def timestamp_to_iso_string(timestamp_obj):
    """Convert Firebase timestamp object to ISO string"""
    try:
        if isinstance(timestamp_obj, dict):
            # Handle {_seconds, _nanoseconds} format
            if "_seconds" in timestamp_obj:
                seconds = timestamp_obj["_seconds"]
            elif "seconds" in timestamp_obj:
                seconds = timestamp_obj["seconds"]
            else:
                return timestamp_obj

            # Convert Unix timestamp to ISO string
            dt = datetime.fromtimestamp(seconds)
            return dt.isoformat() + "Z"
        return timestamp_obj
    except Exception as e:
        print(f"Error converting timestamp {timestamp_obj}: {e}")
        return timestamp_obj


def convert_object(obj, path=""):
    """Recursively convert all timestamp fields to ISO strings"""
    if isinstance(obj, dict):
        converted = {}
        for key, value in obj.items():
            if key in [
                "effectiveDate",
                "paymentDate",
                "issueDate",
                "dueDate",
                "date",
                "validUntil",
                "createdAt",
                "updatedAt",
            ]:
                converted[key] = timestamp_to_iso_string(value)
                if converted[key] != value:
                    print(f"Converted {key} at {path}")
            else:
                converted[key] = convert_object(value, f"{path}.{key}")
        return converted
    elif isinstance(obj, list):
        return [convert_object(item, f"{path}[{i}]") for i, item in enumerate(obj)]
    else:
        return obj


def convert_file(file_path):
    """Convert a single JSON file"""
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return False

    print(f"🔄 Converting {file_path}...")

    # Create backup
    backup_path = f"{file_path}.backup_iso"
    shutil.copy2(file_path, backup_path)
    print(f"✅ Backup created: {backup_path}")

    # Load, convert, and save
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    converted_data = convert_object(data)

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(converted_data, f, indent=2, ensure_ascii=False)

    print(f"✅ Converted {file_path}")
    return True


def main():
    print("🚀 CONVERTING TO ISO STRING FORMAT FOR FIREBASE ADMIN PANEL")
    print("=" * 60)

    files = [
        "data/normalized/products.json",
        "data/normalized/customers.json",
        "data/normalized/payments.json",
        "data/normalized/invoices.json",
    ]

    for file_path in files:
        convert_file(file_path)
        print()

    print("🎉 CONVERSION COMPLETE!")
    print("✅ All timestamp objects converted to ISO strings")
    print("✅ Firebase admin panel will automatically recognize these as Timestamps")


if __name__ == "__main__":
    main()
