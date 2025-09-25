#!/usr/bin/env python3
"""
Analyze unmapped customer references and suggest mappings
"""

import json
from difflib import SequenceMatcher


def similarity(a, b):
    """Calculate similarity between two strings"""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def analyze_unmapped_customers():
    """Analyze unmapped customer references and suggest closest matches"""

    # Load data
    with open("data/normalized/customers.json", "r", encoding="utf-8") as f:
        customers_data = json.load(f)
    with open("data/normalized/invoices.json", "r", encoding="utf-8") as f:
        invoices = json.load(f)
    with open("data/normalized/payments.json", "r", encoding="utf-8") as f:
        payments = json.load(f)

    customers = list(customers_data.values())
    actual_customer_ids = {customer["id"] for customer in customers}

    # Find unmapped references
    invalid_refs = set()

    for invoice in invoices:
        customer_id = invoice.get("customerId")
        if customer_id and customer_id not in actual_customer_ids:
            invalid_refs.add(customer_id)

    for payment in payments:
        customer_id = payment.get("customerId")
        if customer_id and customer_id not in actual_customer_ids:
            invalid_refs.add(customer_id)

    print(f"Analyzing {len(invalid_refs)} unmapped customer references...\n")

    # Analyze each unmapped reference
    for invalid_ref in sorted(invalid_refs):
        print(f"INVALID REF: {invalid_ref}")

        # Remove 'cust_' prefix for analysis
        clean_ref = invalid_ref.replace("cust_", "")

        # Find closest matches
        matches = []
        for actual_id in actual_customer_ids:
            sim = similarity(clean_ref, actual_id)
            if sim > 0.3:  # Only show reasonably similar matches
                matches.append((actual_id, sim))

        # Sort by similarity
        matches.sort(key=lambda x: x[1], reverse=True)

        if matches:
            print("  Possible matches:")
            for actual_id, sim in matches[:5]:  # Show top 5
                print(f"    {actual_id} (similarity: {sim:.2f})")
        else:
            print("  No similar matches found")

        print()


if __name__ == "__main__":
    analyze_unmapped_customers()
