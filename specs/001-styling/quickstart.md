# Quickstart Guide: Centralized Design Token System

## Overview

This quickstart guide provides developers with immediate steps to set up, develop with, and validate the centralized design token system for the Snowva Business Hub. Follow these steps to ensure proper implementation and testing compliance.

## Prerequisites

### Required Tools
- Node.js 18+ with npm/yarn
- VS Code or compatible TypeScript editor
- Git for version control
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Project Setup Verification
```bash
# Verify you're on the correct branch
git branch --show-current
# Should show: 001-styling

# Install dependencies (if not already done)
npm install

# Verify TypeScript compilation
npx tsc --noEmit
```

## Phase 1: Development Environment Setup

### 1. Install Testing Infrastructure

```bash
# Install Vitest and testing utilities
npm install --save-dev vitest @vitest/ui jsdom
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev @testing-library/user-event
npm install --save-dev playwright @playwright/test

# Install CSS processing tools
npm install --save-dev autoprefixer cssnano postcss
```

### 2. Configure Test Framework

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      threshold: {
        global: {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100
        }
      }
    }
  }
});
```

### 3. Update Package Scripts

Add to `package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "validate-tokens": "node scripts/validate-design-tokens.js",
    "build-css": "node scripts/build-design-system.js"
  }
}
```

## Phase 2: Design Token System Setup

### 1. Create Directory Structure

```bash
# Create design system directories
mkdir -p styles/tokens
mkdir -p styles/components  
mkdir -p styles/themes
mkdir -p styles/utilities

# Create test directories
mkdir -p __tests__/components
mkdir -p __tests__/styles
mkdir -p __tests__/integration
```

### 2. Create Foundation Design Tokens

Create `styles/tokens/colors.css`:
```css
:root {
  /* Snowva Brand Foundation */
  --snowva-blue-50: #eff6ff;
  --snowva-blue-100: #dbeafe;
  --snowva-blue-500: #3b82f6;
  --snowva-blue-600: #2563eb;
  --snowva-blue-700: #1d4ed8;

  /* Semantic Color Tokens */
  --color-primary: var(--snowva-blue-500);
  --color-primary-hover: var(--snowva-blue-600);
  --color-primary-active: var(--snowva-blue-700);
  
  /* Status Colors */
  --status-success: #10b981;
  --status-success-bg: #ecfdf5;
  --status-success-text: #065f46;
  
  --status-danger: #ef4444;
  --status-danger-bg: #fef2f2;
  --status-danger-text: #991b1b;
}
```

### 3. Create Basic Component Classes

Create `styles/components/buttons.css`:
```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.btn-primary {
  background-color: var(--color-primary);
  color: var(--text-inverse);
  border-color: var(--color-primary);
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
}
```

### 4. Create Main Stylesheet

Create `styles/index.css`:
```css
/* Import design tokens */
@import './tokens/colors.css';
@import './tokens/spacing.css';
@import './tokens/typography.css';

/* Import component styles */
@import './components/buttons.css';
@import './components/forms.css';

/* Import themes */
@import './themes/light.css';
@import './themes/dark.css';

/* Global base styles */
html {
  font-family: var(--font-sans);
  color: var(--text-primary);
  background-color: var(--surface-primary);
}
```

## Phase 3: Theme System Implementation

### 1. Create Theme Provider

Create `contexts/ThemeContext.tsx`:
```tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeId = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeId>('light');
  
  const setTheme = async (newTheme: ThemeId) => {
    const startTime = performance.now();
    
    document.documentElement.setAttribute('data-theme', newTheme);
    setThemeState(newTheme);
    localStorage.setItem('snowva-theme', newTheme);
    
    const endTime = performance.now();
    console.log(`Theme switch took ${endTime - startTime}ms`);
  };
  
  const toggleTheme = async () => {
    await setTheme(theme === 'light' ? 'dark' : 'light');
  };
  
  useEffect(() => {
    const saved = localStorage.getItem('snowva-theme') as ThemeId;
    if (saved && ['light', 'dark'].includes(saved)) {
      setTheme(saved);
    }
  }, []);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### 2. Create Theme Definitions

Create `styles/themes/light.css`:
```css
[data-theme="light"] {
  --surface-primary: #ffffff;
  --surface-secondary: #f8fafc;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --border-primary: #e2e8f0;
}
```

Create `styles/themes/dark.css`:
```css
[data-theme="dark"] {
  --surface-primary: #1e293b;
  --surface-secondary: #334155;
  --text-primary: #f1f5f9;
  --text-secondary: #cbd5e1;
  --border-primary: #475569;
}
```

## Phase 4: Testing Implementation

### 1. Create Component Tests

Create `__tests__/components/ThemeProvider.test.tsx`:
```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext';

const TestComponent = () => {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button onClick={() => setTheme('dark')}>Switch to Dark</button>
    </div>
  );
};

describe('ThemeProvider', () => {
  test('provides theme context to children', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
  });
  
  test('theme switching completes within 500ms', async () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );
    
    const startTime = performance.now();
    fireEvent.click(screen.getByText('Switch to Dark'));
    
    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(500);
  });
});
```

### 2. Create Token Validation Tests

Create `__tests__/styles/tokenValidation.test.ts`:
```typescript
import { validateToken, getTokenValue } from '../../utils/tokenUtils';

describe('Design Token Validation', () => {
  test('validates color token format', () => {
    const colorToken = {
      id: 'color-primary',
      type: 'color',
      value: { raw: '#3b82f6' }
    };
    
    const result = validateToken(colorToken);
    expect(result.isValid).toBe(true);
  });
  
  test('rejects invalid color formats', () => {
    const invalidToken = {
      id: 'color-invalid',
      type: 'color', 
      value: { raw: 'not-a-color' }
    };
    
    const result = validateToken(invalidToken);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid color format');
  });
  
  test('resolves token references correctly', () => {
    const value = getTokenValue('color-primary');
    expect(value).toBe('#3b82f6');
  });
});
```

### 3. Create Performance Tests

Create `__tests__/integration/performance.test.ts`:
```typescript
import { measureThemeSwitch } from '../utils/performanceUtils';

describe('Performance Requirements', () => {
  test('theme switching under 500ms limit', async () => {
    const switchTime = await measureThemeSwitch('light', 'dark');
    expect(switchTime).toBeLessThan(500);
  });
  
  test('CSS bundle size under limits', async () => {
    // Test will be implemented with actual CSS measurement
    const bundleSize = await measureCSSBundleSize();
    expect(bundleSize).toBeLessThan(20480); // 20KB limit
  });
});
```

## Phase 5: Component Migration

### 1. Update Vite Configuration

Update `vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        require('autoprefixer'),
        require('cssnano')({ preset: 'default' })
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@styles': path.resolve(__dirname, './styles'),
    }
  }
});
```

### 2. Import Design System

Update `index.tsx`:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import './styles/index.css'; // Import design system

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
```

### 3. Migrate First Component

Update a simple component (example: `BackButton.tsx`):
```tsx
// Before (Tailwind utilities)
<button className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50">

// After (Semantic classes)  
<button className="btn btn-secondary">
```

## Phase 6: Validation & Testing

### 1. Run Test Suite

```bash
# Run all tests with coverage
npm run test:coverage

# Verify 100% coverage requirement
# Coverage report should show 100% for all metrics

# Run performance tests
npm run test:e2e

# Validate design tokens
npm run validate-tokens
```

### 2. Manual Validation Checklist

- [ ] Theme switching works in all browsers
- [ ] Theme preference persists after page reload  
- [ ] All components use semantic classes
- [ ] No Tailwind utilities remain in components
- [ ] Visual consistency across light/dark themes
- [ ] Performance requirements met (<500ms switching)
- [ ] All tests pass with 100% coverage

### 3. Performance Monitoring

```bash
# Measure theme switching performance
node -e "
const { measureThemeSwitch } = require('./utils/performanceUtils');
measureThemeSwitch('light', 'dark').then(time => {
  console.log(\`Theme switch: \${time}ms\`);
  if (time > 500) process.exit(1);
});
"
```

## Troubleshooting

### Common Issues

**Theme switching takes too long**
- Check for CSS bundle size - may need optimization
- Verify preloading of theme CSS files
- Ensure no network requests during theme switch

**Tests failing with coverage below 100%**  
- Add tests for all functions and components
- Test error conditions and edge cases
- Include integration tests for theme interactions

**Token references not resolving**
- Verify token naming follows conventions
- Check for circular references in token definitions
- Ensure all referenced tokens exist

**Visual inconsistencies between themes**
- Validate all components use semantic classes
- Check theme definitions include all required tokens
- Test color contrast requirements

## Next Steps

1. **Component Migration**: Systematically migrate all components from Tailwind to semantic classes
2. **Documentation**: Create component documentation with usage examples
3. **Testing**: Expand test coverage to include edge cases and performance scenarios
4. **Optimization**: Profile and optimize CSS bundle size and loading performance
5. **Validation**: Conduct thorough cross-browser and accessibility testing

---

**Quickstart Status**: ✅ READY FOR DEVELOPMENT
**Test Coverage**: Framework configured for 100% coverage requirement  
**Performance**: All tools configured to validate <500ms theme switching
**Next Phase**: Begin systematic component migration following TDD principles