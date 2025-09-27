/**
 * Component Migration Validation Utilities
 * Validates migration from Tailwind CSS to centralized design system
 * Constitutional TDD compliance - implements T072 requirements
 */

import fs from 'fs/promises';
import { glob } from 'glob';
import path from 'path';

export interface MigrationResult {
  file: string;
  isComplete: boolean;
  tailwindClasses: string[];
  centralizedClasses: string[];
  issues: string[];
  recommendations: string[];
}

export interface SystemMigrationStatus {
  totalFiles: number;
  migratedFiles: number;
  partiallyMigrated: number;
  notMigrated: number;
  migrationProgress: number;
  criticalIssues: string[];
  recommendations: string[];
}

export interface ClassUsageAnalysis {
  className: string;
  occurrences: number;
  files: string[];
  isTailwind: boolean;
  isCentralized: boolean;
  suggestedReplacement?: string;
}

export interface MigrationReport {
  status: SystemMigrationStatus;
  classAnalysis: ClassUsageAnalysis[];
  fileDetails: MigrationResult[];
  recommendations: {
    immediate: string[];
    longTerm: string[];
    performance: string[];
  };
}

/**
 * Component Migration Validator
 * Comprehensive validation of component migration from Tailwind to centralized design system
 */
export class ComponentMigrationValidator {
  private tailwindPatterns: RegExp[];
  private centralizedPatterns: RegExp[];
  private componentClassMap: Map<string, string>;
  private antiPatterns: RegExp[];

  constructor() {
    this.initializePatterns();
    this.initializeClassMap();
    this.initializeAntiPatterns();
  }

  /**
   * Analyze single file for migration status
   */
  async analyzeFile(filePath: string): Promise<MigrationResult> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return this.analyzeContent(filePath, content);
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
   * Analyze content for migration patterns
   */
  analyzeContent(filePath: string, content: string): MigrationResult {
    const tailwindClasses = this.extractTailwindClasses(content);
    const centralizedClasses = this.extractCentralizedClasses(content);
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check migration completeness
    const isComplete = tailwindClasses.length === 0 && centralizedClasses.length > 0;

    // Identify migration issues
    if (tailwindClasses.length > 0 && centralizedClasses.length > 0) {
      issues.push('File contains both Tailwind and centralized classes - incomplete migration');
    }

    if (tailwindClasses.length > 0 && centralizedClasses.length === 0) {
      issues.push('File not yet migrated to centralized design system');
    }

    // Check for anti-patterns
    const antiPatternIssues = this.detectAntiPatterns(content);
    issues.push(...antiPatternIssues);

    // Generate recommendations
    if (tailwindClasses.length > 0) {
      recommendations.push(`Replace ${tailwindClasses.length} Tailwind classes with centralized equivalents`);
      
      // Specific class replacement suggestions
      const uniqueTailwindClasses = [...new Set(tailwindClasses)];
      for (const tailwindClass of uniqueTailwindClasses.slice(0, 5)) {
        const replacement = this.componentClassMap.get(tailwindClass);
        if (replacement) {
          recommendations.push(`Replace '${tailwindClass}' with '${replacement}'`);
        } else {
          recommendations.push(`Create centralized class for '${tailwindClass}'`);
        }
      }
    }

    if (centralizedClasses.length === 0 && !content.includes('className')) {
      recommendations.push('Add centralized styling classes to component');
    }

    return {
      file: filePath,
      isComplete,
      tailwindClasses,
      centralizedClasses,
      issues,
      recommendations
    };
  }

  /**
   * Analyze entire component system
   */
  async analyzeSystem(componentDirectory: string, filePattern: string = '**/*.{tsx,jsx,ts,js}'): Promise<SystemMigrationStatus> {
    try {
      const pattern = path.join(componentDirectory, filePattern).replace(/\\/g, '/');
      const files = await glob(pattern);
      
      if (files.length === 0) {
        return {
          totalFiles: 0,
          migratedFiles: 0,
          partiallyMigrated: 0,
          notMigrated: 0,
          migrationProgress: 0,
          criticalIssues: ['No component files found to analyze'],
          recommendations: []
        };
      }

      const results = await Promise.all(
        files.map(file => this.analyzeFile(file))
      );

      return this.compileSystemStatus(results);
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
   * Analyze class usage patterns across codebase
   */
  async analyzeClassUsage(directory: string, filePattern: string = '**/*.{tsx,jsx,ts,js}'): Promise<ClassUsageAnalysis[]> {
    try {
      const pattern = path.join(directory, filePattern).replace(/\\/g, '/');
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

      return this.compileClassAnalysis(classUsage);
    } catch (error) {
      return [];
    }
  }

  /**
   * Generate comprehensive migration report
   */
  async generateMigrationReport(componentDirectory: string): Promise<MigrationReport> {
    const [status, classAnalysis] = await Promise.all([
      this.analyzeSystem(componentDirectory),
      this.analyzeClassUsage(componentDirectory)
    ]);

    const pattern = path.join(componentDirectory, '**/*.{tsx,jsx,ts,js}').replace(/\\/g, '/');
    const files = await glob(pattern);
    const fileDetails = await Promise.all(files.map(file => this.analyzeFile(file)));

    const recommendations = this.generateRecommendations(status, classAnalysis);

    return {
      status,
      classAnalysis,
      fileDetails,
      recommendations
    };
  }

  /**
   * Extract Tailwind utility classes from content
   */
  private extractTailwindClasses(content: string): string[] {
    const classes: string[] = [];
    
    for (const pattern of this.tailwindPatterns) {
      const matches = content.match(new RegExp(pattern.source, 'g'));
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
      const matches = content.match(new RegExp(pattern.source, 'g'));
      if (matches) {
        classes.push(...matches);
      }
    }

    // Also look for custom CSS classes that follow our naming convention
    const customClasses = content.match(/\b[a-z]+(-[a-z]+)*\b/g) || [];
    const designSystemClasses = customClasses.filter(cls => 
      cls.includes('-') && !this.isTailwindClass(cls) && cls.length > 2
    );

    classes.push(...designSystemClasses);

    return [...new Set(classes)];
  }

  /**
   * Extract all CSS classes from content
   */
  private extractAllClasses(content: string): string[] {
    const classMatches = content.match(/className\s*=\s*["'`]([^"'`]+)["'`]/g);
    if (!classMatches) return [];

    const classes: string[] = [];
    for (const match of classMatches) {
      const classNamesMatch = match.match(/["'`]([^"'`]+)["'`]/);
      if (classNamesMatch) {
        const classNames = classNamesMatch[1].split(/\s+/);
        classes.push(...classNames.filter(Boolean));
      }
    }

    return [...new Set(classes)];
  }

  /**
   * Detect anti-patterns in styling
   */
  private detectAntiPatterns(content: string): string[] {
    const issues: string[] = [];

    for (const pattern of this.antiPatterns) {
      if (pattern.test(content)) {
        if (pattern.source.includes('(p|m)(x|y|t|b|l|r)?-\\d+')) {
          issues.push('Found scattered spacing utilities - should use semantic spacing classes');
        } else if (pattern.source.includes('(text|bg|border).*-\\d+')) {
          issues.push('Found hardcoded color utilities - should use design token classes');
        } else if (pattern.source.includes('(w|h)-\\d+')) {
          issues.push('Found hardcoded sizing utilities - should use semantic size classes');
        } else if (pattern.source.includes('className="[^"]*\\s{2,}')) {
          issues.push('Found extra whitespace in className - should clean up');
        }
      }
    }

    return issues;
  }

  /**
   * Check if class is Tailwind utility
   */
  private isTailwindClass(className: string): boolean {
    return this.tailwindPatterns.some(pattern => {
      const testPattern = new RegExp(`^${pattern.source}$`);
      return testPattern.test(className);
    });
  }

  /**
   * Check if class is from centralized system
   */
  private isCentralizedClass(className: string): boolean {
    return this.centralizedPatterns.some(pattern => {
      const testPattern = new RegExp(`^${pattern.source}$`);
      return testPattern.test(className);
    });
  }

  /**
   * Compile system migration status from individual file results
   */
  private compileSystemStatus(results: MigrationResult[]): SystemMigrationStatus {
    const totalFiles = results.length;
    const migratedFiles = results.filter(r => r.isComplete).length;
    const partiallyMigrated = results.filter(r => 
      !r.isComplete && r.centralizedClasses.length > 0 && r.tailwindClasses.length > 0
    ).length;
    const notMigrated = results.filter(r => 
      r.tailwindClasses.length > 0 && r.centralizedClasses.length === 0
    ).length;
    
    const migrationProgress = totalFiles > 0 ? (migratedFiles / totalFiles) * 100 : 0;

    const criticalIssues: string[] = [];
    const recommendations: string[] = [];

    for (const result of results) {
      criticalIssues.push(...result.issues);
      recommendations.push(...result.recommendations);
    }

    return {
      totalFiles,
      migratedFiles,
      partiallyMigrated,
      notMigrated,
      migrationProgress,
      criticalIssues: [...new Set(criticalIssues)],
      recommendations: [...new Set(recommendations)]
    };
  }

  /**
   * Compile class usage analysis
   */
  private compileClassAnalysis(classUsage: Map<string, { count: number; files: Set<string> }>): ClassUsageAnalysis[] {
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
   * Generate categorized recommendations
   */
  private generateRecommendations(status: SystemMigrationStatus, classAnalysis: ClassUsageAnalysis[]): {
    immediate: string[];
    longTerm: string[];
    performance: string[];
  } {
    const immediate: string[] = [];
    const longTerm: string[] = [];
    const performance: string[] = [];

    // Immediate recommendations based on high-usage Tailwind classes
    const tailwindClasses = classAnalysis.filter(c => c.isTailwind);
    const mostUsedTailwind = tailwindClasses.slice(0, 5);

    for (const classInfo of mostUsedTailwind) {
      if (classInfo.suggestedReplacement) {
        immediate.push(`Replace '${classInfo.className}' (${classInfo.occurrences} uses) with '${classInfo.suggestedReplacement}'`);
      } else {
        immediate.push(`Create centralized class for '${classInfo.className}' (${classInfo.occurrences} uses)`);
      }
    }

    // Long-term recommendations
    if (status.migrationProgress < 100) {
      longTerm.push(`Complete migration of remaining ${status.totalFiles - status.migratedFiles} files`);
    }

    if (status.partiallyMigrated > 0) {
      longTerm.push(`Resolve ${status.partiallyMigrated} partially migrated files`);
    }

    // Performance recommendations
    if (tailwindClasses.length > 20) {
      performance.push('Consider CSS purging to remove unused Tailwind classes');
      performance.push('Bundle size could be reduced by completing migration');
    }

    if (status.migrationProgress > 50) {
      performance.push('Consider removing Tailwind CSS dependency after migration completion');
    }

    const duplicateClasses = classAnalysis.filter(c => c.occurrences > 10 && !c.isCentralized);
    if (duplicateClasses.length > 0) {
      performance.push(`Consider creating reusable components for ${duplicateClasses.length} frequently used class combinations`);
    }

    return {
      immediate,
      longTerm,
      performance
    };
  }

  /**
   * Initialize Tailwind utility patterns
   */
  private initializePatterns(): void {
    this.tailwindPatterns = [
      // Spacing utilities
      /\b(p|m|px|py|pl|pr|pt|pb|mx|my|ml|mr|mt|mb)-\d+/,
      // Sizing utilities  
      /\b(w|h|min-w|min-h|max-w|max-h)-\d+/,
      // Color utilities
      /\b(text|bg|border)-(red|blue|green|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-\d+/,
      // Layout utilities
      /\b(flex|grid|block|inline|hidden|absolute|relative|fixed|static|sticky)/,
      // Border and shadow utilities
      /\b(rounded|shadow|border)(-\w+)?/,
      // Typography utilities
      /\b(font)-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)/,
      /\b(text)-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)/,
      // Display utilities
      /\b(items|justify|content|self)-(start|end|center|between|around|evenly|stretch)/,
      // Responsive and state utilities
      /\b(sm|md|lg|xl|2xl):[a-z-]+/,
      /\b(hover|focus|active|disabled):[a-z-]+/
    ];

    this.centralizedPatterns = [
      // Component classes
      /\b(btn|button)-(primary|secondary|tertiary|danger|success|warning|info)/,
      // Form classes
      /\b(form)-(input|select|textarea|label|error|help|group|field)/,
      // Layout classes
      /\b(card|modal|nav|header|footer|sidebar|container)/,
      // Table classes
      /\b(table)-(header|row|cell|wrapper)/,
      // Status classes
      /\b(status)-(badge|indicator|dot)/,
      // Theme classes
      /\b(theme-toggle|loading|spinner|breadcrumb)/,
      // Typography classes
      /\b(text)-(primary|secondary|inverse|muted|success|danger|warning)/,
      // Spacing classes
      /\b(padding|margin|spacing)-(xs|sm|md|lg|xl|2xl)/,
      // Border classes
      /\b(border)-(radius|width)-(xs|sm|md|lg|xl)/
    ];
  }

  /**
   * Initialize class mapping from Tailwind to centralized
   */
  private initializeClassMap(): void {
    this.componentClassMap = new Map([
      // Buttons
      ['bg-blue-500', 'btn-primary'],
      ['bg-gray-500', 'btn-secondary'],
      ['bg-red-500', 'btn-danger'],
      ['bg-green-500', 'btn-success'],
      ['bg-yellow-500', 'btn-warning'],
      
      // Text colors
      ['text-white', 'text-inverse'],
      ['text-gray-900', 'text-primary'],
      ['text-gray-600', 'text-secondary'],
      ['text-gray-500', 'text-muted'],
      
      // Spacing
      ['p-1', 'padding-xs'],
      ['p-2', 'padding-sm'],
      ['p-4', 'padding-md'],
      ['p-6', 'padding-lg'],
      ['p-8', 'padding-xl'],
      ['m-1', 'margin-xs'],
      ['m-2', 'margin-sm'],
      ['m-4', 'margin-md'],
      ['m-6', 'margin-lg'],
      ['m-8', 'margin-xl'],
      
      // Borders and shapes
      ['rounded', 'border-radius-md'],
      ['rounded-sm', 'border-radius-sm'],
      ['rounded-lg', 'border-radius-lg'],
      ['border', 'border-default'],
      ['shadow', 'shadow-sm'],
      ['shadow-lg', 'shadow-lg'],
      
      // Layout
      ['flex', 'layout-flex'],
      ['grid', 'layout-grid'],
      ['hidden', 'display-hidden'],
      ['block', 'display-block'],
      ['inline', 'display-inline']
    ]);
  }

  /**
   * Initialize anti-pattern detection
   */
  private initializeAntiPatterns(): void {
    this.antiPatterns = [
      // Scattered spacing utilities
      /(p|m)(x|y|t|b|l|r)?-\d+.*?(p|m)(x|y|t|b|l|r)?-\d+/,
      // Hardcoded colors
      /(text|bg|border).*?-\d+/,
      // Hardcoded sizing
      /(w|h)-\d+/,
      // Excessive whitespace in className
      /className="[^"]*\s{2,}/,
      // Long class lists (potential for componentization)
      /className="[^"]{100,}"/
    ];
  }
}

// Export convenience instance
export const componentMigrationValidator = new ComponentMigrationValidator();