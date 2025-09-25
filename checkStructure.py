#!/usr/bin/env python3
"""
Quick structure check to understand JSON format
"""

import json


def check_structure():
    """Check the structure of our JSON files"""

    # Load customers first
    try:
        with open("data/normalized/customers.json", "r", encoding="utf-8") as f:
            customers_data = json.load(f)

        print(f"Customers file type: {type(customers_data)}")

        if isinstance(customers_data, dict):
            print(f"First 3 keys in customers: {list(customers_data.keys())[:3]}")
            first_key = list(customers_data.keys())[0]
            first_customer = customers_data[first_key]
            print(f"First customer structure: {first_customer.keys()}")

        # Load products
        with open("data/normalized/products.json", "r", encoding="utf-8") as f:
            products_data = json.load(f)

        print(f"Products file type: {type(products_data)}")
        if isinstance(products_data, dict):
            print(f"First 3 keys in products: {list(products_data.keys())[:3]}")

    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    check_structure()
