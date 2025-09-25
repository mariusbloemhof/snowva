// Simple Firebase connection test
import { runFirebaseTests } from "./utils/firebaseTest.js";

// Test Firebase connection
console.log("Testing Firebase connection...");
runFirebaseTests()
  .then(() => {
    console.log("Firebase tests completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Firebase test failed:", error);
    process.exit(1);
  });
