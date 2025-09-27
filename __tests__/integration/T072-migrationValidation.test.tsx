/**
 * T072: Migration Validation Scripts
 * Validate component migration from Tailwind to centralized design system
 * Part of Phase 3.7 System Integration - constitutional TDD compliance
 */

import fs from 'fs/promises';
import { glob } from 'glob';
import path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Migration validation interfaces
interface MigrationResult {
  file: string;
  isComplete: boolean;
  tailwindClasses: string[];
  centralizedClasses: string[];
  issues: string[];
  recommendations: string[];
}

interface SystemMigrationStatus {
  totalFiles: number;
  migratedFiles: number;
  partiallyMigrated: number;
  notMigrated: number;
  migrationProgress: number;
  criticalIssues: string[];
  recommendations: string[];
}

interface ClassUsageAnalysis {
  className: string;
  occurrences: number;
  files: string[];
  isTailwind: boolean;
  isCentralized: boolean;
  suggestedReplacement?: string;
}

/**
 * Component Migration Validator
 * Validates migration progress from Tailwind to centralized system
 */
class ComponentMigrationValidator {
  private tailwindPatterns: RegExp[];
  private centralizedPatterns: RegExp[];
  private componentClassMap: Map<string, string>;

  constructor() {
    // Common Tailwind utility patterns
    this.tailwindPatterns = [
      /\b(p|m|px|py|pl|pr|pt|pb|mx|my|ml|mr|mt|mb)-\d+/g,
      /\b(w|h)-\d+/g,
      /\b(text|bg|border)-(red|blue|green|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|fuchsia|rose|white|black)-(\d+|white|black)?/g,
      /\b(flex|grid|block|inline|hidden)/g,
      /\b(rounded|shadow|border)(-\w+)?/g,
      /\b(font)-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)/g,
      /\b(text)-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)/g,
      /\b(fixed|absolute|relative|static|sticky)/g,
      /\b(inset|top|right|bottom|left)-\d+/g,
      /\b(bg-opacity|text-opacity)-\d+/g,
      /\b(items|justify)-(start|end|center|between|around|evenly)/g,
      /\b(max-w)-\w+/g
    ];

    // Centralized design system patterns
    this.centralizedPatterns = [
      /\b(btn|button)-(primary|secondary|tertiary|danger|success|warning)/g,
      /\b(form)-(input|select|textarea|label|error|help)/g,
      /\b(card|modal|nav|header|footer|sidebar)/g,
      /\b(table)-(header|row|cell)/g,
      /\b(status)-(badge|indicator)/g,
      /\b(theme-toggle|loading|spinner)/g
    ];

    // Map of common Tailwind classes to centralized equivalents
    this.componentClassMap = new Map([
      ['bg-blue-500', 'btn-primary'],
      ['bg-gray-500', 'btn-secondary'],
      ['text-white', 'text-inverse'],
      ['p-4', 'padding-md'],
      ['m-4', 'margin-md'],
      ['rounded', 'border-radius-md'],
      ['shadow', 'shadow-sm'],
      ['border', 'border-default'],
      ['flex', 'layout-flex'],
      ['grid', 'layout-grid'],
      ['hidden', 'display-hidden'],
      ['block', 'display-block']
    ]);
  }

  /**
   * Analyze a single file for migration status
   */
  async analyzeFile(filePath: string): Promise<MigrationResult> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const tailwindClasses = this.extractTailwindClasses(content);
      const centralizedClasses = this.extractCentralizedClasses(content);
      const issues: string[] = [];
      const recommendations: string[] = [];

      // Check for migration issues
      if (tailwindClasses.length > 0 && centralizedClasses.length > 0) {
        issues.push('File contains both Tailwind and centralized classes - incomplete migration');
      }

      if (tailwindClasses.length > 0) {
        recommendations.push(`Replace ${tailwindClasses.length} Tailwind classes with centralized equivalents`);
        
        // Suggest specific replacements
        for (const tailwindClass of tailwindClasses) {
          const replacement = this.componentClassMap.get(tailwindClass);
          if (replacement) {
            recommendations.push(`Replace '${tailwindClass}' with '${replacement}'`);
          }
        }
      }

      // Check for common anti-patterns
      if (content.includes('className="') && (content.includes('py-') && content.includes('px-') || content.includes('p-'))) {
        issues.push('Found scattered padding utilities - should use semantic spacing classes');
      }

      if (content.match(/className="[^"]*\b(text|bg|border)-(\w+(-\d+)?|white|black)/)) {
        issues.push('Found hardcoded color utilities - should use design token classes');
      }

      const isComplete = tailwindClasses.length === 0 && centralizedClasses.length > 0;

      return {
        file: filePath,
        isComplete,
        tailwindClasses,
        centralizedClasses,
        issues,
        recommendations
      };
    } catch (error) {
      return {
        file: filePath,
        isComplete: false,
        tailwindClasses: [],
        centralizedClasses: [],
        issues: [`Failed to analyze file: ${error instanceof Error ? error.message : 'Unknown error'}`],
        recommendations: []
      };
    }
  }

  /**
   * Analyze entire component directory
   */
  async analyzeSystem(componentDirectory: string): Promise<SystemMigrationStatus> {
    try {
      const pattern = path.join(componentDirectory, '**/*.{tsx,jsx,ts,js}').replace(/\\/g, '/');
      const files = await glob(pattern);
      
      const results = await Promise.all(
        files.map(file => this.analyzeFile(file))
      );

      const migratedFiles = results.filter(r => r.isComplete).length;
      const partiallyMigrated = results.filter(r => !r.isComplete && r.centralizedClasses.length > 0).length;
      const notMigrated = results.filter(r => r.tailwindClasses.length > 0 && r.centralizedClasses.length === 0).length;
      
      const migrationProgress = files.length > 0 ? (migratedFiles / files.length) * 100 : 0;

      const criticalIssues: string[] = [];
      const recommendations: string[] = [];

      for (const result of results) {
        criticalIssues.push(...result.issues);
        recommendations.push(...result.recommendations);
      }

      return {
        totalFiles: files.length,
        migratedFiles,
        partiallyMigrated,
        notMigrated,
        migrationProgress,
        criticalIssues: [...new Set(criticalIssues)],
        recommendations: [...new Set(recommendations)]
      };
    } catch (error) {
      return {
        totalFiles: 0,
        migratedFiles: 0,
        partiallyMigrated: 0,
        notMigrated: 0,
        migrationProgress: 0,
        criticalIssues: [`Failed to analyze system: ${error instanceof Error ? error.message : 'Unknown error'}`],
        recommendations: []
      };
    }
  }

  /**
   * Analyze class usage across the codebase
   */
  async analyzeClassUsage(directory: string): Promise<ClassUsageAnalysis[]> {
    const pattern = path.join(directory, '**/*.{tsx,jsx,ts,js}').replace(/\\/g, '/');
    const files = await glob(pattern);
    const classUsage = new Map<string, { count: number; files: Set<string> }>();

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const classes = this.extractAllClasses(content);
        
        for (const className of classes) {
          if (!classUsage.has(className)) {
            classUsage.set(className, { count: 0, files: new Set() });
          }
          const usage = classUsage.get(className)!;
          usage.count++;
          usage.files.add(file);
        }
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }

    const analysis: ClassUsageAnalysis[] = [];
    
    for (const [className, usage] of classUsage.entries()) {
      const isTailwind = this.isTailwindClass(className);
      const isCentralized = this.isCentralizedClass(className);
      const suggestedReplacement = this.componentClassMap.get(className);

      analysis.push({
        className,
        occurrences: usage.count,
        files: Array.from(usage.files),
        isTailwind,
        isCentralized,
        suggestedReplacement
      });
    }

    return analysis.sort((a, b) => b.occurrences - a.occurrences);
  }

  /**
   * Generate migration report
   */
  async generateMigrationReport(componentDirectory: string): Promise<{
    status: SystemMigrationStatus;
    classAnalysis: ClassUsageAnalysis[];
    fileDetails: MigrationResult[];
    recommendations: {
      immediate: string[];
      longTerm: string[];
      performance: string[];
    };
  }> {
    const status = await this.analyzeSystem(componentDirectory);
    const classAnalysis = await this.analyzeClassUsage(componentDirectory);
    
    const pattern = path.join(componentDirectory, '**/*.{tsx,jsx,ts,js}').replace(/\\/g, '/');
    const files = await glob(pattern);
    const fileDetails = await Promise.all(files.map(file => this.analyzeFile(file)));

    // Generate categorized recommendations
    const immediate: string[] = [];
    const longTerm: string[] = [];
    const performance: string[] = [];

    const tailwindClasses = classAnalysis.filter(c => c.isTailwind);
    const mostUsedTailwind = tailwindClasses.slice(0, 5);

    for (const classInfo of mostUsedTailwind) {
      if (classInfo.suggestedReplacement) {
        immediate.push(`Replace '${classInfo.className}' (${classInfo.occurrences} uses) with '${classInfo.suggestedReplacement}'`);
      } else {
        immediate.push(`Create centralized class for '${classInfo.className}' (${classInfo.occurrences} uses)`);
      }
    }

    if (status.migrationProgress < 100) {
      longTerm.push(`Complete migration of remaining ${status.totalFiles - status.migratedFiles} files`);
    }

    if (tailwindClasses.length > 20) {
      performance.push('Consider CSS purging to remove unused Tailwind classes');
      performance.push('Bundle size could be reduced by completing migration');
    }

    return {
      status,
      classAnalysis,
      fileDetails,
      recommendations: {
        immediate,
        longTerm,
        performance
      }
    };
  }

  /**
   * Extract Tailwind classes from content
   */
  private extractTailwindClasses(content: string): string[] {
    const classes: string[] = [];
    
    for (const pattern of this.tailwindPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        classes.push(...matches);
      }
    }

    return [...new Set(classes)];
  }

  /**
   * Extract centralized design system classes
   */
  private extractCentralizedClasses(content: string): string[] {
    const classes: string[] = [];
    
    for (const pattern of this.centralizedPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        classes.push(...matches);
      }
    }

    return [...new Set(classes)];
  }

  /**
   * Extract all CSS classes from content
   */
  private extractAllClasses(content: string): string[] {
    const classMatches = content.match(/className="([^"]*)"/g);
    if (!classMatches) return [];

    const classes: string[] = [];
    for (const match of classMatches) {
      const classNames = match.replace(/className="|"/g, '').split(/\s+/);
      classes.push(...classNames.filter(Boolean));
    }

    return [...new Set(classes)];
  }

  /**
   * Check if class is Tailwind utility
   */
  private isTailwindClass(className: string): boolean {
    return this.tailwindPatterns.some(pattern => {
      pattern.lastIndex = 0; // Reset regex state
      return pattern.test(className);
    });
  }

  /**
   * Check if class is from centralized system
   */
  private isCentralizedClass(className: string): boolean {
    return this.centralizedPatterns.some(pattern => {
      pattern.lastIndex = 0; // Reset regex state
      return pattern.test(className);
    });
  }
}

describe('T072: Migration Validation Scripts', () => {
  let migrationValidator: ComponentMigrationValidator;

  beforeEach(() => {
    migrationValidator = new ComponentMigrationValidator();

    // Mock file system operations
    vi.mock('glob', async () => {
      return {
        glob: vi.fn().mockResolvedValue([
          'components/Button.tsx',
          'components/Form.tsx',
          'components/Modal.tsx',
          'components/Legacy.tsx'
        ])
      };
    });

    vi.spyOn(fs, 'readFile').mockImplementation(async (filePath: string) => {
      const fileName = path.basename(filePath as string);
      
      switch (fileName) {
        case 'Button.tsx': // Fully migrated
          return `
            export const Button = ({ children, variant = 'primary' }) => (
              <button className="btn-primary focus-ring">
                {children}
              </button>
            );
          `;
        
        case 'Form.tsx': // Partially migrated
          return `
            export const Form = () => (
              <form className="form-container p-4 bg-white rounded shadow">
                <input className="form-input" />
                <button className="btn-primary">Submit</button>
              </form>
            );
          `;
        
        case 'Modal.tsx': // Not migrated
          return `
            export const Modal = () => (
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
                <div className="bg-white p-6 rounded-lg shadow-xl max-w-md">
                  <h2 className="text-lg font-semibold mb-4">Modal Title</h2>
                  <p className="text-gray-600">Modal content</p>
                </div>
              </div>
            );
          `;
        
        case 'Legacy.tsx': // Mixed migration
          return `
            export const Legacy = () => (
              <div className="card p-4 bg-blue-500 text-white rounded">
                <button className="btn-secondary mr-2">Cancel</button>
                <button className="bg-green-500 px-4 py-2 rounded">OK</button>
              </div>
            );
          `;
        
        default:
          return '';
      }
    });
  });

  describe('Individual File Analysis', () => {
    it('should identify fully migrated components', async () => {
      const result = await migrationValidator.analyzeFile('components/Button.tsx');

      expect(result.isComplete).toBe(true);
      expect(result.tailwindClasses).toHaveLength(0);
      expect(result.centralizedClasses.length).toBeGreaterThan(0);
      expect(result.centralizedClasses).toContain('btn-primary');
      expect(result.issues).toHaveLength(0);
    });

    it('should identify partially migrated components', async () => {
      const result = await migrationValidator.analyzeFile('components/Form.tsx');



      expect(result.isComplete).toBe(false);
      expect(result.tailwindClasses.length).toBeGreaterThan(0);
      expect(result.centralizedClasses.length).toBeGreaterThan(0);
      expect(result.issues.some(issue => issue.includes('incomplete migration'))).toBe(true);
    });

    it('should identify non-migrated components', async () => {
      const result = await migrationValidator.analyzeFile('components/Modal.tsx');

      expect(result.isComplete).toBe(false);
      expect(result.tailwindClasses.length).toBeGreaterThan(0);
      expect(result.centralizedClasses).toHaveLength(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should detect anti-patterns in component styling', async () => {
      const result = await migrationValidator.analyzeFile('components/Form.tsx');

      // The form should have scattered padding and hardcoded colors based on its content
      const hasScatteredUtilities = result.issues.some(issue => issue.includes('scattered'));
      const hasHardcodedColors = result.issues.some(issue => issue.includes('hardcoded'));
      expect(hasScatteredUtilities || hasHardcodedColors).toBe(true);
    });
  });

  describe('System-wide Migration Analysis', () => {
    it('should analyze entire component system', async () => {
      const status = await migrationValidator.analyzeSystem('./components');

      expect(status.totalFiles).toBe(4);
      expect(status.migratedFiles).toBeGreaterThan(0);
      expect(status.migrationProgress).toBeGreaterThan(0);
      expect(status.migrationProgress).toBeLessThanOrEqual(100);
    });

    it('should categorize migration status correctly', async () => {
      const status = await migrationValidator.analyzeSystem('./components');

      expect(status.migratedFiles).toBeDefined();
      expect(status.partiallyMigrated).toBeDefined();
      expect(status.notMigrated).toBeDefined();
      expect(status.migratedFiles + status.partiallyMigrated + status.notMigrated).toBeLessThanOrEqual(status.totalFiles);
    });

    it('should collect system-wide issues and recommendations', async () => {
      const status = await migrationValidator.analyzeSystem('./components');

      expect(status.criticalIssues).toBeInstanceOf(Array);
      expect(status.recommendations).toBeInstanceOf(Array);
      expect(status.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Class Usage Analysis', () => {
    it('should analyze class usage patterns', async () => {
      const analysis = await migrationValidator.analyzeClassUsage('./components');

      expect(analysis).toBeInstanceOf(Array);
      expect(analysis.length).toBeGreaterThan(0);
      
      const hasClasses = analysis.some(item => item.occurrences > 0);
      expect(hasClasses).toBe(true);
    });

    it('should identify most frequently used classes', async () => {
      const analysis = await migrationValidator.analyzeClassUsage('./components');

      // Should be sorted by occurrence count (descending)
      for (let i = 1; i < analysis.length; i++) {
        expect(analysis[i].occurrences).toBeLessThanOrEqual(analysis[i - 1].occurrences);
      }
    });

    it('should distinguish between Tailwind and centralized classes', async () => {
      const analysis = await migrationValidator.analyzeClassUsage('./components');

      const tailwindClasses = analysis.filter(c => c.isTailwind);
      const centralizedClasses = analysis.filter(c => c.isCentralized);

      expect(tailwindClasses.length).toBeGreaterThan(0);
      expect(centralizedClasses.length).toBeGreaterThan(0);
    });

    it('should suggest replacement classes', async () => {
      const analysis = await migrationValidator.analyzeClassUsage('./components');

      const classesWithSuggestions = analysis.filter(c => c.suggestedReplacement);
      expect(classesWithSuggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Migration Report Generation', () => {
    it('should generate comprehensive migration report', async () => {
      const report = await migrationValidator.generateMigrationReport('./components');

      expect(report.status).toBeDefined();
      expect(report.classAnalysis).toBeInstanceOf(Array);
      expect(report.fileDetails).toBeInstanceOf(Array);
      expect(report.recommendations).toBeDefined();
      
      expect(report.recommendations.immediate).toBeInstanceOf(Array);
      expect(report.recommendations.longTerm).toBeInstanceOf(Array);
      expect(report.recommendations.performance).toBeInstanceOf(Array);
    });

    it('should prioritize recommendations by impact', async () => {
      const report = await migrationValidator.generateMigrationReport('./components');

      // Immediate recommendations should focus on high-usage classes
      expect(report.recommendations.immediate.length).toBeGreaterThan(0);
      
      // Should include usage counts in recommendations
      const hasUsageCounts = report.recommendations.immediate.some(rec => 
        rec.includes('uses') || rec.includes('occurrences')
      );
      expect(hasUsageCounts).toBe(true);
    });

    it('should identify performance optimization opportunities', async () => {
      const report = await migrationValidator.generateMigrationReport('./components');

      // Should suggest performance optimizations if many Tailwind classes remain
      const tailwindClasses = report.classAnalysis.filter(c => c.isTailwind);
      if (tailwindClasses.length > 10) {
        expect(report.recommendations.performance.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Constitutional Requirements Compliance', () => {
    it('should enforce complete migration validation', async () => {
      const status = await migrationValidator.analyzeSystem('./components');

      expect(status.migrationProgress).toBeGreaterThanOrEqual(0);
      expect(status.migrationProgress).toBeLessThanOrEqual(100);
      expect(status.totalFiles).toBeGreaterThan(0);
    });

    it('should maintain validation performance', async () => {
      const startTime = performance.now();
      await migrationValidator.analyzeSystem('./components');
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should provide actionable migration guidance', async () => {
      const report = await migrationValidator.generateMigrationReport('./components');

      expect(report.recommendations.immediate.length).toBeGreaterThan(0);
      
      // Each recommendation should be specific and actionable
      const actionableRecommendations = report.recommendations.immediate.filter(rec =>
        rec.includes('Replace') || rec.includes('Create') || rec.includes('Remove')
      );
      
      expect(actionableRecommendations.length).toBeGreaterThan(0);
    });

    it('should detect critical migration blockers', async () => {
      const status = await migrationValidator.analyzeSystem('./components');

      // Should identify mixed migration states as critical issues
      const mixedMigrationIssues = status.criticalIssues.filter(issue =>
        issue.includes('incomplete') || issue.includes('mixed')
      );

      if (status.partiallyMigrated > 0) {
        expect(mixedMigrationIssues.length).toBeGreaterThan(0);
      }
    });

    it('should validate design system consistency', async () => {
      const analysis = await migrationValidator.analyzeClassUsage('./components');

      const centralizedClasses = analysis.filter(c => c.isCentralized);
      
      // Should have centralized classes from our design system
      const hasDesignSystemClasses = centralizedClasses.some(c => 
        c.className.startsWith('btn-') ||
        c.className.startsWith('form-') ||
        c.className.startsWith('card')
      );

      expect(hasDesignSystemClasses).toBe(true);
    });
  });
});