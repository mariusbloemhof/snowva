/**
 * Design Token Validation Utilities
 * 
 * Snowva Business Hub - Centralized Design System
 * Validates design tokens and provides type-safe access
 * 
 * Ensures token consistency and catches misconfigurations
 */

import type {
    TokenValidationError,
    TokenValidationResult
} from './types';

/* ========================================
   COLOR VALIDATION
   ======================================== */

/**
 * Validates if a string is a valid CSS color value
 */
export function isValidColor(value: string): boolean {
  if (!value) return false;
  
  // CSS named colors, hex, rgb, rgba, hsl, hsla, var() functions
  const colorPatterns = [
    /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{8})$/, // Hex
    /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/, // RGB
    /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(0|1|0?\.\d+)\s*\)$/, // RGBA
    /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/, // HSL
    /^hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*(0|1|0?\.\d+)\s*\)$/, // HSLA
    /^var\(--[\w-]+\)$/, // CSS Custom Properties
    /^transparent$/, // CSS keyword
    /^currentColor$/i, // CSS keyword
  ];
  
  return colorPatterns.some(pattern => pattern.test(value.trim()));
}

/**
 * Validates color scale completeness (50-950 + special values)
 */
export function validateColorScale(scale: any, scaleName: string): TokenValidationError[] {
  const errors: TokenValidationError[] = [];
  const requiredSteps = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
  
  if (!scale || typeof scale !== 'object') {
    errors.push({
      token: `colors.${scaleName}`,
      value: typeof scale,
      expected: 'object with color scale',
      message: `Color scale ${scaleName} must be an object`
    });
    return errors;
  }
  
  requiredSteps.forEach(step => {
    if (!scale[step]) {
      errors.push({
        token: `colors.${scaleName}.${step}`,
        value: scale[step],
        expected: 'valid CSS color',
        message: `Missing color value for ${scaleName}-${step}`
      });
    } else if (!isValidColor(scale[step])) {
      errors.push({
        token: `colors.${scaleName}.${step}`,
        value: scale[step],
        expected: 'valid CSS color',
        message: `Invalid color value for ${scaleName}-${step}: ${scale[step]}`
      });
    }
  });
  
  return errors;
}

/**
 * Validates complete color token structure
 */
export function validateColorTokens(colors: any): TokenValidationError[] {
  const errors: TokenValidationError[] = [];
  
  if (!colors || typeof colors !== 'object') {
    errors.push({
      token: 'colors',
      value: typeof colors,
      expected: 'object',
      message: 'Colors must be an object'
    });
    return errors;
  }
  
  // Validate color scales
  const requiredScales = ['gray', 'red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'purple', 'pink'];
  const brandScales = ['primary', 'secondary', 'accent'];
  const semanticScales = ['success', 'warning', 'error', 'info'];
  
  [...requiredScales, ...brandScales, ...semanticScales].forEach(scaleName => {
    if (!colors[scaleName]) {
      errors.push({
        token: `colors.${scaleName}`,
        value: undefined,
        expected: 'color scale object',
        message: `Missing required color scale: ${scaleName}`
      });
    } else {
      errors.push(...validateColorScale(colors[scaleName], scaleName));
    }
  });
  
  // Validate special colors
  const specialColors = ['white', 'black', 'transparent'];
  specialColors.forEach(colorName => {
    if (!colors[colorName]) {
      errors.push({
        token: `colors.${colorName}`,
        value: colors[colorName],
        expected: 'valid CSS color',
        message: `Missing special color: ${colorName}`
      });
    } else if (!isValidColor(colors[colorName])) {
      errors.push({
        token: `colors.${colorName}`,
        value: colors[colorName],
        expected: 'valid CSS color',
        message: `Invalid special color value: ${colorName}`
      });
    }
  });
  
  return errors;
}

/* ========================================
   SPACING VALIDATION
   ======================================== */

/**
 * Validates if a string is a valid CSS length value
 */
export function isValidLength(value: string): boolean {
  if (!value) return false;
  
  const lengthPattern = /^(0|auto|inherit|initial|unset|revert|var\(--[\w-]+\)|\d*\.?\d+(px|rem|em|%|vh|vw|vmin|vmax|ch|ex|lh|rlh|fr))$/;
  return lengthPattern.test(value.trim());
}

/**
 * Validates spacing token structure
 */
export function validateSpacingTokens(spacing: any): TokenValidationError[] {
  const errors: TokenValidationError[] = [];
  
  if (!spacing || typeof spacing !== 'object') {
    errors.push({
      token: 'spacing',
      value: typeof spacing,
      expected: 'object',
      message: 'Spacing must be an object'
    });
    return errors;
  }
  
  // Validate base spacing scale
  const requiredSpacingSteps = ['0', '1', '2', '3', '4', '5', '6', '8', '10', '12', '16', '20', '24', '32', '40', '48', '56', '64'];
  
  requiredSpacingSteps.forEach(step => {
    if (spacing[step] === undefined || spacing[step] === null) {
      errors.push({
        token: `spacing.${step}`,
        value: spacing[step],
        expected: 'valid CSS length',
        message: `Missing spacing value for step ${step}`
      });
    } else if (!isValidLength(spacing[step])) {
      errors.push({
        token: `spacing.${step}`,
        value: spacing[step],
        expected: 'valid CSS length',
        message: `Invalid spacing value for step ${step}: ${spacing[step]}`
      });
    }
  });
  
  return errors;
}

/* ========================================
   TYPOGRAPHY VALIDATION
   ======================================== */

/**
 * Validates font family string
 */
export function isValidFontFamily(value: string): boolean {
  if (!value) return false;
  // Allow font family lists, quoted names, and CSS functions
  return /^[\w\s,"'-]+$|^var\(--[\w-]+\)$/.test(value);
}

/**
 * Validates font weight value
 */
export function isValidFontWeight(value: string): boolean {
  if (!value) return false;
  const validWeights = ['100', '200', '300', '400', '500', '600', '700', '800', '900', 'normal', 'bold', 'lighter', 'bolder'];
  return validWeights.includes(value) || /^var\(--[\w-]+\)$/.test(value);
}

/**
 * Validates line height value
 */
export function isValidLineHeight(value: string): boolean {
  if (!value) return false;
  return /^\d*\.?\d+$|^normal$|^var\(--[\w-]+\)$/.test(value);
}

/**
 * Validates typography token structure
 */
export function validateTypographyTokens(typography: any): TokenValidationError[] {
  const errors: TokenValidationError[] = [];
  
  if (!typography || typeof typography !== 'object') {
    errors.push({
      token: 'typography',
      value: typeof typography,
      expected: 'object',
      message: 'Typography must be an object'
    });
    return errors;
  }
  
  // Validate font families
  const requiredFontFamilies = ['font-family-sans', 'font-family-serif', 'font-family-mono', 'font-family-base'];
  requiredFontFamilies.forEach(fontFamily => {
    if (!typography[fontFamily]) {
      errors.push({
        token: `typography.${fontFamily}`,
        value: typography[fontFamily],
        expected: 'valid font family',
        message: `Missing font family: ${fontFamily}`
      });
    } else if (!isValidFontFamily(typography[fontFamily])) {
      errors.push({
        token: `typography.${fontFamily}`,
        value: typography[fontFamily],
        expected: 'valid font family',
        message: `Invalid font family value: ${fontFamily}`
      });
    }
  });
  
  return errors;
}

/* ========================================
   SHADOW VALIDATION
   ======================================== */

/**
 * Validates CSS shadow value
 */
export function isValidShadow(value: string): boolean {
  if (!value) return false;
  if (value === 'none') return true;
  if (/^var\(--[\w-]+\)$/.test(value)) return true;
  
  // Basic shadow pattern validation
  const shadowPattern = /^(\s*(inset\s+)?(\d+px|\d+rem|\d+em|\d+)\s+(\d+px|\d+rem|\d+em|\d+)\s+(\d+px|\d+rem|\d+em|\d+)?\s*(\d+px|\d+rem|\d+em|\d+)?\s*(#[a-fA-F0-9]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|\w+)\s*,?\s*)*$/;
  return shadowPattern.test(value);
}

/**
 * Validates shadow token structure
 */
export function validateShadowTokens(shadows: any): TokenValidationError[] {
  const errors: TokenValidationError[] = [];
  
  if (!shadows || typeof shadows !== 'object') {
    errors.push({
      token: 'shadows',
      value: typeof shadows,
      expected: 'object',
      message: 'Shadows must be an object'
    });
    return errors;
  }
  
  // Validate each shadow value
  Object.entries(shadows).forEach(([key, value]) => {
    if (typeof value === 'string' && !isValidShadow(value)) {
      errors.push({
        token: `shadows.${key}`,
        value: value,
        expected: 'valid CSS shadow',
        message: `Invalid shadow value for ${key}: ${value}`
      });
    }
  });
  
  return errors;
}

/* ========================================
   BORDER VALIDATION
   ======================================== */

/**
 * Validates CSS border value
 */
export function isValidBorder(value: string): boolean {
  if (!value) return false;
  if (value === 'none' || value === 'inherit' || value === 'initial') return true;
  if (/^var\(--[\w-]+\)$/.test(value)) return true;
  
  // Basic border pattern validation
  const borderPattern = /^(\d+px|\d+rem|\d+em|\d+|thin|medium|thick)?\s*(solid|dashed|dotted|double|groove|ridge|inset|outset|none)?\s*(#[a-fA-F0-9]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|\w+|transparent)?$/;
  return borderPattern.test(value.trim());
}

/**
 * Validates border radius value
 */
export function isValidBorderRadius(value: string): boolean {
  if (!value) return false;
  return isValidLength(value) || /^\d+px\s+\d+px(\s+\d+px(\s+\d+px)?)?$/.test(value);
}

/**
 * Validates border token structure
 */
export function validateBorderTokens(borders: any): TokenValidationError[] {
  const errors: TokenValidationError[] = [];
  
  if (!borders || typeof borders !== 'object') {
    errors.push({
      token: 'borders',
      value: typeof borders,
      expected: 'object',
      message: 'Borders must be an object'
    });
    return errors;
  }
  
  // Validate border radius values
  Object.entries(borders).forEach(([key, value]) => {
    if (typeof value === 'string') {
      if (key.includes('radius') && !isValidBorderRadius(value)) {
        errors.push({
          token: `borders.${key}`,
          value: value,
          expected: 'valid CSS border-radius',
          message: `Invalid border radius value for ${key}: ${value}`
        });
      } else if (!key.includes('radius') && !key.includes('width') && !key.includes('style') && !isValidBorder(value)) {
        errors.push({
          token: `borders.${key}`,
          value: value,
          expected: 'valid CSS border',
          message: `Invalid border value for ${key}: ${value}`
        });
      }
    }
  });
  
  return errors;
}

/* ========================================
   TRANSITION VALIDATION
   ======================================== */

/**
 * Validates CSS transition value
 */
export function isValidTransition(value: string): boolean {
  if (!value) return false;
  if (value === 'none' || value === 'all' || value === 'inherit' || value === 'initial') return true;
  if (/^var\(--[\w-]+\)$/.test(value)) return true;
  
  // Basic transition pattern validation
  const transitionPattern = /^[\w-]+\s+\d+m?s\s+(linear|ease|ease-in|ease-out|ease-in-out|cubic-bezier\([^)]+\))(\s*,\s*[\w-]+\s+\d+m?s\s+(linear|ease|ease-in|ease-out|ease-in-out|cubic-bezier\([^)]+\)))*$/;
  return transitionPattern.test(value);
}

/**
 * Validates transition token structure
 */
export function validateTransitionTokens(transitions: any): TokenValidationError[] {
  const errors: TokenValidationError[] = [];
  
  if (!transitions || typeof transitions !== 'object') {
    errors.push({
      token: 'transitions',
      value: typeof transitions,
      expected: 'object',
      message: 'Transitions must be an object'
    });
    return errors;
  }
  
  // Validate transition values
  Object.entries(transitions).forEach(([key, value]) => {
    if (typeof value === 'string' && !key.includes('duration') && !key.includes('easing') && !isValidTransition(value)) {
      errors.push({
        token: `transitions.${key}`,
        value: value,
        expected: 'valid CSS transition',
        message: `Invalid transition value for ${key}: ${value}`
      });
    }
  });
  
  return errors;
}

/* ========================================
   COMPLETE TOKEN VALIDATION
   ======================================== */

/**
 * Validates complete design token structure
 */
export function validateDesignTokens(tokens: any): TokenValidationResult {
  const errors: TokenValidationError[] = [];
  const warnings: string[] = [];
  
  if (!tokens || typeof tokens !== 'object') {
    return {
      isValid: false,
      errors: [{
        token: 'root',
        value: typeof tokens,
        expected: 'object',
        message: 'Design tokens must be an object'
      }],
      warnings: []
    };
  }
  
  // Validate each token category
  if (tokens.colors) {
    errors.push(...validateColorTokens(tokens.colors));
  } else {
    warnings.push('Missing color tokens');
  }
  
  if (tokens.spacing) {
    errors.push(...validateSpacingTokens(tokens.spacing));
  } else {
    warnings.push('Missing spacing tokens');
  }
  
  if (tokens.typography) {
    errors.push(...validateTypographyTokens(tokens.typography));
  } else {
    warnings.push('Missing typography tokens');
  }
  
  if (tokens.shadows) {
    errors.push(...validateShadowTokens(tokens.shadows));
  } else {
    warnings.push('Missing shadow tokens');
  }
  
  if (tokens.borders) {
    errors.push(...validateBorderTokens(tokens.borders));
  } else {
    warnings.push('Missing border tokens');
  }
  
  if (tokens.transitions) {
    errors.push(...validateTransitionTokens(tokens.transitions));
  } else {
    warnings.push('Missing transition tokens');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/* ========================================
   THEME VALIDATION
   ======================================== */

/**
 * Validates theme configuration
 */
export function validateThemeConfig(theme: any): TokenValidationError[] {
  const errors: TokenValidationError[] = [];
  
  if (!theme || typeof theme !== 'object') {
    errors.push({
      token: 'theme',
      value: typeof theme,
      expected: 'object',
      message: 'Theme configuration must be an object'
    });
    return errors;
  }
  
  // Validate required properties
  if (!theme.name) {
    errors.push({
      token: 'theme.name',
      value: theme.name,
      expected: 'string',
      message: 'Theme must have a name'
    });
  }
  
  if (!theme.displayName) {
    errors.push({
      token: 'theme.displayName',
      value: theme.displayName,
      expected: 'string',
      message: 'Theme must have a display name'
    });
  }
  
  if (!theme.colors || typeof theme.colors !== 'object') {
    errors.push({
      token: 'theme.colors',
      value: typeof theme.colors,
      expected: 'object',
      message: 'Theme must include color overrides'
    });
  }
  
  return errors;
}

/* ========================================
   CSS CUSTOM PROPERTY VALIDATION
   ======================================== */

/**
 * Validates CSS custom properties object
 */
export function validateCSSCustomProperties(properties: any): TokenValidationError[] {
  const errors: TokenValidationError[] = [];
  
  if (!properties || typeof properties !== 'object') {
    errors.push({
      token: 'css-properties',
      value: typeof properties,
      expected: 'object',
      message: 'CSS custom properties must be an object'
    });
    return errors;
  }
  
  Object.entries(properties).forEach(([key, value]) => {
    if (!key.startsWith('--')) {
      errors.push({
        token: key,
        value: key,
        expected: '--prefixed-name',
        message: `CSS custom property names must start with --: ${key}`
      });
    }
    
    if (typeof value !== 'string') {
      errors.push({
        token: key,
        value: typeof value,
        expected: 'string',
        message: `CSS custom property values must be strings: ${key}`
      });
    }
  });
  
  return errors;
}

/* ========================================
   UTILITY FUNCTIONS
   ======================================== */

/**
 * Checks if running in development mode for enhanced validation
 */
export function isDevelopmentMode(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Logs validation errors to console in development
 */
export function logValidationErrors(result: TokenValidationResult, context: string = ''): void {
  if (!isDevelopmentMode()) return;
  
  const prefix = context ? `[${context}] ` : '';
  
  if (result.errors.length > 0) {
    console.group(`${prefix}Design Token Validation Errors`);
    result.errors.forEach(error => {
      console.error(`Token: ${error.token}`, {
        value: error.value,
        expected: error.expected,
        message: error.message
      });
    });
    console.groupEnd();
  }
  
  if (result.warnings.length > 0) {
    console.group(`${prefix}Design Token Validation Warnings`);
    result.warnings.forEach(warning => {
      console.warn(warning);
    });
    console.groupEnd();
  }
  
  if (result.isValid && result.warnings.length === 0) {
    console.log(`${prefix}✅ Design tokens validation passed`);
  }
}

/**
 * Creates a validation error object
 */
export function createValidationError(
  token: string,
  value: string | undefined,
  expected: string,
  message?: string
): TokenValidationError {
  return {
    token,
    value,
    expected,
    message: message || `Expected ${expected} for ${token}, got ${value}`
  };
}