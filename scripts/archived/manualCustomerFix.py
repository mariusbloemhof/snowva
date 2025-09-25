#!/usr/bin/env python3
"""
FINAL MANUAL CUSTOMER MAPPING FIX
Based on similarity analysis, apply the high-confidence mappings
"""

import json


def apply_manual_customer_mappings():
    """Apply manual mappings for high-confidence customer matches"""

    print("=" * 80)
    print("APPLYING MANUAL CUSTOMER MAPPINGS (HIGH CONFIDENCE)")
    print("=" * 80)

    # High-confidence mappings (similarity > 0.8)
    manual_mappings = {
        "cust_aa_business_services": "a_a_business_services_pty_ltd",
        "cust_daramode__tuinroete_woonwaens": "t_a_tuinroete_woonwaens",
        "cust_limeco_minerals_braailholix": "limeco_minerals_pty_ltd_t_a_braailholix",
        "cust_riversdale_trading_bali_trading": "riversdale_trading_t_a_bali_trading",
        "cust_santonio_musina_foodzone": "santonio_cc_t_a_musina_foodzone",
        "cust_steyns_boumateriale": "steyn_s_boumateriale",
        "cust_walkers_midas_upington_4x4_mega_world": "walkers_midas_upington_t_a_4x4_mega_world",
        "cust_watko_promotional_branded_image": "watko_promotional_cc_t_a_branded_image",
    }

    # Medium-confidence mappings (similarity 0.5-0.8, but clear matches)
    medium_mappings = {
        "cust_estelle_menzies": "stellenbosch",  # 0.59 similarity
        "cust_johan_nel": "hahn_hahn",  # 0.56 similarity
        "cust_naomi_bouwer": "agri_bonus",  # 0.55 similarity
        "cust_lena_van_rensburg": "lydenburg",  # 0.54 similarity
    }

    all_mappings = {**manual_mappings, **medium_mappings}

    print(f"Applying {len(all_mappings)} manual customer mappings...")
    print("\nMappings:")
    for old_id, new_id in all_mappings.items():
        print(f"  {old_id} -> {new_id}")

    # Load data
    with open("data/normalized/invoices.json", "r", encoding="utf-8") as f:
        invoices = json.load(f)
    with open("data/normalized/payments.json", "r", encoding="utf-8") as f:
        payments = json.load(f)

    # Apply fixes to invoices
    invoice_fixes = 0
    for invoice in invoices:
        old_customer_id = invoice.get("customerId")
        if old_customer_id in all_mappings:
            new_customer_id = all_mappings[old_customer_id]
            invoice["customerId"] = new_customer_id
            invoice_fixes += 1

    # Apply fixes to payments
    payment_fixes = 0
    for payment in payments:
        old_customer_id = payment.get("customerId")
        if old_customer_id in all_mappings:
            new_customer_id = all_mappings[old_customer_id]
            payment["customerId"] = new_customer_id
            payment_fixes += 1

    print(f"\n✅ Fixed {invoice_fixes} invoice customer references")
    print(f"✅ Fixed {payment_fixes} payment customer references")

    # Save fixed data
    with open("data/normalized/invoices.json", "w", encoding="utf-8") as f:
        json.dump(invoices, f, indent=2, ensure_ascii=False)

    with open("data/normalized/payments.json", "w", encoding="utf-8") as f:
        json.dump(payments, f, indent=2, ensure_ascii=False)

    print(f"💾 Saved fixed data")

    return invoice_fixes + payment_fixes


if __name__ == "__main__":
    total_fixes = apply_manual_customer_mappings()

    print(f"\n🎉 APPLIED {total_fixes} MANUAL CUSTOMER REFERENCE FIXES!")
    print("\nRun finalIntegrityCheck.py to verify remaining issues...")
