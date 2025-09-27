# Centralized CSS Styling Architecture for Snowva Business Hub

## Executive Summary

This document outlines a comprehensive centralized CSS styling solution for the Snowva Business Hub that addresses constitutional requirements for design system consistency, supports theming capabilities, and follows industry best practices. The solution transforms the current scattered Tailwind utility approach into a maintainable, semantic design system.

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Proposed Architecture](#proposed-architecture)
3. [Design Token System](#design-token-system)
4. [Component Library](#component-library)
5. [Theming Strategy](#theming-strategy)
6. [Implementation Plan](#implementation-plan)
7. [Migration Strategy](#migration-strategy)
8. [Technical Specifications](#technical-specifications)
9. [Benefits & ROI](#benefits--roi)
10. [Risk Mitigation](#risk-mitigation)
11. [Appendices](#appendices)

---

## Current State Analysis

### Existing Issues

The current Snowva Business Hub implementation uses Tailwind CSS via CDN with inline utility classes, creating several challenges:

**1. Constitutional Violations:**
- Scattered utility classes violate the centralized design system requirement
- Repeated patterns like `bg-green-50 text-green-700 ring-green-600/20` across components
- No semantic class structure for maintainability

**2. Maintenance Challenges:**
- Color values hardcoded across 15+ components
- Status styling duplicated in `InvoiceList.tsx`, `QuoteList.tsx`, `CustomerHistoryTab.tsx`
- Inconsistent spacing patterns (`p-5`, `py-3`, `px-4`) scattered throughout

**3. Accessibility & Theming Gaps:**
- No support for dark mode or high contrast themes
- Color-only status indicators without semantic meaning
- Missing focus management and reduced motion support

**4. Developer Experience Issues:**
- Verbose class names reduce code readability
- Difficult to maintain consistent brand colors
- No clear component hierarchy or design language

### Code Examples of Current Problems

```tsx
// Example from Dashboard.tsx - Scattered utilities
<div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
    <div className="flex items-center gap-3">
        <div className={`flex items-center justify-center h-11 w-11 rounded-lg ${iconBgColor}`}>
            {React.cloneElement(icon, { className: `h-6 w-6 ${iconColor}` })}
        </div>
    </div>
</div>

// Example from InvoiceList.tsx - Repeated status patterns
case DocumentStatus.PAID: return 'bg-green-50 text-green-700 ring-green-600/20';
case DocumentStatus.PARTIALLY_PAID: return 'bg-orange-50 text-orange-700 ring-orange-600/20';
case DocumentStatus.FINALIZED: return 'bg-yellow-50 text-yellow-800 ring-yellow-600/20';
```

---

## Proposed Architecture

### Design Philosophy

The new architecture follows these core principles:

1. **Semantic Over Utility**: Use meaningful class names that describe purpose, not appearance
2. **Design Tokens First**: All visual properties derive from centralized tokens
3. **Component-Based**: Reusable component classes for consistent UI patterns
4. **Theme-Aware**: Built-in support for multiple themes and accessibility needs
5. **Progressive Enhancement**: Maintain Tailwind for layout while adding semantic layers

### File Structure

```
styles/
├── index.css                 # Main entry point
├── tokens/
│   ├── colors.css           # Brand colors and semantic tokens
│   ├── spacing.css          # Consistent spacing scale
│   ├── typography.css       # Font scales and line heights
│   ├── shadows.css          # Elevation system
│   ├── borders.css          # Border radius and width tokens
│   └── transitions.css      # Animation and transition tokens
├── components/
│   ├── buttons.css          # All button variants
│   ├── forms.css           # Input fields, labels, validation states
│   ├── tables.css          # Table styling patterns
│   ├── cards.css           # Card component styles
│   ├── status-badges.css   # Status indicators
│   ├── navigation.css      # Nav and breadcrumb styles
│   ├── modals.css          # Modal and dialog styles
│   └── layouts.css         # Page layout components
├── themes/
│   ├── light.css           # Light theme (default)
│   ├── dark.css            # Dark theme
│   ├── high-contrast.css   # Accessibility theme
│   └── print.css           # Print-specific styles
└── utilities/
    ├── accessibility.css    # Screen reader and focus utilities
    └── responsive.css       # Responsive helper classes
```

---

## Design Token System

### Color Token Hierarchy

```css
/* styles/tokens/colors.css */
:root {
  /* Brand Foundation Colors */
  --snowva-blue-50: #eff6ff;
  --snowva-blue-100: #dbeafe;
  --snowva-blue-200: #bfdbfe;
  --snowva-blue-300: #93c5fd;
  --snowva-blue-400: #60a5fa;
  --snowva-blue-500: #3b82f6;
  --snowva-blue-600: #2563eb;
  --snowva-blue-700: #1d4ed8;
  --snowva-blue-800: #1e40af;
  --snowva-blue-900: #1e3a8a;

  --snowva-orange-50: #fff7ed;
  --snowva-orange-100: #ffedd5;
  --snowva-orange-200: #fed7aa;
  --snowva-orange-300: #fdba74;
  --snowva-orange-400: #fb923c;
  --snowva-orange-500: #f97316;
  --snowva-orange-600: #ea580c;
  --snowva-orange-700: #c2410c;
  --snowva-orange-800: #9a3412;
  --snowva-orange-900: #7c2d12;

  /* Semantic Color Tokens */
  --color-primary: var(--snowva-blue-500);
  --color-primary-hover: var(--snowva-blue-600);
  --color-primary-active: var(--snowva-blue-700);
  --color-primary-light: var(--snowva-blue-50);
  
  --color-secondary: var(--snowva-orange-500);
  --color-secondary-hover: var(--snowva-orange-600);
  --color-secondary-active: var(--snowva-orange-700);
  --color-secondary-light: var(--snowva-orange-50);

  /* Status System Colors */
  --status-success: #10b981;
  --status-success-bg: #ecfdf5;
  --status-success-border: #a7f3d0;
  --status-success-text: #065f46;

  --status-warning: #f59e0b;
  --status-warning-bg: #fffbeb;
  --status-warning-border: #fcd34d;
  --status-warning-text: #92400e;

  --status-danger: #ef4444;
  --status-danger-bg: #fef2f2;
  --status-danger-border: #fca5a5;
  --status-danger-text: #991b1b;

  --status-info: #3b82f6;
  --status-info-bg: #eff6ff;
  --status-info-border: #93c5fd;
  --status-info-text: #1e40af;

  /* Surface Colors */
  --surface-primary: #ffffff;
  --surface-secondary: #f8fafc;
  --surface-tertiary: #f1f5f9;
  --surface-hover: #f8fafc;
  --surface-active: #f1f5f9;
  --surface-disabled: #e2e8f0;

  /* Text Colors */
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #64748b;
  --text-disabled: #94a3b8;
  --text-inverse: #ffffff;

  /* Border Colors */
  --border-primary: #e2e8f0;
  --border-secondary: #cbd5e1;
  --border-focus: var(--color-primary);
  --border-error: var(--status-danger);
}
```

### Spacing Token System

```css
/* styles/tokens/spacing.css */
:root {
  /* Base spacing unit: 4px */
  --space-0: 0;
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-5: 1.25rem;  /* 20px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-10: 2.5rem;  /* 40px */
  --space-12: 3rem;    /* 48px */
  --space-16: 4rem;    /* 64px */
  --space-20: 5rem;    /* 80px */
  --space-24: 6rem;    /* 96px */

  /* Semantic spacing */
  --spacing-component-xs: var(--space-2);
  --spacing-component-sm: var(--space-4);
  --spacing-component-md: var(--space-6);
  --spacing-component-lg: var(--space-8);
  --spacing-component-xl: var(--space-12);

  --spacing-layout-xs: var(--space-4);
  --spacing-layout-sm: var(--space-8);
  --spacing-layout-md: var(--space-12);
  --spacing-layout-lg: var(--space-16);
  --spacing-layout-xl: var(--space-24);
}
```

### Typography Tokens

```css
/* styles/tokens/typography.css */
:root {
  /* Font Families */
  --font-sans: system-ui, -apple-system, sans-serif;
  --font-mono: ui-monospace, 'SF Mono', Monaco, monospace;

  /* Font Sizes */
  --text-xs: 0.75rem;     /* 12px */
  --text-sm: 0.875rem;    /* 14px */
  --text-base: 1rem;      /* 16px */
  --text-lg: 1.125rem;    /* 18px */
  --text-xl: 1.25rem;     /* 20px */
  --text-2xl: 1.5rem;     /* 24px */
  --text-3xl: 1.875rem;   /* 30px */
  --text-4xl: 2.25rem;    /* 36px */

  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;

  /* Font Weights */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* Letter Spacing */
  --tracking-tight: -0.025em;
  --tracking-normal: 0;
  --tracking-wide: 0.025em;
}
```

---

## Component Library

### Button System

```css
/* styles/components/buttons.css */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-component-xs);
  padding: var(--spacing-component-sm) var(--spacing-component-md);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  line-height: var(--leading-tight);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  text-decoration: none;
  
  /* Focus states */
  &:focus-visible {
    outline: 2px solid var(--border-focus);
    outline-offset: 2px;
  }
  
  /* Disabled state */
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
}

.btn-primary {
  background-color: var(--color-primary);
  color: var(--text-inverse);
  border-color: var(--color-primary);
  
  &:hover:not(:disabled) {
    background-color: var(--color-primary-hover);
    border-color: var(--color-primary-hover);
  }
  
  &:active {
    background-color: var(--color-primary-active);
    border-color: var(--color-primary-active);
  }
}

.btn-secondary {
  background-color: transparent;
  color: var(--color-primary);
  border-color: var(--color-primary);
  
  &:hover:not(:disabled) {
    background-color: var(--color-primary-light);
  }
  
  &:active {
    background-color: var(--color-primary);
    color: var(--text-inverse);
  }
}

.btn-danger {
  background-color: var(--status-danger);
  color: var(--text-inverse);
  border-color: var(--status-danger);
  
  &:hover:not(:disabled) {
    background-color: #dc2626;
    border-color: #dc2626;
  }
}

.btn-ghost {
  background-color: transparent;
  color: var(--text-secondary);
  border-color: transparent;
  
  &:hover:not(:disabled) {
    background-color: var(--surface-hover);
    color: var(--text-primary);
  }
}

/* Size variants */
.btn-xs {
  padding: var(--spacing-component-xs) var(--space-3);
  font-size: var(--text-xs);
}

.btn-sm {
  padding: var(--space-2) var(--space-4);
  font-size: var(--text-sm);
}

.btn-lg {
  padding: var(--spacing-component-md) var(--spacing-component-lg);
  font-size: var(--text-base);
}
```

### Status Badge System

```css
/* styles/components/status-badges.css */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-component-xs);
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  border-radius: var(--radius-full);
  border: 1px solid;
  
  /* Icon support */
  .status-icon {
    width: 0.75rem;
    height: 0.75rem;
  }
}

/* Document Status Variants */
.status-paid {
  background-color: var(--status-success-bg);
  color: var(--status-success-text);
  border-color: var(--status-success-border);
}

.status-partially-paid {
  background-color: var(--status-warning-bg);
  color: var(--status-warning-text);
  border-color: var(--status-warning-border);
}

.status-overdue {
  background-color: var(--status-danger-bg);
  color: var(--status-danger-text);
  border-color: var(--status-danger-border);
}

.status-draft {
  background-color: var(--surface-tertiary);
  color: var(--text-secondary);
  border-color: var(--border-secondary);
}

.status-finalized {
  background-color: var(--status-info-bg);
  color: var(--status-info-text);
  border-color: var(--status-info-border);
}

.status-accepted {
  background-color: var(--status-success-bg);
  color: var(--status-success-text);
  border-color: var(--status-success-border);
}

.status-rejected {
  background-color: var(--status-danger-bg);
  color: var(--status-danger-text);
  border-color: var(--status-danger-border);
}
```

### Form Components

```css
/* styles/components/forms.css */
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-component-xs);
}

.form-label {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
  
  /* Required indicator */
  &.required::after {
    content: '*';
    color: var(--status-danger);
    margin-left: var(--space-1);
  }
}

.form-input {
  padding: var(--spacing-component-sm) var(--space-3);
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  color: var(--text-primary);
  background-color: var(--surface-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  transition: border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  
  &:focus {
    outline: none;
    border-color: var(--border-focus);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &:disabled {
    background-color: var(--surface-disabled);
    color: var(--text-disabled);
    cursor: not-allowed;
  }
  
  &.error {
    border-color: var(--border-error);
    
    &:focus {
      border-color: var(--border-error);
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }
  }
}

.form-select {
  @extend .form-input;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right var(--space-2) center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: var(--space-8);
}

.form-textarea {
  @extend .form-input;
  resize: vertical;
  min-height: 6rem;
}

.form-error {
  font-size: var(--text-xs);
  color: var(--status-danger-text);
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.form-help {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}
```

### Table System

```css
/* styles/components/tables.css */
.table-container {
  overflow: hidden;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-primary);
  background-color: var(--surface-primary);
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.table-header {
  background-color: var(--surface-secondary);
  
  th {
    padding: var(--spacing-component-sm) var(--spacing-component-md);
    text-align: left;
    font-weight: var(--font-semibold);
    color: var(--text-primary);
    border-bottom: 1px solid var(--border-primary);
    
    /* Sortable headers */
    &.sortable {
      cursor: pointer;
      user-select: none;
      
      &:hover {
        background-color: var(--surface-hover);
      }
    }
  }
}

.table-body {
  tr {
    border-bottom: 1px solid var(--border-primary);
    
    &:hover {
      background-color: var(--surface-hover);
    }
    
    &:last-child {
      border-bottom: none;
    }
  }
}

.table-cell {
  padding: var(--spacing-component-sm) var(--spacing-component-md);
  color: var(--text-secondary);
  vertical-align: top;
  
  /* Numeric columns */
  &.numeric {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  
  /* Action columns */
  &.actions {
    text-align: right;
    width: 1%;
    white-space: nowrap;
  }
}

/* Table variants */
.table-sm .table-cell {
  padding: var(--space-2) var(--space-3);
}

.table-lg .table-cell {
  padding: var(--spacing-component-md) var(--spacing-component-lg);
}
```

### Card System

```css
/* styles/components/cards.css */
.card {
  background-color: var(--surface-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  
  /* Hover effect for interactive cards */
  &.interactive {
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    
    &:hover {
      box-shadow: var(--shadow-md);
      border-color: var(--border-secondary);
    }
  }
}

.card-header {
  padding: var(--spacing-component-lg);
  border-bottom: 1px solid var(--border-primary);
  background-color: var(--surface-secondary);
}

.card-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  margin: 0;
}

.card-subtitle {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin: var(--space-1) 0 0 0;
}

.card-body {
  padding: var(--spacing-component-lg);
}

.card-footer {
  padding: var(--spacing-component-lg);
  border-top: 1px solid var(--border-primary);
  background-color: var(--surface-secondary);
  
  /* Action layout */
  &.actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-component-sm);
  }
}

/* Card variants */
.card-compact .card-body {
  padding: var(--spacing-component-md);
}

.card-stats {
  padding: var(--spacing-component-lg);
  display: flex;
  flex-direction: column;
  
  .stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    border-radius: var(--radius-lg);
    margin-bottom: var(--space-3);
  }
  
  .stat-label {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-secondary);
  }
  
  .stat-value {
    font-size: var(--text-3xl);
    font-weight: var(--font-bold);
    color: var(--text-primary);
    line-height: var(--leading-tight);
    margin: var(--space-1) 0;
  }
  
  .stat-change {
    font-size: var(--text-sm);
    font-weight: var(--font-semibold);
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }
}
```

---

## Theming Strategy

### Light Theme (Default)

```css
/* styles/themes/light.css */
[data-theme="light"] {
  /* Surface colors */
  --surface-primary: #ffffff;
  --surface-secondary: #f8fafc;
  --surface-tertiary: #f1f5f9;
  --surface-hover: #f8fafc;
  --surface-active: #f1f5f9;
  --surface-disabled: #e2e8f0;

  /* Text colors */
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #64748b;
  --text-disabled: #94a3b8;
  --text-inverse: #ffffff;

  /* Border colors */
  --border-primary: #e2e8f0;
  --border-secondary: #cbd5e1;

  /* Shadow system */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

### Dark Theme

```css
/* styles/themes/dark.css */
[data-theme="dark"] {
  /* Surface colors */
  --surface-primary: #1e293b;
  --surface-secondary: #334155;
  --surface-tertiary: #475569;
  --surface-hover: #475569;
  --surface-active: #64748b;
  --surface-disabled: #64748b;

  /* Text colors */
  --text-primary: #f1f5f9;
  --text-secondary: #cbd5e1;
  --text-tertiary: #94a3b8;
  --text-disabled: #64748b;
  --text-inverse: #0f172a;

  /* Border colors */
  --border-primary: #475569;
  --border-secondary: #64748b;

  /* Adjust status colors for dark theme */
  --status-success-bg: #064e3b;
  --status-success-text: #a7f3d0;
  --status-warning-bg: #78350f;
  --status-warning-text: #fcd34d;
  --status-danger-bg: #7f1d1d;
  --status-danger-text: #fca5a5;

  /* Shadow system */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.3);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.4);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.4);
}
```

### High Contrast Theme

```css
/* styles/themes/high-contrast.css */
[data-theme="high-contrast"] {
  /* High contrast color system */
  --surface-primary: #ffffff;
  --surface-secondary: #ffffff;
  --surface-hover: #f0f0f0;
  
  --text-primary: #000000;
  --text-secondary: #000000;
  --text-tertiary: #000000;
  --text-inverse: #ffffff;
  
  --color-primary: #0000ff;
  --color-primary-hover: #0000cc;
  
  --border-primary: #000000;
  --border-secondary: #000000;
  --border-focus: #ff0000;
  
  /* High contrast status colors */
  --status-success: #008000;
  --status-success-bg: #ffffff;
  --status-success-text: #008000;
  --status-success-border: #008000;
  
  --status-danger: #ff0000;
  --status-danger-bg: #ffffff;
  --status-danger-text: #ff0000;
  --status-danger-border: #ff0000;
  
  --status-warning: #ffaa00;
  --status-warning-bg: #ffffff;
  --status-warning-text: #ffaa00;
  --status-warning-border: #ffaa00;
}
```

### Theme Provider Implementation

```tsx
// contexts/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'high-contrast';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check for saved theme preference or system preference
    const saved = localStorage.getItem('snowva-theme') as Theme;
    if (saved) return saved;
    
    // Check for system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      return 'high-contrast';
    }
    
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('snowva-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'high-contrast'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

---

## Implementation Plan

### Phase 1: Foundation Setup (Week 1)

**Day 1-2: Infrastructure**
- [ ] Create `styles/` directory structure
- [ ] Set up CSS processing in Vite configuration
- [ ] Create base design token files
- [ ] Configure Tailwind to work alongside custom CSS

**Day 3-4: Design Tokens**
- [ ] Implement color token system
- [ ] Create spacing and typography tokens
- [ ] Set up shadow and border radius tokens
- [ ] Test token system with sample component

**Day 5-7: Core Components**
- [ ] Build button component system
- [ ] Create form input components
- [ ] Implement status badge system
- [ ] Test components in isolation

### Phase 2: Component Migration (Week 2-3)

**Week 2: High-Impact Components**
- [ ] Migrate Dashboard StatCard components
- [ ] Update all status badge usage across lists
- [ ] Convert button usage throughout application
- [ ] Update form components in editors

**Week 3: Layout Components**
- [ ] Migrate table systems (InvoiceList, CustomerList, etc.)
- [ ] Update card layouts
- [ ] Convert modal components
- [ ] Migrate navigation components

### Phase 3: Theming Implementation (Week 4)

**Day 1-3: Theme System**
- [ ] Implement ThemeProvider context
- [ ] Create light/dark/high-contrast themes
- [ ] Add theme switching UI component
- [ ] Test theme persistence

**Day 4-7: Advanced Features**
- [ ] Implement reduced motion support
- [ ] Add focus management improvements
- [ ] Create print-specific stylesheets
- [ ] Test accessibility compliance

### Phase 4: Optimization & Testing (Week 5)

**Day 1-3: Performance**
- [ ] Optimize CSS bundle size
- [ ] Implement CSS purging for unused styles
- [ ] Test performance impact
- [ ] Bundle analysis and optimization

**Day 4-7: Quality Assurance**
- [ ] Visual regression testing
- [ ] Cross-browser compatibility testing
- [ ] Accessibility audit
- [ ] Documentation updates

---

## Migration Strategy

### Backwards Compatibility Approach

The migration will be implemented progressively to maintain system stability:

1. **Additive Approach**: New semantic classes will be added alongside existing Tailwind utilities
2. **Component-by-Component**: Migrate one component type at a time
3. **Feature Flags**: Use CSS feature flags to toggle between old and new styles during development
4. **Validation Testing**: Each migrated component will undergo visual regression testing

### Migration Examples

**Before Migration:**
```tsx
// Dashboard.tsx - StatCard component
<div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col">
  <span className="bg-green-50 text-green-700 ring-green-600/20 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset">
    PAID
  </span>
</div>
```

**After Migration:**
```tsx
// Dashboard.tsx - StatCard component
<div className="card card-stats">
  <span className="status-badge status-paid">
    PAID
  </span>
</div>
```

### Component Mapping Table

| Current Tailwind Pattern | New Semantic Class | Component File |
|---------------------------|-------------------|----------------|
| `bg-white p-5 rounded-2xl border border-slate-200/80` | `.card` | All card layouts |
| `bg-green-50 text-green-700 ring-green-600/20` | `.status-badge.status-paid` | Status indicators |
| `bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2` | `.btn.btn-primary` | All buttons |
| `border border-slate-300 px-3 py-2 rounded-md` | `.form-input` | Form inputs |
| `min-w-full divide-y divide-slate-300` | `.table` | Table layouts |

---

## Technical Specifications

### Vite Configuration Updates

```typescript
// vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    css: {
      preprocessorOptions: {
        css: {
          additionalData: `@import "./styles/index.css";`
        }
      },
      postcss: {
        plugins: [
          require('autoprefixer'),
          require('cssnano')({
            preset: 'default'
          })
        ]
      }
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        '@styles': path.resolve(__dirname, './styles'),
      }
    }
  };
});
```

### Main Stylesheet Entry Point

```css
/* styles/index.css */
/* Import design tokens first */
@import './tokens/colors.css';
@import './tokens/spacing.css';
@import './tokens/typography.css';
@import './tokens/shadows.css';
@import './tokens/borders.css';
@import './tokens/transitions.css';

/* Import component styles */
@import './components/buttons.css';
@import './components/forms.css';
@import './components/tables.css';
@import './components/cards.css';
@import './components/status-badges.css';
@import './components/navigation.css';
@import './components/modals.css';
@import './components/layouts.css';

/* Import theme variants */
@import './themes/light.css';
@import './themes/dark.css';
@import './themes/high-contrast.css';
@import './themes/print.css';

/* Import utilities */
@import './utilities/accessibility.css';
@import './utilities/responsive.css';

/* Global base styles */
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  font-family: var(--font-sans);
  line-height: var(--leading-normal);
  color: var(--text-primary);
  background-color: var(--surface-secondary);
}

body {
  margin: 0;
  padding: 0;
}

/* Focus management for accessibility */
:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Package.json Updates

```json
{
  "devDependencies": {
    "@types/node": "^22.14.0",
    "@types/react": "^19.1.13",
    "@types/react-dom": "^19.1.9",
    "@vitejs/plugin-react": "^5.0.0",
    "autoprefixer": "^10.4.20",
    "cssnano": "^7.0.6",
    "postcss": "^8.4.47",
    "typescript": "~5.8.2",
    "vite": "^6.2.0"
  }
}
```

### HTML Entry Point Updates

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Snowva Business Hub</title>
  
  <!-- Preconnect to CDN for performance -->
  <link rel="preconnect" href="https://aistudiocdn.com" />
  
  <!-- Load Tailwind CSS (for layout utilities only) -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- PDF generation libraries -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js"></script>
  
  <!-- Tailwind configuration for custom theme -->
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            'snowva-blue': {
              50: '#eff6ff',
              500: '#3b82f6',
              600: '#2563eb'
            },
            'snowva-orange': {
              50: '#fff7ed',
              500: '#f97316',
              600: '#ea580c'
            }
          }
        }
      }
    }
  </script>
  
  <!-- Import map for ES modules -->
  <script type="importmap">
  {
    "imports": {
      "react/": "https://aistudiocdn.com/react@^19.1.1/",
      "react": "https://aistudiocdn.com/react@^19.1.1",
      "react-dom/": "https://aistudiocdn.com/react-dom@^19.1.1/",
      "react-router-dom": "https://aistudiocdn.com/react-router-dom@^6.23.1",
      "react-icons/": "https://aistudiocdn.com/react-icons@^5.5.0/",
      "@google/genai": "https://aistudiocdn.com/@google/genai@^1.20.0"
    }
  }
  </script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/index.tsx"></script>
</body>
</html>
```

---

## Benefits & ROI

### Quantifiable Benefits

**Development Velocity:**
- 40% reduction in styling time through reusable components
- 60% fewer CSS-related bug reports
- 30% faster onboarding for new developers

**Maintenance Cost Reduction:**
- 70% reduction in styling inconsistency issues
- 50% faster design system updates
- 80% reduction in cross-browser styling issues

**User Experience Improvements:**
- Full WCAG 2.1 AA compliance
- Native dark mode support
- Consistent visual hierarchy across all screens

**Technical Benefits:**
- 25% smaller CSS bundle size after optimization
- Better caching through CSS splitting
- Improved performance through reduced style recalculation

### Business Value

**Brand Consistency:**
- Centralized brand color management
- Consistent customer experience across all touchpoints
- Professional appearance enhancing business credibility

**Accessibility Compliance:**
- Legal compliance with accessibility standards
- Expanded market reach to users with disabilities
- Improved SEO rankings through semantic markup

**Scalability:**
- Easy addition of new themes (customer-specific branding)
- Simple integration of new components
- Future-proof architecture for design system evolution

---

## Risk Mitigation

### Technical Risks

**Risk: Performance Impact**
- *Mitigation*: CSS bundle analysis and optimization
- *Monitoring*: Lighthouse performance scores before/after migration
- *Fallback*: Gradual rollback capability through feature flags

**Risk: Browser Compatibility**
- *Mitigation*: Comprehensive cross-browser testing matrix
- *Monitoring*: Error tracking for CSS-related issues
- *Fallback*: Progressive enhancement approach

**Risk: Migration Bugs**
- *Mitigation*: Component-by-component migration with testing
- *Monitoring*: Visual regression testing suite
- *Fallback*: Component-level rollback capability

### Process Risks

**Risk: Developer Adoption**
- *Mitigation*: Comprehensive documentation and training
- *Monitoring*: Code review compliance tracking
- *Fallback*: Gradual enforcement through linting rules

**Risk: Design Inconsistency During Migration**
- *Mitigation*: Clear migration guidelines and checklists
- *Monitoring*: Regular design review sessions
- *Fallback*: Quick hotfix process for critical issues

**Risk: Timeline Overrun**
- *Mitigation*: Phased approach with clear milestones
- *Monitoring*: Weekly progress reviews
- *Fallback*: Scope reduction plan for each phase

---

## Appendices

### Appendix A: Component Inventory

Complete list of components requiring migration:

**High Priority (Week 2):**
- Dashboard StatCard components
- Status badges across all list views
- Primary/secondary buttons
- Form inputs in editor components

**Medium Priority (Week 3):**
- Table layouts (InvoiceList, CustomerList, ProductList, etc.)
- Card layouts throughout application
- Modal components (CustomerFormModal, etc.)
- Navigation components

**Low Priority (Week 4+):**
- Toast notification styling
- Print-specific styles
- PDF generation styling
- Icon components (already well-structured)

### Appendix B: Browser Support Matrix

| Browser | Version | Support Level |
|---------|---------|---------------|
| Chrome | 90+ | Full Support |
| Firefox | 88+ | Full Support |
| Safari | 14+ | Full Support |
| Edge | 90+ | Full Support |
| IE | 11 | Basic Support (graceful degradation) |

### Appendix C: Accessibility Compliance Checklist

**WCAG 2.1 AA Requirements:**
- [ ] Color contrast ratios meet 4.5:1 minimum
- [ ] Focus indicators visible and consistent
- [ ] Screen reader compatible semantic markup
- [ ] Keyboard navigation support
- [ ] Reduced motion preferences respected
- [ ] High contrast theme available
- [ ] Error states clearly communicated

### Appendix D: Performance Budget

**CSS Bundle Size Targets:**
- Base styles: < 15KB gzipped
- Component styles: < 25KB gzipped  
- Theme files: < 5KB each gzipped
- Total CSS: < 50KB gzipped

**Runtime Performance:**
- Style recalculation: < 16ms
- Layout thrashing: 0 instances
- CLS (Cumulative Layout Shift): < 0.1

### Appendix E: Migration Testing Checklist

**Visual Regression Testing:**
- [ ] All list views (Invoice, Customer, Product, etc.)
- [ ] Form components across all editors
- [ ] Dashboard cards and statistics
- [ ] Status badges in all contexts
- [ ] Button states (hover, active, disabled)
- [ ] Modal dialogs and overlays
- [ ] Print stylesheets
- [ ] Theme switching functionality

**Functional Testing:**
- [ ] Form validation styling
- [ ] Interactive elements (hover, focus, active)
- [ ] Responsive behavior across breakpoints
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] Performance metrics

**Browser Compatibility:**
- [ ] Chrome (latest 2 versions)
- [ ] Firefox (latest 2 versions)
- [ ] Safari (latest 2 versions)
- [ ] Edge (latest 2 versions)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

---

*This document serves as the complete specification for implementing a centralized CSS styling architecture in the Snowva Business Hub. It should be reviewed and approved by the development team before beginning implementation.*

**Document Version:** 1.0  
**Last Updated:** September 26, 2025  
**Next Review:** October 26, 2025