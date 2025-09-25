#!/usr/bin/env python3
"""
Firebase Timestamp Migration Script for payments.json

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


def migrate_payment_dates(payment: Dict[str, Any]) -> Dict[str, Any]:
    """
    Migrate date fields in a single payment from string to Timestamp format.

    Args:
        payment: Payment dictionary with string dates

    Returns:
        Payment dictionary with Timestamp objects
    """
    migrated_payment = payment.copy()

    # Convert date (required field for payments)
    if "date" in payment:
        timestamp = string_to_timestamp_dict(payment["date"])
        if timestamp:
            migrated_payment["date"] = timestamp
        else:
            print(
                f"⚠️  Failed to convert date for payment {payment.get('id', 'unknown')}"
            )
            return None

    return migrated_payment


def validate_migration(original_data: List[Dict], migrated_data: List[Dict]) -> bool:
    """
    Validate that migration was successful.

    Args:
        original_data: Original payment list
        migrated_data: Migrated payment list

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
        # Check date conversion
        if "date" in original and "date" in migrated:
            if isinstance(migrated["date"], dict) and "_seconds" in migrated["date"]:
                # Convert back to verify
                timestamp_seconds = migrated["date"]["_seconds"]
                converted_back = datetime.fromtimestamp(timestamp_seconds).date()
                original_date = datetime.fromisoformat(original["date"]).date()

                if converted_back != original_date:
                    print(
                        f"❌ Date mismatch for payment {original.get('id')}: {original_date} != {converted_back}"
                    )
                    validation_errors += 1
            else:
                print(f"❌ Invalid timestamp format for payment {original.get('id')}")
                validation_errors += 1

    if validation_errors == 0:
        print(f"✅ Validation passed for {len(migrated_data)} payments")
        return True
    else:
        print(f"❌ Validation failed with {validation_errors} errors")
        return False


def main():
    """Main migration function."""
    print("🚀 Starting Firebase Timestamp migration for payments.json...")

    # File paths
    payments_file = "data/normalized/payments.json"

    if not os.path.exists(payments_file):
        print(f"❌ File not found: {payments_file}")
        sys.exit(1)

    # Create backup
    backup_path = create_backup(payments_file)

    try:
        # Load original data
        print(f"📖 Loading {payments_file}...")
        with open(payments_file, "r", encoding="utf-8") as f:
            original_payments = json.load(f)

        print(f"📊 Found {len(original_payments)} payments to migrate")

        # Migrate each payment
        migrated_payments = []
        migration_errors = 0

        for i, payment in enumerate(original_payments):
            migrated_payment = migrate_payment_dates(payment)
            if migrated_payment:
                migrated_payments.append(migrated_payment)
            else:
                migration_errors += 1
                print(
                    f"❌ Failed to migrate payment {i+1}: {payment.get('id', 'unknown')}"
                )

        if migration_errors > 0:
            print(f"⚠️  Migration completed with {migration_errors} errors")
            if migration_errors > len(original_payments) * 0.1:  # More than 10% errors
                print("❌ Too many errors, aborting migration")
                sys.exit(1)

        # Validate migration
        if not validate_migration(original_payments, migrated_payments):
            print("❌ Migration validation failed, aborting")
            sys.exit(1)

        # Write migrated data
        migrated_file = payments_file.replace(".json", "_migrated.json")
        print(f"💾 Writing migrated data to {migrated_file}...")

        with open(migrated_file, "w", encoding="utf-8") as f:
            json.dump(migrated_payments, f, indent=2, ensure_ascii=False)

        print(f"✅ Migration completed successfully!")
        print(f"📊 Migrated {len(migrated_payments)} payments")
        print(f"📁 Original backup: {backup_path}")
        print(f"📁 Migrated data: {migrated_file}")
        print()
        print("🔄 To apply migration:")
        print(f"   mv {migrated_file} {payments_file}")
        print()
        print("🔙 To rollback:")
        print(f"   mv {backup_path} {payments_file}")

    except Exception as e:
        print(f"❌ Migration failed: {e}")
        print(f"🔙 Restore from backup: mv {backup_path} {payments_file}")
        sys.exit(1)


if __name__ == "__main__":
    main()
