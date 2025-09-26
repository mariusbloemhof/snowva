# Quickstart Guide: Centralized Theming System

**Feature**: 001-theming | **Duration**: 15 minutes | **Date**: 2025-09-26

## Prerequisites

- Node.js 18+ with npm/pnpm
- React 19 + TypeScript project set up
- Firebase project configured
- VS Code with TypeScript extension

## Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
# Core theming dependencies (if not already installed)
npm install firebase
npm install --save-dev @types/react @types/react-dom

# Development tools for CSS processing
npm install --save-dev stylelint stylelint-config-standard
```

### 2. Create Theme Directory Structure
```bash
# Create centralized styles directory
mkdir -p styles/themes styles/components styles/vendor

# Create essential theme files
touch styles/tokens.css
touch styles/global.css
touch styles/themes/light.css
touch styles/themes/dark.css
touch styles/themes/vibrant.css
touch styles/themes/themes.ts
```

### 3. Basic Theme Setup
```typescript
// styles/themes/themes.ts
export interface Theme {
  id: string;
  name: string;
  description: string;
}

export const defaultThemes: Theme[] = [
  { id: 'light', name: 'Light', description: 'Clean light theme' },
  { id: 'dark', name: 'Dark', description: 'Dark theme for low light' },
  { id: 'vibrant', name: 'Vibrant', description: 'Colorful vibrant theme' }
];
```

```css
/* styles/tokens.css - Basic design tokens */
:root {
  /* Colors */
  --color-white: #ffffff;
  --color-black: #000000;
  --color-gray-50: #f9fafb;
  --color-gray-900: #111827;
  --color-blue-500: #3b82f6;
  --color-blue-600: #2563eb;
  
  /* Spacing */
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  
  /* Typography */
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
}
```

## Theme Context Setup (3 minutes)

### 1. Create Theme Context
```typescript
// contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextValue {
  currentTheme: string;
  switchTheme: (themeId: string) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(false);

  const switchTheme = (themeId: string) => {
    setIsLoading(true);
    document.documentElement.setAttribute('data-theme', themeId);
    setCurrentTheme(themeId);
    localStorage.setItem('theme', themeId);
    setTimeout(() => setIsLoading(false), 300);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    switchTheme(savedTheme);
  }, []);

  return (
    <ThemeContext.Provider value={{ currentTheme, switchTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

### 2. Wrap App with Theme Provider
```typescript
// App.tsx
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      {/* Your existing app content */}
      <div className="app">
        {/* Routes, components, etc. */}
      </div>
    </ThemeProvider>
  );
}
```

## Basic Semantic Classes (4 minutes)

### 1. Create Component Styles
```css
/* styles/components/buttons.css */
.button {
  padding: var(--spacing-2) var(--spacing-4);
  border: none;
  border-radius: 0.375rem;
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: background-color 0.2s;
}

.button-primary {
  background-color: var(--color-primary);
  color: var(--color-primary-contrast);
}

.button-primary:hover {
  background-color: var(--color-primary-hover);
}
```

```css
/* styles/components/forms.css */
.form-input {
  padding: var(--spacing-3);
  border: 1px solid var(--color-border-default);
  border-radius: 0.375rem;
  font-size: var(--font-size-base);
  background-color: var(--color-background-input);
  color: var(--color-text-primary);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-focus);
}

.form-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-label);
  margin-bottom: var(--spacing-2);
}
```

### 2. Create Theme Mappings
```css
/* styles/themes/light.css */
[data-theme="light"] {
  --color-primary: var(--color-blue-500);
  --color-primary-hover: var(--color-blue-600);
  --color-primary-contrast: var(--color-white);
  --color-primary-focus: rgba(59, 130, 246, 0.3);
  
  --color-text-primary: var(--color-gray-900);
  --color-text-label: var(--color-gray-900);
  
  --color-background-input: var(--color-white);
  --color-border-default: var(--color-gray-300);
}
```

```css
/* styles/themes/dark.css */
[data-theme="dark"] {
  --color-primary: var(--color-blue-400);
  --color-primary-hover: var(--color-blue-300);
  --color-primary-contrast: var(--color-gray-900);
  --color-primary-focus: rgba(96, 165, 250, 0.3);
  
  --color-text-primary: var(--color-gray-100);
  --color-text-label: var(--color-gray-200);
  
  --color-background-input: var(--color-gray-800);
  --color-border-default: var(--color-gray-600);
}
```

### 3. Import Styles
```css
/* styles/global.css */
@import 'tokens.css';
@import 'themes/light.css';
@import 'themes/dark.css';
@import 'components/buttons.css';
@import 'components/forms.css';

/* Apply theme transition */
* {
  transition: background-color 0.2s, border-color 0.2s, color 0.2s;
}
```

```typescript
// index.tsx - Import global styles
import './styles/global.css';
```

## Theme Selector Component (3 minutes)

### 1. Create Theme Picker
```typescript
// components/ThemePicker.tsx
import { useTheme } from '../contexts/ThemeContext';

const themes = [
  { id: 'light', name: 'Light' },
  { id: 'dark', name: 'Dark' },
  { id: 'vibrant', name: 'Vibrant' }
];

export function ThemePicker() {
  const { currentTheme, switchTheme, isLoading } = useTheme();

  return (
    <div className="theme-picker">
      <label className="form-label">Choose Theme:</label>
      <select 
        className="form-input"
        value={currentTheme}
        onChange={(e) => switchTheme(e.target.value)}
        disabled={isLoading}
      >
        {themes.map(theme => (
          <option key={theme.id} value={theme.id}>
            {theme.name}
          </option>
        ))}
      </select>
      {isLoading && <span>Switching theme...</span>}
    </div>
  );
}
```

### 2. Add to Your App
```typescript
// In any component where you want theme selection
import { ThemePicker } from './components/ThemePicker';

function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      <ThemePicker />
    </div>
  );
}
```

## Testing Your Setup

### 1. Verify Theme Switching
```bash
# Start your development server
npm run dev
```

1. Navigate to your theme picker component
2. Switch between Light and Dark themes
3. Verify smooth transitions and color changes
4. Check localStorage persistence (refresh page, theme should persist)

### 2. Test Semantic Classes
Replace any existing utility classes in your components:

```typescript
// BEFORE
<button className="py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600">
  Click me
</button>

// AFTER  
<button className="button button-primary">
  Click me
</button>
```

### 3. Verify CSS Variables
Open browser DevTools and check the `:root` element:
- Should see all CSS custom properties defined
- Values should change when switching themes
- `data-theme` attribute should update on `<html>` element

## Next Steps

### Extend Your Theme System
1. **Add More Themes**: Create additional CSS files in `styles/themes/`
2. **Add Firebase Persistence**: Integrate with Firebase to save user preferences
3. **Migrate Components**: Replace all utility classes with semantic classes
4. **Add Advanced Tokens**: Extend tokens for shadows, typography scales, etc.

### Common Patterns
```typescript
// Custom component with theme-aware styling
function CustomCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="card-content">
        {children}
      </div>
    </div>
  );
}
```

```css
/* Add corresponding CSS */
.card {
  background-color: var(--color-background-card);
  border: 1px solid var(--color-border-card);
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-content {
  padding: var(--spacing-4);
}
```

## Troubleshooting

### Theme Not Switching
- Check if `data-theme` attribute is being set on `<html>` element
- Verify CSS custom properties are defined for the theme
- Ensure global CSS is imported in your entry file

### Styles Not Applied
- Check CSS import order (tokens → themes → components → global)
- Verify semantic class names match CSS file definitions
- Check for CSS specificity conflicts

### Performance Issues
- Ensure transitions are hardware-accelerated (use `transform` and `opacity`)
- Limit the number of CSS custom properties (< 100 per theme)
- Use CSS containment for isolated theme switching

## Success Criteria

✅ **Theme switching works smoothly (<300ms)**  
✅ **CSS variables update automatically**  
✅ **Theme preference persists across sessions**  
✅ **Semantic classes replace utility classes**  
✅ **All components adopt theme colors**  
✅ **No JavaScript errors in console**  
✅ **Responsive design maintained across themes**  

**🎉 Congratulations!** You now have a working centralized theming system. This foundation supports the full feature implementation with Firebase persistence, advanced themes, and complete component migration.