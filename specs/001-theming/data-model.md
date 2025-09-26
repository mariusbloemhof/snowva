# Data Model: Centralized Theming System

**Feature**: 001-theming | **Phase**: 1 | **Date**: 2025-09-26

## Entity Definitions

### Theme Entity
```typescript
interface Theme {
  id: string;                    // Unique theme identifier (e.g., 'light', 'dark', 'vibrant')
  name: string;                  // Display name for user selection
  description: string;           // Brief description of theme characteristics
  cssVariables: ThemeTokens;     // Complete set of CSS custom property values
  isDefault: boolean;           // Whether this is the default theme
  category: ThemeCategory;      // Theme categorization for grouping
  previewImage?: string;        // Optional preview image URL
  supportedFeatures: string[];  // List of supported UI features
  version: string;              // Theme version for compatibility
  createdAt: Date;             // Theme creation timestamp
  updatedAt: Date;             // Last modification timestamp
}

enum ThemeCategory {
  LIGHT = 'light',
  DARK = 'dark', 
  HIGH_CONTRAST = 'high-contrast',
  COLORFUL = 'colorful',
  CUSTOM = 'custom'
}
```

### Theme Tokens Entity
```typescript
interface ThemeTokens {
  // Primitive Tokens (Raw Values)
  primitive: {
    colors: {
      gray: ColorScale;          // Gray color scale (50, 100, 200...900)
      blue: ColorScale;          // Primary brand color scale
      green: ColorScale;         // Success color scale
      red: ColorScale;           // Error color scale
      yellow: ColorScale;        // Warning color scale
      indigo: ColorScale;        // Secondary brand color scale
    };
    typography: {
      fontFamily: {
        sans: string;            // Sans-serif font stack
        mono: string;            // Monospace font stack
      };
      fontSize: FontScale;       // Font size scale (xs, sm, base, lg, xl...)
      fontWeight: FontWeightScale; // Font weight values (light, normal, medium...)
      lineHeight: LineHeightScale; // Line height values (tight, normal, relaxed...)
    };
    spacing: SpacingScale;       // Spacing scale (0.5, 1, 2, 3, 4...)
    borderRadius: RadiusScale;   // Border radius scale (none, sm, base, lg...)
    shadows: ShadowScale;        // Box shadow scale (sm, base, lg, xl...)
  };
  
  // Semantic Tokens (Contextual Mappings)
  semantic: {
    colors: {
      text: {
        primary: string;         // Primary text color
        secondary: string;       // Secondary text color
        tertiary: string;        // Tertiary text color
        inverse: string;         // Inverse text color (on dark backgrounds)
        disabled: string;        // Disabled text color
      };
      background: {
        primary: string;         // Primary background color
        secondary: string;       // Secondary background color
        tertiary: string;        // Tertiary background color
        overlay: string;         // Modal/overlay background
        elevated: string;        // Elevated surface background
      };
      border: {
        default: string;         // Default border color
        subtle: string;          // Subtle border color
        strong: string;          // Strong border color
        focus: string;           // Focus ring border color
        error: string;           // Error state border color
      };
      interactive: {
        primary: string;         // Primary interactive color (links, buttons)
        primaryHover: string;    // Primary hover state
        secondary: string;       // Secondary interactive color
        secondaryHover: string;  // Secondary hover state
        disabled: string;        // Disabled interactive color
      };
      status: {
        success: string;         // Success state color
        warning: string;         // Warning state color
        error: string;           // Error state color
        info: string;            // Info state color
      };
    };
    spacing: {
      none: string;              // No spacing
      xs: string;                // Extra small spacing
      sm: string;                // Small spacing
      md: string;                // Medium spacing
      lg: string;                // Large spacing
      xl: string;                // Extra large spacing
      xxl: string;               // Extra extra large spacing
    };
    typography: {
      heading: TypographyStyle;  // Heading text styles
      body: TypographyStyle;     // Body text styles
      caption: TypographyStyle;  // Caption text styles
      label: TypographyStyle;    // Label text styles
    };
  };
  
  // Component Tokens (Component-Specific Overrides)
  components: {
    button: ButtonTokens;
    form: FormTokens;
    table: TableTokens;
    card: CardTokens;
    navigation: NavigationTokens;
  };
}
```

### User Theme Preferences Entity
```typescript
interface UserThemePreferences {
  userId: string;               // Reference to user document
  selectedTheme: string;        // Current active theme ID
  customizations: {
    fontSize: FontSizePreference; // User font size preference
    reducedMotion: boolean;     // Motion preference setting
    highContrast: boolean;      // High contrast preference
    colorBlindness?: ColorBlindnessType; // Accessibility accommodation
  };
  recentThemes: string[];       // Recently used theme IDs (max 5)
  createdAt: Timestamp;         // Firebase Timestamp
  updatedAt: Timestamp;         // Firebase Timestamp
}

enum FontSizePreference {
  SMALL = 'small',
  NORMAL = 'normal', 
  LARGE = 'large'
}

enum ColorBlindnessType {
  PROTANOPIA = 'protanopia',
  DEUTERANOPIA = 'deuteranopia', 
  TRITANOPIA = 'tritanopia'
}
```

### Theme Context State Entity
```typescript
interface ThemeContextState {
  currentTheme: Theme;          // Currently active theme
  availableThemes: Theme[];     // All available themes
  isLoading: boolean;          // Theme switching loading state
  error: string | null;        // Theme loading/switching error
  preferences: UserThemePreferences | null; // Current user preferences
}

interface ThemeContextActions {
  switchTheme: (themeId: string) => Promise<void>;
  updatePreferences: (preferences: Partial<UserThemePreferences>) => Promise<void>;
  previewTheme: (themeId: string) => void;
  exitPreview: () => void;
  refreshThemes: () => Promise<void>;
}

type ThemeContextValue = ThemeContextState & ThemeContextActions;
```

## Supporting Type Definitions

### Color and Scale Types
```typescript
interface ColorScale {
  50: string;   // Lightest shade
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;  // Base color
  600: string;
  700: string;
  800: string;
  900: string;  // Darkest shade
}

interface FontScale {
  xs: string;    // Extra small
  sm: string;    // Small
  base: string;  // Base size
  lg: string;    // Large
  xl: string;    // Extra large
  '2xl': string; // 2X large
  '3xl': string; // 3X large
  '4xl': string; // 4X large
}

interface SpacingScale {
  0: string;     // No spacing
  0.5: string;   // 2px
  1: string;     // 4px
  2: string;     // 8px
  3: string;     // 12px
  4: string;     // 16px
  5: string;     // 20px
  6: string;     // 24px
  8: string;     // 32px
  10: string;    // 40px
  12: string;    // 48px
  16: string;    // 64px
  20: string;    // 80px
  24: string;    // 96px
}
```

### Component Token Types
```typescript
interface ButtonTokens {
  padding: {
    sm: string;     // Small button padding
    md: string;     // Medium button padding
    lg: string;     // Large button padding
  };
  fontSize: {
    sm: string;     // Small button font size
    md: string;     // Medium button font size
    lg: string;     // Large button font size
  };
  borderRadius: string;  // Button border radius
  fontWeight: string;    // Button font weight
  minHeight: string;     // Minimum button height
}

interface FormTokens {
  input: {
    padding: string;      // Input field padding
    fontSize: string;     // Input font size
    borderRadius: string; // Input border radius
    borderWidth: string;  // Input border width
    minHeight: string;    // Minimum input height
  };
  label: {
    fontSize: string;     // Label font size
    fontWeight: string;   // Label font weight
    marginBottom: string; // Label bottom margin
  };
  error: {
    fontSize: string;     // Error text font size
    marginTop: string;    // Error text top margin
  };
}

interface TableTokens {
  cell: {
    padding: string;      // Table cell padding
    fontSize: string;     // Table cell font size
    lineHeight: string;   // Table cell line height
  };
  header: {
    padding: string;      // Table header padding
    fontSize: string;     // Table header font size
    fontWeight: string;   // Table header font weight
    borderBottom: string; // Header border bottom
  };
  row: {
    minHeight: string;    // Minimum row height
    borderBottom: string; // Row border bottom
  };
}
```

## Data Relationships

### Firebase Collection Structure
```
/users/{userId}/preferences/theme  → UserThemePreferences document
/themes/{themeId}                  → Theme document (admin-managed)
/system/themeConfig                → System theme configuration
```

### State Management Flow
```
User Action (theme switch) 
→ ThemeContext.switchTheme()
→ Firebase update (UserThemePreferences)
→ CSS custom property updates
→ Component re-styling (automatic via CSS)
→ Context state update
→ UI loading states clear
```

### Component Dependencies
```
ThemeProvider (context)
├── App component tree
├── ThemeSettings component
├── ThemePicker component  
└── All themed components (automatic CSS inheritance)
```

## Validation Rules

### Theme Entity Validation
- `id`: Required, must be URL-safe string (alphanumeric + hyphens)
- `name`: Required, max 50 characters
- `cssVariables`: Required, must contain all required token categories
- `version`: Required, must follow semantic versioning (x.y.z)
- `supportedFeatures`: Must be array of known feature strings

### User Preferences Validation
- `selectedTheme`: Must reference existing theme ID
- `recentThemes`: Max 5 items, all must be valid theme IDs
- `customizations.fontSize`: Must be valid FontSizePreference enum value
- Firebase Timestamp fields auto-validated by Firestore

### CSS Token Validation
- Color values: Must be valid CSS color (hex, rgb, hsl, or CSS color name)
- Spacing values: Must be valid CSS length units (px, rem, em)
- Font values: Must be valid CSS font-family or font-size strings

## State Transitions

### Theme Switching Flow
```
IDLE → SWITCHING (user initiates)
SWITCHING → LOADING (Firebase update starts)
LOADING → APPLYING (CSS variables update)
APPLYING → IDLE (transition complete)

Error States:
SWITCHING → ERROR (validation fails)
LOADING → ERROR (Firebase fails)
APPLYING → ERROR (CSS application fails)
ERROR → IDLE (user dismisses error)
```

### Preview Mode Flow
```
IDLE → PREVIEW (user hovers/selects preview)
PREVIEW → IDLE (user exits preview)
PREVIEW → SWITCHING (user confirms selection)
```

## Performance Considerations

### Caching Strategy
- Active theme: Stored in memory (React state)
- Available themes: Cached in localStorage with TTL
- CSS variables: Browser-optimized, no React re-renders needed
- Firebase preferences: Cached locally, sync in background

### Loading Strategy  
- Critical CSS: Inline base theme styles
- Additional themes: Lazy-loaded on demand
- Transitions: CSS-based, hardware accelerated
- Fallbacks: Graceful degradation to default theme