# Firebase Theme Service Contract

**Feature**: 001-theming | **Component**: FirebaseThemeService | **Date**: 2025-09-26

## Service Class Interface

### ThemeService Class
```typescript
class FirebaseThemeService {
  private db: Firestore;
  private userId: string | null;
  private cache: Map<string, Theme>;
  private preferencesCache: UserThemePreferences | null;

  constructor(firebaseConfig: FirebaseConfig);
  
  // User Authentication
  setUserId(userId: string): void;
  clearUserId(): void;
  
  // Theme Management
  getAvailableThemes(): Promise<Theme[]>;
  getTheme(themeId: string): Promise<Theme>;
  validateTheme(theme: Theme): Promise<boolean>;
  
  // User Preferences
  getUserPreferences(): Promise<UserThemePreferences>;
  updateUserPreferences(preferences: Partial<UserThemePreferences>): Promise<void>;
  clearUserPreferences(): Promise<void>;
  
  // Offline Support
  enableOfflineSupport(): void;
  syncOfflineChanges(): Promise<void>;
  getOfflinePreferences(): UserThemePreferences | null;
}
```

## Method Contracts

### getAvailableThemes
```typescript
/**
 * Retrieve all available themes from Firestore
 * @returns Promise<Theme[]> - Array of available themes
 * @throws FirebaseError if connection fails
 * @throws ValidationError if theme data is invalid
 */
async getAvailableThemes(): Promise<Theme[]>

// Expected behavior:
// 1. Check cache first (return if fresh < 5 minutes)
// 2. Query /themes collection with proper ordering
// 3. Validate each theme schema
// 4. Filter out disabled/deprecated themes
// 5. Update cache with results
// 6. Return theme array sorted by category/name
```

### getTheme
```typescript
/**
 * Retrieve specific theme by ID
 * @param themeId - Unique theme identifier
 * @returns Promise<Theme> - Theme object
 * @throws ThemeNotFoundError if theme doesn't exist
 * @throws ValidationError if theme data is corrupted
 */
async getTheme(themeId: string): Promise<Theme>

// Expected behavior:
// 1. Check cache first
// 2. Query /themes/{themeId} document
// 3. Validate theme schema
// 4. Cache result for future requests
// 5. Return theme object
```

### getUserPreferences
```typescript
/**
 * Get current user's theme preferences
 * @returns Promise<UserThemePreferences> - User preferences
 * @throws AuthenticationError if no user set
 * @throws FirebaseError if document access fails
 */
async getUserPreferences(): Promise<UserThemePreferences>

// Expected behavior:
// 1. Verify userId is set
// 2. Check local cache first
// 3. Query /users/{userId}/preferences/theme document
// 4. If no document exists, return defaults
// 5. Validate preference schema
// 6. Cache preferences locally
// 7. Return preferences object
```

### updateUserPreferences
```typescript
/**
 * Update user theme preferences in Firestore
 * @param preferences - Partial preferences to update
 * @throws AuthenticationError if no user set
 * @throws ValidationError if preferences invalid
 * @throws FirebaseError if update fails
 */
async updateUserPreferences(preferences: Partial<UserThemePreferences>): Promise<void>

// Expected behavior:
// 1. Verify userId is set
// 2. Validate preference values
// 3. Merge with existing preferences
// 4. Set updatedAt timestamp
// 5. Update Firestore document (merge: true)
// 6. Update local cache
// 7. Trigger offline sync if needed
```

## Firebase Document Schemas

### Theme Document (/themes/{themeId})
```typescript
interface ThemeDocument {
  id: string;                    // Document ID
  name: string;                  // Display name
  description: string;           // Theme description
  category: ThemeCategory;       // Theme category
  isDefault: boolean;           // Default theme flag
  isActive: boolean;            // Enable/disable flag
  cssVariables: ThemeTokens;    // Complete token set
  previewImage?: string;        // Preview image URL
  supportedFeatures: string[];  // Feature compatibility
  version: string;              // Theme version
  createdAt: FirebaseTimestamp; // Creation time
  updatedAt: FirebaseTimestamp; // Last update time
  createdBy: string;            // Admin user ID
}
```

### User Preferences Document (/users/{userId}/preferences/theme)
```typescript
interface UserPreferencesDocument {
  selectedTheme: string;        // Current theme ID
  customizations: {
    fontSize: FontSizePreference;
    reducedMotion: boolean;
    highContrast: boolean;
    colorBlindness?: ColorBlindnessType;
  };
  recentThemes: string[];       // Recent theme IDs (max 5)
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}
```

## Offline Support Contract

### Local Storage Schema
```typescript
interface OfflineThemeData {
  preferences: UserThemePreferences;
  themes: Theme[];              // Cached theme definitions
  lastSync: number;            // Timestamp of last successful sync
  pendingUpdates: Partial<UserThemePreferences>[]; // Queue of offline changes
}
```

### Offline Operations
```typescript
/**
 * Enable offline functionality with local storage fallback
 */
enableOfflineSupport(): void

// Expected behavior:
// 1. Set up local storage listeners
// 2. Cache current user preferences
// 3. Cache frequently used themes
// 4. Queue preference changes when offline
// 5. Auto-sync when connection restored

/**
 * Sync offline changes when connection restored
 */
async syncOfflineChanges(): Promise<void>

// Expected behavior:
// 1. Check for pending offline updates
// 2. Merge changes with server state
// 3. Resolve conflicts (server wins by default)
// 4. Clear offline change queue
// 5. Update local cache with latest data
```

## Security Contract

### Firestore Security Rules
```javascript
// Theme documents - read-only for clients
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public theme access (read-only)
    match /themes/{themeId} {
      allow read: if true;
      allow write: if false; // Admin-only via server
    }
    
    // User preferences - user can only access their own
    match /users/{userId}/preferences/theme {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // System configuration - admin only
    match /system/themeConfig {
      allow read: if request.auth != null;
      allow write: if false; // Admin-only via server
    }
  }
}
```

### Data Validation Rules
```typescript
// Validate theme ID format
const THEME_ID_REGEX = /^[a-z0-9-]+$/;

// Validate color values
const COLOR_REGEX = /^(#[0-9A-F]{6}|rgb\(|hsl\(|var\()/i;

// Validate user preferences
function validateUserPreferences(prefs: Partial<UserThemePreferences>): boolean {
  // Validate selectedTheme exists
  // Validate customization values
  // Validate recentThemes array length
  // Validate timestamp formats
}
```

## Error Handling Contract

### Service-Level Errors
```typescript
class FirebaseThemeError extends Error {
  constructor(operation: string, cause: Error) {
    super(`Firebase theme operation failed: ${operation}`);
    this.name = 'FirebaseThemeError';
    this.cause = cause;
  }
}

class AuthenticationError extends Error {
  constructor() {
    super('User must be authenticated for theme operations');
    this.name = 'AuthenticationError';
  }
}

class ThemeValidationError extends Error {
  constructor(details: string) {
    super(`Theme validation failed: ${details}`);
    this.name = 'ThemeValidationError';
  }
}
```

### Retry Logic
```typescript
// Network operations should implement exponential backoff:
// - Initial retry after 1 second
// - Double delay for each subsequent retry
// - Maximum 5 retry attempts
// - Fall back to offline mode after retries exhausted
```

## Performance Contract

### Caching Strategy
```typescript
interface CacheStrategy {
  themes: {
    ttl: 300000;        // 5 minutes TTL for theme list
    maxSize: 50;        // Maximum cached themes
    evictionPolicy: 'LRU'; // Least recently used eviction
  };
  preferences: {
    ttl: 600000;        // 10 minutes TTL for preferences
    persistent: true;   // Persist to localStorage
    syncOnFocus: true;  // Sync when app regains focus
  };
}
```

### Batch Operations
```typescript
/**
 * Batch multiple preference updates for efficiency
 * @param updates - Array of preference updates
 */
async batchUpdatePreferences(updates: Partial<UserThemePreferences>[]): Promise<void>

// Expected behavior:
// 1. Merge all updates into single change
// 2. Validate merged result
// 3. Perform single Firestore write
// 4. Update cache once with final state
```

## Integration Contract

### Firebase Initialization
```typescript
// Service requires initialized Firebase app:
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const themeService = new FirebaseThemeService(db);

// Must call enableOfflineSupport if offline functionality needed:
themeService.enableOfflineSupport();
```

### Authentication Integration
```typescript
// Service integrates with Firebase Auth:
onAuthStateChanged(auth, (user) => {
  if (user) {
    themeService.setUserId(user.uid);
  } else {
    themeService.clearUserId();
  }
});
```

## Testing Contract

### Unit Test Requirements
- Mock Firestore for all operations
- Test offline/online state transitions  
- Test caching behavior and TTL
- Test error handling and retry logic
- Test preference validation
- Test batch operations

### Integration Test Requirements
- Real Firestore emulator testing
- Authentication flow integration
- Offline/online synchronization
- Performance benchmarking
- Security rule validation