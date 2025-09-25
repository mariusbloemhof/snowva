#!/usr/bin/env python3
"""
Fix customer product IDs to match the correct product IDs from products.json
"""
import json

# Product ID mappings
PRODUCT_ID_MAPPINGS = {
    "snowva_ultimate_ice_maker": "prod_snowva",
    "outray": "prod_outray",
    "makabrai": "prod_makabrai",
}


def fix_customer_product_ids():
    """Update customer customProductPricing to use correct product IDs"""

    # Load customers data
    with open("data/normalized/customers.json", "r", encoding="utf-8") as f:
        customers = json.load(f)
    total_fixes = 0

    for customer_id, customer in customers.items():
        if "customProductPricing" in customer:
            for pricing in customer["customProductPricing"]:
                old_product_id = pricing["productId"]
                if old_product_id in PRODUCT_ID_MAPPINGS:
                    new_product_id = PRODUCT_ID_MAPPINGS[old_product_id]
                    pricing["productId"] = new_product_id

                    # Also update the pricing ID to reflect the new product ID
                    if "prices" in pricing:
                        for price in pricing["prices"]:
                            old_price_id = price["id"]
                            # Replace old product ID with new product ID in price ID
                            new_price_id = old_price_id.replace(
                                old_product_id, new_product_id
                            )
                            price["id"] = new_price_id

                    # Update the pricing record ID as well
                    old_pricing_id = pricing["id"]
                    new_pricing_id = old_pricing_id.replace(
                        old_product_id, new_product_id
                    )
                    pricing["id"] = new_pricing_id

                    total_fixes += 1
                    print(f"Fixed {customer_id}: {old_product_id} → {new_product_id}")

    # Write updated data back
    with open("data/normalized/customers.json", "w", encoding="utf-8") as f:
        json.dump(customers, f, indent=2, ensure_ascii=False)

    print(f"\nCompleted! Fixed {total_fixes} product ID references.")
    return total_fixes


if __name__ == "__main__":
    fix_customer_product_ids()
