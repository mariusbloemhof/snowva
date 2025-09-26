# CSS Architecture Contract

**Feature**: 001-theming | **Component**: CSSArchitecture | **Date**: 2025-09-26

## Design Token System

### CSS Custom Property Naming Convention
```css
/* Naming pattern: --{category}-{property}-{variant?}-{state?} */

/* Primitive Tokens (Raw Values) */
--color-gray-50: #f9fafb;
--color-gray-900: #111827;
--spacing-1: 0.25rem;    /* 4px */
--spacing-16: 4rem;      /* 64px */
--font-size-sm: 0.875rem;
--font-weight-medium: 500;

/* Semantic Tokens (Contextual Usage) */  
--color-text-primary: var(--color-gray-900);
--color-background-primary: var(--color-white);
--spacing-component-padding: var(--spacing-4);
--typography-heading-size: var(--font-size-xl);

/* Component Tokens (Component-Specific) */
--button-padding-y: var(--spacing-2);
--button-padding-x: var(--spacing-4); 
--table-cell-padding: var(--spacing-3);
--form-input-border-radius: var(--border-radius-md);
```

### Token Application Hierarchy
```css
/* 1. Apply primitive tokens at root level */
:root {
  /* Primitive color palette */
  --color-blue-500: #3b82f6;
  --color-blue-600: #2563eb;
  /* ... all primitive tokens */
}

/* 2. Map semantic tokens to primitives per theme */
[data-theme="light"] {
  --color-primary: var(--color-blue-500);
  --color-primary-hover: var(--color-blue-600);
  --color-text-primary: var(--color-gray-900);
  --color-background-primary: var(--color-white);
}

[data-theme="dark"] {
  --color-primary: var(--color-blue-400);
  --color-primary-hover: var(--color-blue-300);
  --color-text-primary: var(--color-gray-100);
  --color-background-primary: var(--color-gray-900);
}

/* 3. Components use semantic tokens exclusively */
.button-primary {
  background-color: var(--color-primary);
  color: var(--color-primary-contrast);
  padding: var(--button-padding-y) var(--button-padding-x);
}
```

## Semantic CSS Classes

### Component Class Categories
```css
/* Form Components */
.form-input {
  padding: var(--form-input-padding);
  border: var(--form-input-border-width) solid var(--color-border-default);
  border-radius: var(--form-input-border-radius);
  font-size: var(--form-input-font-size);
  background-color: var(--color-background-input);
  color: var(--color-text-primary);
  transition: var(--transition-fast);
}

.form-input:focus {
  border-color: var(--color-border-focus);
  box-shadow: var(--shadow-focus-ring);
  outline: none;
}

.form-input--error {
  border-color: var(--color-border-error);
}

.form-label {
  font-size: var(--form-label-font-size);
  font-weight: var(--form-label-font-weight);
  color: var(--color-text-label);
  margin-bottom: var(--form-label-margin-bottom);
  display: block;
}

.form-error {
  color: var(--color-text-error);
  font-size: var(--form-error-font-size);
  margin-top: var(--form-error-margin-top);
}

/* Button Components */
.button {
  /* Base button styles */
  padding: var(--button-padding-y) var(--button-padding-x);
  border-radius: var(--button-border-radius);
  font-size: var(--button-font-size);
  font-weight: var(--button-font-weight);
  min-height: var(--button-min-height);
  border: none;
  cursor: pointer;
  transition: var(--transition-fast);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.button-primary {
  background-color: var(--color-primary);
  color: var(--color-primary-contrast);
}

.button-primary:hover {
  background-color: var(--color-primary-hover);
}

.button-secondary {
  background-color: var(--color-secondary);
  color: var(--color-secondary-contrast);
}

.button--disabled {
  background-color: var(--color-button-disabled);
  color: var(--color-button-disabled-text);
  cursor: not-allowed;
}

/* Table Components */
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--table-font-size);
}

.table-header {
  background-color: var(--color-background-table-header);
  color: var(--color-text-table-header);
  font-weight: var(--table-header-font-weight);
  text-align: left;
  padding: var(--table-header-padding);
  border-bottom: var(--table-header-border-bottom);
}

.table-row {
  border-bottom: var(--table-row-border-bottom);
  min-height: var(--table-row-min-height);
}

.table-row:hover {
  background-color: var(--color-background-table-row-hover);
}

.table-cell {
  padding: var(--table-cell-padding);
  color: var(--color-text-table-cell);
  vertical-align: middle;
}

/* Card Components */
.card {
  background-color: var(--color-background-card);
  border: var(--card-border-width) solid var(--color-border-card);
  border-radius: var(--card-border-radius);
  box-shadow: var(--card-box-shadow);
  overflow: hidden;
}

.card-header {
  padding: var(--card-header-padding);
  border-bottom: var(--card-header-border-bottom);
  background-color: var(--color-background-card-header);
}

.card-content {
  padding: var(--card-content-padding);
}
```

### Layout Classes
```css
/* Container Classes */
.container {
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--container-padding-x);
}

.section {
  padding: var(--section-padding-y) 0;
}

.grid-layout {
  display: grid;
  gap: var(--grid-gap);
  grid-template-columns: repeat(auto-fit, minmax(var(--grid-min-column-width), 1fr));
}

/* Utility Classes (Limited Use) */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.loading {
  opacity: 0.6;
  pointer-events: none;
}
```

## Theme Application Contract

### Theme Switching Mechanism
```css
/* Theme applied via data attribute on root element */
html[data-theme="light"] {
  --color-primary: var(--light-primary);
  --color-background-primary: var(--light-bg-primary);
  /* ... all semantic token mappings */
}

html[data-theme="dark"] {
  --color-primary: var(--dark-primary);
  --color-background-primary: var(--dark-bg-primary);
  /* ... all semantic token mappings */
}

html[data-theme="vibrant"] {
  --color-primary: var(--vibrant-primary);
  --color-background-primary: var(--vibrant-bg-primary);
  /* ... all semantic token mappings */
}
```

### Theme Transition Management
```css
/* Global transition for theme changes */
*,
*::before,
*::after {
  transition: 
    background-color var(--transition-theme),
    border-color var(--transition-theme),
    color var(--transition-theme),
    box-shadow var(--transition-theme);
}

/* Disable transitions during theme switching for performance */
.theme-switching * {
  transition: none !important;
}

/* Respect user motion preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
```

## Migration Contract

### Utility Class Mapping
```typescript
interface UtilityClassMapping {
  // Current scattered utilities → Semantic classes
  'py-3 px-4': '.button, .form-input';
  'text-sm text-slate-900': '.table-cell';
  'bg-blue-50 text-blue-700 ring-blue-600/20': '.badge-primary';
  'hover:bg-slate-50': '.table-row:hover';
  'px-3 py-3.5 text-left text-sm font-semibold text-slate-900': '.table-header';
  'whitespace-nowrap py-4 pl-4 pr-3 text-sm': '.table-cell--first';
  'rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset': '.badge';
  // ... complete mapping for all scattered utilities
}
```

### Component Refactoring Pattern
```typescript
// BEFORE (scattered utilities)
<td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
  <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-blue-50 text-blue-700 ring-blue-600/20">
    B2B
  </span>
</td>

// AFTER (semantic classes)
<td className="table-cell table-cell--first">
  <span className="badge badge-primary">
    B2B
  </span>
</td>
```

### Automated Migration Script
```typescript
/**
 * Utility class replacement automation
 * Scans all .tsx files and replaces utility combinations with semantic classes
 */
interface MigrationRule {
  pattern: RegExp;           // Regex to match utility class combinations
  replacement: string;       // Semantic class replacement
  component: string;         // Target component type
  validation: (element: string) => boolean; // Validation function
}

const migrationRules: MigrationRule[] = [
  {
    pattern: /className="([^"]*?)py-3\s+px-4([^"]*?)"/g,
    replacement: 'className="button $1$2"',
    component: 'button',
    validation: (el) => el.includes('<button') || el.includes('role="button"')
  },
  // ... more migration rules
];
```

## File Organization Contract

### CSS File Structure
```
styles/
├── tokens.css              # CSS custom property definitions
├── global.css              # Global styles and theme application
├── themes/
│   ├── light.css          # Light theme semantic token mappings
│   ├── dark.css           # Dark theme semantic token mappings
│   ├── vibrant.css        # Vibrant theme semantic token mappings
│   └── themes.ts          # Theme metadata and TypeScript definitions
├── components/
│   ├── buttons.css        # Button component styles
│   ├── forms.css          # Form component styles  
│   ├── tables.css         # Table component styles
│   ├── cards.css          # Card component styles
│   ├── navigation.css     # Navigation component styles
│   └── layout.css         # Layout and utility styles
└── vendor/
    ├── reset.css          # CSS reset/normalize
    └── fonts.css          # Font loading and declarations
```

### Import Order
```css
/* 1. Vendor/Reset */
@import 'vendor/reset.css';
@import 'vendor/fonts.css';

/* 2. Design Tokens */
@import 'tokens.css';

/* 3. Theme Definitions */
@import 'themes/light.css';
@import 'themes/dark.css'; 
@import 'themes/vibrant.css';

/* 4. Component Styles */
@import 'components/buttons.css';
@import 'components/forms.css';
@import 'components/tables.css';
@import 'components/cards.css';
@import 'components/navigation.css';
@import 'components/layout.css';

/* 5. Global Application */
@import 'global.css';
```

## Performance Contract

### CSS Loading Strategy
```typescript
// Critical CSS (base theme + essential components) inlined in HTML
// Additional themes loaded on demand via dynamic imports

async function loadTheme(themeId: string): Promise<void> {
  if (!loadedThemes.has(themeId)) {
    const theme = await import(`./styles/themes/${themeId}.css`);
    loadedThemes.add(themeId);
  }
}
```

### CSS Variable Optimization
```css
/* Group related variables for browser optimization */
:root {
  /* Color variables grouped */
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-primary-contrast: #ffffff;
  
  /* Spacing variables grouped */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  
  /* Typography variables grouped */
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
}
```

## Validation Contract

### CSS Linting Rules
```typescript
// stylelint configuration for theme system compliance
const stylelintConfig = {
  rules: {
    // Enforce semantic class naming
    'selector-class-pattern': '^([a-z][a-z0-9]*)(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$',
    
    // Require CSS custom properties for values
    'declaration-property-value-allowed-list': {
      'color': ['/var\\(--color-.+\\)$/'],
      'background-color': ['/var\\(--color-.+\\)$/'],
      'border-color': ['/var\\(--color-.+\\)$/'],
      'padding': ['/var\\(--spacing-.+\\)$/'],
      'margin': ['/var\\(--spacing-.+\\)$/']
    },
    
    // Disallow hardcoded values
    'color-no-hex': true,
    'length-zero-no-unit': true,
    'declaration-no-important': true
  }
};
```

### TypeScript Integration
```typescript
// Generate TypeScript definitions from CSS custom properties
export type ThemeTokens = {
  '--color-primary': string;
  '--color-primary-hover': string;
  '--spacing-1': string;
  '--font-size-base': string;
  // ... all token types
};

// CSS-in-TS type safety
export const tokens = {
  color: {
    primary: 'var(--color-primary)' as const,
    primaryHover: 'var(--color-primary-hover)' as const,
  },
  spacing: {
    1: 'var(--spacing-1)' as const,
    2: 'var(--spacing-2)' as const,
  }
} as const;
```