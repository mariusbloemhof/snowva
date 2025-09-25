#!/usr/bin/env python3
"""
Comprehensive Data Integrity Verification Script
Validates ALL foreign key relationships across the entire dataset
"""

import json
import os
from collections import defaultdict


def load_json_file(file_path):
    """Load and parse JSON file"""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"ERROR: File not found: {file_path}")
        return None
    except json.JSONDecodeError as e:
        print(f"ERROR: Invalid JSON in {file_path}: {e}")
        return None


def verify_data_integrity():
    """Verify ALL foreign key relationships in the dataset"""

    print("=" * 80)
    print("COMPREHENSIVE DATA INTEGRITY VERIFICATION")
    print("=" * 80)

    # Load all data files
    base_path = "data/normalized"

    customers_file = os.path.join(base_path, "customers.json")
    products_file = os.path.join(base_path, "products.json")
    invoices_file = os.path.join(base_path, "invoices.json")
    payments_file = os.path.join(base_path, "payments.json")

    customers = load_json_file(customers_file)
    products = load_json_file(products_file)
    invoices = load_json_file(invoices_file)
    payments = load_json_file(payments_file)

    if not all(
        [
            customers is not None,
            products is not None,
            invoices is not None,
            payments is not None,
        ]
    ):
        print("FATAL: Could not load all required data files")
        return False

    # Convert dictionaries to lists (the JSON files contain objects with ID keys)
    try:
        if isinstance(customers, dict):
            customers = list(customers.values())
        if isinstance(products, dict):
            products = list(products.values())
        if isinstance(invoices, dict):
            invoices = list(invoices.values())
        if isinstance(payments, dict):
            payments = list(payments.values())
    except Exception as e:
        print(f"FATAL: Error processing JSON structure: {e}")
        return False

    # Create lookup sets for fast validation
    product_ids = {product["id"] for product in products}
    customer_ids = {customer["id"] for customer in customers}
    invoice_ids = {invoice["id"] for invoice in invoices}

    print(
        f"Loaded {len(customers)} customers, {len(products)} products, {len(invoices)} invoices, {len(payments)} payments"
    )
    print()

    total_errors = 0

    # ========================================================================
    # 1. VERIFY CUSTOMERS.JSON - Product References
    # ========================================================================
    print("1. VERIFYING CUSTOMERS -> PRODUCTS REFERENCES")
    print("-" * 50)

    customer_product_errors = []

    for customer in customers:
        customer_id = customer.get("id", "UNKNOWN")

        # Check customProductPricing references
        custom_pricing = customer.get("customProductPricing", {})
        for product_ref, pricing_data in custom_pricing.items():
            if product_ref not in product_ids:
                error_msg = f"Customer '{customer_id}' references invalid product '{product_ref}' in customProductPricing"
                customer_product_errors.append(error_msg)

    if customer_product_errors:
        print(f"❌ FOUND {len(customer_product_errors)} CUSTOMER->PRODUCT ERRORS:")
        for error in customer_product_errors[:10]:  # Show first 10
            print(f"   {error}")
        if len(customer_product_errors) > 10:
            print(f"   ... and {len(customer_product_errors) - 10} more")
        total_errors += len(customer_product_errors)
    else:
        print("✅ All customer product references are valid")

    print()

    # ========================================================================
    # 2. VERIFY INVOICES.JSON - Customer and Product References
    # ========================================================================
    print("2. VERIFYING INVOICES -> CUSTOMERS & PRODUCTS REFERENCES")
    print("-" * 60)

    invoice_customer_errors = []
    invoice_product_errors = []

    for invoice in invoices:
        invoice_id = invoice.get("id", "UNKNOWN")

        # Check customer reference
        customer_id = invoice.get("customerId")
        if customer_id and customer_id not in customer_ids:
            error_msg = (
                f"Invoice '{invoice_id}' references invalid customer '{customer_id}'"
            )
            invoice_customer_errors.append(error_msg)

        # Check product references in lineItems
        line_items = invoice.get("lineItems", [])
        for i, item in enumerate(line_items):
            product_id = item.get("productId")
            if product_id and product_id not in product_ids:
                error_msg = f"Invoice '{invoice_id}' lineItem[{i}] references invalid product '{product_id}'"
                invoice_product_errors.append(error_msg)

    if invoice_customer_errors:
        print(f"❌ FOUND {len(invoice_customer_errors)} INVOICE->CUSTOMER ERRORS:")
        for error in invoice_customer_errors[:5]:
            print(f"   {error}")
        if len(invoice_customer_errors) > 5:
            print(f"   ... and {len(invoice_customer_errors) - 5} more")
        total_errors += len(invoice_customer_errors)
    else:
        print("✅ All invoice customer references are valid")

    if invoice_product_errors:
        print(f"❌ FOUND {len(invoice_product_errors)} INVOICE->PRODUCT ERRORS:")
        for error in invoice_product_errors[:5]:
            print(f"   {error}")
        if len(invoice_product_errors) > 5:
            print(f"   ... and {len(invoice_product_errors) - 5} more")
        total_errors += len(invoice_product_errors)
    else:
        print("✅ All invoice product references are valid")

    print()

    # ========================================================================
    # 3. VERIFY PAYMENTS.JSON - Customer and Invoice References
    # ========================================================================
    print("3. VERIFYING PAYMENTS -> CUSTOMERS & INVOICES REFERENCES")
    print("-" * 60)

    payment_customer_errors = []
    payment_invoice_errors = []

    for payment in payments:
        payment_id = payment.get("id", "UNKNOWN")

        # Check customer reference
        customer_id = payment.get("customerId")
        if customer_id and customer_id not in customer_ids:
            error_msg = (
                f"Payment '{payment_id}' references invalid customer '{customer_id}'"
            )
            payment_customer_errors.append(error_msg)

        # Check invoice references in allocatedInvoices
        allocated_invoices = payment.get("allocatedInvoices", [])
        for allocation in allocated_invoices:
            invoice_id = allocation.get("invoiceId")
            if invoice_id and invoice_id not in invoice_ids:
                error_msg = f"Payment '{payment_id}' references invalid invoice '{invoice_id}' in allocations"
                payment_invoice_errors.append(error_msg)

    if payment_customer_errors:
        print(f"❌ FOUND {len(payment_customer_errors)} PAYMENT->CUSTOMER ERRORS:")
        for error in payment_customer_errors[:5]:
            print(f"   {error}")
        if len(payment_customer_errors) > 5:
            print(f"   ... and {len(payment_customer_errors) - 5} more")
        total_errors += len(payment_customer_errors)
    else:
        print("✅ All payment customer references are valid")

    if payment_invoice_errors:
        print(f"❌ FOUND {len(payment_invoice_errors)} PAYMENT->INVOICE ERRORS:")
        for error in payment_invoice_errors[:5]:
            print(f"   {error}")
        if len(payment_invoice_errors) > 5:
            print(f"   ... and {len(payment_invoice_errors) - 5} more")
        total_errors += len(payment_invoice_errors)
    else:
        print("✅ All payment invoice references are valid")

    print()

    # ========================================================================
    # 4. VERIFY PARENT-CHILD CUSTOMER RELATIONSHIPS
    # ========================================================================
    print("4. VERIFYING CUSTOMER PARENT-CHILD RELATIONSHIPS")
    print("-" * 50)

    parent_child_errors = []

    for customer in customers:
        customer_id = customer.get("id", "UNKNOWN")
        parent_id = customer.get("parentCompanyId")

        if parent_id and parent_id not in customer_ids:
            error_msg = f"Customer '{customer_id}' references invalid parent company '{parent_id}'"
            parent_child_errors.append(error_msg)

    if parent_child_errors:
        print(f"❌ FOUND {len(parent_child_errors)} PARENT-CHILD RELATIONSHIP ERRORS:")
        for error in parent_child_errors:
            print(f"   {error}")
        total_errors += len(parent_child_errors)
    else:
        print("✅ All parent-child customer relationships are valid")

    print()

    # ========================================================================
    # SUMMARY
    # ========================================================================
    print("=" * 80)
    print("INTEGRITY VERIFICATION SUMMARY")
    print("=" * 80)

    if total_errors == 0:
        print("🎉 SUCCESS: ALL DATA INTEGRITY CHECKS PASSED!")
        print("   ✅ All foreign key relationships are valid")
        print("   ✅ All product references exist")
        print("   ✅ All customer references exist")
        print("   ✅ All invoice references exist")
        print("   ✅ All parent-child relationships are valid")
        return True
    else:
        print(f"❌ FAILED: Found {total_errors} total integrity errors")
        print("   Data migration should NOT proceed until these are fixed!")
        return False


if __name__ == "__main__":
    success = verify_data_integrity()
    exit(0 if success else 1)
