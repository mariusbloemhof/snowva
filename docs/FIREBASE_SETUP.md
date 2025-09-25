# Firebase Setup Instructions

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "snowva-business-hub")
4. Enable Google Analytics (optional)
5. Create the project

## 2. Enable Firestore Database

1. In your Firebase project, click on "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select your preferred location
5. Click "Done"

## 3. Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click "Web" icon (</>) to add a web app
4. Register your app with a nickname
5. Copy the Firebase configuration object

## 4. Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional: Firebase Emulator (for local development)
VITE_USE_FIREBASE_EMULATOR=false

# Gemini AI (existing)
VITE_GEMINI_API_KEY=your_existing_gemini_key
```

## 5. Example Configuration

Your Firebase config object will look like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxxxxxxxxxxx",
};
```

## 6. Security Rules (Initial Setup)

In Firestore Database → Rules, use these rules for development:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // WARNING: Only for development!
    }
  }
}
```

**IMPORTANT:** Update these rules for production to implement proper security.

## 7. After Configuration

Once you've set up your environment variables:

1. The Firebase services will automatically connect
2. You can run the data migration to populate Firebase with your existing data
3. The app will use Firebase instead of mock data

## 8. Data Migration

After Firebase is configured, you can migrate your existing data:

```javascript
import { dataMigration } from "./utils/dataMigration";

// Migrate all data
const results = await dataMigration.migrateAll();

// Or migrate specific data types
await dataMigration.migrateCustomers();
await dataMigration.migrateProducts();
// etc.
```

## 9. Testing Firebase Connection

You can test the Firebase connection by:

1. Opening browser developer tools
2. Going to the Network tab
3. Loading the app - you should see Firestore API calls
4. Check the Console for any Firebase-related logs

## Troubleshooting

- **"Firebase: No Firebase App '[DEFAULT]' has been created"**: Check your environment variables
- **"Missing or insufficient permissions"**: Check Firestore security rules
- **Network errors**: Verify your API key and project configuration
- **CORS issues**: Make sure your domain is authorized in Firebase Console

## Production Considerations

1. **Security Rules**: Implement proper authentication and authorization
2. **API Key Restrictions**: Restrict your API keys to specific domains
3. **Monitoring**: Set up Firebase monitoring and alerts
4. **Backup**: Configure automated backups for Firestore
5. **Performance**: Consider indexing strategies for large datasets
