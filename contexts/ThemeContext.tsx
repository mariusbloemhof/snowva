/**
 * Theme Context Provider
 * 
 * Snowva Business Hub - Centralized Design System
 * React Context for theme management with <500ms switching requirement
 * 
 * Provides theme switching, persistence, and performance monitoring
 */

import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState
} from 'react';
import {
    createCSSRuleFromProperties,
    generateCSSCustomProperties,
    resolveThemeTokens
} from '../styles/tokens/resolution';
import type {
    DesignTokens,
    ThemeConfig,
    ThemeContextValue,
    ThemeName
} from '../styles/tokens/types';
import { validateThemeConfig } from '../styles/tokens/validation';

/* ========================================
   THEME CONFIGURATIONS
   ======================================== */

// Base design tokens (imported from actual token files in production)
const baseTokens: DesignTokens = {
  colors: {} as any, // Will be populated by actual token imports
  spacing: {} as any,
  typography: {} as any,
  shadows: {} as any,
  borders: {} as any,
  transitions: {} as any
};

// Theme configurations
const themeConfigs: ThemeConfig[] = [
  {
    name: 'light',
    displayName: 'Light Theme',
    colors: {
      // Light theme color overrides
      background: '#ffffff',
      'background-secondary': '#f8fafc',
      'background-tertiary': '#f1f5f9',
      text: '#1e293b',
      'text-secondary': '#475569',
      'text-tertiary': '#64748b',
      'border-light': '#e2e8f0',
      'border-medium': '#cbd5e1',
    } as any
  },
  {
    name: 'dark',
    displayName: 'Dark Theme',
    colors: {
      // Dark theme color overrides  
      background: '#0f172a',
      'background-secondary': '#1e293b',
      'background-tertiary': '#334155',
      text: '#f8fafc',
      'text-secondary': '#e2e8f0',
      'text-tertiary': '#cbd5e1',
      'border-light': '#334155',
      'border-medium': '#475569',
    } as any,
    shadows: {
      // Enhanced shadows for dark theme
      card: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.15)',
      modal: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
    } as any
  },
  {
    name: 'high-contrast',
    displayName: 'High Contrast',
    colors: {
      // High contrast color overrides
      background: '#ffffff',
      'background-secondary': '#ffffff',
      'background-tertiary': '#ffffff',
      text: '#000000',
      'text-secondary': '#000000',
      'text-tertiary': '#000000',
      'border-light': '#000000',
      'border-medium': '#000000',
    } as any,
    borders: {
      // Stronger borders for high contrast
      card: '2px solid #000000',
      input: '2px solid #000000',
    } as any
  },
  {
    name: 'auto',
    displayName: 'System',
    colors: {} as any // Will use system preference detection
  }
];

/* ========================================
   PERFORMANCE MONITORING
   ======================================== */

interface PerformanceMetrics {
  switchStartTime: number;
  switchEndTime: number;
  duration: number;
  isWithinLimit: boolean;
  error?: string;
}

class ThemePerformanceMonitor {
  private switchStartTime: number = 0;
  private metrics: PerformanceMetrics[] = [];
  
  startSwitch(): void {
    this.switchStartTime = performance.now();
  }
  
  endSwitch(): PerformanceMetrics {
    const endTime = performance.now();
    const duration = endTime - this.switchStartTime;
    const isWithinLimit = duration < 500; // Constitutional requirement: <500ms
    
    const metrics: PerformanceMetrics = {
      switchStartTime: this.switchStartTime,
      switchEndTime: endTime,
      duration,
      isWithinLimit
    };
    
    if (!isWithinLimit) {
      metrics.error = `Theme switch took ${duration.toFixed(2)}ms, exceeding 500ms limit`;
      console.warn('⚠️ Theme switch performance warning:', metrics.error);
    }
    
    this.metrics.push(metrics);
    return metrics;
  }
  
  getAveragePerformance(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, metric) => sum + metric.duration, 0);
    return total / this.metrics.length;
  }
  
  getPerformanceGrade(): 'excellent' | 'good' | 'poor' {
    const avg = this.getAveragePerformance();
    if (avg < 200) return 'excellent';
    if (avg < 400) return 'good';
    return 'poor';
  }
}

/* ========================================
   THEME PERSISTENCE
   ======================================== */

const THEME_STORAGE_KEY = 'snowva-theme-preference';
const THEME_STORAGE_VERSION = '1.0';

interface ThemePreference {
  theme: ThemeName;
  timestamp: number;
  version: string;
}

class ThemePersistence {
  static save(theme: ThemeName): void {
    try {
      const preference: ThemePreference = {
        theme,
        timestamp: Date.now(),
        version: THEME_STORAGE_VERSION
      };
      
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(preference));
    } catch (error) {
      console.warn('Failed to persist theme preference:', error);
    }
  }
  
  static load(): ThemeName | null {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (!stored) return null;
      
      const preference: ThemePreference = JSON.parse(stored);
      
      // Validate version and expiry (7 days)
      const isValid = preference.version === THEME_STORAGE_VERSION;
      const isExpired = Date.now() - preference.timestamp > 7 * 24 * 60 * 60 * 1000;
      
      if (!isValid || isExpired) {
        this.clear();
        return null;
      }
      
      return preference.theme;
    } catch (error) {
      console.warn('Failed to load theme preference:', error);
      return null;
    }
  }
  
  static clear(): void {
    try {
      localStorage.removeItem(THEME_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear theme preference:', error);
    }
  }
}

/* ========================================
   SYSTEM THEME DETECTION
   ======================================== */

function detectSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light'; // Default fallback
}

/* ========================================
   THEME CONTEXT
   ======================================== */

const ThemeContext = createContext<ThemeContextValue | null>(null);

/* ========================================
   THEME PROVIDER COMPONENT
   ======================================== */

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeName;
  enablePerformanceMonitoring?: boolean;
}

export function ThemeProvider({ 
  children, 
  defaultTheme = 'auto',
  enablePerformanceMonitoring = true 
}: ThemeProviderProps): React.JSX.Element {
  // State management
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  
  // Performance monitoring
  const performanceMonitor = useRef(new ThemePerformanceMonitor());
  const styleElement = useRef<HTMLStyleElement | null>(null);
  
  // Initialize theme from persistence or system preference
  useEffect(() => {
    const persistedTheme = ThemePersistence.load();
    if (persistedTheme) {
      setCurrentTheme(persistedTheme);
    } else if (currentTheme === 'auto') {
      setResolvedTheme(detectSystemTheme());
    }
  }, []);
  
  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (currentTheme !== 'auto') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [currentTheme]);
  
  // Apply theme to DOM
  useEffect(() => {
    if (enablePerformanceMonitoring) {
      performanceMonitor.current.startSwitch();
    }
    
    const actualTheme = currentTheme === 'auto' ? resolvedTheme : currentTheme;
    
    // Update document data attribute for CSS selectors
    document.documentElement.setAttribute('data-theme', actualTheme);
    
    // Generate and inject theme CSS
    const themeConfig = themeConfigs.find(config => config.name === actualTheme);
    if (themeConfig) {
      const themedTokens = resolveThemeTokens(baseTokens, themeConfig);
      const cssProperties = generateCSSCustomProperties(themedTokens);
      const cssText = createCSSRuleFromProperties(cssProperties, ':root');
      
      // Inject CSS
      if (!styleElement.current) {
        styleElement.current = document.createElement('style');
        styleElement.current.setAttribute('data-theme-provider', 'true');
        document.head.appendChild(styleElement.current);
      }
      
      styleElement.current.textContent = cssText;
    }
    
    if (enablePerformanceMonitoring) {
      const metrics = performanceMonitor.current.endSwitch();
      
      // Report performance issues in development
      if (process.env.NODE_ENV === 'development' && !metrics.isWithinLimit) {
        console.error('🚨 Constitutional violation: Theme switch exceeded 500ms limit', metrics);
      }
    }
  }, [currentTheme, resolvedTheme, enablePerformanceMonitoring]);
  
  // Theme switching function with validation and persistence
  const setTheme = useCallback((theme: ThemeName) => {
    // Validate theme exists
    const isValidTheme = themeConfigs.some(config => config.name === theme) || theme === 'auto';
    if (!isValidTheme) {
      console.warn(`Invalid theme: ${theme}. Using fallback.`);
      theme = 'light';
    }
    
    setCurrentTheme(theme);
    
    // Persist theme preference (except auto, which should detect system preference)
    if (theme !== 'auto') {
      ThemePersistence.save(theme);
    } else {
      ThemePersistence.clear();
    }
  }, []);
  
  // Compute context value
  const contextValue = useMemo<ThemeContextValue>(() => {
    const actualTheme = currentTheme === 'auto' ? resolvedTheme : currentTheme;
    const themeConfig = themeConfigs.find(config => config.name === actualTheme);
    const themedTokens = themeConfig ? resolveThemeTokens(baseTokens, themeConfig) : baseTokens;
    
    return {
      currentTheme,
      availableThemes: themeConfigs,
      setTheme,
      tokens: themedTokens,
      isDark: actualTheme === 'dark',
      isHighContrast: actualTheme === 'high-contrast'
    };
  }, [currentTheme, resolvedTheme, setTheme]);
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

/* ========================================
   THEME CONTEXT HOOK
   ======================================== */

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}

/* ========================================
   THEME UTILITIES
   ======================================== */

/**
 * Hook for accessing theme performance metrics (development only)
 */
export function useThemePerformance() {
  const performanceMonitor = useRef(new ThemePerformanceMonitor());
  
  return {
    getAveragePerformance: () => performanceMonitor.current.getAveragePerformance(),
    getPerformanceGrade: () => performanceMonitor.current.getPerformanceGrade(),
    isPerformant: () => performanceMonitor.current.getAveragePerformance() < 500
  };
}

/**
 * Hook for theme-aware CSS class generation
 */
export function useThemedClasses() {
  const { isDark, isHighContrast } = useTheme();
  
  return useCallback((baseClass: string, variants?: {
    dark?: string;
    light?: string;
    highContrast?: string;
  }) => {
    let className = baseClass;
    
    if (variants) {
      if (isDark && variants.dark) {
        className += ` ${variants.dark}`;
      } else if (!isDark && variants.light) {
        className += ` ${variants.light}`;
      }
      
      if (isHighContrast && variants.highContrast) {
        className += ` ${variants.highContrast}`;
      }
    }
    
    return className;
  }, [isDark, isHighContrast]);
}

/**
 * Component for theme-based conditional rendering
 */
interface ThemeGateProps {
  children: ReactNode;
  theme?: ThemeName | ThemeName[];
  not?: ThemeName | ThemeName[];
  fallback?: ReactNode;
}

export function ThemeGate({ children, theme, not, fallback = null }: ThemeGateProps): React.JSX.Element | null {
  const { currentTheme } = useTheme();
  
  // Check inclusion criteria
  if (theme) {
    const allowedThemes = Array.isArray(theme) ? theme : [theme];
    if (!allowedThemes.includes(currentTheme)) {
      return fallback as React.JSX.Element;
    }
  }
  
  // Check exclusion criteria
  if (not) {
    const excludedThemes = Array.isArray(not) ? not : [not];
    if (excludedThemes.includes(currentTheme)) {
      return fallback as React.JSX.Element;
    }
  }
  
  return children as React.JSX.Element;
}

/* ========================================
   DEVELOPMENT UTILITIES
   ======================================== */

if (process.env.NODE_ENV === 'development') {
  // Expose theme utilities to window for debugging
  (window as any).__SNOWVA_THEME_DEBUG__ = {
    ThemePersistence,
    detectSystemTheme,
    themeConfigs,
    validateThemeConfig
  };
}

export { detectSystemTheme, themeConfigs, ThemePersistence };
export type { PerformanceMetrics, ThemePreference };
