/**
 * Design Token Resolution Utilities
 * 
 * Snowva Business Hub - Centralized Design System
 * Resolves design tokens to CSS values with theme support
 * 
 * Provides type-safe token access and CSS custom property generation
 */

import type {
    CSSCustomProperties,
    DesignTokens,
    GetToken,
    ResponsiveValue,
    ThemeConfig,
    TokenPath,
    TokenToCSSMap,
    TokenValue
} from './types';

/* ========================================
   TOKEN PATH RESOLUTION
   ======================================== */

/**
 * Resolves a dot-notation token path to its value
 * Example: resolveTokenPath(tokens, 'colors.primary.500') => '#3b82f6'
 */
export function resolveTokenPath<T extends Record<string, any>>(
  tokens: T,
  path: string
): string | undefined {
  if (!tokens || !path) return undefined;
  
  const pathParts = path.split('.');
  let current: any = tokens;
  
  for (const part of pathParts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  
  return typeof current === 'string' ? current : undefined;
}

/**
 * Type-safe token getter function
 */
export function createTokenGetter(tokens: DesignTokens): GetToken {
  return <P extends TokenPath<DesignTokens>>(path: P): TokenValue<DesignTokens, P> => {
    return resolveTokenPath(tokens, path) as TokenValue<DesignTokens, P>;
  };
}

/**
 * Resolves CSS custom property references within token values
 * Example: 'var(--color-primary-500)' with context resolves to actual value
 */
export function resolveCSSVariableReferences(
  value: string,
  cssProperties: CSSCustomProperties
): string {
  if (!value || !value.includes('var(')) return value;
  
  return value.replace(/var\((--[\w-]+)(?:,\s*([^)]*))?\)/g, (match, varName, fallback) => {
    const resolvedValue = cssProperties[varName as keyof CSSCustomProperties];
    return resolvedValue || fallback || match;
  });
}

/* ========================================
   CSS CUSTOM PROPERTY GENERATION
   ======================================== */

/**
 * Converts a token path to a CSS custom property name
 * Example: 'colors.primary.500' => '--color-primary-500'
 */
export function tokenPathToCSSProperty(path: string): string {
  return '--' + path
    .replace(/\./g, '-')
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '');
}

/**
 * Flattens nested token object to CSS custom properties
 */
export function flattenTokensToCSS(
  tokens: Record<string, any>,
  prefix: string = ''
): CSSCustomProperties {
  const cssProperties: CSSCustomProperties = {};
  
  function flatten(obj: any, currentPath: string = '') {
    Object.entries(obj).forEach(([key, value]) => {
      const newPath = currentPath ? `${currentPath}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Check if this is a composite token (has size, weight, etc.)
        const hasCompositeProperties = ['size', 'weight', 'line-height', 'letter-spacing'].some(
          prop => prop in value
        );
        
        if (hasCompositeProperties) {
          // Handle composite tokens (like typography scales)
          Object.entries(value).forEach(([subKey, subValue]) => {
            if (typeof subValue === 'string') {
              const cssPropertyName = tokenPathToCSSProperty(`${newPath}-${subKey}`);
              cssProperties[cssPropertyName as keyof CSSCustomProperties] = subValue;
            }
          });
        } else {
          // Regular nested object
          flatten(value, newPath);
        }
      } else if (typeof value === 'string') {
        const cssPropertyName = tokenPathToCSSProperty(newPath);
        cssProperties[cssPropertyName as keyof CSSCustomProperties] = value;
      }
    });
  }
  
  flatten(tokens, prefix);
  return cssProperties;
}

/**
 * Generates CSS custom properties for all design tokens
 */
export function generateCSSCustomProperties(tokens: DesignTokens): CSSCustomProperties {
  const cssProperties: CSSCustomProperties = {};
  
  // Flatten each token category
  Object.entries(tokens).forEach(([category, tokenGroup]) => {
    const categoryCSS = flattenTokensToCSS(tokenGroup, category);
    Object.assign(cssProperties, categoryCSS);
  });
  
  return cssProperties;
}

/**
 * Creates CSS rule string from custom properties
 */
export function createCSSRuleFromProperties(
  properties: CSSCustomProperties,
  selector: string = ':root'
): string {
  const propertyEntries = Object.entries(properties)
    .map(([property, value]) => `  ${property}: ${value};`)
    .join('\n');
  
  return `${selector} {\n${propertyEntries}\n}`;
}

/* ========================================
   THEME RESOLUTION
   ======================================== */

/**
 * Merges base tokens with theme overrides
 */
export function resolveThemeTokens(
  baseTokens: DesignTokens,
  themeConfig: ThemeConfig
): DesignTokens {
  const resolvedTokens = { ...baseTokens };
  
  // Apply theme color overrides
  if (themeConfig.colors) {
    resolvedTokens.colors = {
      ...resolvedTokens.colors,
      ...themeConfig.colors
    };
  }
  
  // Apply theme shadow overrides
  if (themeConfig.shadows) {
    resolvedTokens.shadows = {
      ...resolvedTokens.shadows,
      ...themeConfig.shadows
    };
  }
  
  // Apply theme border overrides
  if (themeConfig.borders) {
    resolvedTokens.borders = {
      ...resolvedTokens.borders,
      ...themeConfig.borders
    };
  }
  
  return resolvedTokens;
}

/**
 * Gets CSS custom properties for a specific theme
 */
export function getThemeCSSProperties(
  baseTokens: DesignTokens,
  themeConfig: ThemeConfig
): CSSCustomProperties {
  const themedTokens = resolveThemeTokens(baseTokens, themeConfig);
  return generateCSSCustomProperties(themedTokens);
}

/**
 * Generates CSS for all themes with proper selectors
 */
export function generateThemeCSS(
  baseTokens: DesignTokens,
  themes: ThemeConfig[]
): string {
  const baseCSS = createCSSRuleFromProperties(
    generateCSSCustomProperties(baseTokens),
    ':root'
  );
  
  const themeCSS = themes.map(theme => {
    if (theme.name === 'light') return ''; // Light theme uses base tokens
    
    const themeProperties = getThemeCSSProperties(baseTokens, theme);
    const selector = `[data-theme="${theme.name}"]`;
    return createCSSRuleFromProperties(themeProperties, selector);
  }).filter(css => css.length > 0);
  
  return [baseCSS, ...themeCSS].join('\n\n');
}

/* ========================================
   RESPONSIVE TOKEN RESOLUTION
   ======================================== */

/**
 * Resolves responsive token values to CSS with media queries
 */
export function resolveResponsiveValue<T>(
  responsiveValue: ResponsiveValue<T>,
  getValue: (value: T) => string
): string {
  const breakpoints = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  };
  
  let css = '';
  
  // Base value (mobile-first)
  if (responsiveValue.base !== undefined) {
    css += getValue(responsiveValue.base);
  }
  
  // Responsive values
  Object.entries(breakpoints).forEach(([breakpoint, minWidth]) => {
    const value = responsiveValue[breakpoint as keyof typeof breakpoints];
    if (value !== undefined) {
      css += `\n@media (min-width: ${minWidth}) {\n  ${getValue(value)}\n}`;
    }
  });
  
  return css;
}

/* ========================================
   TOKEN COMPUTATION UTILITIES
   ======================================== */

/**
 * Computes derived token values (e.g., hover states from base colors)
 */
export function computeDerivedTokens(baseTokens: DesignTokens): Partial<DesignTokens> {
  const derived: Partial<DesignTokens> = {};
  
  // Example: Compute hover colors by lightening/darkening base colors
  if (baseTokens.colors) {
    derived.colors = {
      ...baseTokens.colors,
      // Add computed hover variants
      'button-primary-hover': adjustColorBrightness(baseTokens.colors.primary[600], 10),
      'button-secondary-hover': adjustColorBrightness(baseTokens.colors.secondary[600], 10)
    } as any;
  }
  
  return derived;
}

/**
 * Adjusts color brightness (simplified - in real app would use color manipulation library)
 */
function adjustColorBrightness(color: string, percent: number): string {
  // Simplified implementation - in production, use a proper color manipulation library
  if (color.startsWith('#')) {
    const num = parseInt(color.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }
  return color; // Return original if can't process
}

/* ========================================
   TOKEN INTERPOLATION
   ======================================== */

/**
 * Interpolates between two token values for smooth animations
 */
export function interpolateTokenValues(
  startValue: string,
  endValue: string,
  progress: number
): string {
  // Basic implementation for numeric values in CSS units
  const startMatch = startValue.match(/^([\d.]+)(.*)?$/);
  const endMatch = endValue.match(/^([\d.]+)(.*)?$/);
  
  if (startMatch && endMatch && startMatch[2] === endMatch[2]) {
    const startNum = parseFloat(startMatch[1]);
    const endNum = parseFloat(endMatch[1]);
    const unit = startMatch[2] || '';
    const interpolated = startNum + (endNum - startNum) * progress;
    return `${interpolated}${unit}`;
  }
  
  // Return end value if interpolation not possible
  return endValue;
}

/* ========================================
   DEVELOPMENT UTILITIES
   ======================================== */

/**
 * Gets all available token paths for development/debugging
 */
export function getAllTokenPaths(tokens: Record<string, any>, prefix: string = ''): string[] {
  const paths: string[] = [];
  
  function traverse(obj: any, currentPath: string = '') {
    Object.entries(obj).forEach(([key, value]) => {
      const newPath = currentPath ? `${currentPath}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Check if this is a leaf node with string properties
        const hasStringProperties = Object.values(value).some(v => typeof v === 'string');
        if (hasStringProperties) {
          paths.push(newPath);
        }
        traverse(value, newPath);
      } else if (typeof value === 'string') {
        paths.push(newPath);
      }
    });
  }
  
  traverse(tokens, prefix);
  return paths.sort();
}

/**
 * Creates a mapping from token paths to CSS custom property names
 */
export function createTokenToCSSMap(tokens: DesignTokens): TokenToCSSMap {
  const map: TokenToCSSMap = {};
  const paths = getAllTokenPaths(tokens);
  
  paths.forEach(path => {
    map[path] = tokenPathToCSSProperty(path);
  });
  
  return map;
}

/**
 * Validates token reference exists and returns resolved value
 */
export function safeTokenResolve(
  tokens: DesignTokens,
  path: string,
  fallback?: string
): string {
  const resolved = resolveTokenPath(tokens, path);
  
  if (resolved === undefined) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Token path not found: ${path}${fallback ? ` (using fallback: ${fallback})` : ''}`);
    }
    return fallback || path;
  }
  
  return resolved;
}

/* ========================================
   PERFORMANCE OPTIMIZATION
   ======================================== */

/**
 * Memoizes token resolution for performance
 */
export function createMemoizedTokenResolver() {
  const cache = new Map<string, string>();
  
  return function memoizedResolve(tokens: DesignTokens, path: string): string | undefined {
    const cacheKey = `${JSON.stringify(tokens)}_${path}`;
    
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }
    
    const resolved = resolveTokenPath(tokens, path);
    if (resolved) {
      cache.set(cacheKey, resolved);
    }
    
    return resolved;
  };
}

/**
 * Clears token resolution cache (useful for theme changes)
 */
export function clearTokenCache(): void {
  // Implementation would clear the memoization cache
  // This is a placeholder for the actual cache clearing logic
}

/* ========================================
   EXPORT UTILITIES
   ======================================== */

/**
 * Exports tokens to various formats for design tools integration
 */
export interface TokenExportOptions {
  format: 'css' | 'json' | 'scss' | 'js';
  includeComments?: boolean;
  prefix?: string;
}

export function exportTokens(
  tokens: DesignTokens,
  options: TokenExportOptions
): string {
  switch (options.format) {
    case 'css':
      const cssProperties = generateCSSCustomProperties(tokens);
      return createCSSRuleFromProperties(cssProperties);
    
    case 'json':
      return JSON.stringify(tokens, null, 2);
    
    case 'scss':
      const scssVars = Object.entries(generateCSSCustomProperties(tokens))
        .map(([prop, value]) => `$${prop.slice(2)}: ${value};`)
        .join('\n');
      return scssVars;
    
    case 'js':
      return `export const tokens = ${JSON.stringify(tokens, null, 2)};`;
    
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}