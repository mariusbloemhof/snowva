/**
 * CSS Processing Optimization Utilities
 * Provides CSS processing pipeline for build optimization
 * Constitutional TDD compliance - implements T070 requirements
 */

import fs from 'fs/promises';

export interface CSSProcessingResult {
  processed: string;
  sourceMap?: string;
  size: number;
  optimizations: string[];
}

export interface CSSBundleResult {
  bundled: string;
  size: number;
  files: number;
}

export interface CSSOptimizationResult {
  outputPath: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  optimizations: string[];
}

export interface CSSValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    rules: number;
    selectors: number;
    declarations: number;
  };
}

export interface BuildMetrics {
  [key: string]: number;
}

/**
 * Core CSS processor with optimization capabilities
 */
export class CSSProcessor {
  private preserveCustomProperties: boolean;
  private minify: boolean;

  constructor(options: { 
    preserveCustomProperties?: boolean; 
    minify?: boolean; 
  } = {}) {
    this.preserveCustomProperties = options.preserveCustomProperties ?? true;
    this.minify = options.minify ?? true;
  }

  /**
   * Process CSS content with optimizations
   */
  async processCSS(cssContent: string): Promise<CSSProcessingResult> {
    const originalSize = cssContent.length;
    const optimizations: string[] = [];
    let processed = cssContent;

    // Remove comments (but preserve license comments)
    processed = processed.replace(/\/\*(?!\s*!)[^*]*\*+(?:[^/*][^*]*\*+)*\//g, '');
    if (processed.length < cssContent.length) {
      optimizations.push('comments removed');
    }

    if (this.minify) {
      // Normalize whitespace
      processed = processed.replace(/\s+/g, ' ');
      optimizations.push('whitespace normalized');

      // Remove unnecessary semicolons
      processed = processed.replace(/;\s*}/g, '}');
      optimizations.push('unnecessary semicolons removed');

      // Normalize braces and commas
      processed = processed
        .replace(/\s*{\s*/g, '{')
        .replace(/\s*}\s*/g, '}')
        .replace(/\s*,\s*/g, ',')
        .replace(/\s*:\s*/g, ':')
        .replace(/\s*;\s*/g, ';');
      
      optimizations.push('selectors optimized');
    }

    // Preserve custom properties (CSS variables) if configured
    if (this.preserveCustomProperties) {
      // Ensure custom properties maintain proper spacing
      processed = processed.replace(/var\s*\(\s*--([^)]+)\s*\)/g, 'var(--$1)');
    }

    const finalSize = processed.length;
    const sizeReduction = originalSize - finalSize;
    if (sizeReduction > 0) {
      optimizations.push(`size reduced by ${sizeReduction}b`);
    }

    return {
      processed: processed.trim(),
      size: finalSize,
      optimizations
    };
  }

  /**
   * Generate source map for debugging
   */
  async generateSourceMap(original: string, processed: string, sourcePath?: string): Promise<string> {
    // Simple source map implementation
    const sourceMap = {
      version: 3,
      sources: [sourcePath || 'styles/index.css'],
      mappings: this.generateMappings(original, processed),
      file: 'processed.css',
      sourcesContent: [original]
    };

    return JSON.stringify(sourceMap);
  }

  /**
   * Bundle multiple CSS files into one
   */
  async bundleCSS(cssFiles: string[]): Promise<CSSBundleResult> {
    const bundled = cssFiles.join('\n');
    
    return {
      bundled,
      size: bundled.length,
      files: cssFiles.length
    };
  }

  /**
   * Generate simple mappings for source map
   */
  private generateMappings(original: string, processed: string): string {
    // Simplified mapping generation - in production, would use proper source map library
    return 'AAAA,CCCC,EEEE';
  }
}

/**
 * CSS Asset Pipeline for build optimization
 */
export class CSSAssetPipeline {
  private processor: CSSProcessor;

  constructor(processorOptions?: { 
    preserveCustomProperties?: boolean; 
    minify?: boolean; 
  }) {
    this.processor = new CSSProcessor(processorOptions);
  }

  /**
   * Optimize CSS bundle with file I/O
   */
  async optimizeCSSBundle(inputPath: string): Promise<CSSOptimizationResult> {
    try {
      const cssContent = await fs.readFile(inputPath, 'utf-8');
      const result = await this.processor.processCSS(cssContent);
      
      const outputPath = inputPath.replace(/\.css$/, '.optimized.css');
      await fs.writeFile(outputPath, result.processed, 'utf-8');

      const compressionRatio = cssContent.length > 0 
        ? (cssContent.length - result.size) / cssContent.length 
        : 0;

      return {
        outputPath,
        originalSize: cssContent.length,
        optimizedSize: result.size,
        compressionRatio,
        optimizations: result.optimizations
      };
    } catch (error) {
      throw new Error(`CSS optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate CSS output for correctness
   */
  async validateCSSOutput(cssPath: string): Promise<CSSValidationResult> {
    try {
      const cssContent = await fs.readFile(cssPath, 'utf-8');
      
      // Parse CSS for basic validation
      const rules = this.countCSSRules(cssContent);
      const selectors = this.countSelectors(cssContent);
      const declarations = this.countDeclarations(cssContent);

      const errors: string[] = [];
      const warnings: string[] = [];

      // Check for syntax errors
      if (cssContent.includes('{{') || cssContent.includes('}}')) {
        errors.push('Invalid nested braces detected');
      }
      
      if (cssContent.includes(';;')) {
        warnings.push('Duplicate semicolons found');
      }

      // Check for unclosed braces
      const openBraces = (cssContent.match(/\{/g) || []).length;
      const closeBraces = (cssContent.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        errors.push('Mismatched braces detected');
      }

      // Validate custom properties
      const invalidVars = cssContent.match(/var\(\s*[^-][^)]*\)/g);
      if (invalidVars) {
        warnings.push('Invalid CSS custom property references found');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        stats: { rules, selectors, declarations }
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Failed to read CSS file: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        stats: { rules: 0, selectors: 0, declarations: 0 }
      };
    }
  }

  /**
   * Count CSS rules in content
   */
  private countCSSRules(cssContent: string): number {
    // Match CSS rules (selector + declaration block)
    const ruleMatches = cssContent.match(/[^{}]+\{[^{}]*\}/g);
    return ruleMatches ? ruleMatches.length : 0;
  }

  /**
   * Count selectors in CSS content
   */
  private countSelectors(cssContent: string): number {
    const selectorMatches = cssContent.match(/[^{,}]+(?=\s*[{,])/g);
    return selectorMatches ? selectorMatches.length : 0;
  }

  /**
   * Count declarations in CSS content
   */
  private countDeclarations(cssContent: string): number {
    const declarationMatches = cssContent.match(/[^:;{}]+:[^:;{}]+/g);
    return declarationMatches ? declarationMatches.length : 0;
  }
}

/**
 * Build performance tracking for CSS processing
 */
export class BuildPerformanceTracker {
  private metrics: Map<string, number> = new Map();
  private startTimes: Map<string, number> = new Map();

  /**
   * Start timing an operation
   */
  startTimer(label: string): void {
    this.startTimes.set(label, performance.now());
  }

  /**
   * End timing an operation and return duration
   */
  endTimer(label: string): number {
    const startTime = this.startTimes.get(label);
    if (!startTime) {
      throw new Error(`Timer ${label} was not started`);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    this.metrics.set(label, duration);
    this.startTimes.delete(label);
    
    return duration;
  }

  /**
   * Get all collected metrics
   */
  getMetrics(): BuildMetrics {
    return Object.fromEntries(this.metrics.entries());
  }

  /**
   * Reset all metrics and timers
   */
  reset(): void {
    this.metrics.clear();
    this.startTimes.clear();
  }

  /**
   * Get average processing time for repeated operations
   */
  getAverageTime(label: string): number {
    const times = Array.from(this.metrics.entries())
      .filter(([key]) => key.startsWith(label))
      .map(([, value]) => value);
    
    return times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0;
  }
}

/**
 * CSS bundle size analyzer for constitutional compliance
 */
export class CSSBundleAnalyzer {
  private readonly MAX_BUNDLE_SIZE = 20480; // 20KB constitutional limit

  /**
   * Analyze bundle size and compliance
   */
  analyzeBundleSize(cssContent: string): {
    size: number;
    isCompliant: boolean;
    compressionPotential: number;
    recommendations: string[];
  } {
    const size = new Blob([cssContent]).size;
    const isCompliant = size <= this.MAX_BUNDLE_SIZE;
    
    // Estimate compression potential
    const whitespaceSize = (cssContent.match(/\s/g) || []).length;
    const commentSize = (cssContent.match(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g) || [])
      .join('').length;
    
    const compressionPotential = (whitespaceSize + commentSize) / size;
    
    const recommendations: string[] = [];
    
    if (!isCompliant) {
      recommendations.push('Bundle exceeds 20KB constitutional limit');
    }
    
    if (compressionPotential > 0.3) {
      recommendations.push('High compression potential - consider minification');
    }
    
    if (cssContent.includes('/*') && cssContent.includes('*/')) {
      recommendations.push('Remove comments to reduce bundle size');
    }

    return {
      size,
      isCompliant,
      compressionPotential,
      recommendations
    };
  }

  /**
   * Get bundle size impact analysis
   */
  getBundleImpact(originalSize: number, optimizedSize: number): {
    reduction: number;
    percentage: number;
    grade: 'excellent' | 'good' | 'fair' | 'poor';
  } {
    const reduction = originalSize - optimizedSize;
    const percentage = originalSize > 0 ? reduction / originalSize : 0;
    
    let grade: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
    if (percentage >= 0.4) grade = 'excellent';
    else if (percentage >= 0.25) grade = 'good';
    else if (percentage >= 0.1) grade = 'fair';

    return {
      reduction,
      percentage,
      grade
    };
  }
}

// Export utility instances for convenience
export const cssProcessor = new CSSProcessor();
export const cssAssetPipeline = new CSSAssetPipeline();
export const buildPerformanceTracker = new BuildPerformanceTracker();
export const cssBundleAnalyzer = new CSSBundleAnalyzer();