#!/usr/bin/env python3
"""
Transform Snowva invoices and payments data from Google Sheets to Firebase-ready JSON format.
This script handles the updated spreadsheet structure with proper product headers.
"""

import json
import csv
from io import StringIO
from datetime import datetime
import requests
from typing import Dict, List, Any, Optional
import re

# Product mapping from spreadsheet headers to our product IDs
PRODUCT_MAPPING = {
    "Snowva": "prod_snowva",
    "Outray": "prod_outray",
    "Makabrai": "prod_makabrai",
    "Braai Grid - Small": "prod_braai_grid_small",
    "Braai Grid - Medium": "prod_braai_grid_medium",
    "Braai Grid - Large": "prod_braai_grid_large",
    "Braai Bak - 2.5l": "prod_braai_bak_2_5l",
    "Braai Bak - 3.8l": "prod_braai_bak_3_8l",
    "Braai Bak - 5.5l": "prod_braai_bak_5_2l",  # Note: 5.5l maps to 5.2l in our products
    "Borki": "prod_borki",
    "BraaiTas": "prod_braai_tas",
}


def clean_currency(value: str) -> float:
    """Clean currency string and return float value."""
    if not value or value.strip() == "":
        return 0.0
    # Remove R, spaces, commas and convert to float
    cleaned = re.sub(r"[R\s,]", "", str(value).strip())
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def clean_quantity(value: str) -> int:
    """Clean quantity string and return integer value."""
    if not value or value.strip() == "":
        return 0
    try:
        return int(str(value).strip())
    except ValueError:
        return 0


def normalize_customer_name(name: str) -> str:
    """Normalize customer name to match our customer IDs."""
    if not name:
        return ""

    # Remove common business suffixes and normalize
    name = re.sub(r"\s*(Pty\s*Ltd|CC|Ltd|Bpk|t/a|T/A)\s*", " ", name)
    name = re.sub(r"\s+", "_", name.lower().strip())
    name = re.sub(r"[^\w_]", "", name)
    return f"cust_{name}"


def parse_date(date_str: str) -> str:
    """Parse date from YYYY/MM/DD format."""
    if not date_str:
        return ""

    try:
        # Handle YYYY/MM/DD format
        if "/" in date_str:
            parts = date_str.split("/")
            if len(parts) == 3:
                year, month, day = parts
                return f"{year}-{month.zfill(2)}-{day.zfill(2)}"
    except Exception:
        pass

    return date_str


def fetch_google_sheets_data(sheet_url: str) -> List[List[str]]:
    """Fetch data from Google Sheets and return as list of rows."""
    # Convert to CSV export URL
    csv_url = sheet_url.replace("/gviz/tq?tqx=out:html", "/export?format=csv")

    response = requests.get(csv_url)
    response.raise_for_status()

    # Parse CSV data
    csv_data = StringIO(response.text)
    reader = csv.reader(csv_data)
    return list(reader)


def create_invoice_from_row(
    row: List[str], headers: List[str]
) -> Optional[Dict[str, Any]]:
    """Create invoice object from spreadsheet row."""
    if len(row) < 7:  # Minimum required columns
        return None

    # Parse basic invoice data
    date_str = row[0].strip() if len(row) > 0 else ""
    retailer = row[1].strip() if len(row) > 1 else ""
    consumer = row[2].strip() if len(row) > 2 else ""
    invoice_type = row[3].strip() if len(row) > 3 else "Retail"
    invoice_number = row[4].strip() if len(row) > 4 else ""
    po_number = row[5].strip() if len(row) > 5 else ""
    status = row[6].strip() if len(row) > 6 else "Unpaid"

    # Skip empty rows
    if not invoice_number or not date_str:
        return None

    # Determine customer name
    customer_name = consumer if consumer else retailer
    if not customer_name:
        return None

    # Parse line items from product columns
    line_items = []

    # Product columns start at index 7, alternating qty/price pairs
    for i in range(7, len(headers) - 2, 2):  # -2 to exclude courier charge and total
        if i >= len(row) or i + 1 >= len(row):
            break

        qty_str = row[i].strip() if i < len(row) else ""
        price_str = row[i + 1].strip() if i + 1 < len(row) else ""

        qty = clean_quantity(qty_str)
        price = clean_currency(price_str)

        if qty > 0 and price > 0:
            # Find the product name from headers
            header_index = (i - 7) // 2
            product_headers = list(PRODUCT_MAPPING.keys())

            if header_index < len(product_headers):
                product_name = product_headers[header_index]
                product_id = PRODUCT_MAPPING.get(product_name)

                if product_id:
                    line_items.append(
                        {"productId": product_id, "quantity": qty, "unitPrice": price}
                    )

    # Skip invoices with no line items
    if not line_items:
        return None

    # Parse total amount (last column)
    total_str = row[-1].strip() if len(row) > 0 else ""
    total_amount = clean_currency(total_str)

    # Parse courier charge (second to last column)
    courier_str = row[-2].strip() if len(row) > 1 else ""
    courier_charge = clean_currency(courier_str)

    # Calculate subtotal
    subtotal = sum(item["quantity"] * item["unitPrice"] for item in line_items)

    # Create invoice object
    invoice = {
        "id": f"inv_{invoice_number}",
        "customerId": normalize_customer_name(customer_name),
        "invoiceNumber": invoice_number,
        "issueDate": parse_date(date_str),
        "dueDate": parse_date(date_str),  # Same as issue date for now
        "status": status,
        "poNumber": po_number,
        "type": invoice_type,
        "lineItems": line_items,
        "subtotal": subtotal,
        "taxAmount": 0.0,  # Tax seems to be included in prices
        "discountAmount": 0.0,
        "shippingAmount": courier_charge,
        "totalAmount": total_amount if total_amount > 0 else subtotal + courier_charge,
        "notes": f"{invoice_type} customer"
        + (f" - Consumer: {consumer}" if consumer else ""),
    }

    return invoice


def create_payment_from_invoice(invoice: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Create payment record for paid invoices."""
    if invoice["status"].lower() != "paid":
        return None

    payment = {
        "id": f"pay_{invoice['invoiceNumber']}",
        "customerId": invoice["customerId"],
        "paymentDate": invoice["issueDate"],  # Assume payment date same as invoice date
        "amount": invoice["totalAmount"],
        "method": "Unknown",  # Not specified in data
        "reference": f"Payment for invoice {invoice['invoiceNumber']}",
        "allocations": [{"invoiceId": invoice["id"], "amount": invoice["totalAmount"]}],
    }

    return payment


def main():
    """Main processing function."""
    print("🔄 Fetching updated invoice data from Google Sheets...")

    # Fetch the data
    sheet_url = "https://docs.google.com/spreadsheets/d/1jNxXxHg4Zt4k0DaJZaJGCeboUq1fyE4psTaFL_Jkg44/gviz/tq?tqx=out:html"
    rows = fetch_google_sheets_data(sheet_url)

    if not rows:
        print("❌ No data found in spreadsheet")
        return

    print(f"📊 Found {len(rows)} rows in spreadsheet")

    # First row is headers
    headers = rows[0] if rows else []
    data_rows = rows[1:] if len(rows) > 1 else []

    print(f"📋 Processing {len(data_rows)} invoice records...")

    # Process invoices
    invoices = []
    payments = []

    for i, row in enumerate(data_rows):
        try:
            invoice = create_invoice_from_row(row, headers)
            if invoice:
                invoices.append(invoice)

                # Create payment if invoice is paid
                payment = create_payment_from_invoice(invoice)
                if payment:
                    payments.append(payment)

        except Exception as e:
            print(f"⚠️ Error processing row {i + 2}: {e}")
            continue

    print(
        f"✅ Successfully processed {len(invoices)} invoices and {len(payments)} payments"
    )

    # Validate product references
    print("\n🔍 Validating product references...")
    with open("normalized/products.json", "r") as f:
        products_data = json.load(f)
        product_ids = set(products_data.get("products", {}).keys())

    missing_products = set()
    for invoice in invoices:
        for item in invoice["lineItems"]:
            if item["productId"] not in product_ids:
                missing_products.add(item["productId"])

    if missing_products:
        print(f"⚠️ Found {len(missing_products)} missing product references:")
        for product_id in missing_products:
            print(f"   - {product_id}")
    else:
        print("✅ All product references are valid")

    # Save to files
    print(f"\n💾 Saving {len(invoices)} invoices to normalized/invoices_new.json...")
    with open("normalized/invoices_new.json", "w") as f:
        json.dump(invoices, f, indent=2)

    print(f"💾 Saving {len(payments)} payments to normalized/payments_new.json...")
    with open("normalized/payments_new.json", "w") as f:
        json.dump(payments, f, indent=2)

    # Print summary
    print(f"\n📊 Summary:")
    print(f"   • Total invoices: {len(invoices)}")
    print(f"   • Paid invoices: {len(payments)}")
    print(f"   • Unpaid invoices: {len(invoices) - len(payments)}")

    # Count by status
    status_counts = {}
    for invoice in invoices:
        status = invoice["status"]
        status_counts[status] = status_counts.get(status, 0) + 1

    print(f"   • Status breakdown:")
    for status, count in status_counts.items():
        print(f"     - {status}: {count}")

    print(f"\n🎉 Invoice and payment transformation completed successfully!")
    print(f"📁 Files created:")
    print(f"   - invoices_new.json ({len(invoices)} records)")
    print(f"   - payments_new.json ({len(payments)} records)")


if __name__ == "__main__":
    main()
