// Complete Firebase Re-migration Script
// Run this in the browser console when the Snowva app is loaded

async function completeFirebaseRemigration() {
  console.log("🔥 Starting Complete Firebase Re-migration");
  console.log("=".repeat(50));

  try {
    // Dynamically import the FirebaseAdmin class
    const { FirebaseAdmin } = await import("./utils/dataMigration.js");
    const admin = new FirebaseAdmin();

    // Step 1: Clear all collections
    console.log("🗑️ Clearing existing Firebase collections...");
    const collections = ["products", "customers", "invoices", "payments"];

    for (const collection of collections) {
      console.log(`  Clearing ${collection}...`);
      await admin.clearCollection(collection);
      console.log(`  ✅ ${collection} cleared`);
    }

    // Step 2: Re-migrate all data in correct order
    console.log("\n📤 Re-migrating all data with fixed relationships...");

    // Products first (base dependency)
    console.log("  📦 Migrating products...");
    await admin.migrateProducts();
    console.log("  ✅ Products migrated");

    // Customers (depends on products for pricing)
    console.log("  👥 Migrating customers...");
    await admin.migrateCustomers();
    console.log("  ✅ Customers migrated");

    // Invoices (depends on customers and products)
    console.log("  📄 Migrating invoices...");
    await admin.migrateInvoices();
    console.log("  ✅ Invoices migrated");

    // Payments (depends on customers and invoices)
    console.log("  💰 Migrating payments...");
    await admin.migratePayments();
    console.log("  ✅ Payments migrated");

    console.log("\n🎉 Complete Firebase re-migration successful!");
    console.log(
      "All data has been re-uploaded with fixed relational integrity."
    );
    console.log("\n✅ Next Steps:");
    console.log("1. Refresh the page");
    console.log("2. Test the Custom Product Pricing tab");
    console.log("3. Verify all product names are displayed correctly");

    return true;
  } catch (error) {
    console.error("❌ Migration failed:", error);
    return false;
  }
}

// Run the migration
completeFirebaseRemigration()
  .then((success) => {
    if (success) {
      console.log("\n🔄 Please refresh the page to see the changes!");
    }
  })
  .catch((error) => {
    console.error("❌ Failed to run migration:", error);
  });
