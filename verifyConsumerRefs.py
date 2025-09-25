#!/usr/bin/env python3
"""
Verify that all broken customer references are for Consumer customers
"""

import json


def verify_broken_refs_are_consumers():
    """Check if all broken customer references are for Consumer type customers"""

    print("=" * 80)
    print("VERIFYING BROKEN CUSTOMER REFERENCES ARE CONSUMERS")
    print("=" * 80)

    # Load data
    with open("data/normalized/customers.json", "r", encoding="utf-8") as f:
        customers_data = json.load(f)
    with open("data/normalized/invoices.json", "r", encoding="utf-8") as f:
        invoices = json.load(f)
    with open("data/normalized/payments.json", "r", encoding="utf-8") as f:
        payments = json.load(f)

    customers = list(customers_data.values())
    actual_customer_ids = {customer["id"] for customer in customers}

    # Find all broken references
    broken_refs = set()

    # From invoices
    invoice_refs_with_details = []
    for invoice in invoices:
        customer_id = invoice.get("customerId")
        if customer_id and customer_id not in actual_customer_ids:
            broken_refs.add(customer_id)
            invoice_refs_with_details.append(
                {
                    "invoice_id": invoice["id"],
                    "customer_id": customer_id,
                    "amount": invoice.get("total", 0),
                }
            )

    # From payments
    payment_refs_with_details = []
    for payment in payments:
        customer_id = payment.get("customerId")
        if customer_id and customer_id not in actual_customer_ids:
            broken_refs.add(customer_id)
            payment_refs_with_details.append(
                {
                    "payment_id": payment["id"],
                    "customer_id": customer_id,
                    "amount": payment.get("amount", 0),
                }
            )

    print(f"Found {len(broken_refs)} unique broken customer references")
    print(
        f"Affecting {len(invoice_refs_with_details)} invoices and {len(payment_refs_with_details)} payments"
    )
    print()

    # Analyze customer types in our actual customer base
    customer_types = {}
    for customer in customers:
        customer_type = customer.get("type", "Unknown")
        if customer_type not in customer_types:
            customer_types[customer_type] = []
        customer_types[customer_type].append(customer["id"])

    print("CUSTOMER TYPE BREAKDOWN IN DATABASE:")
    for customer_type, customer_list in customer_types.items():
        print(f"  {customer_type}: {len(customer_list)} customers")
    print()

    # Analyze the pattern of broken references
    print("BROKEN CUSTOMER REFERENCE ANALYSIS:")
    print("-" * 40)

    consumer_pattern_count = 0
    retail_pattern_count = 0

    for ref in sorted(broken_refs):
        print(f"BROKEN REF: {ref}")

        # Check if it looks like a personal name (consumer pattern)
        ref_clean = ref.replace("cust_", "").replace("_", " ")
        words = ref_clean.split()

        # Heuristic: if it has 2-3 words and looks like names, likely consumer
        if len(words) >= 2 and len(words) <= 4:
            # Check if words look like personal names (no business indicators)
            business_indicators = [
                "pty",
                "ltd",
                "cc",
                "trading",
                "group",
                "services",
                "solutions",
                "motors",
                "warehouse",
                "boutique",
            ]
            has_business_indicators = any(
                indicator in ref.lower() for indicator in business_indicators
            )

            if not has_business_indicators:
                print("  → LIKELY CONSUMER (personal name pattern)")
                consumer_pattern_count += 1
            else:
                print("  → LIKELY RETAIL (business indicators found)")
                retail_pattern_count += 1
        else:
            print("  → UNCLEAR PATTERN")

        # Show some sample invoices/payments for this customer
        sample_invoices = [
            inv for inv in invoice_refs_with_details if inv["customer_id"] == ref
        ][:2]
        sample_payments = [
            pay for pay in payment_refs_with_details if pay["customer_id"] == ref
        ][:2]

        if sample_invoices:
            print(
                f"    Sample invoices: {[inv['invoice_id'] for inv in sample_invoices]}"
            )
            total_invoice_amount = sum(
                inv["amount"]
                for inv in invoice_refs_with_details
                if inv["customer_id"] == ref
            )
            print(f"    Total invoice amount: R{total_invoice_amount:,.2f}")

        if sample_payments:
            print(
                f"    Sample payments: {[pay['payment_id'] for pay in sample_payments]}"
            )

        print()

    # Summary
    print("=" * 80)
    print("ANALYSIS SUMMARY")
    print("=" * 80)
    print(f"Total broken references: {len(broken_refs)}")
    print(f"Likely CONSUMER customers: {consumer_pattern_count}")
    print(f"Likely RETAIL customers: {retail_pattern_count}")
    print(
        f"Unclear patterns: {len(broken_refs) - consumer_pattern_count - retail_pattern_count}"
    )
    print()

    if consumer_pattern_count == len(broken_refs):
        print("✅ ALL broken references appear to be Consumer customers!")
        print("   Safe to ignore these for Retail business functionality.")
    elif consumer_pattern_count > retail_pattern_count:
        print("⚠️  MOSTLY Consumer customers, but some may be Retail.")
        print("   Review the retail patterns above.")
    else:
        print("❌ MIXED or mostly Retail customers found!")
        print("   These need to be fixed for proper business functionality.")


if __name__ == "__main__":
    verify_broken_refs_are_consumers()
