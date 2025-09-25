#!/usr/bin/env python3
"""
COMPLETE RELATIONAL INTEGRITY FIX - ALL RELATIONSHIPS
"""
import json
import re


def create_customer_mapping():
    """Create mapping from invoice customer IDs to actual customer IDs"""

    # Load customers
    with open("data/normalized/customers.json", "r", encoding="utf-8") as f:
        customers = json.load(f)

    # Load invoices to see what customer IDs they're trying to reference
    with open("data/normalized/invoices.json", "r", encoding="utf-8") as f:
        invoices = json.load(f)

    # Get all customer IDs that invoices are trying to reference
    invoice_customer_refs = set()
    for invoice in invoices:
        invoice_customer_refs.add(invoice["customerId"])

    # Get all actual customer IDs
    actual_customer_ids = set(customers.keys())

    print("Invoice Customer References:")
    for ref in sorted(invoice_customer_refs):
        print(f"  {ref}")

    print("\nActual Customer IDs (sample):")
    for cid in sorted(list(actual_customer_ids))[:10]:
        print(f"  {cid}")

    # Create mapping by analyzing patterns
    customer_mapping = {}

    for invoice_ref in invoice_customer_refs:
        # Remove 'cust_' prefix and normalize
        if invoice_ref.startswith("cust_"):
            clean_ref = invoice_ref[5:]  # Remove 'cust_'

            # Try direct match first
            if clean_ref in actual_customer_ids:
                customer_mapping[invoice_ref] = clean_ref
                continue

            # Try pattern matching
            # Example: cust_the_biltong_boutiek__plettenberg_bay -> plettenberg_bay
            if "__" in clean_ref:
                parts = clean_ref.split("__")
                # Try the last part first (usually the branch/location)
                if parts[-1] in actual_customer_ids:
                    customer_mapping[invoice_ref] = parts[-1]
                    continue
                # Try the first part (parent company)
                if parts[0] in actual_customer_ids:
                    customer_mapping[invoice_ref] = parts[0]
                    continue

            # Try underscore replacements
            variations = [
                clean_ref.replace("__", "_"),
                clean_ref.replace("_", ""),
                clean_ref.replace(" ", "_"),
            ]

            for variation in variations:
                if variation in actual_customer_ids:
                    customer_mapping[invoice_ref] = variation
                    break

    print(f"\nCustomer ID Mapping ({len(customer_mapping)} mappings):")
    for old_id, new_id in customer_mapping.items():
        print(f"  {old_id} -> {new_id}")

    # Show unmapped references
    unmapped = [ref for ref in invoice_customer_refs if ref not in customer_mapping]
    if unmapped:
        print(f"\nUnmapped Customer References ({len(unmapped)}):")
        for ref in unmapped[:10]:
            print(f"  {ref}")

    return customer_mapping


def fix_customer_references():
    """Fix all customer ID references in invoices and payments"""

    customer_mapping = create_customer_mapping()

    # Fix invoices
    with open("data/normalized/invoices.json", "r", encoding="utf-8") as f:
        invoices = json.load(f)

    invoice_fixes = 0
    for invoice in invoices:
        old_customer_id = invoice["customerId"]
        if old_customer_id in customer_mapping:
            new_customer_id = customer_mapping[old_customer_id]
            invoice["customerId"] = new_customer_id
            invoice_fixes += 1
            print(
                f"Fixed invoice {invoice['id']}: {old_customer_id} -> {new_customer_id}"
            )

    # Save fixed invoices
    with open("data/normalized/invoices.json", "w", encoding="utf-8") as f:
        json.dump(invoices, f, indent=2, ensure_ascii=False)

    # Fix payments if they exist
    try:
        with open("data/normalized/payments.json", "r", encoding="utf-8") as f:
            payments = json.load(f)

        payment_fixes = 0
        for payment in payments:
            old_customer_id = payment["customerId"]
            if old_customer_id in customer_mapping:
                new_customer_id = customer_mapping[old_customer_id]
                payment["customerId"] = new_customer_id
                payment_fixes += 1
                print(
                    f"Fixed payment {payment['id']}: {old_customer_id} -> {new_customer_id}"
                )

        # Save fixed payments
        with open("data/normalized/payments.json", "w", encoding="utf-8") as f:
            json.dump(payments, f, indent=2, ensure_ascii=False)

        print(f"\n✅ CUSTOMER REFERENCE FIXES COMPLETE:")
        print(f"  - Invoice fixes: {invoice_fixes}")
        print(f"  - Payment fixes: {payment_fixes}")

    except FileNotFoundError:
        print("  - Payments file not found, skipping payment fixes")
        print(f"\n✅ CUSTOMER REFERENCE FIXES COMPLETE:")
        print(f"  - Invoice fixes: {invoice_fixes}")


if __name__ == "__main__":
    fix_customer_references()
