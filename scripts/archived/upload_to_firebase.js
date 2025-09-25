import { initializeApp } from "firebase/app";
import { doc, getFirestore, setDoc, Timestamp } from "firebase/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA1h2LlbmGwJpXcNlJaVSPxOzJt8cn1mKs",
  authDomain: "snowva-gemini.firebaseapp.com",
  projectId: "snowva-gemini",
  storageBucket: "snowva-gemini.firebasestorage.app",
  messagingSenderId: "1069740672302",
  appId: "1:1069740672302:web:6928c0bf7a98e8c8c63fb4",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper function to convert timestamp objects to Firebase Timestamps
function convertTimestampFields(obj) {
  if (!obj || typeof obj !== "object") return obj;

  const converted = { ...obj };

  // Convert date fields that are in {_seconds, _nanoseconds} format
  const dateFields = [
    "issueDate",
    "dueDate",
    "date",
    "effectiveDate",
    "validUntil",
    "createdAt",
    "updatedAt",
  ];

  for (const field of dateFields) {
    if (converted[field]) {
      // Handle {_seconds, _nanoseconds} format
      if (
        typeof converted[field] === "object" &&
        (converted[field]._seconds || converted[field].seconds)
      ) {
        const seconds = converted[field]._seconds || converted[field].seconds;
        const nanoseconds =
          converted[field]._nanoseconds || converted[field].nanoseconds || 0;
        console.log(`Converting ${field}: ${seconds} seconds`);
        converted[field] = new Timestamp(seconds, nanoseconds);
      }
      // Handle ISO string format
      else if (
        typeof converted[field] === "string" &&
        converted[field].includes("T")
      ) {
        console.log(`Converting ISO string ${field}: ${converted[field]}`);
        const date = new Date(converted[field]);
        converted[field] = Timestamp.fromDate(date);
      }
    }
  }

  // Recursively process nested objects (like prices in products)
  if (converted.prices && Array.isArray(converted.prices)) {
    converted.prices = converted.prices.map((price) =>
      convertTimestampFields(price)
    );
  }

  if (
    converted.customProductPricing &&
    Array.isArray(converted.customProductPricing)
  ) {
    converted.customProductPricing = converted.customProductPricing.map(
      (cpp) => ({
        ...cpp,
        prices: Array.isArray(cpp.prices)
          ? cpp.prices.map((price) => convertTimestampFields(price))
          : cpp.prices,
      })
    );
  }

  return converted;
}

// Upload products
async function uploadProducts() {
  try {
    const productsData = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "data/normalized/products.json"),
        "utf8"
      )
    );

    // Extract products from the nested structure
    const products = productsData.products
      ? Object.values(productsData.products)
      : productsData;
    console.log(`Uploading ${products.length} products...`);

    for (const product of products) {
      const converted = convertTimestampFields(product);
      await setDoc(doc(db, "products", product.id), converted);
      console.log(`✓ Uploaded product: ${product.id}`);
    }
    console.log("✅ All products uploaded successfully!");
  } catch (error) {
    console.error("❌ Error uploading products:", error);
  }
}

// Upload customers
async function uploadCustomers() {
  try {
    const customersData = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "data/normalized/customers.json"),
        "utf8"
      )
    );

    // Extract customers from nested structure if needed
    const customers = Array.isArray(customersData)
      ? customersData
      : Object.values(customersData);
    console.log(`Uploading ${customers.length} customers...`);

    for (const customer of customers) {
      const converted = convertTimestampFields(customer);
      await setDoc(doc(db, "customers", customer.id), converted);
      console.log(`✓ Uploaded customer: ${customer.id}`);
    }
    console.log("✅ All customers uploaded successfully!");
  } catch (error) {
    console.error("❌ Error uploading customers:", error);
  }
}

// Upload invoices
async function uploadInvoices() {
  try {
    const invoicesData = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "data/normalized/invoices.json"),
        "utf8"
      )
    );
    console.log(`Uploading ${invoicesData.length} invoices...`);

    let count = 0;
    for (const invoice of invoicesData) {
      const converted = convertTimestampFields(invoice);
      await setDoc(doc(db, "invoices", invoice.id), converted);
      count++;
      if (count % 50 === 0) {
        console.log(`✓ Uploaded ${count}/${invoicesData.length} invoices...`);
      }
    }
    console.log("✅ All invoices uploaded successfully!");
  } catch (error) {
    console.error("❌ Error uploading invoices:", error);
  }
}

// Upload payments
async function uploadPayments() {
  try {
    const paymentsData = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "data/normalized/payments.json"),
        "utf8"
      )
    );
    console.log(`Uploading ${paymentsData.length} payments...`);

    for (const payment of paymentsData) {
      const converted = convertTimestampFields(payment);
      await setDoc(doc(db, "payments", payment.id), converted);
      console.log(`✓ Uploaded payment: ${payment.id}`);
    }
    console.log("✅ All payments uploaded successfully!");
  } catch (error) {
    console.error("❌ Error uploading payments:", error);
  }
}

// Main upload function
async function uploadAllData() {
  console.log("🚀 Starting Firebase data upload...");
  console.log(
    "⚠️  Make sure you have cleared the existing collections in Firebase Console first!"
  );
  console.log("");

  try {
    await uploadProducts();
    console.log("");
    await uploadCustomers();
    console.log("");
    await uploadInvoices();
    console.log("");
    await uploadPayments();
    console.log("");
    console.log("🎉 All data uploaded successfully to Firebase!");
  } catch (error) {
    console.error("❌ Upload failed:", error);
  } finally {
    process.exit(0);
  }
}

// Check if this script is run directly (ES module version)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // Prompt user to confirm they've cleared the collections
  console.log("⚠️  IMPORTANT: Before running this script:");
  console.log("   1. Go to Firebase Console → Firestore Database");
  console.log(
    "   2. Clear all documents in customers, invoices, and payments collections"
  );
  console.log(
    "   3. Update the firebaseConfig object in this script with your actual Firebase config"
  );
  console.log("");
  console.log("Press Ctrl+C to cancel, or any key to continue...");

  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on("data", () => {
    uploadAllData();
  });
}

export {
  uploadAllData,
  uploadCustomers,
  uploadInvoices,
  uploadPayments,
  uploadProducts,
};
