/**
 * Design Token Validation Utilities
 * Comprehensive validation and integrity checking for design tokens
 * Constitutional TDD compliance - implements T071 requirements
 */

import fs from 'fs/promises';
import path from 'path';

export interface TokenValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  tokenCount: number;
  validTokens: string[];
  invalidTokens: string[];
}

export interface TokenIntegrityCheck {
  tokenName: string;
  value: any;
  isValid: boolean;
  issues: string[];
  type: 'color' | 'spacing' | 'typography' | 'shadow' | 'border' | 'transition';
}

export interface CircularReferenceCheck {
  hasCircularReferences: boolean;
  circularChains: string[][];
  affectedTokens: string[];
}

export interface DTCGComplianceResult {
  isCompliant: boolean;
  version: string;
  violations: string[];
  recommendations: string[];
}

export interface TokenFileValidationResult {
  filesFound: string[];
  validFiles: string[];
  invalidFiles: string[];
  errors: string[];
}

/**
 * Core Design Token Validator
 * Provides comprehensive validation of design token integrity and compliance
 */
export class DesignTokenValidator {
  private tokens: Map<string, any> = new Map();
  
  constructor(tokens?: Map<string, any>) {
    this.tokens = tokens || new Map();
  }

  /**
   * Load tokens from JSON file
   */
  async loadTokensFromFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const tokenData = JSON.parse(content);
      
      // Handle both flat and nested token structures
      this.tokens = new Map();
      this.flattenTokens(tokenData, '', this.tokens);
    } catch (error) {
      throw new Error(`Failed to load tokens from ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load tokens from CSS file (custom properties)
   */
  async loadTokensFromCSS(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const tokenMatches = content.match(/--[a-zA-Z0-9-]+\s*:\s*[^;]+/g);
      
      this.tokens = new Map();
      
      if (tokenMatches) {
        for (const match of tokenMatches) {
          const [name, value] = match.split(':').map(s => s.trim());
          if (name && value) {
            this.tokens.set(name, value.replace(/;$/, ''));
          }
        }
      }
    } catch (error) {
      throw new Error(`Failed to load CSS tokens from ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Set tokens programmatically
   */
  setTokens(tokens: Map<string, any> | Record<string, any>): void {
    if (tokens instanceof Map) {
      this.tokens = new Map(tokens);
    } else {
      this.tokens = new Map(Object.entries(tokens));
    }
  }

  /**
   * Get all loaded tokens
   */
  getTokens(): Map<string, any> {
    return new Map(this.tokens);
  }

  /**
   * Validate token structure and integrity
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
        warnings.push(`Token ${tokenName}: ${validation.issues.join(', ')}`);
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
        if (circularStart >= 0) {
          const circularChain = chain.slice(circularStart);
          circularChains.push([...circularChain, tokenName]);
          affectedTokens.push(...circularChain, tokenName);
        }
        return true;
      }

      if (visited.has(tokenName)) {
        return false;
      }

      visited.add(tokenName);
      recursionStack.add(tokenName);

      const tokenValue = this.tokens.get(tokenName);
      if (typeof tokenValue === 'string') {
        const references = this.extractTokenReferences(tokenValue);
        for (const referencedToken of references) {
          if (this.tokens.has(referencedToken)) {
            if (detectCircular(referencedToken, [...chain, tokenName])) {
              return true;
            }
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

    // Check token naming conventions (kebab-case with -- prefix)
    const invalidNames: string[] = [];
    for (const tokenName of this.tokens.keys()) {
      if (!this.isValidTokenName(tokenName)) {
        invalidNames.push(tokenName);
      }
    }

    if (invalidNames.length > 0) {
      violations.push(`Invalid token names (should be kebab-case with -- prefix): ${invalidNames.join(', ')}`);
    }

    // Check for DTCG structure compliance
    for (const [tokenName, tokenValue] of this.tokens.entries()) {
      if (typeof tokenValue === 'object' && tokenValue !== null) {
        // DTCG format should have $value and optionally $type
        if (!tokenValue.$value && tokenValue.value === undefined) {
          violations.push(`Token ${tokenName} missing $value property for DTCG compliance`);
        }
        
        if (!tokenValue.$type && tokenValue.type === undefined) {
          recommendations.push(`Token ${tokenName} should specify $type property for better DTCG compliance`);
        }
      } else {
        // Simple value format - recommend DTCG structure
        recommendations.push(`Token ${tokenName} could use DTCG format with $value and $type properties`);
      }
    }

    return {
      isCompliant: violations.length === 0,
      version: '1.0',
      violations,
      recommendations
    };
  }

  /**
   * Resolve token value by following references
   */
  resolveTokenValue(tokenName: string, visited: Set<string> = new Set()): any {
    if (visited.has(tokenName)) {
      throw new Error(`Circular reference detected for token: ${tokenName}`);
    }

    const tokenValue = this.tokens.get(tokenName);
    if (tokenValue === undefined) {
      throw new Error(`Token not found: ${tokenName}`);
    }

    if (typeof tokenValue !== 'string') {
      return tokenValue;
    }

    const references = this.extractTokenReferences(tokenValue);
    if (references.length === 0) {
      return tokenValue;
    }

    visited.add(tokenName);
    let resolvedValue = tokenValue;

    for (const reference of references) {
      try {
        const referencedValue = this.resolveTokenValue(reference, new Set(visited));
        resolvedValue = resolvedValue.replace(`var(${reference})`, referencedValue);
      } catch (error) {
        // Reference couldn't be resolved, keep as-is
        continue;
      }
    }

    visited.delete(tokenName);
    return resolvedValue;
  }

  /**
   * Validate individual token
   */
  private validateSingleToken(tokenName: string, tokenValue: any): TokenIntegrityCheck {
    const issues: string[] = [];
    let isValid = true;
    let type: TokenIntegrityCheck['type'] = 'color';

    // Check token naming convention
    if (!this.isValidTokenName(tokenName)) {
      issues.push('Token name should use kebab-case with -- prefix');
      isValid = false;
    }

    // Determine token type and validate accordingly
    type = this.inferTokenType(tokenName);
    
    switch (type) {
      case 'color':
        if (!this.isValidColor(tokenValue)) {
          issues.push('Invalid color value');
          isValid = false;
        }
        break;
      case 'spacing':
        if (!this.isValidSpacing(tokenValue)) {
          issues.push('Invalid spacing value');
          isValid = false;
        }
        break;
      case 'typography':
        if (!this.isValidTypography(tokenValue)) {
          issues.push('Invalid typography value');
          isValid = false;
        }
        break;
      case 'shadow':
        if (!this.isValidShadow(tokenValue)) {
          issues.push('Invalid shadow value');
          isValid = false;
        }
        break;
      case 'border':
        if (!this.isValidBorder(tokenValue)) {
          issues.push('Invalid border value');
          isValid = false;
        }
        break;
      case 'transition':
        if (!this.isValidTransition(tokenValue)) {
          issues.push('Invalid transition value');
          isValid = false;
        }
        break;
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
   * Flatten nested token objects
   */
  private flattenTokens(obj: any, prefix: string, result: Map<string, any>): void {
    for (const [key, value] of Object.entries(obj)) {
      const tokenName = prefix ? `${prefix}-${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Check if this is a DTCG token with $value
        if ((value as any).$value !== undefined) {
          result.set(tokenName.startsWith('--') ? tokenName : `--${tokenName}`, value);
        } else {
          // Recursively flatten nested objects
          this.flattenTokens(value, tokenName, result);
        }
      } else {
        result.set(tokenName.startsWith('--') ? tokenName : `--${tokenName}`, value);
      }
    }
  }

  /**
   * Extract token references from a value string
   */
  private extractTokenReferences(value: string): string[] {
    const matches = value.match(/var\((--[^)]+)\)/g);
    if (!matches) return [];
    
    return matches.map(match => {
      const tokenMatch = match.match(/var\((--[^)]+)\)/);
      return tokenMatch ? tokenMatch[1] : '';
    }).filter(Boolean);
  }

  /**
   * Check if token name follows valid conventions
   */
  private isValidTokenName(tokenName: string): boolean {
    return /^--[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(tokenName);
  }

  /**
   * Infer token type from name
   */
  private inferTokenType(tokenName: string): TokenIntegrityCheck['type'] {
    if (tokenName.includes('color')) return 'color';
    if (tokenName.includes('spacing') || tokenName.includes('size')) return 'spacing';
    if (tokenName.includes('font') || tokenName.includes('text')) return 'typography';
    if (tokenName.includes('shadow')) return 'shadow';
    if (tokenName.includes('border') || tokenName.includes('radius')) return 'border';
    if (tokenName.includes('transition') || tokenName.includes('duration')) return 'transition';
    return 'color'; // Default fallback
  }

  // Validation helper methods
  private isValidColor(value: any): boolean {
    if (typeof value !== 'string' && (typeof value !== 'object' || !value.$value)) return false;
    const colorValue = typeof value === 'string' ? value : value.$value;
    return /^(#[0-9a-fA-F]{3,8}|rgb\(|rgba\(|hsl\(|hsla\(|var\(--|[a-z]+)$/i.test(colorValue);
  }

  private isValidSpacing(value: any): boolean {
    if (typeof value !== 'string' && (typeof value !== 'object' || !value.$value)) return false;
    const spacingValue = typeof value === 'string' ? value : value.$value;
    return /^(\d+\.?\d*(px|rem|em|%|vh|vw|ch|ex)|0|auto|var\(--)/i.test(spacingValue);
  }

  private isValidTypography(value: any): boolean {
    if (typeof value !== 'string' && (typeof value !== 'object' || !value.$value)) return false;
    const typographyValue = typeof value === 'string' ? value : value.$value;
    return /^(\d+\.?\d*(px|rem|em|pt|%)|[a-z-]+|normal|bold|italic|var\(--)/i.test(typographyValue);
  }

  private isValidShadow(value: any): boolean {
    if (typeof value !== 'string' && (typeof value !== 'object' || !value.$value)) return false;
    const shadowValue = typeof value === 'string' ? value : value.$value;
    return /^(none|\d+\.?\d*px|rgba?\(|inset|var\(--)/i.test(shadowValue);
  }

  private isValidBorder(value: any): boolean {
    if (typeof value !== 'string' && (typeof value !== 'object' || !value.$value)) return false;
    const borderValue = typeof value === 'string' ? value : value.$value;
    return /^(\d+\.?\d*px|none|solid|dashed|dotted|ridge|groove|inset|outset|var\(--)/i.test(borderValue);
  }

  private isValidTransition(value: any): boolean {
    if (typeof value !== 'string' && (typeof value !== 'object' || !value.$value)) return false;
    const transitionValue = typeof value === 'string' ? value : value.$value;
    return /^(\d+\.?\d*(s|ms)|ease|linear|ease-in|ease-out|ease-in-out|cubic-bezier|var\(--)/i.test(transitionValue);
  }
}

/**
 * Token File System Validator
 * Validates token files and their organization
 */
export class TokenFileValidator {
  /**
   * Validate all token files in a directory
   */
  async validateTokenFiles(tokenDirectory: string): Promise<TokenFileValidationResult> {
    const errors: string[] = [];
    const validFiles: string[] = [];
    const invalidFiles: string[] = [];
    let filesFound: string[] = [];

    try {
      const files = await fs.readdir(tokenDirectory);
      filesFound = files.filter(file => 
        file.endsWith('.json') || 
        file.endsWith('.js') || 
        file.endsWith('.ts') || 
        file.endsWith('.css')
      );

      for (const file of filesFound) {
        const filePath = path.join(tokenDirectory, file);
        
        try {
          await this.validateSingleFile(filePath);
          validFiles.push(file);
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

  /**
   * Validate a single token file
   */
  private async validateSingleFile(filePath: string): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8');
    const ext = path.extname(filePath);

    switch (ext) {
      case '.json':
        JSON.parse(content); // Will throw if invalid JSON
        break;
      case '.css':
        // Basic CSS validation - check for CSS custom properties
        if (!content.includes('--') || !content.includes(':')) {
          throw new Error('CSS file does not appear to contain custom properties');
        }
        break;
      case '.js':
      case '.ts':
        // For JS/TS files, just verify they can be read
        if (content.trim().length === 0) {
          throw new Error('File is empty');
        }
        break;
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  }
}

/**
 * Token Batch Validator
 * High-level validation orchestrator
 */
export class TokenBatchValidator {
  private tokenValidator: DesignTokenValidator;
  private fileValidator: TokenFileValidator;

  constructor() {
    this.tokenValidator = new DesignTokenValidator();
    this.fileValidator = new TokenFileValidator();
  }

  /**
   * Comprehensive validation of token system
   */
  async validateTokenSystem(tokenDirectory: string): Promise<{
    fileValidation: TokenFileValidationResult;
    structuralValidation: TokenValidationResult;
    circularReferences: CircularReferenceCheck;
    dtcgCompliance: DTCGComplianceResult;
    summary: {
      overallValid: boolean;
      criticalIssues: string[];
      warnings: string[];
      recommendations: string[];
    };
  }> {
    // Validate files
    const fileValidation = await this.fileValidator.validateTokenFiles(tokenDirectory);
    
    // Load and validate token structure
    const tokenFiles = fileValidation.validFiles.filter(f => f.endsWith('.json'));
    if (tokenFiles.length > 0) {
      const firstTokenFile = path.join(tokenDirectory, tokenFiles[0]);
      await this.tokenValidator.loadTokensFromFile(firstTokenFile);
    }

    const structuralValidation = this.tokenValidator.validateTokenStructure();
    const circularReferences = this.tokenValidator.checkCircularReferences();
    const dtcgCompliance = this.tokenValidator.validateDTCGCompliance();

    // Compile summary
    const criticalIssues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    criticalIssues.push(...fileValidation.errors);
    criticalIssues.push(...structuralValidation.errors);
    
    if (circularReferences.hasCircularReferences) {
      criticalIssues.push('Circular references detected in token aliases');
    }

    warnings.push(...structuralValidation.warnings);
    warnings.push(...dtcgCompliance.violations);
    
    recommendations.push(...dtcgCompliance.recommendations);

    return {
      fileValidation,
      structuralValidation,
      circularReferences,
      dtcgCompliance,
      summary: {
        overallValid: criticalIssues.length === 0,
        criticalIssues,
        warnings,
        recommendations
      }
    };
  }
}

// Export convenience instances
export const designTokenValidator = new DesignTokenValidator();
export const tokenFileValidator = new TokenFileValidator();
export const tokenBatchValidator = new TokenBatchValidator();