// Simple migration script to run via browser console
// Navigate to the app and paste this in the console

import { FirebaseAdmin } from "./utils/dataMigration.js";

async function remigrate() {
  console.log("Starting customer re-migration...");

  const admin = new FirebaseAdmin();

  // Clear customers
  console.log("Clearing customers...");
  await admin.clearCollection("customers");

  // Re-migrate customers with fixed product IDs
  console.log("Re-migrating customers...");
  await admin.migrateCustomers();

  console.log("✅ Customer re-migration complete!");
}

// Run it
remigrate().catch(console.error);
