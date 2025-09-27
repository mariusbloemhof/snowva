# Data Model: Centralized Design Token System

## Entity Overview

This document defines the core entities for the centralized design token system, their relationships, validation rules, and state transitions.

## Primary Entities

### 1. Design Token

Represents a single design decision with semantic naming and theme-specific values.

```typescript
interface DesignToken {
  id: string;                    // Unique identifier (e.g., "color-primary")
  name: string;                  // Human-readable name ("Primary Brand Color")
  category: TokenCategory;       // Token grouping (color, spacing, typography, etc.)
  type: TokenType;              // Value type (color, dimension, fontFamily, etc.)
  value: TokenValue;            // Actual value or reference to another token
  description?: string;         // Usage guidelines and context
  metadata: TokenMetadata;      // Additional properties and constraints
  createdAt: Date;
  updatedAt: Date;
}

enum TokenCategory {
  COLOR = 'color',
  SPACING = 'spacing', 
  TYPOGRAPHY = 'typography',
  SHADOW = 'shadow',
  BORDER = 'border',
  TRANSITION = 'transition'
}

enum TokenType {
  COLOR = 'color',
  DIMENSION = 'dimension',
  FONT_FAMILY = 'fontFamily',
  FONT_WEIGHT = 'fontWeight',
  LINE_HEIGHT = 'lineHeight',
  FONT_SIZE = 'fontSize',
  LETTER_SPACING = 'letterSpacing',
  SHADOW = 'shadow',
  BORDER_RADIUS = 'borderRadius',
  BORDER_WIDTH = 'borderWidth',
  DURATION = 'duration',
  CUBIC_BEZIER = 'cubicBezier'
}

interface TokenValue {
  raw: string;                  // Original value (e.g., "#3b82f6", "16px")
  resolved?: string;            // Computed value after token references resolved
  reference?: string;           // Reference to another token (e.g., "{color.blue.500}")
}

interface TokenMetadata {
  group?: string;               // Sub-category grouping
  state?: TokenState;           // Token lifecycle state
  deprecated?: boolean;         // Deprecation flag
  deprecationMessage?: string;  // Migration guidance
  extensions?: Record<string, any>; // Custom metadata
}

enum TokenState {
  DRAFT = 'draft',
  ACTIVE = 'active', 
  DEPRECATED = 'deprecated',
  ARCHIVED = 'archived'
}
```

**Validation Rules**:
- Token `id` must follow kebab-case naming convention
- Token `value.raw` must match expected format for `type`
- Color values must be valid hex, rgb, or hsl formats
- Dimension values must include valid CSS units (px, rem, em, %, vw, vh)
- Font weight values must be numeric (100-900) or named (normal, bold)
- References must point to existing, non-deprecated tokens
- Circular references are not allowed

**Relationships**:
- Tokens can reference other tokens via `value.reference`
- Semantic tokens should reference foundation tokens
- Component tokens should reference semantic tokens

### 2. Theme Configuration

Defines a complete set of design token values for a specific visual mode.

```typescript
interface ThemeConfiguration {
  id: string;                   // Unique theme identifier (e.g., "light", "dark")
  name: string;                 // Display name ("Light Theme")
  description?: string;         // Theme purpose and usage
  tokens: Record<string, string>; // Token ID to value mapping
  metadata: ThemeMetadata;      // Theme properties and constraints
  parentTheme?: string;         // Theme inheritance reference
  createdAt: Date;
  updatedAt: Date;
}

interface ThemeMetadata {
  isDefault: boolean;           // Whether this is the default theme
  contrastLevel: ContrastLevel; // Accessibility contrast information
  colorScheme: ColorScheme;     // Light or dark preference
  supportedFeatures: string[];  // Feature compatibility flags
  performanceMetrics?: ThemePerformanceMetrics;
}

enum ContrastLevel {
  NORMAL = 'normal',
  HIGH = 'high',
  MAXIMUM = 'maximum'
}

enum ColorScheme {
  LIGHT = 'light',
  DARK = 'dark', 
  AUTO = 'auto'
}

interface ThemePerformanceMetrics {
  bundleSize: number;           // CSS bundle size in bytes
  loadTime: number;             // Theme loading time in milliseconds
  switchingTime: number;        // Theme switching time in milliseconds
  lastMeasured: Date;
}
```

**Validation Rules**:
- Theme `id` must be unique and URL-safe
- All token references in `tokens` must exist in the design token registry
- At least one theme must have `isDefault: true`
- Contrast level must meet accessibility standards for color combinations
- Switching time must not exceed 500ms (per FR-003)

**State Transitions**:
- DRAFT → ACTIVE: Theme passes validation and testing
- ACTIVE → DEPRECATED: Theme is being replaced but still supported
- DEPRECATED → ARCHIVED: Theme is no longer available for use

### 3. Semantic Component Class

Represents styling for a specific UI pattern that uses design tokens.

```typescript
interface SemanticComponentClass {
  id: string;                   // CSS class name (e.g., "btn-primary")
  name: string;                 // Human-readable name ("Primary Button")
  category: ComponentCategory;  // Component grouping
  cssProperties: CSSProperty[]; // CSS declarations using tokens
  variants?: ComponentVariant[]; // Size, state, or style variants
  documentation: ComponentDocumentation;
  dependencies: string[];       // Required design token IDs
  createdAt: Date;
  updatedAt: Date;
}

enum ComponentCategory {
  BUTTON = 'button',
  FORM = 'form',
  TABLE = 'table',
  CARD = 'card',
  STATUS = 'status',
  NAVIGATION = 'navigation',
  MODAL = 'modal',
  LAYOUT = 'layout'
}

interface CSSProperty {
  property: string;             // CSS property name (e.g., "background-color")
  value: string;                // Value using token reference (e.g., "var(--color-primary)")
  condition?: string;           // Conditional application (e.g., ":hover", ":focus")
}

interface ComponentVariant {
  name: string;                 // Variant identifier (e.g., "small", "large")
  modifierClass: string;        // Additional CSS class (e.g., "btn-sm")
  propertyOverrides: CSSProperty[]; // Property modifications for variant
}

interface ComponentDocumentation {
  description: string;          // Component purpose and usage
  examples: ComponentExample[]; // Usage examples and patterns
  accessibility?: AccessibilityGuidelines;
  designGuidelines?: DesignGuidelines;
}

interface ComponentExample {
  title: string;
  htmlExample: string;         // Example HTML markup
  description: string;         // When and how to use
}

interface AccessibilityGuidelines {
  ariaLabels?: string[];       // Required ARIA labels
  keyboardSupport?: string[];  // Keyboard interaction patterns
  contrastRequirements?: string; // Color contrast specifications
}

interface DesignGuidelines {
  spacing: string;             // Recommended spacing usage
  typography: string;          // Typography guidelines
  interactions: string;        // Hover, focus, active state guidance
}
```

**Validation Rules**:
- Class `id` must follow CSS class naming conventions
- All token references in `cssProperties` must exist
- Variant modifier classes must not conflict with base class
- CSS property names must be valid CSS identifiers
- Examples must include valid HTML markup

### 4. Status Indicator

Represents visual styling for business entity states with consistent color coding.

```typescript
interface StatusIndicator {
  id: string;                   // Status identifier (e.g., "status-paid")
  businessEntity: BusinessEntityType; // Associated business object
  statusValue: string;          // Business status value (e.g., "PAID")
  displayName: string;          // Human-readable label
  semanticClass: string;        // Associated CSS class
  iconName?: string;            // Optional icon identifier
  colorTokens: StatusColorTokens; // Color system for status
  priority: number;             // Display priority (for sorting)
  createdAt: Date;
  updatedAt: Date;
}

enum BusinessEntityType {
  INVOICE = 'invoice',
  QUOTE = 'quote', 
  CUSTOMER = 'customer',
  PAYMENT = 'payment',
  PRODUCT = 'product'
}

interface StatusColorTokens {
  background: string;           // Background color token reference
  text: string;                // Text color token reference
  border: string;              // Border color token reference
  icon?: string;               // Icon color token reference
}
```

**Validation Rules**:
- Status `businessEntity` and `statusValue` combination must be unique
- All color token references must exist in the design token registry
- Color combinations must meet minimum contrast requirements
- Priority values must be positive integers

## Entity Relationships

### Design Token Hierarchy
```
Foundation Tokens (raw values)
    ↓ (references)
Semantic Tokens (meaningful abstractions)
    ↓ (references)  
Component Tokens (usage-specific)
    ↓ (used by)
CSS Component Classes
```

### Theme Application
```
Theme Configuration
    ↓ (provides values for)
Design Tokens
    ↓ (consumed by)
Component Classes
    ↓ (applied to)
React Components
```

### Status System Integration
```
Business Entity Status
    ↓ (maps to)
Status Indicator
    ↓ (uses)
Design Tokens
    ↓ (rendered via)
Component Classes
```

## Data Storage & Persistence

### Design Tokens
- **Storage**: CSS custom properties in `/styles/tokens/` files
- **Format**: CSS variables with JSON metadata comments
- **Validation**: JSON schema validation during build process
- **Versioning**: Git-based versioning with semantic version tags

### Theme Configurations  
- **Storage**: CSS files in `/styles/themes/` directory
- **Runtime**: CSS custom property overwrites via `data-theme` attribute
- **Persistence**: User preference stored in localStorage
- **Performance**: Preloaded themes to minimize switching delay

### Component Classes
- **Storage**: CSS files in `/styles/components/` directory
- **Organization**: One file per component category
- **Documentation**: Inline comments with usage examples
- **Testing**: Automated visual regression tests

## Migration Data Model

### Legacy Tailwind Mapping

```typescript
interface TailwindMigrationRule {
  tailwindPattern: string;      // Original Tailwind classes (e.g., "bg-blue-500")
  semanticClass: string;        // New semantic class (e.g., "btn-primary")
  componentFile: string;        // Source file requiring update
  confidence: MigrationConfidence; // Automated migration confidence level
  manualReview: boolean;        // Requires human validation
}

enum MigrationConfidence {
  HIGH = 'high',               // Direct 1:1 mapping
  MEDIUM = 'medium',           // Semantic equivalent exists
  LOW = 'low',                 // Complex pattern requiring analysis
  MANUAL = 'manual'            // Human decision required
}
```

## Performance Constraints

### Token Resolution
- Token reference chains limited to 3 levels deep
- Circular reference detection during validation
- Computed value caching for frequently accessed tokens

### Theme Switching
- Maximum 500ms for complete theme application (per FR-003)
- CSS custom property updates batched for performance
- Theme preloading to eliminate network delays

### Bundle Size
- Individual token files under 5KB each
- Combined theme bundles under 20KB
- Component CSS modules under 10KB each
- Total design system bundle under 100KB

---

**Data Model Status**: ✅ COMPLETE
**Validation Coverage**: All entities include comprehensive validation rules
**Performance Constraints**: All requirements under 500ms theme switching target
**Ready for Contract Generation**: Entity definitions enable API contract creation