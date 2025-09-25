#!/usr/bin/env python3
"""
Complete Firebase Re-migration Script

This script will:
1. Clear all existing Firebase collections
2. Re-migrate all data from the fixed JSON files
3. Preserve correct document IDs and relationships
"""
import asyncio
import os
import sys

# Add the project root to Python path to import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))


async def complete_firebase_remigration():
    """Perform complete Firebase re-migration with fixed data"""
    print("🔥 Starting Complete Firebase Re-migration")
    print("=" * 50)

    try:
        # Import the FirebaseAdmin class
        from utils.dataMigration import FirebaseAdmin

        admin = FirebaseAdmin()

        # Step 1: Clear all collections
        print("🗑️ Clearing existing Firebase collections...")
        collections_to_clear = ["products", "customers", "invoices", "payments"]

        for collection_name in collections_to_clear:
            print(f"  Clearing {collection_name}...")
            await admin.clearCollection(collection_name)
            print(f"  ✅ {collection_name} cleared")

        # Step 2: Re-migrate all data
        print(f"\n📤 Re-migrating all data with fixed relationships...")

        # Migrate products first (base dependency)
        print("  📦 Migrating products...")
        await admin.migrateProducts()
        print("  ✅ Products migrated")

        # Migrate customers (depends on products for pricing)
        print("  👥 Migrating customers...")
        await admin.migrateCustomers()
        print("  ✅ Customers migrated")

        # Migrate invoices (depends on customers and products)
        print("  📄 Migrating invoices...")
        await admin.migrateInvoices()
        print("  ✅ Invoices migrated")

        # Migrate payments (depends on customers and invoices)
        print("  💰 Migrating payments...")
        await admin.migratePayments()
        print("  ✅ Payments migrated")

        print(f"\n🎉 Complete Firebase re-migration successful!")
        print(f"All data has been re-uploaded with fixed relational integrity.")

    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Make sure you're running this from the project root directory.")
        return False
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        return False

    return True


if __name__ == "__main__":
    # Run the async migration
    success = asyncio.run(complete_firebase_remigration())

    if success:
        print(f"\n✅ Next Steps:")
        print(f"1. Refresh your browser")
        print(f"2. Test the Custom Product Pricing tab")
        print(f"3. Verify all product names are displayed correctly")
        print(f"4. Test edit functionality")
    else:
        print(f"\n❌ Re-migration failed. Please check the errors above.")
