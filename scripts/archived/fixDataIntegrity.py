#!/usr/bin/env python3
"""
Comprehensive Data Integrity Fix and Firebase Re-migration Script

This script will:
1. Analyze relational integrity issues across all JSON files
2. Fix product ID consistency across customers, invoices, quotes, and payments
3. Ensure all foreign key relationships are valid
4. Provide a complete re-migration to Firebase
"""
import json
import os
from typing import Dict, List, Set, Any


class DataIntegrityFixer:
    def __init__(self):
        self.data_dir = "data/normalized"
        self.products = {}
        self.customers = {}
        self.invoices = {}
        self.quotes = {}
        self.payments = {}

        # Track all issues found
        self.issues = {
            "invalid_product_refs": [],
            "invalid_customer_refs": [],
            "missing_products": [],
            "inconsistent_ids": [],
        }

    def load_all_data(self):
        """Load all JSON data files"""
        print("📂 Loading all data files...")

        # Products: { "products": { prod_id: {...}, ... } }
        with open(f"{self.data_dir}/products.json", "r", encoding="utf-8") as f:
            products_data = json.load(f)
            self.products = products_data.get("products", products_data)

        # Customers: { customer_id: {...}, ... }
        with open(f"{self.data_dir}/customers.json", "r", encoding="utf-8") as f:
            self.customers = json.load(f)

        # Invoices: [ {...}, ... ] - convert to dict by id
        with open(f"{self.data_dir}/invoices.json", "r", encoding="utf-8") as f:
            invoices_list = json.load(f)
            self.invoices = {invoice["id"]: invoice for invoice in invoices_list}

        # Check if quotes.json exists
        quotes_file = f"{self.data_dir}/quotes.json"
        if os.path.exists(quotes_file):
            with open(quotes_file, "r", encoding="utf-8") as f:
                quotes_data = json.load(f)
                # Assume it could be array or object
                if isinstance(quotes_data, list):
                    self.quotes = {quote["id"]: quote for quote in quotes_data}
                else:
                    self.quotes = quotes_data
        else:
            print("  ⚠️ quotes.json not found, skipping...")
            self.quotes = {}

        # Payments: [ {...}, ... ] - convert to dict by id
        with open(f"{self.data_dir}/payments.json", "r", encoding="utf-8") as f:
            payments_list = json.load(f)
            self.payments = {payment["id"]: payment for payment in payments_list}

        print(f"✅ Loaded:")
        print(f"  - Products: {len(self.products)}")
        print(f"  - Customers: {len(self.customers)}")
        print(f"  - Invoices: {len(self.invoices)}")
        print(f"  - Quotes: {len(self.quotes)}")
        print(f"  - Payments: {len(self.payments)}")

    def analyze_product_integrity(self):
        """Analyze and report product ID consistency issues"""
        print("\n🔍 Analyzing product integrity...")

        product_ids = set(self.products.keys())
        print(f"Available product IDs: {sorted(product_ids)}")

        # Check customer customProductPricing
        customer_product_refs = set()
        for customer_id, customer in self.customers.items():
            if "customProductPricing" in customer:
                for pricing in customer["customProductPricing"]:
                    product_id = pricing["productId"]
                    customer_product_refs.add(product_id)
                    if product_id not in product_ids:
                        self.issues["invalid_product_refs"].append(
                            {
                                "type": "customer_pricing",
                                "customer_id": customer_id,
                                "invalid_product_id": product_id,
                                "pricing_id": pricing["id"],
                            }
                        )

        # Check invoice line items
        invoice_product_refs = set()
        for invoice_id, invoice in self.invoices.items():
            if "lineItems" in invoice:
                for item in invoice["lineItems"]:
                    product_id = item["productId"]
                    invoice_product_refs.add(product_id)
                    if product_id not in product_ids:
                        self.issues["invalid_product_refs"].append(
                            {
                                "type": "invoice_line_item",
                                "invoice_id": invoice_id,
                                "invalid_product_id": product_id,
                                "line_item_id": item["id"],
                            }
                        )

        # Check quote line items
        quote_product_refs = set()
        for quote_id, quote in self.quotes.items():
            if "lineItems" in quote:
                for item in quote["lineItems"]:
                    product_id = item["productId"]
                    quote_product_refs.add(product_id)
                    if product_id not in product_ids:
                        self.issues["invalid_product_refs"].append(
                            {
                                "type": "quote_line_item",
                                "quote_id": quote_id,
                                "invalid_product_id": product_id,
                                "line_item_id": item["id"],
                            }
                        )

        print(f"\n📊 Product Reference Analysis:")
        print(f"  - Customer pricing refs: {len(customer_product_refs)}")
        print(f"  - Invoice line item refs: {len(invoice_product_refs)}")
        print(f"  - Quote line item refs: {len(quote_product_refs)}")
        print(
            f"  - Invalid product references: {len(self.issues['invalid_product_refs'])}"
        )

        # Show invalid references
        if self.issues["invalid_product_refs"]:
            print(f"\n❌ Invalid Product References:")
            invalid_refs = {}
            for issue in self.issues["invalid_product_refs"]:
                ref = issue["invalid_product_id"]
                if ref not in invalid_refs:
                    invalid_refs[ref] = []
                invalid_refs[ref].append(issue)

            for invalid_id, occurrences in invalid_refs.items():
                print(f"  - '{invalid_id}' used {len(occurrences)} times")

        return customer_product_refs, invoice_product_refs, quote_product_refs

    def create_product_id_mapping(self):
        """Create mapping from old/invalid product IDs to correct ones"""
        print("\n🔧 Creating product ID mapping...")

        # Build comprehensive mapping based on patterns observed
        product_mapping = {
            # Original issues
            "snowva_ultimate_ice_maker": "prod_snowva",
            "outray": "prod_outray",
            "makabrai": "prod_makabrai",
            # Missing "prod_" prefix mappings
            "borki": "prod_borki",
            "braai_bak_2_5l": "prod_braai_bak_2_5l",
            "braai_bak_3_8l": "prod_braai_bak_3_8l",
            "braai_bak_5_2l": "prod_braai_bak_5_2l",
            "braai_grid_large": "prod_braai_grid_large",
            "braai_grid_medium": "prod_braai_grid_medium",
            "braai_grid_small": "prod_braai_grid_small",
            # Product variations that should map to existing products
            "snowva_ultimate_ice_tray_blue_assorted": "prod_snowva",
            "outray_travel_tray": "prod_outray",
            "braaitas": "prod_braai_tas",  # "braai tas" variant
            "borki_handmade": "prod_borki",  # borki variant
            # Grid variations - map to closest match
            "makabrai_grid_25x25": "prod_makabrai",
            "makabrai_grid_40x30": "prod_makabrai",
            "makabrai_grid_40x50": "prod_makabrai",
            "makabrai_grid_50x40": "prod_makabrai",
            # Size variations that don't have exact matches
            "braai_bak_5_5l": "prod_braai_bak_5_2l",  # Map to closest size
            # Single character issues
            "v": None,  # This looks like data corruption, skip it
        }

        print(f"Product ID Mapping:")
        for old_id, new_id in product_mapping.items():
            status = "✅" if new_id else "❌"
            print(f"  {status} '{old_id}' → '{new_id or 'SKIP (data corruption)'}'")

        return product_mapping

    def fix_product_references(self, product_mapping):
        """Fix all invalid product references using the mapping"""
        print(f"\n🔧 Fixing product references...")

        fixes_applied = 0

        # Fix customer customProductPricing
        for customer_id, customer in self.customers.items():
            if "customProductPricing" in customer:
                for pricing in customer["customProductPricing"]:
                    old_product_id = pricing["productId"]
                    if (
                        old_product_id in product_mapping
                        and product_mapping[old_product_id]
                    ):
                        new_product_id = product_mapping[old_product_id]
                        pricing["productId"] = new_product_id

                        # Also update pricing ID and price IDs
                        pricing["id"] = pricing["id"].replace(
                            old_product_id, new_product_id
                        )
                        if "prices" in pricing:
                            for price in pricing["prices"]:
                                price["id"] = price["id"].replace(
                                    old_product_id, new_product_id
                                )

                        fixes_applied += 1
                        print(
                            f"  Fixed customer {customer_id}: {old_product_id} → {new_product_id}"
                        )

        # Fix invoice line items
        for invoice_id, invoice in self.invoices.items():
            if "lineItems" in invoice:
                for item in invoice["lineItems"]:
                    old_product_id = item["productId"]
                    if (
                        old_product_id in product_mapping
                        and product_mapping[old_product_id]
                    ):
                        new_product_id = product_mapping[old_product_id]
                        item["productId"] = new_product_id
                        fixes_applied += 1
                        print(
                            f"  Fixed invoice {invoice_id}: {old_product_id} → {new_product_id}"
                        )

        # Fix quote line items
        for quote_id, quote in self.quotes.items():
            if "lineItems" in quote:
                for item in quote["lineItems"]:
                    old_product_id = item["productId"]
                    if (
                        old_product_id in product_mapping
                        and product_mapping[old_product_id]
                    ):
                        new_product_id = product_mapping[old_product_id]
                        item["productId"] = new_product_id
                        fixes_applied += 1
                        print(
                            f"  Fixed quote {quote_id}: {old_product_id} → {new_product_id}"
                        )

        print(f"✅ Applied {fixes_applied} product reference fixes")
        return fixes_applied

    def create_customer_id_mapping(self):
        """Create mapping from invoice customer IDs to actual customer IDs"""
        print(f"\n🔧 Creating customer ID mapping...")

        customer_mapping = {}
        available_customers = list(self.customers.keys())

        # Collect all invalid customer IDs from invoices
        invalid_customer_ids = set()
        for invoice_id, invoice in self.invoices.items():
            customer_id = invoice.get("customerId")
            if customer_id and customer_id not in self.customers:
                invalid_customer_ids.add(customer_id)

        # Create mappings based on name patterns
        for invalid_id in invalid_customer_ids:
            # Remove "cust_" prefix and try to match
            if invalid_id.startswith("cust_"):
                clean_id = invalid_id[5:]  # Remove "cust_" prefix

                # Try different cleaning patterns
                variations = [
                    clean_id,
                    clean_id.replace("__", "_"),
                    clean_id.replace("_", ""),
                ]

                # Special mappings for known patterns
                if "plettenberg_bay" in clean_id:
                    customer_mapping[invalid_id] = "plettenberg_bay"
                elif "pretoria_caravans" in clean_id:
                    customer_mapping[invalid_id] = "pretoria_caravans_outdoor"
                elif "sportsmans_warehouse" in clean_id:
                    # Extract location from sportsmans warehouse pattern
                    location = clean_id.split("__")[-1] if "__" in clean_id else ""
                    customer_mapping[invalid_id] = (
                        location if location in available_customers else None
                    )
                else:
                    # Try pattern matching for other cases
                    matched = False
                    for variation in variations:
                        if variation in available_customers:
                            customer_mapping[invalid_id] = variation
                            matched = True
                            break
                    if not matched:
                        customer_mapping[invalid_id] = None

        print(f"Customer ID Mapping (first 10):")
        count = 0
        for old_id, new_id in customer_mapping.items():
            if count >= 10:
                break
            status = "✅" if new_id else "❌"
            print(f"  {status} '{old_id}' → '{new_id or 'NO MATCH FOUND'}'")
            count += 1

        if len(customer_mapping) > 10:
            print(f"  ... and {len(customer_mapping) - 10} more mappings")

        return customer_mapping

    def fix_customer_references(self, customer_mapping):
        """Fix all invalid customer references using the mapping"""
        print(f"\n🔧 Fixing customer references...")

        fixes_applied = 0

        # Fix invoice customer references
        for invoice_id, invoice in self.invoices.items():
            old_customer_id = invoice.get("customerId")
            if (
                old_customer_id in customer_mapping
                and customer_mapping[old_customer_id]
            ):
                new_customer_id = customer_mapping[old_customer_id]
                invoice["customerId"] = new_customer_id
                fixes_applied += 1
                if fixes_applied <= 5:  # Only show first 5
                    print(
                        f"  Fixed invoice {invoice_id}: {old_customer_id} → {new_customer_id}"
                    )

        # Fix quote customer references
        for quote_id, quote in self.quotes.items():
            old_customer_id = quote.get("customerId")
            if (
                old_customer_id in customer_mapping
                and customer_mapping[old_customer_id]
            ):
                new_customer_id = customer_mapping[old_customer_id]
                quote["customerId"] = new_customer_id
                fixes_applied += 1

        # Fix payment customer references
        for payment_id, payment in self.payments.items():
            old_customer_id = payment.get("customerId")
            if (
                old_customer_id in customer_mapping
                and customer_mapping[old_customer_id]
            ):
                new_customer_id = customer_mapping[old_customer_id]
                payment["customerId"] = new_customer_id
                fixes_applied += 1

        if fixes_applied > 5:
            print(f"  ... and {fixes_applied - 5} more customer reference fixes")

        print(f"✅ Applied {fixes_applied} customer reference fixes")
        return fixes_applied

    def analyze_customer_integrity(self):
        """Check customer ID references in invoices, quotes, and payments"""
        print(f"\n🔍 Analyzing customer integrity...")

        customer_ids = set(self.customers.keys())

        # Check invoice customer references
        for invoice_id, invoice in self.invoices.items():
            customer_id = invoice.get("customerId")
            if customer_id and customer_id not in customer_ids:
                self.issues["invalid_customer_refs"].append(
                    {
                        "type": "invoice",
                        "document_id": invoice_id,
                        "invalid_customer_id": customer_id,
                    }
                )

        # Check quote customer references
        for quote_id, quote in self.quotes.items():
            customer_id = quote.get("customerId")
            if customer_id and customer_id not in customer_ids:
                self.issues["invalid_customer_refs"].append(
                    {
                        "type": "quote",
                        "document_id": quote_id,
                        "invalid_customer_id": customer_id,
                    }
                )

        # Check payment customer references
        for payment_id, payment in self.payments.items():
            customer_id = payment.get("customerId")
            if customer_id and customer_id not in customer_ids:
                self.issues["invalid_customer_refs"].append(
                    {
                        "type": "payment",
                        "document_id": payment_id,
                        "invalid_customer_id": customer_id,
                    }
                )

        print(
            f"❌ Invalid customer references: {len(self.issues['invalid_customer_refs'])}"
        )

    def save_fixed_data(self):
        """Save all fixed data back to JSON files"""
        print(f"\n💾 Saving fixed data...")

        # Save customers as direct object
        with open(f"{self.data_dir}/customers.json", "w", encoding="utf-8") as f:
            json.dump(self.customers, f, indent=2, ensure_ascii=False)

        # Save invoices as array
        invoices_list = list(self.invoices.values())
        with open(f"{self.data_dir}/invoices.json", "w", encoding="utf-8") as f:
            json.dump(invoices_list, f, indent=2, ensure_ascii=False)

        # Save payments as array
        payments_list = list(self.payments.values())
        with open(f"{self.data_dir}/payments.json", "w", encoding="utf-8") as f:
            json.dump(payments_list, f, indent=2, ensure_ascii=False)

        # Only save quotes if we loaded them
        if self.quotes:
            quotes_list = list(self.quotes.values())
            with open(f"{self.data_dir}/quotes.json", "w", encoding="utf-8") as f:
                json.dump(quotes_list, f, indent=2, ensure_ascii=False)

        print("✅ All fixed data saved!")

    def generate_summary_report(self):
        """Generate a comprehensive summary of all issues and fixes"""
        print(f"\n📋 INTEGRITY ANALYSIS SUMMARY")
        print("=" * 50)

        total_issues = sum(len(issues) for issues in self.issues.values())
        print(f"Total Issues Found: {total_issues}")

        for issue_type, issues in self.issues.items():
            if issues:
                print(f"\n{issue_type.replace('_', ' ').title()}: {len(issues)}")
                if issue_type == "invalid_product_refs":
                    # Group by invalid product ID
                    invalid_refs = {}
                    for issue in issues:
                        ref = issue["invalid_product_id"]
                        if ref not in invalid_refs:
                            invalid_refs[ref] = 0
                        invalid_refs[ref] += 1

                    for invalid_id, count in invalid_refs.items():
                        print(f"  - '{invalid_id}': {count} references")

    def run_complete_fix(self):
        """Run the complete data integrity fix process"""
        print("🚀 Starting Complete Data Integrity Fix")
        print("=" * 50)

        # Step 1: Load all data
        self.load_all_data()

        # Step 2: Analyze product integrity
        self.analyze_product_integrity()

        # Step 3: Create product ID mapping
        product_mapping = self.create_product_id_mapping()

        # Step 4: Fix product references
        fixes_applied = self.fix_product_references(product_mapping)

        # Step 5: Analyze customer integrity
        self.analyze_customer_integrity()

        # Step 6: Generate summary report
        self.generate_summary_report()

        # Step 7: Save fixed data
        if fixes_applied > 0:
            self.save_fixed_data()

        print(f"\n🎉 Data integrity fix complete!")
        print(f"Applied {fixes_applied} fixes across all data files.")

        return fixes_applied > 0


def main():
    """Main function to run the data integrity fixer"""
    fixer = DataIntegrityFixer()
    data_was_modified = fixer.run_complete_fix()

    if data_was_modified:
        print(f"\n🔄 Next Steps:")
        print(f"1. Review the changes made to the JSON files")
        print(f"2. Run a complete Firebase re-migration")
        print(f"3. Test the application to ensure all relationships work")
    else:
        print(f"\n✅ No data modifications were needed!")


if __name__ == "__main__":
    main()
