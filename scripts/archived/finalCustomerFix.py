#!/usr/bin/env python3
"""
FINAL DATA INTEGRITY FIX - Comprehensive Customer Reference Cleanup
Handles ALL remaining customer ID mismatches found in the integrity verification
"""

import json
import re
from collections import defaultdict


def load_data():
    """Load all data files"""
    with open("data/normalized/customers.json", "r", encoding="utf-8") as f:
        customers_data = json.load(f)
    with open("data/normalized/invoices.json", "r", encoding="utf-8") as f:
        invoices = json.load(f)
    with open("data/normalized/payments.json", "r", encoding="utf-8") as f:
        payments = json.load(f)

    # Convert customers from object to list for easier processing
    customers = (
        list(customers_data.values())
        if isinstance(customers_data, dict)
        else customers_data
    )

    return customers, invoices, payments, customers_data


def create_comprehensive_customer_mapping():
    """Create comprehensive mapping from all invalid customer references to valid ones"""

    customers, invoices, payments, customers_dict = load_data()

    # Get all actual customer IDs
    actual_customer_ids = {customer["id"] for customer in customers}

    print(f"Found {len(actual_customer_ids)} valid customer IDs")

    # Collect all invalid references from invoices and payments
    invalid_refs = set()

    # Check invoices
    for invoice in invoices:
        customer_id = invoice.get("customerId")
        if customer_id and customer_id not in actual_customer_ids:
            invalid_refs.add(customer_id)

    # Check payments
    for payment in payments:
        customer_id = payment.get("customerId")
        if customer_id and customer_id not in actual_customer_ids:
            invalid_refs.add(customer_id)

    print(f"Found {len(invalid_refs)} invalid customer references")

    # Create mapping using multiple strategies
    customer_mapping = {}
    unmapped_refs = []

    for invalid_ref in invalid_refs:
        mapped = False

        # Strategy 1: Remove 'cust_' prefix
        if invalid_ref.startswith("cust_"):
            clean_ref = invalid_ref[5:]
            if clean_ref in actual_customer_ids:
                customer_mapping[invalid_ref] = clean_ref
                mapped = True
                continue

        # Strategy 2: Handle complex patterns like 'cust_company_name__location' -> 'location'
        if invalid_ref.startswith("cust_") and "__" in invalid_ref:
            # Split on double underscore and try the last part
            parts = invalid_ref.split("__")
            if len(parts) >= 2:
                potential_id = parts[-1]  # Last part after __
                if potential_id in actual_customer_ids:
                    customer_mapping[invalid_ref] = potential_id
                    mapped = True
                    continue

        # Strategy 3: Try to find partial matches
        if not mapped:
            clean_search = invalid_ref.replace("cust_", "").replace("__", "_").lower()

            for actual_id in actual_customer_ids:
                if (
                    clean_search in actual_id.lower()
                    or actual_id.lower() in clean_search
                ):
                    customer_mapping[invalid_ref] = actual_id
                    mapped = True
                    break

        # Strategy 4: Try exact match without prefix transformations
        if not mapped:
            for actual_id in actual_customer_ids:
                # Check if removing common prefixes/suffixes reveals a match
                variations = [
                    invalid_ref.replace("cust_", ""),
                    invalid_ref.replace("cust_", "").replace("_", " ").strip(),
                    invalid_ref.split("_")[-1] if "_" in invalid_ref else invalid_ref,
                ]

                for variation in variations:
                    if variation == actual_id:
                        customer_mapping[invalid_ref] = actual_id
                        mapped = True
                        break

                if mapped:
                    break

        if not mapped:
            unmapped_refs.append(invalid_ref)

    print(f"Successfully mapped {len(customer_mapping)} customer references")
    print(f"Could not map {len(unmapped_refs)} references")

    if unmapped_refs:
        print("\nUnmapped references:")
        for ref in unmapped_refs[:10]:
            print(f"  {ref}")
        if len(unmapped_refs) > 10:
            print(f"  ... and {len(unmapped_refs) - 10} more")

    return customer_mapping


def apply_customer_fixes():
    """Apply comprehensive customer reference fixes"""

    print("=" * 80)
    print("FINAL CUSTOMER REFERENCE INTEGRITY FIX")
    print("=" * 80)

    # Create mapping
    customer_mapping = create_comprehensive_customer_mapping()

    if not customer_mapping:
        print("No customer reference fixes needed!")
        return

    print(f"\nApplying {len(customer_mapping)} customer reference fixes...")

    # Load data for fixing
    customers, invoices, payments, customers_dict = load_data()

    # Fix invoices
    invoice_fixes = 0
    for invoice in invoices:
        old_customer_id = invoice.get("customerId")
        if old_customer_id in customer_mapping:
            new_customer_id = customer_mapping[old_customer_id]
            invoice["customerId"] = new_customer_id
            invoice_fixes += 1

    # Fix payments
    payment_fixes = 0
    for payment in payments:
        old_customer_id = payment.get("customerId")
        if old_customer_id in customer_mapping:
            new_customer_id = customer_mapping[old_customer_id]
            payment["customerId"] = new_customer_id
            payment_fixes += 1

    print(f"✅ Fixed {invoice_fixes} invoice customer references")
    print(f"✅ Fixed {payment_fixes} payment customer references")

    # Save fixed data
    with open("data/normalized/invoices.json", "w", encoding="utf-8") as f:
        json.dump(invoices, f, indent=2, ensure_ascii=False)

    with open("data/normalized/payments.json", "w", encoding="utf-8") as f:
        json.dump(payments, f, indent=2, ensure_ascii=False)

    print(f"💾 Saved fixed invoices and payments data")

    return invoice_fixes + payment_fixes


if __name__ == "__main__":
    total_fixes = apply_customer_fixes()

    if total_fixes > 0:
        print(f"\n🎉 APPLIED {total_fixes} TOTAL CUSTOMER REFERENCE FIXES!")
        print("Run finalIntegrityCheck.py to verify all issues are resolved.")
    else:
        print("No fixes were needed.")
