/**
 * CSS Class Builder Utilities
 * 
 * Snowva Business Hub - Centralized Design System
 * Utilities for building type-safe CSS classes from design tokens
 * 
 * Provides semantic class generation and responsive utilities
 */

import type {
    DesignTokens,
    ResponsiveValue
} from './types';

/* ========================================
   CLASS NAME UTILITIES
   ======================================== */

/**
 * Conditionally joins class names, filtering out falsy values
 */
export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Creates a class name with optional modifiers
 */
export function createClassName(
  base: string,
  modifiers?: Record<string, boolean | undefined>
): string {
  const classes = [base];
  
  if (modifiers) {
    Object.entries(modifiers).forEach(([modifier, condition]) => {
      if (condition) {
        classes.push(`${base}--${modifier}`);
      }
    });
  }
  
  return classes.join(' ');
}

/**
 * Generates BEM-style class names
 */
export interface BEMConfig {
  block: string;
  element?: string;
  modifiers?: Record<string, boolean | string | undefined>;
}

export function bem({ block, element, modifiers }: BEMConfig): string {
  let className = block;
  
  if (element) {
    className += `__${element}`;
  }
  
  if (modifiers) {
    Object.entries(modifiers).forEach(([modifier, value]) => {
      if (value === true) {
        className += ` ${className}--${modifier}`;
      } else if (typeof value === 'string' && value) {
        className += ` ${className}--${modifier}-${value}`;
      }
    });
  }
  
  return className;
}

/* ========================================
   SEMANTIC CLASS BUILDERS
   ======================================== */

/**
 * Configuration for semantic class generation
 */
export interface SemanticClassConfig {
  component: string;
  variant?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  state?: 'default' | 'hover' | 'active' | 'focus' | 'disabled' | 'loading';
  intent?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  responsive?: boolean;
}

/**
 * Builds semantic CSS class names following the design system conventions
 */
export function buildSemanticClass(config: SemanticClassConfig): string {
  const { component, variant, size, state, intent, responsive } = config;
  
  let className = component;
  
  if (variant) {
    className += `-${variant}`;
  }
  
  if (size && size !== 'md') {
    className += `-${size}`;
  }
  
  if (intent && intent !== 'primary') {
    className += `-${intent}`;
  }
  
  const modifiers: Record<string, boolean> = {};
  
  if (state && state !== 'default') {
    modifiers[state] = true;
  }
  
  if (responsive) {
    modifiers.responsive = true;
  }
  
  return createClassName(className, modifiers);
}

/* ========================================
   TOKEN-BASED CLASS BUILDERS
   ======================================== */

/**
 * Builds spacing utility classes from tokens
 */
export interface SpacingClassConfig {
  property: 'margin' | 'padding';
  sides?: 't' | 'r' | 'b' | 'l' | 'x' | 'y' | 'all';
  size: keyof DesignTokens['spacing'];
  responsive?: ResponsiveValue<keyof DesignTokens['spacing']>;
}

export function buildSpacingClass(config: SpacingClassConfig): string {
  const { property, sides = 'all', size, responsive } = config;
  
  const prefix = property === 'margin' ? 'm' : 'p';
  const sideMap: Record<string, string> = {
    t: 't',
    r: 'r', 
    b: 'b',
    l: 'l',
    x: 'x',
    y: 'y',
    all: ''
  };
  
  let className = `${prefix}${sideMap[sides]}-${size}`;
  
  if (responsive) {
    const responsiveClasses = Object.entries(responsive)
      .filter(([_, value]) => value !== undefined)
      .map(([breakpoint, value]) => {
        const bp = breakpoint === 'base' ? '' : `${breakpoint}:`;
        return `${bp}${prefix}${sideMap[sides]}-${value}`;
      });
    
    className = responsiveClasses.join(' ');
  }
  
  return className;
}

/**
 * Builds typography utility classes from tokens
 */
export interface TypographyClassConfig {
  element: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'caption' | 'button' | 'label';
  size?: 'sm' | 'base' | 'lg';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  responsive?: ResponsiveValue<string>;
}

export function buildTypographyClass(config: TypographyClassConfig): string {
  const { element, size, weight, responsive } = config;
  
  let className = `text-${element}`;
  
  if (size && size !== 'base') {
    className += `-${size}`;
  }
  
  if (weight && weight !== 'normal') {
    className += ` font-${weight}`;
  }
  
  if (responsive) {
    const responsiveClasses = Object.entries(responsive)
      .filter(([_, value]) => value !== undefined)
      .map(([breakpoint, value]) => {
        const bp = breakpoint === 'base' ? '' : `${breakpoint}:`;
        return `${bp}text-${value}`;
      });
    
    className += ` ${responsiveClasses.join(' ')}`;
  }
  
  return className.trim();
}

/**
 * Builds color utility classes from tokens
 */
export interface ColorClassConfig {
  property: 'text' | 'background' | 'border';
  color: string; // Token path like 'primary.500'
  alpha?: number;
  hover?: boolean;
  focus?: boolean;
}

export function buildColorClass(config: ColorClassConfig): string {
  const { property, color, alpha, hover, focus } = config;
  
  const propertyMap: Record<string, string> = {
    text: 'text',
    background: 'bg',
    border: 'border'
  };
  
  let className = `${propertyMap[property]}-${color.replace('.', '-')}`;
  
  if (alpha && alpha < 100) {
    className += `-${alpha}`;
  }
  
  const stateClasses: string[] = [];
  
  if (hover) {
    stateClasses.push(`hover:${className}`);
  }
  
  if (focus) {
    stateClasses.push(`focus:${className}`);
  }
  
  return [className, ...stateClasses].join(' ');
}

/* ========================================
   COMPONENT CLASS BUILDERS
   ======================================== */

/**
 * Builds button component classes
 */
export interface ButtonClassConfig {
  variant?: 'solid' | 'outlined' | 'ghost' | 'link';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  intent?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  state?: 'default' | 'hover' | 'active' | 'focus' | 'disabled' | 'loading';
  fullWidth?: boolean;
  iconOnly?: boolean;
}

export function buildButtonClass(config: ButtonClassConfig = {}): string {
  const {
    variant = 'solid',
    size = 'md',
    intent = 'primary',
    state = 'default',
    fullWidth = false,
    iconOnly = false
  } = config;
  
  const baseClass = 'button';
  const variantClass = `button-${variant}`;
  const intentClass = intent !== 'primary' ? `button-${intent}` : '';
  const sizeClass = size !== 'md' ? `button-${size}` : '';
  
  const modifiers: Record<string, boolean> = {
    [state]: state !== 'default',
    'full-width': fullWidth,
    'icon-only': iconOnly
  };
  
  return classNames(
    baseClass,
    variantClass,
    intentClass,
    sizeClass,
    createClassName('', modifiers)
  );
}

/**
 * Builds input component classes
 */
export interface InputClassConfig {
  type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'textarea' | 'select';
  size?: 'sm' | 'md' | 'lg';
  state?: 'default' | 'focus' | 'error' | 'success' | 'disabled';
  fullWidth?: boolean;
  hasIcon?: 'left' | 'right' | 'both';
}

export function buildInputClass(config: InputClassConfig = {}): string {
  const {
    type = 'text',
    size = 'md',
    state = 'default',
    fullWidth = false,
    hasIcon
  } = config;
  
  const baseClass = type === 'textarea' ? 'textarea' : type === 'select' ? 'select' : 'input';
  const sizeClass = size !== 'md' ? `form-${size}` : '';
  
  const modifiers: Record<string, boolean> = {
    [state]: state !== 'default',
    'full-width': fullWidth,
    'has-icon-left': hasIcon === 'left' || hasIcon === 'both',
    'has-icon-right': hasIcon === 'right' || hasIcon === 'both'
  };
  
  return classNames(
    baseClass,
    sizeClass,
    createClassName('', modifiers)
  );
}

/**
 * Builds card component classes
 */
export interface CardClassConfig {
  variant?: 'default' | 'outlined' | 'elevated' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  interactive?: boolean;
  selected?: boolean;
  disabled?: boolean;
}

export function buildCardClass(config: CardClassConfig = {}): string {
  const {
    variant = 'default',
    padding = 'md',
    interactive = false,
    selected = false,
    disabled = false
  } = config;
  
  const baseClass = 'card';
  const variantClass = variant !== 'default' ? `card-${variant}` : '';
  const paddingClass = padding !== 'md' ? `card-padding-${padding}` : '';
  
  const modifiers: Record<string, boolean> = {
    interactive,
    selected,
    disabled
  };
  
  return classNames(
    baseClass,
    variantClass,
    paddingClass,
    createClassName('', modifiers)
  );
}

/* ========================================
   LAYOUT CLASS BUILDERS
   ======================================== */

/**
 * Builds flexbox utility classes
 */
export interface FlexClassConfig {
  direction?: 'row' | 'row-reverse' | 'col' | 'col-reverse';
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  gap?: keyof DesignTokens['spacing'];
  responsive?: boolean;
}

export function buildFlexClass(config: FlexClassConfig = {}): string {
  const { direction, justify, align, wrap, gap, responsive } = config;
  
  const classes: string[] = ['flex'];
  
  if (direction && direction !== 'row') {
    classes.push(`flex-${direction}`);
  }
  
  if (justify) {
    classes.push(`justify-${justify}`);
  }
  
  if (align) {
    classes.push(`items-${align}`);
  }
  
  if (wrap && wrap !== 'nowrap') {
    classes.push(`flex-${wrap}`);
  }
  
  if (gap) {
    classes.push(`gap-${gap}`);
  }
  
  if (responsive) {
    // Add responsive variants for mobile-first design
    classes.push('flex-responsive');
  }
  
  return classes.join(' ');
}

/**
 * Builds grid utility classes
 */
export interface GridClassConfig {
  cols?: number | 'none' | 'subgrid';
  rows?: number | 'none' | 'subgrid';
  gap?: keyof DesignTokens['spacing'];
  colGap?: keyof DesignTokens['spacing'];
  rowGap?: keyof DesignTokens['spacing'];
  autoFlow?: 'row' | 'col' | 'dense' | 'row-dense' | 'col-dense';
  responsive?: ResponsiveValue<number>;
}

export function buildGridClass(config: GridClassConfig = {}): string {
  const { cols, rows, gap, colGap, rowGap, autoFlow, responsive } = config;
  
  const classes: string[] = ['grid'];
  
  if (cols) {
    if (typeof cols === 'number') {
      classes.push(`grid-cols-${cols}`);
    } else {
      classes.push(`grid-cols-${cols}`);
    }
  }
  
  if (rows) {
    if (typeof rows === 'number') {
      classes.push(`grid-rows-${rows}`);
    } else {
      classes.push(`grid-rows-${rows}`);
    }
  }
  
  if (gap) {
    classes.push(`gap-${gap}`);
  }
  
  if (colGap) {
    classes.push(`gap-x-${colGap}`);
  }
  
  if (rowGap) {
    classes.push(`gap-y-${rowGap}`);
  }
  
  if (autoFlow && autoFlow !== 'row') {
    classes.push(`grid-flow-${autoFlow}`);
  }
  
  if (responsive) {
    Object.entries(responsive).forEach(([breakpoint, value]) => {
      if (value !== undefined) {
        const bp = breakpoint === 'base' ? '' : `${breakpoint}:`;
        classes.push(`${bp}grid-cols-${value}`);
      }
    });
  }
  
  return classes.join(' ');
}

/* ========================================
   RESPONSIVE CLASS BUILDERS
   ======================================== */

/**
 * Builds responsive utility classes with breakpoint prefixes
 */
export function buildResponsiveClass(
  baseClass: string,
  responsive: ResponsiveValue<string>
): string {
  const classes: string[] = [];
  
  Object.entries(responsive).forEach(([breakpoint, value]) => {
    if (value !== undefined) {
      const prefix = breakpoint === 'base' ? '' : `${breakpoint}:`;
      classes.push(`${prefix}${value}`);
    }
  });
  
  return classes.join(' ');
}

/* ========================================
   STATE CLASS BUILDERS
   ======================================== */

/**
 * Builds interactive state classes (hover, focus, active, etc.)
 */
export interface StateClassConfig {
  base: string;
  hover?: string;
  focus?: string;
  active?: string;
  disabled?: string;
  loading?: string;
  selected?: string;
}

export function buildStateClasses(config: StateClassConfig): string {
  const { base, hover, focus, active, disabled, loading, selected } = config;
  
  const classes = [base];
  
  if (hover) classes.push(`hover:${hover}`);
  if (focus) classes.push(`focus:${focus}`);
  if (active) classes.push(`active:${active}`);
  if (disabled) classes.push(`disabled:${disabled}`);
  if (loading) classes.push(`loading:${loading}`);
  if (selected) classes.push(`selected:${selected}`);
  
  return classes.join(' ');
}

/* ========================================
   THEME CLASS BUILDERS
   ======================================== */

/**
 * Builds theme-specific classes
 */
export interface ThemeClassConfig {
  base: string;
  light?: string;
  dark?: string;
  highContrast?: string;
}

export function buildThemeClasses(config: ThemeClassConfig): string {
  const { base, light, dark, highContrast } = config;
  
  const classes = [base];
  
  if (light) classes.push(`[data-theme="light"] &:${light}`);
  if (dark) classes.push(`[data-theme="dark"] &:${dark}`);
  if (highContrast) classes.push(`[data-theme="high-contrast"] &:${highContrast}`);
  
  return classes.join(' ');
}

/* ========================================
   ACCESSIBILITY CLASS BUILDERS
   ======================================== */

/**
 * Builds accessibility-focused classes
 */
export interface A11yClassConfig {
  focusVisible?: boolean;
  screenReaderOnly?: boolean;
  reducedMotion?: boolean;
  highContrast?: boolean;
}

export function buildA11yClasses(config: A11yClassConfig = {}): string {
  const { focusVisible, screenReaderOnly, reducedMotion, highContrast } = config;
  
  const classes: string[] = [];
  
  if (focusVisible) {
    classes.push('focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2');
  }
  
  if (screenReaderOnly) {
    classes.push('sr-only');
  }
  
  if (reducedMotion) {
    classes.push('motion-reduce:transition-none motion-reduce:animation-none');
  }
  
  if (highContrast) {
    classes.push('contrast-more:border-2 contrast-more:font-semibold');
  }
  
  return classes.join(' ');
}

/* ========================================
   UTILITY CLASS GENERATORS
   ======================================== */

/**
 * Creates a comprehensive utility class builder
 */
export interface UtilityClassBuilder {
  spacing: (config: SpacingClassConfig) => string;
  typography: (config: TypographyClassConfig) => string;
  color: (config: ColorClassConfig) => string;
  button: (config?: ButtonClassConfig) => string;
  input: (config?: InputClassConfig) => string;
  card: (config?: CardClassConfig) => string;
  flex: (config?: FlexClassConfig) => string;
  grid: (config?: GridClassConfig) => string;
  state: (config: StateClassConfig) => string;
  theme: (config: ThemeClassConfig) => string;
  a11y: (config?: A11yClassConfig) => string;
  responsive: (baseClass: string, responsive: ResponsiveValue<string>) => string;
  semantic: (config: SemanticClassConfig) => string;
  bem: (config: BEMConfig) => string;
  classNames: (...classes: (string | undefined | null | false)[]) => string;
}

/**
 * Creates a complete utility class builder with all methods
 */
export function createClassBuilder(): UtilityClassBuilder {
  return {
    spacing: buildSpacingClass,
    typography: buildTypographyClass,
    color: buildColorClass,
    button: buildButtonClass,
    input: buildInputClass,
    card: buildCardClass,
    flex: buildFlexClass,
    grid: buildGridClass,
    state: buildStateClasses,
    theme: buildThemeClasses,
    a11y: buildA11yClasses,
    responsive: buildResponsiveClass,
    semantic: buildSemanticClass,
    bem,
    classNames
  };
}