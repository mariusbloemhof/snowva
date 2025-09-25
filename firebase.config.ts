// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDOGdRyjVOOe9rWe3IJdD66dzcF7EZKL50",
  authDomain: "snowva-f76d8.firebaseapp.com",
  projectId: "snowva-f76d8",
  storageBucket: "snowva-f76d8.firebasestorage.app",
  messagingSenderId: "797875986991",
  appId: "1:797875986991:web:5868716f3f8beb87ad5cda",
  measurementId: "G-Z28MVR4NL7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

// Connect to emulators in development (optional)
if (process.env.NODE_ENV === 'development' && !globalThis.__FIREBASE_EMULATOR_INITIALIZED) {
  try {
    // Uncomment these lines if you want to use Firebase emulators in development
    // connectFirestoreEmulator(db, 'localhost', 8080);
    // connectAuthEmulator(auth, 'http://localhost:9099');
    globalThis.__FIREBASE_EMULATOR_INITIALIZED = true;
  } catch (error) {
    console.log('Firebase emulator already initialized');
  }
}

export default app;