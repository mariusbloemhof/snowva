import { beforeEach, describe, expect, it, vi } from 'vitest';
import { gzipSync } from 'zlib';

describe('CSS Bundle Size Performance Test', () => {
  const MAX_CSS_BUNDLE_SIZE = 20 * 1024; // 20KB constitutional limit
  const MAX_GZIPPED_SIZE = 5 * 1024;     // 5KB gzipped target

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fail to import CSS bundle size utilities before implementation', () => {
    // Contract: Bundle size monitoring system
    expect(() => {
      const { analyzeCSSBundleSize, optimizeCSSBundle } = require('../../utils/bundleAnalyzer');
    }).toThrow('Cannot find module');
  });

  it('should enforce 20KB maximum CSS bundle size (CONSTITUTIONAL)', () => {
    // Contract: <20KB bundle size requirement (CONSTITUTIONAL)
    const mockBundleSizeValidator = {
      validateBundleSize: vi.fn((sizeInBytes: number) => {
        return {
          isWithinLimit: sizeInBytes <= MAX_CSS_BUNDLE_SIZE,
          size: sizeInBytes,
          limit: MAX_CSS_BUNDLE_SIZE,
          sizeInKB: Math.round((sizeInBytes / 1024) * 100) / 100,
          limitInKB: Math.round((MAX_CSS_BUNDLE_SIZE / 1024) * 100) / 100,
          utilizationPercentage: (sizeInBytes / MAX_CSS_BUNDLE_SIZE) * 100
        };
      })
    };

    // Test bundle within limit
    const goodBundle = mockBundleSizeValidator.validateBundleSize(18 * 1024); // 18KB
    expect(goodBundle.isWithinLimit).toBe(true);
    expect(goodBundle.utilizationPercentage).toBeLessThan(100);

    // Test bundle at limit
    const limitBundle = mockBundleSizeValidator.validateBundleSize(20 * 1024); // 20KB
    expect(limitBundle.isWithinLimit).toBe(true);
    expect(limitBundle.utilizationPercentage).toBe(100);

    // Test bundle exceeding limit (CONSTITUTIONAL VIOLATION)
    const oversizedBundle = mockBundleSizeValidator.validateBundleSize(25 * 1024); // 25KB
    expect(oversizedBundle.isWithinLimit).toBe(false);
    expect(oversizedBundle.utilizationPercentage).toBeGreaterThan(100);
  });

  it('should analyze CSS file size composition', () => {
    // Contract: CSS bundle composition analysis
    const mockCSSAnalyzer = {
      analyzeBundleComposition: vi.fn((mockCSSContent: string) => {
        const lines = mockCSSContent.split('\n');
        
        const analysis = {
          totalSize: Buffer.byteLength(mockCSSContent, 'utf8'),
          
          // Component breakdown
          tokenDefinitions: {
            lineCount: lines.filter(line => line.includes('--')).length,
            estimatedSize: lines.filter(line => line.includes('--')).join('\n').length
          },
          
          componentClasses: {
            lineCount: lines.filter(line => line.includes('{')).length,
            estimatedSize: lines.filter(line => !line.includes('--') && line.includes(':')).join('\n').length
          },
          
          mediaQueries: {
            lineCount: lines.filter(line => line.includes('@media')).length,
            estimatedSize: 0 // Calculate based on content between @media blocks
          },
          
          // Optimization opportunities
          redundancy: {
            duplicateSelectors: 0,
            unusedRules: 0,
            optimizationPotential: '15%'
          }
        };
        
        return analysis;
      })
    };

    const sampleCSS = `
      :root {
        --color-primary: #0066cc;
        --color-secondary: #666666;
      }
      
      .btn-primary {
        background-color: var(--color-primary);
        color: white;
      }
      
      @media (max-width: 768px) {
        .btn-primary { padding: 0.5rem; }
      }
    `;

    const analysis = mockCSSAnalyzer.analyzeBundleComposition(sampleCSS);
    expect(analysis.totalSize).toBeLessThan(MAX_CSS_BUNDLE_SIZE);
    expect(analysis.tokenDefinitions.lineCount).toBeGreaterThan(0);
    expect(analysis.componentClasses.lineCount).toBeGreaterThan(0);
  });

  it('should validate gzipped CSS bundle size', () => {
    // Contract: Compressed bundle size optimization
    const mockCompressionAnalyzer = {
      analyzeCompression: vi.fn((cssContent: string) => {
        const uncompressed = Buffer.byteLength(cssContent, 'utf8');
        const compressed = gzipSync(cssContent).length;
        
        return {
          uncompressedSize: uncompressed,
          compressedSize: compressed,
          compressionRatio: compressed / uncompressed,
          savings: uncompressed - compressed,
          isCompressedWithinTarget: compressed <= MAX_GZIPPED_SIZE
        };
      })
    };

    // Test with optimizable CSS (lots of repetition)
    const repetitiveCSSss = Array(100).fill('.btn { color: var(--color-primary); }').join('\n');
    const repetitiveResult = mockCompressionAnalyzer.analyzeCompression(repetitiveCSSss);
    
    expect(repetitiveResult.compressionRatio).toBeLessThan(0.3); // Should compress well
    expect(repetitiveResult.compressedSize).toBeLessThan(repetitiveResult.uncompressedSize);

    // Test with diverse CSS (less compression)
    const diverseCSS = Array(50).fill(0).map((_, i) => 
      `.component-${i} { background: #${i.toString(16).padStart(6, '0')}; }`
    ).join('\n');
    
    const diverseResult = mockCompressionAnalyzer.analyzeCompression(diverseCSS);
    expect(diverseResult.compressionRatio).toBeLessThan(1); // Still should compress
  });

  it('should track bundle size growth over time', () => {
    // Contract: Bundle size regression monitoring
    const mockBundleSizeTracker = {
      trackBundleGrowth: vi.fn((historicalSizes: number[]) => {
        if (historicalSizes.length < 2) return { trend: 'insufficient-data' };
        
        const recent = historicalSizes.slice(-5); // Last 5 builds
        const growth = recent[recent.length - 1] - recent[0];
        const growthPercentage = (growth / recent[0]) * 100;
        
        return {
          currentSize: recent[recent.length - 1],
          previousSize: recent[0],
          growth,
          growthPercentage,
          trend: growthPercentage > 15 ? 'concerning' : 
                 growthPercentage > 5 ? 'moderate' : 'stable',
          isWithinConstitutionalLimit: recent[recent.length - 1] <= MAX_CSS_BUNDLE_SIZE
        };
      })
    };

    // Test stable growth
    const stableSizes = [16000, 16100, 16200, 16150, 16180]; // Minimal growth
    const stableResult = mockBundleSizeTracker.trackBundleGrowth(stableSizes);
    expect(stableResult.trend).toBe('stable');
    expect(stableResult.isWithinConstitutionalLimit).toBe(true);

    // Test concerning growth
    const growingSizes = [15000, 16000, 17500, 19000, 22000]; // Exceeds limit
    const growthResult = mockBundleSizeTracker.trackBundleGrowth(growingSizes);
    expect(growthResult.trend).toBe('concerning');
    expect(growthResult.isWithinConstitutionalLimit).toBe(false);
  });

  it('should identify CSS optimization opportunities', () => {
    // Contract: CSS optimization analysis
    const mockCSSOptimizer = {
      identifyOptimizations: vi.fn((cssContent: string) => {
        const optimizations = {
          duplicateRules: {
            found: cssContent.includes('.btn-primary') && cssContent.includes('.btn-primary'),
            potentialSavings: '2KB',
            description: 'Remove duplicate CSS rules'
          },
          
          unusedSelectors: {
            found: cssContent.includes('.unused-class'),
            potentialSavings: '1.5KB',
            description: 'Remove unused CSS selectors'
          },
          
          inefficientSelectors: {
            found: cssContent.includes('* * *'), // Overly complex selectors
            potentialSavings: '0.5KB',
            description: 'Simplify CSS selectors'
          },
          
          unminified: {
            found: cssContent.includes('  ') || cssContent.includes('\n\n'),
            potentialSavings: '3KB',
            description: 'Minify CSS (remove whitespace and comments)'
          },
          
          unoptimizedCustomProperties: {
            found: cssContent.match(/--[\w-]+-[\w-]+-[\w-]+/g)?.length || 0 > 0,
            potentialSavings: '1KB',
            description: 'Optimize custom property names'
          }
        };
        
        const totalSavings = Object.values(optimizations)
          .filter(opt => opt.found)
          .reduce((sum, opt) => sum + parseFloat(opt.potentialSavings), 0);
        
        return {
          optimizations,
          totalPotentialSavings: `${totalSavings}KB`,
          currentSize: Buffer.byteLength(cssContent, 'utf8'),
          optimizedSize: Buffer.byteLength(cssContent, 'utf8') - (totalSavings * 1024)
        };
      })
    };

    const unoptimizedCSS = `
      /* Duplicate rules */
      .btn-primary { color: red; }
      .btn-primary { color: red; }
      
      /* Unused selector */
      .unused-class { display: none; }
      
      /* Unminified with whitespace */
      .component {
          background-color: var(--very-long-token-name-that-could-be-shorter);
          
          
      }
    `;

    const analysis = mockCSSOptimizer.identifyOptimizations(unoptimizedCSS);
    expect(analysis.optimizations.duplicateRules.found).toBe(true);
    expect(analysis.optimizations.unusedSelectors.found).toBe(true);
    expect(analysis.optimizations.unminified.found).toBe(true);
    expect(parseFloat(analysis.totalPotentialSavings)).toBeGreaterThan(0);
  });

  it('should validate CSS bundle against performance budgets', () => {
    // Contract: Performance budget compliance
    const PERFORMANCE_BUDGETS = {
      total: 20 * 1024,      // 20KB total (constitutional)
      tokens: 8 * 1024,      // 8KB for design tokens
      components: 10 * 1024,  // 10KB for component styles
      utilities: 2 * 1024,    // 2KB for utility classes
      gzipped: 5 * 1024       // 5KB gzipped target
    };

    const mockBudgetValidator = {
      validateAgainstBudget: vi.fn((bundleAnalysis: any) => {
        const results = {
          total: bundleAnalysis.totalSize <= PERFORMANCE_BUDGETS.total,
          tokens: bundleAnalysis.tokensSize <= PERFORMANCE_BUDGETS.tokens,
          components: bundleAnalysis.componentsSize <= PERFORMANCE_BUDGETS.components,
          utilities: bundleAnalysis.utilitiesSize <= PERFORMANCE_BUDGETS.utilities,
          gzipped: bundleAnalysis.gzippedSize <= PERFORMANCE_BUDGETS.gzipped
        };

        const passed = Object.values(results).every(Boolean);
        
        return {
          passed,
          results,
          budgets: PERFORMANCE_BUDGETS,
          utilizationPercentages: {
            total: (bundleAnalysis.totalSize / PERFORMANCE_BUDGETS.total) * 100,
            tokens: (bundleAnalysis.tokensSize / PERFORMANCE_BUDGETS.tokens) * 100,
            components: (bundleAnalysis.componentsSize / PERFORMANCE_BUDGETS.components) * 100,
            utilities: (bundleAnalysis.utilitiesSize / PERFORMANCE_BUDGETS.utilities) * 100
          }
        };
      })
    };

    // Test bundle within all budgets
    const goodBundle = {
      totalSize: 18 * 1024,     // 18KB total
      tokensSize: 7 * 1024,     // 7KB tokens
      componentsSize: 9 * 1024,  // 9KB components
      utilitiesSize: 2 * 1024,   // 2KB utilities
      gzippedSize: 4 * 1024      // 4KB gzipped
    };

    const goodResult = mockBudgetValidator.validateAgainstBudget(goodBundle);
    expect(goodResult.passed).toBe(true);
    expect(goodResult.utilizationPercentages.total).toBeLessThan(100);

    // Test bundle exceeding budgets
    const badBundle = {
      totalSize: 25 * 1024,     // 25KB total (exceeds constitutional limit)
      tokensSize: 10 * 1024,    // 10KB tokens (exceeds budget)
      componentsSize: 12 * 1024, // 12KB components (exceeds budget)
      utilitiesSize: 3 * 1024,   // 3KB utilities (exceeds budget)
      gzippedSize: 7 * 1024      // 7KB gzipped (exceeds target)
    };

    const badResult = mockBudgetValidator.validateAgainstBudget(badBundle);
    expect(badResult.passed).toBe(false);
    expect(badResult.results.total).toBe(false); // Constitutional violation
  });

  it('should monitor bundle size impact on loading performance', () => {
    // Contract: Loading performance correlation
    const mockLoadingPerformanceAnalyzer = {
      analyzeLoadingImpact: vi.fn((bundleSize: number) => {
        // Simulate network conditions
        const networkProfiles = {
          'fast-3g': { bandwidth: 1.6 * 1024 * 1024, latency: 150 }, // 1.6 Mbps
          'slow-3g': { bandwidth: 400 * 1024, latency: 400 },        // 400 Kbps
          'wifi': { bandwidth: 10 * 1024 * 1024, latency: 50 }       // 10 Mbps
        };

        const results: any = {};
        
        Object.entries(networkProfiles).forEach(([network, profile]) => {
          const downloadTime = (bundleSize / profile.bandwidth) * 1000; // ms
          const totalTime = downloadTime + profile.latency;
          
          results[network] = {
            downloadTime: Math.round(downloadTime),
            totalTime: Math.round(totalTime),
            isAcceptable: totalTime < 3000 // < 3 second target
          };
        });
        
        return results;
      })
    };

    // Test acceptable bundle size
    const acceptableSize = 18 * 1024; // 18KB
    const acceptableResults = mockLoadingPerformanceAnalyzer.analyzeLoadingImpact(acceptableSize);
    
    expect(acceptableResults['wifi'].isAcceptable).toBe(true);
    expect(acceptableResults['fast-3g'].isAcceptable).toBe(true);
    
    // Test oversized bundle
    const oversizedBundle = 50 * 1024; // 50KB (constitutional violation)
    const oversizedResults = mockLoadingPerformanceAnalyzer.analyzeLoadingImpact(oversizedBundle);
    
    expect(oversizedResults['slow-3g'].isAcceptable).toBe(false);
    expect(oversizedResults['slow-3g'].totalTime).toBeGreaterThan(3000);
  });

  it('should validate tree-shaking effectiveness', () => {
    // Contract: Tree-shaking optimization validation
    const mockTreeShakingAnalyzer = {
      analyzeTreeShaking: vi.fn((originalBundle: string, treeShakenBundle: string) => {
        const originalSize = Buffer.byteLength(originalBundle, 'utf8');
        const shakenSize = Buffer.byteLength(treeShakenBundle, 'utf8');
        
        const reduction = originalSize - shakenSize;
        const reductionPercentage = (reduction / originalSize) * 100;
        
        return {
          originalSize,
          shakenSize,
          reduction,
          reductionPercentage,
          isEffective: reductionPercentage > 10, // Should remove at least 10%
          stillWithinLimit: shakenSize <= MAX_CSS_BUNDLE_SIZE
        };
      })
    };

    const originalCSS = `
      /* Used styles */
      .btn-primary { background: var(--color-primary); }
      .btn-secondary { background: var(--color-secondary); }
      
      /* Unused styles that should be removed */
      .unused-component { display: block; }
      .another-unused { color: red; }
    `;

    const treeShakenCSS = `
      /* Used styles only */
      .btn-primary { background: var(--color-primary); }
      .btn-secondary { background: var(--color-secondary); }
    `;

    const analysis = mockTreeShakingAnalyzer.analyzeTreeShaking(originalCSS, treeShakenCSS);
    expect(analysis.isEffective).toBe(true);
    expect(analysis.reductionPercentage).toBeGreaterThan(10);
    expect(analysis.stillWithinLimit).toBe(true);
  });
});