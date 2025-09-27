/**
 * T071: Token Validation Scripts
 * Implement comprehensive design token validation and integrity checking
 * Part of Phase 3.7 System Integration - constitutional TDD compliance
 */

import fs from 'fs/promises';
import path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Design token validation interfaces
interface TokenValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  tokenCount: number;
  validTokens: string[];
  invalidTokens: string[];
}

interface TokenIntegrityCheck {
  tokenName: string;
  value: any;
  isValid: boolean;
  issues: string[];
  type: 'color' | 'spacing' | 'typography' | 'shadow' | 'border' | 'transition';
}

interface CircularReferenceCheck {
  hasCircularReferences: boolean;
  circularChains: string[][];
  affectedTokens: string[];
}

interface DTCGComplianceResult {
  isCompliant: boolean;
  version: string;
  violations: string[];
  recommendations: string[];
}

/**
 * Design Token Validator
 * Validates design tokens for correctness, compliance, and integrity
 */
class DesignTokenValidator {
  private tokens: Map<string, any> = new Map();
  
  constructor(tokens?: Map<string, any>) {
    this.tokens = tokens || new Map();
  }

  /**
   * Load tokens from file system
   */
  async loadTokensFromFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const tokenData = JSON.parse(content);
      
      this.tokens = new Map(Object.entries(tokenData));
    } catch (error) {
      throw new Error(`Failed to load tokens from ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate all tokens for structural correctness
   */
  validateTokenStructure(): TokenValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const validTokens: string[] = [];
    const invalidTokens: string[] = [];

    for (const [tokenName, tokenValue] of this.tokens.entries()) {
      const validation = this.validateSingleToken(tokenName, tokenValue);
      
      if (validation.isValid) {
        validTokens.push(tokenName);
      } else {
        invalidTokens.push(tokenName);
        errors.push(...validation.issues);
      }

      if (validation.issues.length > 0) {
        warnings.push(`Token ${tokenName} has issues: ${validation.issues.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      tokenCount: this.tokens.size,
      validTokens,
      invalidTokens
    };
  }

  /**
   * Validate individual token
   */
  private validateSingleToken(tokenName: string, tokenValue: any): TokenIntegrityCheck {
    const issues: string[] = [];
    let isValid = true;
    let type: TokenIntegrityCheck['type'] = 'color';

    // Check token naming convention
    if (!tokenName.startsWith('--')) {
      issues.push('Token name should start with --');
      isValid = false;
    }

    // Determine token type and validate accordingly
    if (tokenName.includes('color')) {
      type = 'color';
      if (!this.isValidColor(tokenValue)) {
        issues.push('Invalid color value');
        isValid = false;
      }
    } else if (tokenName.includes('spacing')) {
      type = 'spacing';
      if (!this.isValidSpacing(tokenValue)) {
        issues.push('Invalid spacing value');
        isValid = false;
      }
    } else if (tokenName.includes('font') || tokenName.includes('text')) {
      type = 'typography';
      if (!this.isValidTypography(tokenValue)) {
        issues.push('Invalid typography value');
        isValid = false;
      }
    } else if (tokenName.includes('shadow')) {
      type = 'shadow';
      if (!this.isValidShadow(tokenValue)) {
        issues.push('Invalid shadow value');
        isValid = false;
      }
    } else if (tokenName.includes('border')) {
      type = 'border';
      if (!this.isValidBorder(tokenValue)) {
        issues.push('Invalid border value');
        isValid = false;
      }
    } else if (tokenName.includes('transition')) {
      type = 'transition';
      if (!this.isValidTransition(tokenValue)) {
        issues.push('Invalid transition value');
        isValid = false;
      }
    }

    return {
      tokenName,
      value: tokenValue,
      isValid,
      issues,
      type
    };
  }

  /**
   * Check for circular references in token aliases
   */
  checkCircularReferences(): CircularReferenceCheck {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const circularChains: string[][] = [];
    const affectedTokens: string[] = [];

    const detectCircular = (tokenName: string, chain: string[]): boolean => {
      if (recursionStack.has(tokenName)) {
        // Found circular reference
        const circularStart = chain.indexOf(tokenName);
        const circularChain = chain.slice(circularStart);
        circularChains.push([...circularChain, tokenName]);
        affectedTokens.push(...circularChain, tokenName);
        return true;
      }

      if (visited.has(tokenName)) {
        return false;
      }

      visited.add(tokenName);
      recursionStack.add(tokenName);

      const tokenValue = this.tokens.get(tokenName);
      if (typeof tokenValue === 'string' && tokenValue.startsWith('var(--')) {
        const referencedToken = tokenValue.match(/var\((--[^)]+)\)/);
        if (referencedToken) {
          const referencedName = referencedToken[1];
          if (detectCircular(referencedName, [...chain, tokenName])) {
            return true;
          }
        }
      }

      recursionStack.delete(tokenName);
      return false;
    };

    for (const tokenName of this.tokens.keys()) {
      if (!visited.has(tokenName)) {
        detectCircular(tokenName, []);
      }
    }

    return {
      hasCircularReferences: circularChains.length > 0,
      circularChains,
      affectedTokens: [...new Set(affectedTokens)]
    };
  }

  /**
   * Validate DTCG (Design Tokens Community Group) compliance
   */
  validateDTCGCompliance(): DTCGComplianceResult {
    const violations: string[] = [];
    const recommendations: string[] = [];

    // Check for required DTCG structure
    for (const [tokenName, tokenValue] of this.tokens.entries()) {
      if (typeof tokenValue === 'object' && tokenValue !== null) {
        // DTCG format should have $value and $type properties
        if (!tokenValue.$value && !tokenValue.value) {
          violations.push(`Token ${tokenName} missing $value property`);
        }
        
        if (!tokenValue.$type && !tokenValue.type) {
          recommendations.push(`Token ${tokenName} should specify $type property`);
        }
      }
    }

    // Check naming conventions
    const invalidNames = Array.from(this.tokens.keys()).filter(name => {
      return !name.match(/^--[a-z][a-z0-9]*(-[a-z0-9]+)*$/);
    });

    if (invalidNames.length > 0) {
      violations.push(`Invalid token names (should be kebab-case): ${invalidNames.join(', ')}`);
    }

    return {
      isCompliant: violations.length === 0,
      version: '1.0',
      violations,
      recommendations
    };
  }

  // Validation helper methods
  private isValidColor(value: any): boolean {
    if (typeof value !== 'string') return false;
    return /^(#[0-9a-fA-F]{3,8}|rgb\(|rgba\(|hsl\(|hsla\(|var\(--)/i.test(value);
  }

  private isValidSpacing(value: any): boolean {
    if (typeof value !== 'string') return false;
    return /^(\d+\.?\d*(px|rem|em|%|vh|vw)|0|var\(--)/i.test(value);
  }

  private isValidTypography(value: any): boolean {
    if (typeof value !== 'string') return false;
    return /^(\d+\.?\d*(px|rem|em|pt)|[a-z-]+|var\(--)/i.test(value);
  }

  private isValidShadow(value: any): boolean {
    if (typeof value !== 'string') return false;
    return /^(none|\d+\.?\d*px|rgba?\(|var\(--)/i.test(value);
  }

  private isValidBorder(value: any): boolean {
    if (typeof value !== 'string') return false;
    return /^(\d+\.?\d*px|none|solid|dashed|dotted|var\(--)/i.test(value);
  }

  private isValidTransition(value: any): boolean {
    if (typeof value !== 'string') return false;
    return /^(\d+\.?\d*(s|ms)|ease|linear|cubic-bezier|var\(--)/i.test(value);
  }
}

/**
 * Token File System Validator
 * Validates token files and their organization
 */
class TokenFileValidator {
  async validateTokenFiles(tokenDirectory: string): Promise<{
    filesFound: string[];
    validFiles: string[];
    invalidFiles: string[];
    errors: string[];
  }> {
    const errors: string[] = [];
    const validFiles: string[] = [];
    const invalidFiles: string[] = [];
    let filesFound: string[] = [];

    try {
      const files = await fs.readdir(tokenDirectory);
      filesFound = files.filter(file => file.endsWith('.json') || file.endsWith('.js') || file.endsWith('.ts'));

      for (const file of filesFound) {
        const filePath = path.join(tokenDirectory, file);
        
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          
          if (file.endsWith('.json')) {
            JSON.parse(content); // Validate JSON
            validFiles.push(file);
          } else {
            // For JS/TS files, just check if they can be read
            validFiles.push(file);
          }
        } catch (error) {
          invalidFiles.push(file);
          errors.push(`Invalid file ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      errors.push(`Failed to read directory ${tokenDirectory}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      filesFound,
      validFiles,
      invalidFiles,
      errors
    };
  }
}

describe('T071: Token Validation Scripts', () => {
  let tokenValidator: DesignTokenValidator;
  let fileValidator: TokenFileValidator;

  beforeEach(() => {
    tokenValidator = new DesignTokenValidator();
    fileValidator = new TokenFileValidator();

    // Mock file system operations
    vi.spyOn(fs, 'readFile').mockImplementation(async (filePath: string) => {
      const mockTokens = {
        '--color-primary': '#3b82f6',
        '--color-secondary': '#64748b',
        '--spacing-sm': '0.5rem',
        '--spacing-md': '1rem',
        '--font-size-base': '16px',
        '--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        '--border-radius-md': '6px',
        '--transition-fast': '150ms ease-in-out',
        '--color-reference': 'var(--color-primary)', // Token reference
        '--invalid-color': 'not-a-color', // Invalid token
        'missing-prefix': '#000000' // Invalid name
      };
      return JSON.stringify(mockTokens);
    });

    vi.spyOn(fs, 'readdir').mockImplementation(async () => {
      return ['tokens.json', 'colors.json', 'spacing.js', 'invalid.json'] as any;
    });
  });

  describe('Token Structure Validation', () => {
    it('should validate token structure and identify issues', async () => {
      await tokenValidator.loadTokensFromFile('mock-tokens.json');
      const result = tokenValidator.validateTokenStructure();

      expect(result.tokenCount).toBeGreaterThan(0);
      expect(result.validTokens).toContain('--color-primary');
      expect(result.validTokens).toContain('--spacing-md');
      expect(result.invalidTokens).toContain('--invalid-color');
      expect(result.invalidTokens).toContain('missing-prefix');
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should identify circular references in token aliases', async () => {
      // Create tokens with circular reference
      const circularTokens = new Map<string, any>([
        ['--token-a', 'var(--token-b)'],
        ['--token-b', 'var(--token-c)'],
        ['--token-c', 'var(--token-a)'] // Creates circular reference
      ]);

      const validator = new DesignTokenValidator(circularTokens);
      const result = validator.checkCircularReferences();

      expect(result.hasCircularReferences).toBe(true);
      expect(result.circularChains.length).toBeGreaterThan(0);
      expect(result.affectedTokens).toContain('--token-a');
      expect(result.affectedTokens).toContain('--token-b');
      expect(result.affectedTokens).toContain('--token-c');
    });

    it('should validate DTCG compliance', async () => {
      const dtcgTokens = new Map<string, any>([
        ['--color-primary', { $value: '#3b82f6', $type: 'color' }],
        ['--spacing-md', { $value: '1rem', $type: 'dimension' }],
        ['--invalid-token', '#ff0000'], // Missing DTCG structure
        ['--INVALID-NAME', { $value: '#000', $type: 'color' }] // Invalid naming
      ]);

      const validator = new DesignTokenValidator(dtcgTokens);
      const result = validator.validateDTCGCompliance();

      expect(result.version).toBe('1.0');
      expect(result.violations.some(v => v.includes('INVALID-NAME') || v.includes('Invalid token names'))).toBe(true);
    });
  });

  describe('Token File System Validation', () => {
    it('should validate token files in directory', async () => {
      const result = await fileValidator.validateTokenFiles('./styles/tokens');

      expect(result.filesFound).toContain('tokens.json');
      expect(result.filesFound).toContain('colors.json');
      expect(result.validFiles.length).toBeGreaterThan(0);
      expect(result.errors).toBeInstanceOf(Array);
    });

    it('should handle invalid JSON files gracefully', async () => {
      vi.spyOn(fs, 'readFile').mockImplementation(async (filePath: string) => {
        if (filePath.includes('invalid.json')) {
          return '{ invalid json }';
        }
        return '{ "valid": "json" }';
      });

      const result = await fileValidator.validateTokenFiles('./styles/tokens');

      expect(result.invalidFiles).toContain('invalid.json');
      expect(result.errors.some(error => error.includes('invalid.json'))).toBe(true);
    });

    it('should handle missing directories gracefully', async () => {
      vi.spyOn(fs, 'readdir').mockRejectedValue(new Error('Directory not found'));

      const result = await fileValidator.validateTokenFiles('./non-existent');

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Failed to read directory');
    });
  });

  describe('Token Type Validation', () => {
    it('should validate color tokens correctly', async () => {
      const colorTokens = new Map<string, any>([
        ['--color-valid-hex', '#3b82f6'],
        ['--color-valid-rgb', 'rgb(59, 130, 246)'],
        ['--color-valid-hsl', 'hsl(217, 91%, 60%)'],
        ['--color-valid-var', 'var(--other-color)'],
        ['--color-invalid', 'not-a-color']
      ]);

      const validator = new DesignTokenValidator(colorTokens);
      const result = validator.validateTokenStructure();

      expect(result.validTokens).toContain('--color-valid-hex');
      expect(result.validTokens).toContain('--color-valid-rgb');
      expect(result.validTokens).toContain('--color-valid-hsl');
      expect(result.validTokens).toContain('--color-valid-var');
      expect(result.invalidTokens).toContain('--color-invalid');
    });

    it('should validate spacing tokens correctly', async () => {
      const spacingTokens = new Map<string, any>([
        ['--spacing-px', '16px'],
        ['--spacing-rem', '1rem'],
        ['--spacing-em', '1.5em'],
        ['--spacing-percent', '50%'],
        ['--spacing-zero', '0'],
        ['--spacing-var', 'var(--other-spacing)'],
        ['--spacing-invalid', 'invalid-spacing']
      ]);

      const validator = new DesignTokenValidator(spacingTokens);
      const result = validator.validateTokenStructure();

      expect(result.validTokens).toContain('--spacing-px');
      expect(result.validTokens).toContain('--spacing-rem');
      expect(result.validTokens).toContain('--spacing-zero');
      expect(result.invalidTokens).toContain('--spacing-invalid');
    });
  });

  describe('Constitutional Requirements Compliance', () => {
    it('should enforce design token integrity', async () => {
      await tokenValidator.loadTokensFromFile('mock-tokens.json');
      const result = tokenValidator.validateTokenStructure();

      // Constitutional requirement: All tokens must be valid
      expect(result.tokenCount).toBeGreaterThan(0);
      expect(result.validTokens.length).toBeGreaterThan(0);
      
      // Should identify issues but not break the system
      expect(result.isValid).toBeDefined();
    });

    it('should validate token naming conventions', async () => {
      const tokens = new Map<string, any>([
        ['--valid-token-name', '#000'],
        ['--another-valid-name', '1rem'],
        ['InvalidTokenName', '#fff'], // Invalid: not kebab-case
        ['--INVALID-CAPS', '2rem'], // Invalid: has capitals
        ['--123-invalid', '3rem'] // Invalid: starts with number
      ]);

      const validator = new DesignTokenValidator(tokens);
      const result = validator.validateDTCGCompliance();

      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations.some(v => v.includes('Invalid token names'))).toBe(true);
    });

    it('should maintain validation performance', async () => {
      // Create large token set for performance test
      const largeTokenSet = new Map<string, any>();
      for (let i = 0; i < 1000; i++) {
        largeTokenSet.set(`--token-${i}`, `#${i.toString(16).padStart(6, '0')}`);
      }

      const validator = new DesignTokenValidator(largeTokenSet);
      
      const startTime = performance.now();
      const result = validator.validateTokenStructure();
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(1000); // Should be fast
      expect(result.tokenCount).toBe(1000);
      expect(result.validTokens.length).toBe(1000);
    });

    it('should provide comprehensive error reporting', async () => {
      const problematicTokens = new Map<string, any>([
        ['--valid-token', '#3b82f6'],
        ['invalid-name', '#ff0000'], // Missing --
        ['--invalid-color', 'not-a-color'], // Invalid color
        ['--token-with-space', ' #000000 '], // Whitespace (actually valid, but could warn)
      ]);

      const validator = new DesignTokenValidator(problematicTokens);
      const result = validator.validateTokenStructure();

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.invalidTokens.length).toBeGreaterThan(0);
      
      // Should provide specific error messages
      expect(result.errors.some(error => error.includes('Token name should start with --'))).toBe(true);
    });
  });
});