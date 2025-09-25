#!/usr/bin/env python3
"""
COMPREHENSIVE DATA INTEGRITY VERIFICATION
Validates ALL foreign key relationships across the entire dataset
"""

import json
import os


def load_data():
    """Load all JSON data files"""
    base_path = "data/normalized"

    with open(os.path.join(base_path, "customers.json"), "r", encoding="utf-8") as f:
        customers_data = json.load(f)
    with open(os.path.join(base_path, "products.json"), "r", encoding="utf-8") as f:
        products_data = json.load(f)
    with open(os.path.join(base_path, "invoices.json"), "r", encoding="utf-8") as f:
        invoices_data = json.load(f)
    with open(os.path.join(base_path, "payments.json"), "r", encoding="utf-8") as f:
        payments_data = json.load(f)

    # Convert to lists based on actual structure
    customers = (
        list(customers_data.values())
        if isinstance(customers_data, dict)
        else customers_data
    )

    # Products has nested structure with "products" key
    if isinstance(products_data, dict) and "products" in products_data:
        products = list(products_data["products"].values())
    else:
        products = (
            list(products_data.values())
            if isinstance(products_data, dict)
            else products_data
        )

    invoices = invoices_data  # Already a list
    payments = payments_data  # Already a list

    return customers, products, invoices, payments


def verify_integrity():
    """Verify ALL foreign key relationships"""

    print("=" * 80)
    print("COMPREHENSIVE DATA INTEGRITY VERIFICATION")
    print("=" * 80)

    customers, products, invoices, payments = load_data()

    print(
        f"Loaded {len(customers)} customers, {len(products)} products, {len(invoices)} invoices, {len(payments)} payments"
    )
    print()

    # Create lookup sets
    product_ids = {product["id"] for product in products}
    customer_ids = {customer["id"] for customer in customers}
    invoice_ids = {invoice["id"] for invoice in invoices}

    total_errors = 0

    # 1. VERIFY CUSTOMERS -> PRODUCTS
    print("1. VERIFYING CUSTOMERS -> PRODUCTS REFERENCES")
    print("-" * 50)

    customer_product_errors = []

    for customer in customers:
        try:
            customer_id = customer["id"]
            custom_pricing = customer.get("customProductPricing", {})

            if custom_pricing and isinstance(custom_pricing, dict):
                for product_ref in custom_pricing.keys():
                    if product_ref not in product_ids:
                        customer_product_errors.append(
                            f"Customer '{customer_id}' references invalid product '{product_ref}'"
                        )
        except Exception as e:
            print(f"Error processing customer: {e}")
            continue

    if customer_product_errors:
        print(f"❌ FOUND {len(customer_product_errors)} CUSTOMER->PRODUCT ERRORS:")
        for error in customer_product_errors[:5]:
            print(f"   {error}")
        if len(customer_product_errors) > 5:
            print(f"   ... and {len(customer_product_errors) - 5} more")
        total_errors += len(customer_product_errors)
    else:
        print("✅ All customer product references are valid")
    print()

    # 2. VERIFY INVOICES -> CUSTOMERS & PRODUCTS
    print("2. VERIFYING INVOICES -> CUSTOMERS & PRODUCTS")
    print("-" * 50)

    invoice_customer_errors = []
    invoice_product_errors = []

    for invoice in invoices:
        invoice_id = invoice["id"]

        # Check customer reference
        customer_id = invoice.get("customerId")
        if customer_id and customer_id not in customer_ids:
            invoice_customer_errors.append(
                f"Invoice '{invoice_id}' references invalid customer '{customer_id}'"
            )

        # Check product references in lineItems
        line_items = invoice.get("lineItems", [])
        for i, item in enumerate(line_items):
            product_id = item.get("productId")
            if product_id and product_id not in product_ids:
                invoice_product_errors.append(
                    f"Invoice '{invoice_id}' lineItem[{i}] references invalid product '{product_id}'"
                )

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

    # 3. VERIFY PAYMENTS -> CUSTOMERS & INVOICES
    print("3. VERIFYING PAYMENTS -> CUSTOMERS & INVOICES")
    print("-" * 50)

    payment_customer_errors = []
    payment_invoice_errors = []

    for payment in payments:
        payment_id = payment["id"]

        # Check customer reference
        customer_id = payment.get("customerId")
        if customer_id and customer_id not in customer_ids:
            payment_customer_errors.append(
                f"Payment '{payment_id}' references invalid customer '{customer_id}'"
            )

        # Check invoice references in allocatedInvoices
        allocated_invoices = payment.get("allocatedInvoices", [])
        for allocation in allocated_invoices:
            invoice_id = allocation.get("invoiceId")
            if invoice_id and invoice_id not in invoice_ids:
                payment_invoice_errors.append(
                    f"Payment '{payment_id}' references invalid invoice '{invoice_id}'"
                )

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

    # 4. VERIFY PARENT-CHILD RELATIONSHIPS
    print("4. VERIFYING CUSTOMER PARENT-CHILD RELATIONSHIPS")
    print("-" * 50)

    parent_errors = []

    for customer in customers:
        customer_id = customer["id"]
        parent_id = customer.get("parentCompanyId")

        if parent_id and parent_id not in customer_ids:
            parent_errors.append(
                f"Customer '{customer_id}' references invalid parent '{parent_id}'"
            )

    if parent_errors:
        print(f"❌ FOUND {len(parent_errors)} PARENT-CHILD ERRORS:")
        for error in parent_errors:
            print(f"   {error}")
        total_errors += len(parent_errors)
    else:
        print("✅ All parent-child relationships are valid")
    print()

    # SUMMARY
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
        print()
        print("✨ YOUR DATA IS READY FOR MIGRATION! ✨")
        return True
    else:
        print(f"❌ FAILED: Found {total_errors} total integrity errors")
        print("   Data migration should NOT proceed until these are fixed!")
        return False


if __name__ == "__main__":
    success = verify_integrity()
    exit(0 if success else 1)
