/**
 * Design Token TypeScript Interfaces
 * 
 * Snowva Business Hub - Centralized Design System
 * Type definitions for design tokens and theme system
 * 
 * Provides type safety and IntelliSense for design token usage
 */

/* ========================================
   COLOR TOKEN INTERFACES
   ======================================== */

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface ColorTokens {
  // Base color scales
  gray: ColorScale;
  red: ColorScale;
  orange: ColorScale;
  yellow: ColorScale;
  green: ColorScale;
  blue: ColorScale;
  indigo: ColorScale;
  purple: ColorScale;
  pink: ColorScale;

  // Brand colors
  primary: ColorScale;
  secondary: ColorScale;
  accent: ColorScale;

  // Semantic colors
  success: ColorScale;
  warning: ColorScale;
  error: ColorScale;
  info: ColorScale;

  // Special colors
  white: string;
  black: string;
  transparent: string;

  // Background colors
  background: string;
  'background-secondary': string;
  'background-tertiary': string;
  'background-inverted': string;
  'background-overlay': string;

  // Text colors
  text: string;
  'text-secondary': string;
  'text-tertiary': string;
  'text-inverted': string;
  'text-muted': string;
  'text-placeholder': string;

  // Border colors
  border: string;
  'border-light': string;
  'border-medium': string;
  'border-dark': string;
  'border-strong': string;
}

/* ========================================
   SPACING TOKEN INTERFACES
   ======================================== */

export interface SpacingTokens {
  // Base spacing scale
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
  8: string;
  10: string;
  12: string;
  16: string;
  20: string;
  24: string;
  32: string;
  40: string;
  48: string;
  56: string;
  64: string;

  // Semantic spacing
  'button-padding-x': string;
  'button-padding-y': string;
  'form-field-gap': string;
  'card-padding': string;
  'page-padding': string;
  'container-gap': string;

  // Responsive spacing
  'responsive-xs': string;
  'responsive-sm': string;
  'responsive-md': string;
  'responsive-lg': string;
}

/* ========================================
   TYPOGRAPHY TOKEN INTERFACES
   ======================================== */

export interface TypographyScale {
  size: string;
  weight: string;
  'line-height': string;
  'letter-spacing': string;
}

export interface TypographyTokens {
  // Font families
  'font-family-sans': string;
  'font-family-serif': string;
  'font-family-mono': string;
  'font-family-base': string;

  // Font weights
  'font-weight-thin': string;
  'font-weight-light': string;
  'font-weight-normal': string;
  'font-weight-medium': string;
  'font-weight-semibold': string;
  'font-weight-bold': string;
  'font-weight-extrabold': string;
  'font-weight-black': string;

  // Font sizes
  'font-size-xs': string;
  'font-size-sm': string;
  'font-size-base': string;
  'font-size-lg': string;
  'font-size-xl': string;
  'font-size-2xl': string;
  'font-size-3xl': string;
  'font-size-4xl': string;
  'font-size-5xl': string;
  'font-size-6xl': string;

  // Line heights
  'line-height-none': string;
  'line-height-tight': string;
  'line-height-snug': string;
  'line-height-normal': string;
  'line-height-relaxed': string;
  'line-height-loose': string;

  // Letter spacing
  'letter-spacing-tighter': string;
  'letter-spacing-tight': string;
  'letter-spacing-normal': string;
  'letter-spacing-wide': string;
  'letter-spacing-wider': string;
  'letter-spacing-widest': string;

  // Semantic typography
  'text-h1': TypographyScale;
  'text-h2': TypographyScale;
  'text-h3': TypographyScale;
  'text-h4': TypographyScale;
  'text-h5': TypographyScale;
  'text-h6': TypographyScale;
  'text-body': TypographyScale;
  'text-body-sm': TypographyScale;
  'text-body-lg': TypographyScale;
  'text-button': TypographyScale;
  'text-label': TypographyScale;
  'text-input': TypographyScale;
  'text-caption': TypographyScale;
}

/* ========================================
   SHADOW TOKEN INTERFACES
   ======================================== */

export interface ShadowTokens {
  // Base shadow scale
  none: string;
  xs: string;
  sm: string;
  base: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;

  // Semantic shadows
  card: string;
  'card-hover': string;
  'card-active': string;
  button: string;
  'button-hover': string;
  'button-active': string;
  modal: string;
  dropdown: string;
  tooltip: string;
  input: string;
  'input-focus': string;
  'input-error': string;

  // Focus shadows
  focus: string;
  'focus-thin': string;
  'focus-thick': string;
  'focus-error': string;
  'focus-success': string;
}

/* ========================================
   BORDER TOKEN INTERFACES
   ======================================== */

export interface BorderTokens {
  // Border widths
  'width-0': string;
  'width-1': string;
  'width-2': string;
  'width-3': string;
  'width-4': string;
  'width-8': string;

  // Border styles
  'style-solid': string;
  'style-dashed': string;
  'style-dotted': string;
  'style-none': string;

  // Border radius
  'radius-none': string;
  'radius-xs': string;
  'radius-sm': string;
  'radius-base': string;
  'radius-md': string;
  'radius-lg': string;
  'radius-xl': string;
  'radius-2xl': string;
  'radius-3xl': string;
  'radius-full': string;

  // Semantic borders
  card: string;
  'card-hover': string;
  'card-active': string;
  button: string;
  'button-outlined': string;
  'button-primary': string;
  input: string;
  'input-hover': string;
  'input-focus': string;
  'input-error': string;
  'input-success': string;
}

/* ========================================
   TRANSITION TOKEN INTERFACES
   ======================================== */

export interface TransitionTokens {
  // Duration scale
  'duration-instant': string;
  'duration-fastest': string;
  'duration-faster': string;
  'duration-fast': string;
  'duration-base': string;
  'duration-slow': string;
  'duration-slower': string;
  'duration-slowest': string;

  // Easing functions
  'easing-linear': string;
  'easing-ease': string;
  'easing-ease-in': string;
  'easing-ease-out': string;
  'easing-ease-in-out': string;
  'easing-smooth': string;
  'easing-sharp': string;
  'easing-bounce': string;

  // Semantic transitions
  button: string;
  'button-hover': string;
  'button-active': string;
  input: string;
  'input-focus': string;
  card: string;
  'card-hover': string;
  modal: string;
  dropdown: string;
  focus: string;
  hover: string;
  active: string;
}

/* ========================================
   COMPLETE DESIGN TOKEN INTERFACE
   ======================================== */

export interface DesignTokens {
  colors: ColorTokens;
  spacing: SpacingTokens;
  typography: TypographyTokens;
  shadows: ShadowTokens;
  borders: BorderTokens;
  transitions: TransitionTokens;
}

/* ========================================
   THEME CONFIGURATION INTERFACES
   ======================================== */

export type ThemeName = 'light' | 'dark' | 'high-contrast' | 'auto';

export interface ThemeConfig {
  name: ThemeName;
  displayName: string;
  colors: Partial<ColorTokens>;
  shadows?: Partial<ShadowTokens>;
  borders?: Partial<BorderTokens>;
}

export interface ThemeContextValue {
  currentTheme: ThemeName;
  availableThemes: ThemeConfig[];
  setTheme: (theme: ThemeName) => void;
  tokens: DesignTokens;
  isDark: boolean;
  isHighContrast: boolean;
}

/* ========================================
   COMPONENT TOKEN INTERFACES
   ======================================== */

export interface ButtonTokens {
  backgroundColor: string;
  backgroundColorHover: string;
  backgroundColorActive: string;
  textColor: string;
  textColorHover: string;
  border: string;
  borderHover: string;
  borderRadius: string;
  padding: string;
  fontSize: string;
  fontWeight: string;
  transition: string;
  shadow: string;
  shadowHover: string;
}

export interface InputTokens {
  backgroundColor: string;
  backgroundColorFocus: string;
  backgroundColorDisabled: string;
  textColor: string;
  textColorPlaceholder: string;
  textColorDisabled: string;
  border: string;
  borderFocus: string;
  borderError: string;
  borderSuccess: string;
  borderRadius: string;
  padding: string;
  fontSize: string;
  lineHeight: string;
  shadow: string;
  shadowFocus: string;
  transition: string;
}

export interface CardTokens {
  backgroundColor: string;
  backgroundColorHover: string;
  border: string;
  borderHover: string;
  borderRadius: string;
  padding: string;
  shadow: string;
  shadowHover: string;
  transition: string;
}

/* ========================================
   TOKEN VALIDATION INTERFACES
   ======================================== */

export interface TokenValidationError {
  token: string;
  value: string | undefined;
  expected: string;
  message: string;
}

export interface TokenValidationResult {
  isValid: boolean;
  errors: TokenValidationError[];
  warnings: string[];
}

/* ========================================
   CSS CUSTOM PROPERTY INTERFACES
   ======================================== */

export interface CSSCustomProperties {
  [key: `--${string}`]: string;
}

export interface TokenToCSSMap {
  [tokenPath: string]: string; // e.g., 'colors.primary.500' -> '--color-primary-500'
}

/* ========================================
   UTILITY TYPE HELPERS
   ======================================== */

// Extract nested token paths for type-safe access
export type TokenPath<T> = T extends object 
  ? {
      [K in keyof T]: K extends string 
        ? T[K] extends object
          ? `${K}.${TokenPath<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

// Get token value type by path
export type TokenValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? TokenValue<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

// Type-safe token getter function signature
export type GetToken = <P extends TokenPath<DesignTokens>>(
  path: P
) => TokenValue<DesignTokens, P>;

/* ========================================
   RESPONSIVE TOKEN INTERFACES
   ======================================== */

export interface ResponsiveValue<T> {
  base?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}

export interface ResponsiveTokens {
  spacing: ResponsiveValue<keyof SpacingTokens>;
  typography: ResponsiveValue<keyof TypographyTokens>;
  shadows: ResponsiveValue<keyof ShadowTokens>;
}

/* ========================================
   COMPONENT VARIANT INTERFACES
   ======================================== */

export interface ComponentVariant {
  name: string;
  tokens: Partial<DesignTokens>;
  className?: string;
}

export interface ComponentVariants {
  [componentName: string]: {
    [variantName: string]: ComponentVariant;
  };
}

/* ========================================
   ANIMATION & MOTION INTERFACES
   ======================================== */

export interface MotionTokens {
  durations: {
    instant: string;
    fast: string;
    normal: string;
    slow: string;
  };
  easings: {
    linear: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
    bounce: string;
  };
  reducedMotion: boolean;
}

export interface AnimationPreferences {
  respectReducedMotion: boolean;
  defaultDuration: keyof TransitionTokens;
  defaultEasing: keyof TransitionTokens;
}