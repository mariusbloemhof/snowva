/**
 * Theme Utility Functions
 * 
 * Snowva Business Hub - Centralized Design System
 * Utilities for theme validation and performance monitoring
 * 
 * Provides theme management, validation, and performance tracking
 */

import type {
    ThemeConfig,
    ThemeName
} from '../styles/tokens/types';
import {
    validateThemeConfig
} from '../styles/tokens/validation';

/* ========================================
   THEME VALIDATION UTILITIES
   ======================================== */

/**
 * Validates theme completeness and consistency
 */
export interface ThemeCompletenessResult {
  isComplete: boolean;
  completionScore: number;
  missingTokens: string[];
  inconsistencies: string[];
  recommendations: string[];
}

export function validateThemeCompleteness(theme: ThemeConfig): ThemeCompletenessResult {
  const requiredTokenCategories = [
    'colors',
    'shadows',
    'borders'
  ];
  
  const requiredColorTokens = [
    'background',
    'background-secondary',
    'text',
    'text-secondary',
    'border-light',
    'border-medium'
  ];
  
  const missingTokens: string[] = [];
  const inconsistencies: string[] = [];
  const recommendations: string[] = [];
  
  // Check required categories
  requiredTokenCategories.forEach(category => {
    if (!theme[category as keyof ThemeConfig]) {
      missingTokens.push(`${category} (category missing)`);
    }
  });
  
  // Check required color tokens
  if (theme.colors) {
    requiredColorTokens.forEach(token => {
      if (!theme.colors![token as keyof typeof theme.colors]) {
        missingTokens.push(`colors.${token}`);
      }
    });
  }
  
  // Check for inconsistencies
  if (theme.colors && theme.name !== 'auto') {
    // Validate background/text contrast
    const bg = theme.colors.background;
    const text = theme.colors.text;
    
    if (bg && text) {
      // Simplified contrast check - in production use proper contrast ratio calculation
      const isDarkBg = bg.includes('#0') || bg.includes('#1') || bg.includes('#2');
      const isDarkText = text.includes('#0') || text.includes('#1') || text.includes('#2');
      
      if (isDarkBg && isDarkText) {
        inconsistencies.push('Dark background with dark text may have poor contrast');
      }
      
      if (!isDarkBg && !isDarkText) {
        inconsistencies.push('Light background with light text may have poor contrast');
      }
    }
  }
  
  // Generate recommendations
  if (missingTokens.length > 0) {
    recommendations.push('Complete missing token definitions for full theme support');
  }
  
  if (inconsistencies.length > 0) {
    recommendations.push('Review color combinations for accessibility compliance');
  }
  
  if (!theme.shadows && theme.name === 'dark') {
    recommendations.push('Dark themes benefit from enhanced shadow definitions');
  }
  
  // Calculate completion score
  const totalRequiredTokens = requiredColorTokens.length;
  const providedTokens = requiredColorTokens.filter(token => 
    theme.colors && theme.colors[token as keyof typeof theme.colors]
  ).length;
  
  const completionScore = totalRequiredTokens > 0 ? providedTokens / totalRequiredTokens : 0;
  const isComplete = completionScore >= 0.9 && inconsistencies.length === 0;
  
  return {
    isComplete,
    completionScore,
    missingTokens,
    inconsistencies,
    recommendations
  };
}

/**
 * Validates theme naming conventions
 */
export function validateThemeNaming(theme: ThemeConfig): {
  isValid: boolean;
  errors: string[];
  suggestions: string[];
} {
  const errors: string[] = [];
  const suggestions: string[] = [];
  
  // Check theme name format
  if (!theme.name) {
    errors.push('Theme name is required');
  } else {
    // Check naming convention
    const validNamePattern = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
    if (!validNamePattern.test(theme.name)) {
      errors.push('Theme name must use kebab-case format (lowercase, hyphens only)');
      suggestions.push(`Consider: ${theme.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
    }
    
    // Check reserved names
    const reservedNames = ['default', 'system', 'inherit', 'initial', 'unset'];
    if (reservedNames.includes(theme.name)) {
      errors.push(`Theme name "${theme.name}" is reserved`);
    }
  }
  
  // Check display name
  if (!theme.displayName) {
    errors.push('Display name is required for user interface');
  } else {
    if (theme.displayName.length < 2) {
      errors.push('Display name must be at least 2 characters');
    }
    if (theme.displayName.length > 50) {
      errors.push('Display name should be 50 characters or less');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    suggestions
  };
}

/**
 * Validates theme accessibility requirements
 */
export function validateThemeAccessibility(theme: ThemeConfig): {
  isAccessible: boolean;
  issues: string[];
  wcagLevel: 'AA' | 'AAA' | 'fail';
} {
  const issues: string[] = [];
  let wcagLevel: 'AA' | 'AAA' | 'fail' = 'AA';
  
  if (!theme.colors) {
    issues.push('No color definitions found for accessibility validation');
    return { isAccessible: false, issues, wcagLevel: 'fail' };
  }
  
  // Check for required accessibility colors
  const requiredA11yTokens = [
    'background',
    'text',
    'border-medium',
    'focus-ring'
  ];
  
  requiredA11yTokens.forEach(token => {
    if (!theme.colors![token as keyof typeof theme.colors]) {
      issues.push(`Missing accessibility-critical token: ${token}`);
    }
  });
  
  // Simplified contrast validation (in production, use proper color contrast libraries)
  if (theme.colors.background && theme.colors.text) {
    // Mock contrast ratio calculation
    const mockContrastRatio = calculateMockContrastRatio(
      theme.colors.background, 
      theme.colors.text
    );
    
    if (mockContrastRatio < 4.5) {
      issues.push('Text/background contrast ratio may not meet WCAG AA standards');
      wcagLevel = 'fail';
    } else if (mockContrastRatio < 7) {
      wcagLevel = 'AA';
    } else {
      wcagLevel = 'AAA';
    }
  }
  
  // Check focus indicators
  if (theme.colors && !theme.colors['focus-ring']) {
    issues.push('Focus ring color not defined - critical for keyboard navigation');
  }
  
  return {
    isAccessible: issues.length === 0 && wcagLevel !== 'fail',
    issues,
    wcagLevel
  };
}

/**
 * Mock contrast ratio calculation (simplified)
 * In production, use a proper color contrast calculation library
 */
function calculateMockContrastRatio(color1: string, color2: string): number {
  // This is a simplified mock - replace with actual contrast ratio calculation
  const isDark1 = color1.includes('#0') || color1.includes('#1') || color1.includes('#2');
  const isDark2 = color2.includes('#0') || color2.includes('#1') || color2.includes('#2');
  
  if (isDark1 !== isDark2) return 7.5; // Good contrast
  if (isDark1 === isDark2) return 2.1; // Poor contrast
  return 4.6; // Moderate contrast
}

/* ========================================
   THEME PERFORMANCE MONITORING
   ======================================== */

export interface ThemePerformanceMetrics {
  switchDuration: number;
  domUpdateTime: number;
  cssPropertyCount: number;
  memoryUsage?: number;
  renderTime: number;
  isWithinLimits: boolean;
}

export class ThemePerformanceTracker {
  private metrics: ThemePerformanceMetrics[] = [];
  private switchStartTime: number = 0;
  private observer: PerformanceObserver | null = null;
  
  constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.initializePerformanceObserver();
    }
  }
  
  private initializePerformanceObserver(): void {
    try {
      this.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name.includes('theme-switch')) {
            this.recordPerformanceEntry(entry);
          }
        });
      });
      
      this.observer.observe({ entryTypes: ['measure', 'mark'] });
    } catch (error) {
      console.warn('Performance monitoring not available:', error);
    }
  }
  
  private recordPerformanceEntry(entry: PerformanceEntry): void {
    // Process performance entries for theme switching
  }
  
  startThemeSwitch(): void {
    this.switchStartTime = performance.now();
    if (typeof performance.mark === 'function') {
      performance.mark('theme-switch-start');
    }
  }
  
  endThemeSwitch(): ThemePerformanceMetrics {
    const endTime = performance.now();
    const duration = endTime - this.switchStartTime;
    
    if (typeof performance.mark === 'function') {
      performance.mark('theme-switch-end');
      performance.measure('theme-switch-duration', 'theme-switch-start', 'theme-switch-end');
    }
    
    const metrics: ThemePerformanceMetrics = {
      switchDuration: duration,
      domUpdateTime: this.measureDOMUpdateTime(),
      cssPropertyCount: this.countCSSProperties(),
      renderTime: this.measureRenderTime(),
      isWithinLimits: duration < 500 // Constitutional requirement
    };
    
    // Add memory usage if available
    if ('memory' in performance) {
      metrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
    }
    
    this.metrics.push(metrics);
    return metrics;
  }
  
  private measureDOMUpdateTime(): number {
    // Mock DOM update time measurement
    return Math.random() * 50; // 0-50ms
  }
  
  private countCSSProperties(): number {
    const rootStyle = getComputedStyle(document.documentElement);
    let count = 0;
    
    for (let i = 0; i < rootStyle.length; i++) {
      const prop = rootStyle[i];
      if (prop.startsWith('--')) {
        count++;
      }
    }
    
    return count;
  }
  
  private measureRenderTime(): number {
    // Mock render time measurement
    return Math.random() * 20; // 0-20ms
  }
  
  getAveragePerformance(): ThemePerformanceMetrics | null {
    if (this.metrics.length === 0) return null;
    
    const total = this.metrics.reduce((acc, metric) => ({
      switchDuration: acc.switchDuration + metric.switchDuration,
      domUpdateTime: acc.domUpdateTime + metric.domUpdateTime,
      cssPropertyCount: acc.cssPropertyCount + metric.cssPropertyCount,
      renderTime: acc.renderTime + metric.renderTime,
      isWithinLimits: acc.isWithinLimits && metric.isWithinLimits
    }), {
      switchDuration: 0,
      domUpdateTime: 0,
      cssPropertyCount: 0,
      renderTime: 0,
      isWithinLimits: true
    });
    
    const count = this.metrics.length;
    return {
      switchDuration: total.switchDuration / count,
      domUpdateTime: total.domUpdateTime / count,
      cssPropertyCount: Math.round(total.cssPropertyCount / count),
      renderTime: total.renderTime / count,
      isWithinLimits: total.isWithinLimits
    };
  }
  
  getPerformanceGrade(): 'excellent' | 'good' | 'poor' {
    const avg = this.getAveragePerformance();
    if (!avg) return 'poor';
    
    if (avg.switchDuration < 200) return 'excellent';
    if (avg.switchDuration < 400) return 'good';
    return 'poor';
  }
  
  clearMetrics(): void {
    this.metrics = [];
  }
  
  dispose(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

/* ========================================
   THEME SYSTEM INTEGRATION UTILITIES
   ======================================== */

/**
 * Validates theme against system capabilities
 */
export function validateThemeSystemIntegration(theme: ThemeConfig): {
  isSupported: boolean;
  limitations: string[];
  fallbacks: string[];
} {
  const limitations: string[] = [];
  const fallbacks: string[] = [];
  
  // Check CSS custom property support
  if (!CSS.supports('color', 'var(--test)')) {
    limitations.push('CSS custom properties not supported');
    fallbacks.push('Use fallback color values');
  }
  
  // Check media query support for dark mode detection
  if (theme.name === 'auto' && !window.matchMedia) {
    limitations.push('System theme detection not available');
    fallbacks.push('Default to light theme');
  }
  
  // Check localStorage for theme persistence
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
  } catch {
    limitations.push('Theme preference persistence unavailable');
    fallbacks.push('Use session-only theme selection');
  }
  
  return {
    isSupported: limitations.length === 0,
    limitations,
    fallbacks
  };
}

/**
 * Generates theme-specific CSS class names
 */
export function generateThemeClassNames(theme: ThemeName, component?: string): {
  themeClass: string;
  componentClass?: string;
  modifierClasses: string[];
} {
  const themeClass = `theme-${theme}`;
  const componentClass = component ? `${component}--${theme}` : undefined;
  
  const modifierClasses: string[] = [];
  
  // Add theme-specific modifiers
  if (theme === 'dark') {
    modifierClasses.push('dark-mode', 'reduced-motion-safe');
  }
  
  if (theme === 'high-contrast') {
    modifierClasses.push('high-contrast', 'enhanced-focus');
  }
  
  if (theme === 'auto') {
    modifierClasses.push('system-theme', 'adaptive');
  }
  
  return {
    themeClass,
    componentClass,
    modifierClasses
  };
}

/**
 * Theme-aware utility for responsive breakpoints
 */
export function getThemeAwareBreakpoints(theme: ThemeName): {
  mobile: string;
  tablet: string;
  desktop: string;
  wide: string;
} {
  // Base breakpoints that work well with all themes
  const baseBreakpoints = {
    mobile: '640px',
    tablet: '768px', 
    desktop: '1024px',
    wide: '1280px'
  };
  
  // Theme-specific adjustments (if needed)
  switch (theme) {
    case 'high-contrast':
      // Slightly larger breakpoints for better accessibility
      return {
        mobile: '680px',
        tablet: '800px',
        desktop: '1100px',
        wide: '1400px'
      };
    
    default:
      return baseBreakpoints;
  }
}

/* ========================================
   DEVELOPMENT UTILITIES
   ======================================== */

/**
 * Debug information for theme development
 */
export function getThemeDebugInfo(theme: ThemeConfig): {
  validation: any;
  completeness: ThemeCompletenessResult;
  accessibility: ReturnType<typeof validateThemeAccessibility>;
  naming: ReturnType<typeof validateThemeNaming>;
  performance: ThemePerformanceMetrics | null;
} {
  const validation = validateThemeConfig(theme);
  const completeness = validateThemeCompleteness(theme);
  const accessibility = validateThemeAccessibility(theme);
  const naming = validateThemeNaming(theme);
  
  // Get performance data if tracker is available
  const tracker = new ThemePerformanceTracker();
  const performance = tracker.getAveragePerformance();
  tracker.dispose();
  
  return {
    validation,
    completeness,
    accessibility,
    naming,
    performance
  };
}

/**
 * Export theme configuration for design tools
 */
export function exportThemeConfig(theme: ThemeConfig, format: 'json' | 'css' | 'figma'): string {
  switch (format) {
    case 'json':
      return JSON.stringify(theme, null, 2);
      
    case 'css':
      return generateThemeCSS(theme);
      
    case 'figma':
      return generateFigmaTokens(theme);
      
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

function generateThemeCSS(theme: ThemeConfig): string {
  const selector = `[data-theme="${theme.name}"]`;
  let css = `${selector} {\n`;
  
  if (theme.colors) {
    Object.entries(theme.colors).forEach(([key, value]) => {
      css += `  --color-${key}: ${value};\n`;
    });
  }
  
  css += `}`;
  return css;
}

function generateFigmaTokens(theme: ThemeConfig): string {
  const figmaTokens = {
    [theme.name]: {
      colors: theme.colors || {},
      shadows: theme.shadows || {},
      borders: theme.borders || {}
    }
  };
  
  return JSON.stringify(figmaTokens, null, 2);
}

/* ========================================
   GLOBAL PERFORMANCE TRACKER INSTANCE
   ======================================== */

export const globalThemePerformanceTracker = new ThemePerformanceTracker();

/* ========================================
   CLEANUP UTILITIES
   ======================================== */

/**
 * Cleanup function for theme utilities
 */
export function cleanupThemeUtils(): void {
  globalThemePerformanceTracker.dispose();
}

/* ========================================
   BROWSER COMPATIBILITY CHECKS
   ======================================== */

export function checkThemeCompatibility(): {
  isSupported: boolean;
  features: Record<string, boolean>;
  recommendations: string[];
} {
  const features = {
    cssCustomProperties: CSS.supports('color', 'var(--test)'),
    darkModeQuery: !!window.matchMedia,
    localStorage: (() => {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
      } catch {
        return false;
      }
    })(),
    performanceAPI: 'performance' in window,
    observerAPI: 'PerformanceObserver' in window
  };
  
  const recommendations: string[] = [];
  
  if (!features.cssCustomProperties) {
    recommendations.push('Update browser for CSS custom property support');
  }
  
  if (!features.darkModeQuery) {
    recommendations.push('System theme detection unavailable');
  }
  
  const isSupported = features.cssCustomProperties && features.darkModeQuery;
  
  return {
    isSupported,
    features,
    recommendations
  };
}