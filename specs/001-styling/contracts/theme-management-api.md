# API Contracts: Theme Management System

## Overview

This document defines the programmatic interfaces for the centralized design token system. While this is primarily a CSS-based system, these contracts define the TypeScript interfaces, React hooks, and utility functions that components will use to interact with the design system.

## Theme Provider API Contract

### ThemeProvider Context Interface

```typescript
// contexts/ThemeContext.tsx

interface ThemeContextAPI {
  // Current theme state
  currentTheme: ThemeId;
  availableThemes: ThemeConfiguration[];
  isLoading: boolean;
  
  // Theme management actions
  setTheme: (themeId: ThemeId) => Promise<void>;
  toggleTheme: () => Promise<void>;
  resetToSystemTheme: () => Promise<void>;
  
  // Theme properties
  getThemeProperty: (tokenId: string) => string | undefined;
  isThemeSupported: (themeId: ThemeId) => boolean;
  
  // Performance metrics
  getThemeSwitchingTime: () => number;
  preloadTheme: (themeId: ThemeId) => Promise<void>;
}

type ThemeId = 'light' | 'dark' | 'high-contrast';

// Usage Contract
const { currentTheme, setTheme, isLoading } = useTheme();
```

**Contract Requirements**:
- `setTheme()` must complete within 500ms (per FR-003)
- Theme changes must persist across browser sessions
- Loading states must be provided during theme transitions
- Error handling for invalid theme IDs

### Theme Switching Performance Contract

```typescript
interface ThemePerformanceContract {
  // Performance requirements (from FR-003)
  maxSwitchingTime: 500; // milliseconds
  maxBundleSize: 20480; // bytes (20KB)
  
  // Performance monitoring
  measureSwitchingTime(): Promise<number>;
  validatePerformanceRequirements(): Promise<PerformanceReport>;
}

interface PerformanceReport {
  switchingTime: number;
  bundleSize: number;
  passed: boolean;
  violations: string[];
}
```

## Design Token Access API Contract

### Token Resolution Interface

```typescript
// utils/tokenUtils.ts

interface TokenAPI {
  // Token value resolution
  getTokenValue: (tokenId: string, themeId?: ThemeId) => string;
  resolveTokenReferences: (tokenValue: string) => string;
  
  // Token validation
  validateToken: (token: DesignToken) => ValidationResult;
  validateTokenFormat: (tokenId: string, value: string, type: TokenType) => boolean;
  
  // Token metadata
  getTokenMetadata: (tokenId: string) => TokenMetadata | undefined;
  getTokensByCategory: (category: TokenCategory) => DesignToken[];
  
  // Development utilities
  listAllTokens: () => DesignToken[];
  findTokenUsage: (tokenId: string) => ComponentUsage[];
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface ComponentUsage {
  componentClass: string;
  cssProperty: string;
  filePath: string;
}

// Usage Contract
const primaryColor = getTokenValue('color-primary');
const isValid = validateToken(newToken);
```

## Component Class Generation API Contract

### CSS Class Builder Interface

```typescript
// utils/classBuilder.ts

interface ComponentClassAPI {
  // Dynamic class generation
  buildComponentClass: (
    baseClass: string, 
    variants?: string[], 
    modifiers?: Record<string, boolean>
  ) => string;
  
  // Class validation
  validateComponentClass: (className: string) => boolean;
  getComponentVariants: (baseClass: string) => ComponentVariant[];
  
  // CSS generation
  generateCSS: (componentClass: SemanticComponentClass) => string;
  generateThemeOverrides: (className: string, themeId: ThemeId) => string;
}

// Usage Contract
const buttonClass = buildComponentClass('btn', ['primary', 'lg'], { disabled: false });
// Returns: "btn btn-primary btn-lg"

const cssOutput = generateCSS(buttonComponentClass);
// Returns: CSS string for the component class
```

## Status Indicator API Contract

### Status Styling Interface

```typescript
// utils/statusUtils.ts

interface StatusAPI {
  // Status class resolution
  getStatusClass: (entityType: BusinessEntityType, statusValue: string) => string;
  getStatusIcon: (entityType: BusinessEntityType, statusValue: string) => string | undefined;
  
  // Status validation
  isValidStatus: (entityType: BusinessEntityType, statusValue: string) => boolean;
  getAvailableStatuses: (entityType: BusinessEntityType) => StatusIndicator[];
  
  // Status color system
  getStatusColors: (statusIndicator: StatusIndicator, themeId?: ThemeId) => StatusColorTokens;
  validateStatusContrast: (statusColors: StatusColorTokens) => boolean;
}

// Usage Contract
const invoiceStatusClass = getStatusClass('invoice', 'PAID');
// Returns: "status-badge status-paid"

const statusColors = getStatusColors(paidStatus, 'dark');
// Returns: { background: '#064e3b', text: '#a7f3d0', border: '#065f46' }
```

## CSS Generation API Contract

### Style Processing Interface

```typescript
// utils/cssGenerator.ts

interface CSSGenerationAPI {
  // CSS compilation
  compileTokensToCSS: (tokens: DesignToken[], themeId?: ThemeId) => string;
  compileComponentsToCSS: (components: SemanticComponentClass[]) => string;
  
  // CSS optimization
  optimizeCSS: (cssContent: string) => string;
  purgeUnusedStyles: (cssContent: string, usageReport: ComponentUsage[]) => string;
  
  // CSS validation
  validateCSSOutput: (cssContent: string) => CSSValidationResult;
  measureCSSBundle: (cssFiles: string[]) => BundleMetrics;
}

interface CSSValidationResult {
  isValid: boolean;
  syntaxErrors: string[];
  performanceWarnings: string[];
  accessibilityIssues: string[];
}

interface BundleMetrics {
  totalSize: number;
  gzippedSize: number;
  fileCount: number;
  duplicateRules: number;
}
```

## Migration API Contract

### Tailwind Replacement Interface

```typescript
// utils/migrationUtils.ts

interface MigrationAPI {
  // Pattern analysis
  analyzeTailwindUsage: (componentFiles: string[]) => TailwindAnalysisReport;
  generateMigrationPlan: (analysisReport: TailwindAnalysisReport) => MigrationPlan;
  
  // Code transformation
  replaceTailwindClasses: (
    fileContent: string, 
    migrationRules: TailwindMigrationRule[]
  ) => TransformationResult;
  
  // Validation
  validateMigration: (
    originalFile: string, 
    migratedFile: string
  ) => MigrationValidationResult;
}

interface TailwindAnalysisReport {
  totalFiles: number;
  totalClasses: number;
  uniquePatterns: string[];
  migrationComplexity: MigrationComplexity[];
}

interface MigrationPlan {
  phases: MigrationPhase[];
  estimatedEffort: number;
  riskAssessment: RiskLevel;
}

interface TransformationResult {
  transformedContent: string;
  appliedRules: TailwindMigrationRule[];
  warnings: string[];
}

interface MigrationValidationResult {
  visuallyEquivalent: boolean;
  functionallyEquivalent: boolean;
  performanceImpact: PerformanceComparison;
}
```

## Testing API Contract

### Design System Testing Interface

```typescript
// __tests__/designSystemTestUtils.ts

interface DesignSystemTestAPI {
  // Component testing utilities
  renderWithTheme: (component: ReactElement, themeId: ThemeId) => RenderResult;
  testThemeSwitching: (component: ReactElement) => Promise<void>;
  
  // Visual regression testing
  captureComponentScreenshot: (
    componentName: string, 
    themeId: ThemeId
  ) => Promise<string>;
  compareVisualSnapshots: (
    baseline: string, 
    current: string
  ) => VisualDiffResult;
  
  // Performance testing
  measureThemeSwitch: (fromTheme: ThemeId, toTheme: ThemeId) => Promise<number>;
  validatePerformanceRequirements: () => Promise<PerformanceTestResult>;
  
  // Token testing
  validateAllTokens: () => Promise<TokenValidationReport>;
  testTokenReferences: () => Promise<ReferenceValidationReport>;
}

interface VisualDiffResult {
  pixelDifference: number;
  percentageDifference: number;
  passed: boolean;
  diffImagePath?: string;
}

interface PerformanceTestResult {
  themeSwitchingTimes: Record<string, number>;
  bundleSizes: Record<string, number>;
  passed: boolean;
  violations: string[];
}
```

## Error Handling Contract

### Design System Error Interface

```typescript
// utils/errorHandling.ts

interface DesignSystemError {
  code: ErrorCode;
  message: string;
  context: ErrorContext;
  severity: ErrorSeverity;
  timestamp: Date;
}

enum ErrorCode {
  INVALID_THEME = 'INVALID_THEME',
  TOKEN_NOT_FOUND = 'TOKEN_NOT_FOUND',
  CIRCULAR_REFERENCE = 'CIRCULAR_REFERENCE',
  PERFORMANCE_VIOLATION = 'PERFORMANCE_VIOLATION',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  MIGRATION_ERROR = 'MIGRATION_ERROR'
}

enum ErrorSeverity {
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

interface ErrorContext {
  themeId?: ThemeId;
  tokenId?: string;
  componentClass?: string;
  performanceMetric?: string;
}
```

## Contract Testing Requirements

### API Contract Tests

Each API contract must have comprehensive test coverage:

```typescript
// Example contract test structure
describe('ThemeProvider Contract', () => {
  test('setTheme completes within 500ms', async () => {
    const startTime = performance.now();
    await setTheme('dark');
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(500);
  });
  
  test('theme changes persist across page reloads', () => {
    setTheme('dark');
    // Simulate page reload
    expect(getCurrentTheme()).toBe('dark');
  });
  
  test('invalid theme IDs throw appropriate errors', () => {
    expect(() => setTheme('invalid')).toThrow(DesignSystemError);
  });
});
```

### Performance Contract Tests

```typescript
describe('Performance Contract', () => {
  test('CSS bundle size under 20KB limit', async () => {
    const metrics = await measureCSSBundle(['styles/*.css']);
    expect(metrics.totalSize).toBeLessThan(20480);
  });
  
  test('theme switching under 500ms limit', async () => {
    const switchTime = await measureThemeSwitch('light', 'dark');
    expect(switchTime).toBeLessThan(500);
  });
});
```

## Integration Points

### Vite Build Integration

```typescript
// vite.config.ts plugin interface
interface DesignSystemVitePlugin {
  validateTokens(): void;
  generateCSS(): void;
  optimizeBundle(): void;
  enforcePerformanceLimits(): void;
}
```

### React Component Integration

```typescript
// Component usage pattern
interface ComponentProps {
  variant?: string;
  size?: 'sm' | 'md' | 'lg';
  theme?: ThemeId; // Optional theme override
}

// Expected usage in components
const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md' }) => {
  const className = buildComponentClass('btn', [variant, size]);
  return <button className={className}>Click me</button>;
};
```

---

**Contract Status**: ✅ COMPLETE
**Test Coverage**: All contracts include test specifications
**Performance Requirements**: All APIs respect 500ms theme switching limit
**Ready for Implementation**: Contracts provide clear implementation guidance