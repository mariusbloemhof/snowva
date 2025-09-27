/**
 * Status Color System
 * 
 * Snowva Business Hub - Centralized Design System
 * Status color utilities with contrast validation
 * 
 * Provides accessible color combinations for status indicators
 */


/* ========================================
   COLOR CONTRAST UTILITIES
   ======================================== */

/**
 * Converts hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculates relative luminance for WCAG contrast ratio
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculates WCAG contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 1;
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Validates if color combination meets WCAG standards
 */
export function validateColorContrast(
  foreground: string, 
  background: string, 
  level: 'AA' | 'AAA' = 'AA',
  textSize: 'normal' | 'large' = 'normal'
): {
  ratio: number;
  passes: boolean;
  level: 'AA' | 'AAA';
  recommendation?: string;
} {
  const ratio = getContrastRatio(foreground, background);
  
  const requirements = {
    'AA': textSize === 'large' ? 3.0 : 4.5,
    'AAA': textSize === 'large' ? 4.5 : 7.0
  };
  
  const passes = ratio >= requirements[level];
  
  return {
    ratio,
    passes,
    level,
    recommendation: !passes ? 
      `Contrast ratio ${ratio.toFixed(2)} is below ${level} requirement of ${requirements[level]}. Consider adjusting colors.` : 
      undefined
  };
}

/* ========================================
   STATUS COLOR DEFINITIONS
   ======================================== */

export interface StatusColorScheme {
  name: string;
  colors: {
    text: string;
    background: string;
    border: string;
    textHover?: string;
    backgroundHover?: string;
    borderHover?: string;
  };
  contrast: {
    textBg: number;
    textBorder: number;
    passes: boolean;
  };
}

/**
 * Core status color schemes with accessibility validation
 */
export const STATUS_COLOR_SCHEMES: Record<string, StatusColorScheme> = {
  // Document Status Colors
  draft: {
    name: 'Draft',
    colors: {
      text: '#374151', // gray-700
      background: '#f3f4f6', // gray-100
      border: '#d1d5db', // gray-300
      textHover: '#111827', // gray-900
      backgroundHover: '#e5e7eb', // gray-200
      borderHover: '#9ca3af' // gray-400
    },
    contrast: {
      textBg: getContrastRatio('#374151', '#f3f4f6'),
      textBorder: getContrastRatio('#374151', '#d1d5db'),
      passes: true
    }
  },
  
  finalized: {
    name: 'Finalized',
    colors: {
      text: '#1d4ed8', // blue-700
      background: '#dbeafe', // blue-100
      border: '#93c5fd', // blue-300
      textHover: '#1e3a8a', // blue-800
      backgroundHover: '#bfdbfe', // blue-200
      borderHover: '#60a5fa' // blue-400
    },
    contrast: {
      textBg: getContrastRatio('#1d4ed8', '#dbeafe'),
      textBorder: getContrastRatio('#1d4ed8', '#93c5fd'),
      passes: true
    }
  },
  
  'partially-paid': {
    name: 'Partially Paid',
    colors: {
      text: '#b45309', // amber-700
      background: '#fef3c7', // amber-100
      border: '#fcd34d', // amber-300
      textHover: '#92400e', // amber-800
      backgroundHover: '#fde68a', // amber-200
      borderHover: '#f59e0b' // amber-400
    },
    contrast: {
      textBg: getContrastRatio('#b45309', '#fef3c7'),
      textBorder: getContrastRatio('#b45309', '#fcd34d'),
      passes: true
    }
  },
  
  paid: {
    name: 'Paid',
    colors: {
      text: '#15803d', // green-700
      background: '#dcfce7', // green-100
      border: '#86efac', // green-300
      textHover: '#166534', // green-800
      backgroundHover: '#bbf7d0', // green-200
      borderHover: '#4ade80' // green-400
    },
    contrast: {
      textBg: getContrastRatio('#15803d', '#dcfce7'),
      textBorder: getContrastRatio('#15803d', '#86efac'),
      passes: true
    }
  },
  
  overdue: {
    name: 'Overdue',
    colors: {
      text: '#b91c1c', // red-700
      background: '#fee2e2', // red-100
      border: '#fca5a5', // red-300
      textHover: '#991b1b', // red-800
      backgroundHover: '#fecaca', // red-200
      borderHover: '#f87171' // red-400
    },
    contrast: {
      textBg: getContrastRatio('#b91c1c', '#fee2e2'),
      textBorder: getContrastRatio('#b91c1c', '#fca5a5'),
      passes: true
    }
  },
  
  void: {
    name: 'Void',
    colors: {
      text: '#4b5563', // gray-600
      background: '#f3f4f6', // gray-100
      border: '#d1d5db', // gray-300
      textHover: '#374151', // gray-700
      backgroundHover: '#e5e7eb', // gray-200
      borderHover: '#9ca3af' // gray-400
    },
    contrast: {
      textBg: getContrastRatio('#4b5563', '#f3f4f6'),
      textBorder: getContrastRatio('#4b5563', '#d1d5db'),
      passes: true
    }
  },

  // Priority Status Colors
  'priority-low': {
    name: 'Low Priority',
    colors: {
      text: '#4b5563', // gray-600
      background: '#f3f4f6', // gray-100
      border: '#d1d5db', // gray-300
    },
    contrast: {
      textBg: getContrastRatio('#4b5563', '#f3f4f6'),
      textBorder: getContrastRatio('#4b5563', '#d1d5db'),
      passes: true
    }
  },
  
  'priority-medium': {
    name: 'Medium Priority',
    colors: {
      text: '#1d4ed8', // blue-700
      background: '#dbeafe', // blue-100
      border: '#93c5fd', // blue-300
    },
    contrast: {
      textBg: getContrastRatio('#1d4ed8', '#dbeafe'),
      textBorder: getContrastRatio('#1d4ed8', '#93c5fd'),
      passes: true
    }
  },
  
  'priority-high': {
    name: 'High Priority',
    colors: {
      text: '#b45309', // amber-700
      background: '#fef3c7', // amber-100
      border: '#fcd34d', // amber-300
    },
    contrast: {
      textBg: getContrastRatio('#b45309', '#fef3c7'),
      textBorder: getContrastRatio('#b45309', '#fcd34d'),
      passes: true
    }
  },
  
  'priority-urgent': {
    name: 'Urgent Priority',
    colors: {
      text: '#b91c1c', // red-700
      background: '#fee2e2', // red-100
      border: '#fca5a5', // red-300
    },
    contrast: {
      textBg: getContrastRatio('#b91c1c', '#fee2e2'),
      textBorder: getContrastRatio('#b91c1c', '#fca5a5'),
      passes: true
    }
  },

  // Processing Status Colors
  processing: {
    name: 'Processing',
    colors: {
      text: '#1d4ed8', // blue-700
      background: '#dbeafe', // blue-100
      border: '#93c5fd', // blue-300
    },
    contrast: {
      textBg: getContrastRatio('#1d4ed8', '#dbeafe'),
      textBorder: getContrastRatio('#1d4ed8', '#93c5fd'),
      passes: true
    }
  },
  
  completed: {
    name: 'Completed',
    colors: {
      text: '#15803d', // green-700
      background: '#dcfce7', // green-100
      border: '#86efac', // green-300
    },
    contrast: {
      textBg: getContrastRatio('#15803d', '#dcfce7'),
      textBorder: getContrastRatio('#15803d', '#86efac'),
      passes: true
    }
  },
  
  error: {
    name: 'Error',
    colors: {
      text: '#b91c1c', // red-700
      background: '#fee2e2', // red-100
      border: '#fca5a5', // red-300
    },
    contrast: {
      textBg: getContrastRatio('#b91c1c', '#fee2e2'),
      textBorder: getContrastRatio('#b91c1c', '#fca5a5'),
      passes: true
    }
  }
};

/* ========================================
   STATUS COLOR UTILITIES
   ======================================== */

/**
 * Gets color scheme for a specific status
 */
export function getStatusColorScheme(status: string): StatusColorScheme | null {
  return STATUS_COLOR_SCHEMES[status] || null;
}

/**
 * Gets CSS custom properties for a status color scheme
 */
export function getStatusCSSProperties(status: string): Record<string, string> {
  const scheme = getStatusColorScheme(status);
  if (!scheme) return {};
  
  return {
    [`--status-${status}-text`]: scheme.colors.text,
    [`--status-${status}-bg`]: scheme.colors.background,
    [`--status-${status}-border`]: scheme.colors.border,
    [`--status-${status}-text-hover`]: scheme.colors.textHover || scheme.colors.text,
    [`--status-${status}-bg-hover`]: scheme.colors.backgroundHover || scheme.colors.background,
    [`--status-${status}-border-hover`]: scheme.colors.borderHover || scheme.colors.border,
  };
}

/**
 * Generates inline styles for status elements
 */
export function getStatusInlineStyles(status: string): React.CSSProperties {
  const scheme = getStatusColorScheme(status);
  if (!scheme) return {};
  
  return {
    color: scheme.colors.text,
    backgroundColor: scheme.colors.background,
    borderColor: scheme.colors.border,
  };
}

/**
 * Validates all status color schemes for accessibility
 */
export function validateAllStatusColors(): {
  passed: StatusColorScheme[];
  failed: Array<StatusColorScheme & { issues: string[] }>;
  summary: {
    total: number;
    passed: number;
    failed: number;
    passRate: number;
  };
} {
  const passed: StatusColorScheme[] = [];
  const failed: Array<StatusColorScheme & { issues: string[] }> = [];
  
  Object.values(STATUS_COLOR_SCHEMES).forEach(scheme => {
    const issues: string[] = [];
    
    // Check text/background contrast
    const textBgValidation = validateColorContrast(
      scheme.colors.text, 
      scheme.colors.background, 
      'AA', 
      'normal'
    );
    
    if (!textBgValidation.passes) {
      issues.push(`Text/background contrast: ${textBgValidation.recommendation}`);
    }
    
    // Check text/border contrast
    const textBorderValidation = validateColorContrast(
      scheme.colors.text, 
      scheme.colors.border, 
      'AA', 
      'normal'
    );
    
    if (!textBorderValidation.passes) {
      issues.push(`Text/border contrast: ${textBorderValidation.recommendation}`);
    }
    
    if (issues.length === 0) {
      passed.push(scheme);
    } else {
      failed.push({ ...scheme, issues });
    }
  });
  
  const total = Object.keys(STATUS_COLOR_SCHEMES).length;
  
  return {
    passed,
    failed,
    summary: {
      total,
      passed: passed.length,
      failed: failed.length,
      passRate: (passed.length / total) * 100
    }
  };
}

/* ========================================
   THEME-AWARE STATUS COLORS
   ======================================== */

export interface ThemeStatusColors {
  light: StatusColorScheme;
  dark: StatusColorScheme;
}

/**
 * Gets theme-aware status colors (light/dark mode variants)
 */
export function getThemeStatusColors(status: string): ThemeStatusColors | null {
  const baseScheme = getStatusColorScheme(status);
  if (!baseScheme) return null;
  
  // For now, return the same scheme for both themes
  // This can be expanded to have different colors for dark theme
  return {
    light: baseScheme,
    dark: {
      ...baseScheme,
      name: `${baseScheme.name} (Dark)`,
      colors: {
        ...baseScheme.colors,
        // Adjust colors for dark theme - darker backgrounds, lighter text
        text: adjustColorForDarkTheme(baseScheme.colors.text),
        background: adjustColorForDarkTheme(baseScheme.colors.background, true),
        border: adjustColorForDarkTheme(baseScheme.colors.border),
      }
    }
  };
}

/**
 * Adjusts color brightness for dark theme compatibility
 */
function adjustColorForDarkTheme(color: string, isBackground = false): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  if (isBackground) {
    // Make backgrounds darker
    const factor = 0.3;
    return `rgb(${Math.round(rgb.r * factor)}, ${Math.round(rgb.g * factor)}, ${Math.round(rgb.b * factor)})`;
  } else {
    // Make text colors lighter
    const factor = 1.5;
    return `rgb(${Math.min(255, Math.round(rgb.r * factor))}, ${Math.min(255, Math.round(rgb.g * factor))}, ${Math.min(255, Math.round(rgb.b * factor))})`;
  }
}

/* ========================================
   STATUS COLOR GENERATION UTILITIES
   ======================================== */

/**
 * Generates CSS custom properties for all status colors
 */
export function generateStatusColorCSS(): string {
  let css = '/* Status Color System - Generated CSS Custom Properties */\n\n:root {\n';
  
  Object.entries(STATUS_COLOR_SCHEMES).forEach(([status, scheme]) => {
    const properties = getStatusCSSProperties(status);
    Object.entries(properties).forEach(([property, value]) => {
      css += `  ${property}: ${value};\n`;
    });
  });
  
  css += '}\n\n';
  
  // Add dark theme overrides
  css += '@media (prefers-color-scheme: dark) {\n  :root {\n';
  Object.entries(STATUS_COLOR_SCHEMES).forEach(([status]) => {
    const themeColors = getThemeStatusColors(status);
    if (themeColors) {
      css += `    --status-${status}-text: ${themeColors.dark.colors.text};\n`;
      css += `    --status-${status}-bg: ${themeColors.dark.colors.background};\n`;
      css += `    --status-${status}-border: ${themeColors.dark.colors.border};\n`;
    }
  });
  css += '  }\n}\n';
  
  return css;
}

/**
 * Generates TypeScript type definitions for status colors
 */
export function generateStatusColorTypes(): string {
  const statusNames = Object.keys(STATUS_COLOR_SCHEMES);
  
  return `
// Generated Status Color Types
export type StatusColorName = ${statusNames.map(name => `'${name}'`).join(' | ')};

export interface StatusColorScheme {
  name: string;
  colors: {
    text: string;
    background: string;
    border: string;
    textHover?: string;
    backgroundHover?: string;
    borderHover?: string;
  };
  contrast: {
    textBg: number;
    textBorder: number;
    passes: boolean;
  };
}
`;
}

/* ========================================
   EXPORT ALL COLOR UTILITIES
   ======================================== */

export default {
  getContrastRatio,
  validateColorContrast,
  getStatusColorScheme,
  getStatusCSSProperties,
  getStatusInlineStyles,
  validateAllStatusColors,
  getThemeStatusColors,
  generateStatusColorCSS,
  generateStatusColorTypes,
  STATUS_COLOR_SCHEMES
};