# Theme Context API Contract

**Feature**: 001-theming | **Component**: ThemeContext | **Date**: 2025-09-26

## Context Provider API

### ThemeProvider Props
```typescript
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;        // Default theme ID if user has no preference
  fallbackTheme: string;        // Fallback theme ID if selected theme fails
  enablePreview?: boolean;      // Enable theme preview functionality
}
```

### Context Value Interface
```typescript
interface ThemeContextValue {
  // Current State
  currentTheme: Theme;
  availableThemes: Theme[];
  isLoading: boolean;
  error: string | null;
  preferences: UserThemePreferences | null;
  isPreviewMode: boolean;
  previewTheme: Theme | null;

  // Actions
  switchTheme: (themeId: string) => Promise<void>;
  updatePreferences: (preferences: Partial<UserThemePreferences>) => Promise<void>;
  previewTheme: (themeId: string) => void;
  exitPreview: () => void;
  refreshThemes: () => Promise<void>;
  resetToDefault: () => Promise<void>;
}
```

## Action Method Contracts

### switchTheme
```typescript
/**
 * Switch to a different theme and persist user preference
 * @param themeId - ID of theme to switch to
 * @throws ThemeNotFoundError if themeId doesn't exist
 * @throws FirebaseError if preference persistence fails
 */
switchTheme(themeId: string): Promise<void>

// Expected behavior:
// 1. Validate themeId exists in availableThemes
// 2. Set isLoading = true
// 3. Apply CSS variables to document root
// 4. Update Firebase user preferences
// 5. Update local context state
// 6. Add to recent themes list
// 7. Set isLoading = false
// 8. Emit theme change event (for analytics)
```

### updatePreferences  
```typescript
/**
 * Update user theme preferences without changing theme
 * @param preferences - Partial preferences to update
 * @throws ValidationError if preferences are invalid
 * @throws FirebaseError if persistence fails
 */
updatePreferences(preferences: Partial<UserThemePreferences>): Promise<void>

// Expected behavior:
// 1. Validate preference values
// 2. Merge with existing preferences
// 3. Update Firebase document
// 4. Update local context state
// 5. Apply any immediate changes (fontSize, etc.)
```

### previewTheme
```typescript
/**
 * Temporarily apply theme for preview (no persistence)
 * @param themeId - ID of theme to preview
 * @throws ThemeNotFoundError if themeId doesn't exist
 */
previewTheme(themeId: string): void

// Expected behavior:
// 1. Validate themeId exists
// 2. Set isPreviewMode = true
// 3. Apply CSS variables temporarily
// 4. Store original theme for restoration
// 5. Set auto-revert timer (30 seconds)
```

### exitPreview
```typescript
/**
 * Exit preview mode and restore original theme
 */
exitPreview(): void

// Expected behavior:
// 1. Restore original theme CSS variables
// 2. Set isPreviewMode = false
// 3. Clear previewTheme state
// 4. Cancel auto-revert timer
```

### refreshThemes
```typescript
/**
 * Reload available themes from system/Firebase
 * @throws FirebaseError if theme loading fails
 */
refreshThemes(): Promise<void>

// Expected behavior:
// 1. Fetch latest theme definitions
// 2. Update availableThemes array  
// 3. Validate current theme still exists
// 4. Fallback to default if current theme removed
```

### resetToDefault
```typescript
/**
 * Reset user to default theme and clear preferences
 */
resetToDefault(): Promise<void>

// Expected behavior:
// 1. Switch to system default theme
// 2. Clear Firebase preferences document
// 3. Clear local storage fallback
// 4. Reset customizations to defaults
```

## Hook Usage Contract

### useTheme Hook
```typescript
/**
 * Hook to access theme context with error handling
 * @throws Error if used outside ThemeProvider
 * @returns ThemeContextValue
 */
function useTheme(): ThemeContextValue

// Usage example:
const { currentTheme, switchTheme, isLoading } = useTheme();
```

### useThemeCSS Hook (Optional)
```typescript
/**
 * Hook to get CSS custom property values for current theme
 * @param property - CSS custom property name
 * @returns Current CSS property value
 */
function useThemeCSS(property: string): string

// Usage example:  
const primaryColor = useThemeCSS('--color-primary');
```

## Error Handling Contract

### Error Types
```typescript
class ThemeNotFoundError extends Error {
  constructor(themeId: string) {
    super(`Theme '${themeId}' not found in available themes`);
    this.name = 'ThemeNotFoundError';
  }
}

class ThemeValidationError extends Error {
  constructor(message: string) {
    super(`Theme validation failed: ${message}`);
    this.name = 'ThemeValidationError';
  }
}

class ThemeLoadingError extends Error {
  constructor(cause: Error) {
    super(`Failed to load theme: ${cause.message}`);
    this.name = 'ThemeLoadingError';
    this.cause = cause;
  }
}
```

### Error Recovery
```typescript
// Context should handle errors gracefully:
// 1. Log error details for debugging
// 2. Set error state for user feedback
// 3. Attempt fallback theme if possible
// 4. Clear error state after successful operation
// 5. Provide retry mechanisms for network errors
```

## Performance Contract

### Response Time Requirements
- Theme switching: Complete within 300ms
- CSS variable updates: Complete within 50ms  
- Context state updates: Synchronous (immediate)
- Firebase persistence: Asynchronous, background operation
- Theme loading: Cache-first, max 1 second for new themes

### Memory Management
- Limit cached themes to 5 most recent
- Clean up unused CSS variables
- Debounce rapid theme switches (prevent spam)
- Lazy load theme assets on demand

## Integration Contract

### CSS Variable Application
```typescript
// Context must apply theme by setting CSS custom properties on document root:
document.documentElement.style.setProperty('--color-primary', theme.tokens.semantic.colors.interactive.primary);

// All components use CSS variables, no React prop drilling required:
.button-primary {
  background-color: var(--color-primary);
  color: var(--color-primary-contrast);
}
```

### Firebase Integration
```typescript
// Theme preferences stored at path:
const preferencesRef = doc(db, `users/${userId}/preferences/theme`);

// Document structure matches UserThemePreferences interface
// Must handle offline/online state gracefully
// Local storage fallback for offline scenarios
```

### Event System
```typescript
// Context emits events for analytics/logging:
window.dispatchEvent(new CustomEvent('themeChanged', {
  detail: { 
    previousTheme: string,
    newTheme: string,
    timestamp: Date,
    userId: string 
  }
}));
```

## Testing Contract

### Unit Test Requirements
- All context methods must have passing tests
- Error scenarios must be covered
- State transitions must be tested
- Firebase mocking required for isolated tests

### Integration Test Requirements  
- Theme switching end-to-end workflow
- Firebase persistence verification
- CSS variable application verification
- Offline/online synchronization testing

### Performance Test Requirements
- Theme switch timing under 300ms
- Memory leak detection during rapid switching
- CSS rendering performance measurement