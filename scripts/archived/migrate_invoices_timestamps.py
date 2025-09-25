#!/usr/bin/env python3
"""
Firebase Timestamp Migration Script for invoices.json

Converts string dates to Firebase Timestamp format for compatibility with Firestore.
Creates backups and validates conversions.
"""

import json
import os
import shutil
from datetime import datetime
from typing import Dict, Any, List
import sys


def create_backup(file_path: str) -> str:
    """Create a timestamped backup of the original file."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = f"{file_path}.backup_{timestamp}"
    shutil.copy2(file_path, backup_path)
    print(f"✅ Created backup: {backup_path}")
    return backup_path


def string_to_timestamp_dict(date_str: str) -> Dict[str, int]:
    """
    Convert ISO date string to Firebase Timestamp format.

    Args:
        date_str: ISO format date string (e.g., "2024-10-01")

    Returns:
        Dict with _seconds and _nanoseconds for Firebase Timestamp
    """
    try:
        # Parse the date string
        if "T" in date_str:
            # Full datetime string
            dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        else:
            # Date only string - assume midnight UTC
            dt = datetime.fromisoformat(f"{date_str}T00:00:00+00:00")

        # Convert to Firebase Timestamp format
        seconds = int(dt.timestamp())
        nanoseconds = dt.microsecond * 1000

        return {"_seconds": seconds, "_nanoseconds": nanoseconds}
    except Exception as e:
        print(f"❌ Error converting date '{date_str}': {e}")
        return None


def migrate_invoice_dates(invoice: Dict[str, Any]) -> Dict[str, Any]:
    """
    Migrate date fields in a single invoice from string to Timestamp format.

    Args:
        invoice: Invoice dictionary with string dates

    Returns:
        Invoice dictionary with Timestamp objects
    """
    migrated_invoice = invoice.copy()

    # Convert issueDate (required field)
    if "issueDate" in invoice:
        timestamp = string_to_timestamp_dict(invoice["issueDate"])
        if timestamp:
            migrated_invoice["issueDate"] = timestamp
        else:
            print(
                f"⚠️  Failed to convert issueDate for invoice {invoice.get('id', 'unknown')}"
            )
            return None

    # Convert dueDate (optional field)
    if "dueDate" in invoice and invoice["dueDate"]:
        timestamp = string_to_timestamp_dict(invoice["dueDate"])
        if timestamp:
            migrated_invoice["dueDate"] = timestamp
        else:
            print(
                f"⚠️  Failed to convert dueDate for invoice {invoice.get('id', 'unknown')}"
            )

    return migrated_invoice


def validate_migration(original_data: List[Dict], migrated_data: List[Dict]) -> bool:
    """
    Validate that migration was successful.

    Args:
        original_data: Original invoice list
        migrated_data: Migrated invoice list

    Returns:
        True if validation passes, False otherwise
    """
    print("\n🔍 Validating migration...")

    # Check counts match
    if len(original_data) != len(migrated_data):
        print(f"❌ Count mismatch: {len(original_data)} -> {len(migrated_data)}")
        return False

    # Sample validation
    validation_errors = 0
    for i, (original, migrated) in enumerate(
        zip(original_data[:10], migrated_data[:10])
    ):
        # Check issueDate conversion
        if "issueDate" in original and "issueDate" in migrated:
            if (
                isinstance(migrated["issueDate"], dict)
                and "_seconds" in migrated["issueDate"]
            ):
                # Convert back to verify
                timestamp_seconds = migrated["issueDate"]["_seconds"]
                converted_back = datetime.fromtimestamp(timestamp_seconds).date()
                original_date = datetime.fromisoformat(original["issueDate"]).date()

                if converted_back != original_date:
                    print(
                        f"❌ Date mismatch for invoice {original.get('id')}: {original_date} != {converted_back}"
                    )
                    validation_errors += 1
            else:
                print(f"❌ Invalid timestamp format for invoice {original.get('id')}")
                validation_errors += 1

    if validation_errors == 0:
        print(f"✅ Validation passed for {len(migrated_data)} invoices")
        return True
    else:
        print(f"❌ Validation failed with {validation_errors} errors")
        return False


def main():
    """Main migration function."""
    print("🚀 Starting Firebase Timestamp migration for invoices.json...")

    # File paths
    invoices_file = "data/normalized/invoices.json"

    if not os.path.exists(invoices_file):
        print(f"❌ File not found: {invoices_file}")
        sys.exit(1)

    # Create backup
    backup_path = create_backup(invoices_file)

    try:
        # Load original data
        print(f"📖 Loading {invoices_file}...")
        with open(invoices_file, "r", encoding="utf-8") as f:
            original_invoices = json.load(f)

        print(f"📊 Found {len(original_invoices)} invoices to migrate")

        # Migrate each invoice
        migrated_invoices = []
        migration_errors = 0

        for i, invoice in enumerate(original_invoices):
            migrated_invoice = migrate_invoice_dates(invoice)
            if migrated_invoice:
                migrated_invoices.append(migrated_invoice)
            else:
                migration_errors += 1
                print(
                    f"❌ Failed to migrate invoice {i+1}: {invoice.get('id', 'unknown')}"
                )

        if migration_errors > 0:
            print(f"⚠️  Migration completed with {migration_errors} errors")
            if migration_errors > len(original_invoices) * 0.1:  # More than 10% errors
                print("❌ Too many errors, aborting migration")
                sys.exit(1)

        # Validate migration
        if not validate_migration(original_invoices, migrated_invoices):
            print("❌ Migration validation failed, aborting")
            sys.exit(1)

        # Write migrated data
        migrated_file = invoices_file.replace(".json", "_migrated.json")
        print(f"💾 Writing migrated data to {migrated_file}...")

        with open(migrated_file, "w", encoding="utf-8") as f:
            json.dump(migrated_invoices, f, indent=2, ensure_ascii=False)

        print(f"✅ Migration completed successfully!")
        print(f"📊 Migrated {len(migrated_invoices)} invoices")
        print(f"📁 Original backup: {backup_path}")
        print(f"📁 Migrated data: {migrated_file}")
        print()
        print("🔄 To apply migration:")
        print(f"   mv {migrated_file} {invoices_file}")
        print()
        print("🔙 To rollback:")
        print(f"   mv {backup_path} {invoices_file}")

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        print(f"🔙 Restore from backup: mv {backup_path} {invoices_file}")
        sys.exit(1)


if __name__ == "__main__":
    main()
