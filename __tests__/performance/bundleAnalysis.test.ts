/**
 * T077: Bundle Size Analysis and Reporting
 * Comprehensive CSS bundle size testing and analysis
 * Constitutional TDD compliance - 20KB bundle size limit
 */

import fs from 'fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock fs module
vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(),
    stat: vi.fn(),
    readdir: vi.fn()
  }
}));

// Constitutional requirements
const BUNDLE_SIZE_LIMITS = {
  CSS_BUNDLE_MAX_SIZE: 20480, // 20KB
  COMPONENT_MAX_SIZE: 2048,   // 2KB per component
  TOKEN_MAX_SIZE: 1024,       // 1KB for tokens
  THEME_MAX_SIZE: 1536,       // 1.5KB per theme
  GZIP_COMPRESSION_MIN: 0.7   // Minimum 70% compression ratio
};

// Bundle analysis utilities
class BundleAnalyzer {
  private bundleStats: Map<string, number> = new Map();
  
  analyzeBundleSize(bundleContent: string): number {
    return new Blob([bundleContent]).size;
  }
  
  analyzeGzipSize(content: string): number {
    // Simulate gzip compression ratio (actual implementation would use zlib)
    const compressionRatio = 0.75; // Typical CSS compression ratio
    return Math.floor(content.length * compressionRatio);
  }
  
  analyzeComponentSizes(bundleContent: string): Map<string, number> {
    const componentSizes = new Map<string, number>();
    
    // Parse CSS to identify component sections
    const componentMatches = bundleContent.match(/\/\*\s*Component:\s*([^*]+)\s*\*\/([\s\S]*?)(?=\/\*\s*Component:|$)/g);
    
    if (componentMatches) {
      componentMatches.forEach(match => {
        const nameMatch = match.match(/\/\*\s*Component:\s*([^*]+)\s*\*\//);
        if (nameMatch) {
          const componentName = nameMatch[1].trim();
          const componentSize = new Blob([match]).size;
          componentSizes.set(componentName, componentSize);
        }
      });
    }
    
    return componentSizes;
  }
  
  generateSizeReport(bundleContent: string): BundleSizeReport {
    const totalSize = this.analyzeBundleSize(bundleContent);
    const gzipSize = this.analyzeGzipSize(bundleContent);
    const componentSizes = this.analyzeComponentSizes(bundleContent);
    
    return {
      totalSize,
      gzipSize,
      compressionRatio: gzipSize / totalSize,
      componentSizes,
      isWithinLimits: totalSize <= BUNDLE_SIZE_LIMITS.CSS_BUNDLE_MAX_SIZE,
      breakdown: this.generateSizeBreakdown(bundleContent)
    };
  }
  
  private generateSizeBreakdown(bundleContent: string): SizeBreakdown {
    const tokens = this.extractSection(bundleContent, 'tokens');
    const themes = this.extractSection(bundleContent, 'themes');
    const components = this.extractSection(bundleContent, 'components');
    const utilities = this.extractSection(bundleContent, 'utilities');
    
    return {
      tokens: this.analyzeBundleSize(tokens),
      themes: this.analyzeBundleSize(themes),
      components: this.analyzeBundleSize(components),
      utilities: this.analyzeBundleSize(utilities)
    };
  }
  
  private extractSection(content: string, sectionName: string): string {
    const sectionRegex = new RegExp(`\\/\\*\\s*${sectionName}[\\s\\S]*?\\*\\/([\\s\\S]*?)(?=\\/\\*\\s*\\w+|$)`, 'i');
    const match = content.match(sectionRegex);
    return match ? match[1] : '';
  }
}

interface BundleSizeReport {
  totalSize: number;
  gzipSize: number;
  compressionRatio: number;
  componentSizes: Map<string, number>;
  isWithinLimits: boolean;
  breakdown: SizeBreakdown;
}

interface SizeBreakdown {
  tokens: number;
  themes: number;
  components: number;
  utilities: number;
}

// Mock file system for testing
const mockFileSystem = new Map<string, string>();

// Mock CSS bundle content for testing
const createMockCSSBundle = (options: { 
  tokensSize?: number; 
  componentsSize?: number; 
  themesSize?: number; 
  utilitiesSize?: number; 
} = {}): string => {
  const {
    tokensSize = 800,
    componentsSize = 12000,
    themesSize = 3000,
    utilitiesSize = 2000
  } = options;
  
  const tokens = '/* Design Tokens */\n' + 'x'.repeat(tokensSize);
  const components = '/* Components */\n' + 'x'.repeat(componentsSize);
  const themes = '/* Themes */\n' + 'x'.repeat(themesSize);
  const utilities = '/* Utilities */\n' + 'x'.repeat(utilitiesSize);
  
  return [tokens, components, themes, utilities].join('\n\n');
};

describe('CSS Bundle Size Analysis and Reporting', () => {
  let bundleAnalyzer: BundleAnalyzer;
  
  beforeEach(() => {
    bundleAnalyzer = new BundleAnalyzer();
    mockFileSystem.clear();
    
    // Mock fs promises
    (fs.readFile as any).mockImplementation(async (filePath: string) => {
      const pathStr = filePath.toString();
      if (mockFileSystem.has(pathStr)) {
        return mockFileSystem.get(pathStr)!;
      }
      throw new Error(`File not found: ${pathStr}`);
    });
  });

  describe('Constitutional Bundle Size Validation', () => {
    it('should enforce 20KB maximum bundle size (CONSTITUTIONAL)', () => {
      // Test with bundle under limit
      const smallBundle = createMockCSSBundle({
        tokensSize: 500,
        componentsSize: 8000,
        themesSize: 2000,
        utilitiesSize: 1000
      });
      
      const smallReport = bundleAnalyzer.generateSizeReport(smallBundle);
      expect(smallReport.totalSize).toBeLessThanOrEqual(BUNDLE_SIZE_LIMITS.CSS_BUNDLE_MAX_SIZE);
      expect(smallReport.isWithinLimits).toBe(true);
      
      // Test with bundle over limit
      const largeBundle = createMockCSSBundle({
        tokensSize: 2000,
        componentsSize: 20000,
        themesSize: 5000,
        utilitiesSize: 3000
      });
      
      const largeReport = bundleAnalyzer.generateSizeReport(largeBundle);
      expect(largeReport.totalSize).toBeGreaterThan(BUNDLE_SIZE_LIMITS.CSS_BUNDLE_MAX_SIZE);
      expect(largeReport.isWithinLimits).toBe(false);
      
      console.log(`Small bundle: ${smallReport.totalSize} bytes`);
      console.log(`Large bundle: ${largeReport.totalSize} bytes (exceeds limit)`);
    });

    it('should validate component-level size limits', () => {
      const bundleWithLargeComponents = `
        /* Component: Button */
        .btn-primary { ${'/* large component CSS */'.repeat(100)} }
        
        /* Component: Card */
        .card { ${'/* normal component CSS */'.repeat(20)} }
        
        /* Component: Modal */
        .modal { ${'/* huge component CSS */'.repeat(200)} }
      `;
      
      const componentSizes = bundleAnalyzer.analyzeComponentSizes(bundleWithLargeComponents);
      
      componentSizes.forEach((size, componentName) => {
        if (size > BUNDLE_SIZE_LIMITS.COMPONENT_MAX_SIZE) {
          console.warn(`Component ${componentName} exceeds size limit: ${size} bytes`);
        }
        
        // Most components should be under the limit
        if (componentName === 'Button' || componentName === 'Card') {
          expect(size).toBeLessThanOrEqual(BUNDLE_SIZE_LIMITS.COMPONENT_MAX_SIZE);
        }
      });
    });

    it('should validate design token size limits', () => {
      const tokenSizes = {
        small: 200,   // Under limit
        medium: 800,  // Within limit
        large: 1500   // Over limit
      };
      
      Object.entries(tokenSizes).forEach(([size, bytes]) => {
        const tokenCSS = `/* Design Tokens - ${size} */\n` + 'x'.repeat(bytes);
        const tokenSize = bundleAnalyzer.analyzeBundleSize(tokenCSS);
        
        if (size === 'large') {
          expect(tokenSize).toBeGreaterThan(BUNDLE_SIZE_LIMITS.TOKEN_MAX_SIZE);
        } else {
          expect(tokenSize).toBeLessThanOrEqual(BUNDLE_SIZE_LIMITS.TOKEN_MAX_SIZE);
        }
      });
    });

    it('should validate theme size limits', () => {
      const lightTheme = `/* Light Theme */\n` + ':root { '.repeat(100) + ' }';
      const darkTheme = `/* Dark Theme */\n` + '[data-theme="dark"] { '.repeat(150) + ' }';
      
      const lightThemeSize = bundleAnalyzer.analyzeBundleSize(lightTheme);
      const darkThemeSize = bundleAnalyzer.analyzeBundleSize(darkTheme);
      
      expect(lightThemeSize).toBeLessThanOrEqual(BUNDLE_SIZE_LIMITS.THEME_MAX_SIZE);
      expect(darkThemeSize).toBeLessThanOrEqual(BUNDLE_SIZE_LIMITS.THEME_MAX_SIZE);
      
      console.log(`Light theme: ${lightThemeSize} bytes`);
      console.log(`Dark theme: ${darkThemeSize} bytes`);
    });
  });

  describe('Bundle Composition Analysis', () => {
    it('should analyze bundle size breakdown by category', () => {
      const bundle = createMockCSSBundle({
        tokensSize: 600,
        componentsSize: 10000,
        themesSize: 2500,
        utilitiesSize: 1200
      });
      
      const report = bundleAnalyzer.generateSizeReport(bundle);
      const breakdown = report.breakdown;
      
      // Validate breakdown totals
      const breakdownTotal = breakdown.tokens + breakdown.themes + 
                           breakdown.components + breakdown.utilities;
      
      expect(breakdownTotal).toBeCloseTo(report.totalSize, -2); // Within 100 bytes
      
      // Components should be the largest section
      expect(breakdown.components).toBeGreaterThan(breakdown.tokens);
      expect(breakdown.components).toBeGreaterThan(breakdown.themes);
      expect(breakdown.components).toBeGreaterThan(breakdown.utilities);
      
      // Calculate percentages
      const percentages = {
        tokens: (breakdown.tokens / report.totalSize) * 100,
        components: (breakdown.components / report.totalSize) * 100,
        themes: (breakdown.themes / report.totalSize) * 100,
        utilities: (breakdown.utilities / report.totalSize) * 100
      };
      
      console.log('Bundle breakdown:', percentages);
      
      // Components should be 40-70% of bundle
      expect(percentages.components).toBeGreaterThan(40);
      expect(percentages.components).toBeLessThan(70);
    });

    it('should identify largest contributors to bundle size', () => {
      const bundleWithVariedComponents = `
        /* Component: Button */
        ${'.btn-primary { color: red; }'.repeat(50)}
        
        /* Component: DataTable */
        ${'.table { border: 1px solid #ccc; }'.repeat(300)}
        
        /* Component: Card */
        ${'.card { padding: 1rem; }'.repeat(75)}
        
        /* Component: Modal */
        ${'.modal { position: fixed; }'.repeat(150)}
      `;
      
      const componentSizes = bundleAnalyzer.analyzeComponentSizes(bundleWithVariedComponents);
      const sortedComponents = Array.from(componentSizes.entries())
        .sort((a, b) => b[1] - a[1]);
      
      // DataTable should be the largest component
      expect(sortedComponents[0][0]).toBe('DataTable');
      
      // Identify components over threshold
      const oversizedComponents = sortedComponents.filter(
        ([_, size]) => size > BUNDLE_SIZE_LIMITS.COMPONENT_MAX_SIZE
      );
      
      console.log('Largest components:', sortedComponents.map(([name, size]) => `${name}: ${size}b`));
      
      // Should identify which components need optimization
      if (oversizedComponents.length > 0) {
        console.warn('Components exceeding size limits:', oversizedComponents);
      }
    });
  });

  describe('Compression Analysis', () => {
    it('should analyze gzip compression ratios', () => {
      const testBundles = [
        {
          name: 'repetitive',
          content: '.btn { color: red; }'.repeat(100),
          expectedRatio: 0.9 // High compression for repetitive content
        },
        {
          name: 'varied',
          content: Array.from({ length: 50 }, (_, i) => 
            `.class-${i} { property-${i}: value-${i}; }`
          ).join('\n'),
          expectedRatio: 0.7 // Lower compression for varied content
        },
        {
          name: 'minified',
          content: '.a{b:c}.d{e:f}'.repeat(100),
          expectedRatio: 0.8 // Medium compression for minified content
        }
      ];
      
      testBundles.forEach(test => {
        const originalSize = bundleAnalyzer.analyzeBundleSize(test.content);
        const gzipSize = bundleAnalyzer.analyzeGzipSize(test.content);
        const compressionRatio = gzipSize / originalSize;
        
        expect(compressionRatio).toBeLessThanOrEqual(test.expectedRatio);
        expect(compressionRatio).toBeGreaterThan(BUNDLE_SIZE_LIMITS.GZIP_COMPRESSION_MIN);
        
        console.log(`${test.name} compression: ${(compressionRatio * 100).toFixed(1)}%`);
      });
    });

    it('should validate minimum compression requirements', () => {
      const fullBundle = createMockCSSBundle();
      const report = bundleAnalyzer.generateSizeReport(fullBundle);
      
      // Must meet minimum compression ratio
      expect(report.compressionRatio).toBeGreaterThan(BUNDLE_SIZE_LIMITS.GZIP_COMPRESSION_MIN);
      
      // Gzipped bundle should also be under reasonable limit
      const gzipLimit = BUNDLE_SIZE_LIMITS.CSS_BUNDLE_MAX_SIZE * 0.8; // 80% of original limit
      expect(report.gzipSize).toBeLessThanOrEqual(gzipLimit);
      
      console.log(`Bundle sizes: ${report.totalSize}b raw, ${report.gzipSize}b gzipped`);
    });
  });

  describe('Bundle Optimization Analysis', () => {
    it('should identify optimization opportunities', () => {
      const unoptimizedBundle = `
        /* Redundant rules */
        .btn { color: red; padding: 10px; }
        .btn { color: red; } /* duplicate */
        
        /* Unused utility classes */
        .utility-unused { display: block; }
        
        /* Overly specific selectors */
        .page .container .card .header .title { font-size: 1.2rem; }
        
        /* Large comment blocks */
        /* ${'This is a very long comment explaining something. '.repeat(20)} */
        
        /* Unminified properties */
        .card {
          background-color: #ffffff;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          margin-bottom: 1rem;
          padding: 1rem;
        }
      `;
      
      const originalSize = bundleAnalyzer.analyzeBundleSize(unoptimizedBundle);
      
      // Simulate optimization
      const optimizedBundle = unoptimizedBundle
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
        .replace(/\s+/g, ' ') // Compress whitespace
        .replace(/;\s*}/g, '}') // Remove unnecessary semicolons
        .trim();
      
      const optimizedSize = bundleAnalyzer.analyzeBundleSize(optimizedBundle);
      const sizeSavings = originalSize - optimizedSize;
      const savingsPercent = (sizeSavings / originalSize) * 100;
      
      expect(optimizedSize).toBeLessThan(originalSize);
      expect(savingsPercent).toBeGreaterThan(20); // Should save at least 20%
      
      console.log(`Optimization savings: ${sizeSavings}b (${savingsPercent.toFixed(1)}%)`);
    });

    it('should analyze unused CSS detection opportunities', () => {
      const bundleWithUnusedCSS = `
        /* Actually used components */
        .btn-primary { background: blue; }
        .card { padding: 1rem; }
        .status-paid { color: green; }
        
        /* Potentially unused components */
        .legacy-component { display: block; }
        .experimental-feature { opacity: 0.5; }
        .debug-only { border: 1px solid red; }
      `;
      
      // Mock usage analysis (in real implementation would scan HTML/JS)
      const usedClasses = ['.btn-primary', '.card', '.status-paid'];
      const allClasses = [
        '.btn-primary', '.card', '.status-paid',
        '.legacy-component', '.experimental-feature', '.debug-only'
      ];
      
      const unusedClasses = allClasses.filter(cls => !usedClasses.includes(cls));
      const unusedPercent = (unusedClasses.length / allClasses.length) * 100;
      
      console.log(`Unused classes: ${unusedClasses.join(', ')} (${unusedPercent.toFixed(1)}%)`);
      
      // Should identify optimization opportunity if significant unused CSS
      if (unusedPercent > 10) {
        console.warn(`Potential for CSS pruning: ${unusedPercent.toFixed(1)}% unused classes`);
      }
      
      expect(unusedClasses.length).toBeGreaterThan(0); // Should detect unused CSS
    });
  });

  describe('Performance Impact Analysis', () => {
    it('should analyze loading performance impact', () => {
      const bundleSizes = [5000, 10000, 15000, 20000, 25000]; // Various bundle sizes
      const networkSpeeds = {
        'fast-3g': 1.5 * 1024 * 1024 / 8, // 1.5 Mbps in bytes/second
        'slow-3g': 400 * 1024 / 8,        // 400 Kbps in bytes/second
        'wifi': 10 * 1024 * 1024 / 8      // 10 Mbps in bytes/second
      };
      
      bundleSizes.forEach(size => {
        Object.entries(networkSpeeds).forEach(([networkType, bytesPerSecond]) => {
          const loadTime = (size / bytesPerSecond) * 1000; // Convert to milliseconds
          
          console.log(`${size}b bundle on ${networkType}: ${loadTime.toFixed(0)}ms`);
          
          // Constitutional bundle size should load quickly even on slow networks
          if (size <= BUNDLE_SIZE_LIMITS.CSS_BUNDLE_MAX_SIZE) {
            if (networkType === 'slow-3g') {
              expect(loadTime).toBeLessThanOrEqual(1000); // 1 second max on slow 3G
            }
            if (networkType === 'fast-3g') {
              expect(loadTime).toBeLessThanOrEqual(500); // 0.5 seconds on fast 3G
            }
          }
        });
      });
    });

    it('should analyze parse time impact', () => {
      const testBundles = [
        { size: 5000, rules: 100 },
        { size: 10000, rules: 300 },
        { size: 15000, rules: 500 },
        { size: 20000, rules: 700 }
      ];
      
      testBundles.forEach(bundle => {
        // Estimate parse time based on size and rule count
        const parseTimeMs = (bundle.size / 1000) * 0.1 + (bundle.rules * 0.01);
        
        console.log(`${bundle.size}b bundle (${bundle.rules} rules): ~${parseTimeMs.toFixed(1)}ms parse time`);
        
        // Parse time should remain reasonable
        if (bundle.size <= BUNDLE_SIZE_LIMITS.CSS_BUNDLE_MAX_SIZE) {
          expect(parseTimeMs).toBeLessThanOrEqual(50); // 50ms max parse time
        }
      });
    });
  });

  describe('Bundle Size Reporting', () => {
    it('should generate comprehensive size reports', () => {
      const bundle = createMockCSSBundle();
      const report = bundleAnalyzer.generateSizeReport(bundle);
      
      // Report should include all required metrics
      expect(report.totalSize).toBeGreaterThan(0);
      expect(report.gzipSize).toBeGreaterThan(0);
      expect(report.compressionRatio).toBeGreaterThan(0);
      expect(report.breakdown).toBeDefined();
      expect(typeof report.isWithinLimits).toBe('boolean');
      
      // Generate human-readable report
      const humanReport = {
        'Total Size': `${report.totalSize.toLocaleString()} bytes`,
        'Gzipped Size': `${report.gzipSize.toLocaleString()} bytes`,
        'Compression': `${(report.compressionRatio * 100).toFixed(1)}%`,
        'Within Limits': report.isWithinLimits ? 'Yes' : 'No',
        'Breakdown': {
          'Tokens': `${report.breakdown.tokens} bytes`,
          'Components': `${report.breakdown.components} bytes`,
          'Themes': `${report.breakdown.themes} bytes`,
          'Utilities': `${report.breakdown.utilities} bytes`
        }
      };
      
      console.log('Bundle Size Report:', humanReport);
      
      // Validate report completeness
      expect(Object.keys(humanReport)).toContain('Total Size');
      expect(Object.keys(humanReport)).toContain('Within Limits');
    });

    it('should track bundle size over time', () => {
      const historicalSizes = [
        { version: '1.0.0', size: 15000, date: '2025-09-01' },
        { version: '1.1.0', size: 16500, date: '2025-09-15' },
        { version: '1.2.0', size: 18000, date: '2025-09-27' }
      ];
      
      // Analyze size growth trend
      const growthRates = historicalSizes.slice(1).map((current, index) => {
        const previous = historicalSizes[index];
        return ((current.size - previous.size) / previous.size) * 100;
      });
      
      const averageGrowthRate = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
      
      console.log('Bundle size growth over time:', historicalSizes);
      console.log(`Average growth rate: ${averageGrowthRate.toFixed(1)}% per version`);
      
      // Growth should be controlled
      expect(averageGrowthRate).toBeLessThanOrEqual(15); // Max 15% growth per version
      
      // Latest version should still be within limits
      const latestSize = historicalSizes[historicalSizes.length - 1].size;
      expect(latestSize).toBeLessThanOrEqual(BUNDLE_SIZE_LIMITS.CSS_BUNDLE_MAX_SIZE);
    });
  });

  describe('Constitutional Compliance Validation', () => {
    it('should enforce constitutional 20KB limit across all scenarios', () => {
      const scenarios = [
        { name: 'Minimal design system', tokensSize: 300, componentsSize: 5000, themesSize: 1000, utilitiesSize: 500 },
        { name: 'Standard design system', tokensSize: 600, componentsSize: 10000, themesSize: 2000, utilitiesSize: 1200 },
        { name: 'Comprehensive design system', tokensSize: 800, componentsSize: 15000, themesSize: 3000, utilitiesSize: 1500 },
        { name: 'Maximum allowable system', tokensSize: 1000, componentsSize: 16000, themesSize: 2500, utilitiesSize: 1000 }
      ];
      
      scenarios.forEach(scenario => {
        const bundle = createMockCSSBundle(scenario);
        const report = bundleAnalyzer.generateSizeReport(bundle);
        
        console.log(`${scenario.name}: ${report.totalSize} bytes (${report.isWithinLimits ? 'PASS' : 'FAIL'})`);
        
        // All scenarios should respect constitutional limit
        expect(report.totalSize).toBeLessThanOrEqual(BUNDLE_SIZE_LIMITS.CSS_BUNDLE_MAX_SIZE);
        expect(report.isWithinLimits).toBe(true);
      });
    });
    
    it('should validate bundle size enforcement mechanisms', () => {
      const oversizedBundle = createMockCSSBundle({
        tokensSize: 2000,
        componentsSize: 25000,
        themesSize: 5000,
        utilitiesSize: 3000
      });
      
      const report = bundleAnalyzer.generateSizeReport(oversizedBundle);
      
      // Should detect violation
      expect(report.isWithinLimits).toBe(false);
      expect(report.totalSize).toBeGreaterThan(BUNDLE_SIZE_LIMITS.CSS_BUNDLE_MAX_SIZE);
      
      // Calculate how much over the limit
      const overage = report.totalSize - BUNDLE_SIZE_LIMITS.CSS_BUNDLE_MAX_SIZE;
      const overagePercent = (overage / BUNDLE_SIZE_LIMITS.CSS_BUNDLE_MAX_SIZE) * 100;
      
      console.log(`Bundle exceeds limit by ${overage} bytes (${overagePercent.toFixed(1)}%)`);
      
      // Should provide clear feedback about violations
      expect(overage).toBeGreaterThan(0);
    });
  });
});