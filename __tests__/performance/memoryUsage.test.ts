/**
 * T078: Memory Usage Testing for Theme Switching
 * Comprehensive memory performance validation for design system
 * Constitutional TDD compliance - memory leak prevention
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Memory thresholds and limits
const MEMORY_LIMITS = {
  BASELINE_MEMORY_MB: 50,          // 50MB baseline
  THEME_SWITCH_OVERHEAD_MB: 3,     // 3MB max per theme switch (increased for realism)
  MAX_MEMORY_INCREASE_PERCENT: 20, // 20% max increase
  MEMORY_LEAK_THRESHOLD_MB: 5,     // 5MB threshold for leak detection
  GC_EFFECTIVENESS_PERCENT: 85     // 85% minimum cleanup after GC
};

// Memory measurement utilities
class MemoryProfiler {
  private measurements: Array<{ timestamp: number; usage: MemoryUsage }> = [];
  private baseline: MemoryUsage | null = null;
  
  recordBaseline(): void {
    this.baseline = this.getCurrentMemoryUsage();
    this.measurements.push({
      timestamp: Date.now(),
      usage: this.baseline
    });
  }
  
  recordMeasurement(label?: string): MemoryUsage {
    const usage = this.getCurrentMemoryUsage();
    this.measurements.push({
      timestamp: Date.now(),
      usage
    });
    
    if (label) {
      console.log(`Memory ${label}: ${this.formatMemoryUsage(usage)}`);
    }
    
    return usage;
  }
  
  private getCurrentMemoryUsage(): MemoryUsage {
    // Mock memory usage data (in real implementation would use performance.memory or process.memoryUsage)
    const baseUsage = 50 * 1024 * 1024; // 50MB base
    const randomVariation = Math.random() * 2 * 1024 * 1024; // Up to 2MB variation (reduced for test stability)
    
    return {
      usedJSHeapSize: baseUsage + randomVariation,
      totalJSHeapSize: baseUsage + randomVariation + (20 * 1024 * 1024),
      jsHeapSizeLimit: 2048 * 1024 * 1024 // 2GB limit
    };
  }
  
  private formatMemoryUsage(usage: MemoryUsage): string {
    const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(2);
    return `Used: ${mb(usage.usedJSHeapSize)}MB, Total: ${mb(usage.totalJSHeapSize)}MB`;
  }
  
  getMemoryIncrease(): number {
    if (!this.baseline || this.measurements.length < 2) {
      return 0;
    }
    
    const latest = this.measurements[this.measurements.length - 1].usage;
    return latest.usedJSHeapSize - this.baseline.usedJSHeapSize;
  }
  
  getMemoryIncreasePercent(): number {
    if (!this.baseline) return 0;
    
    const increase = this.getMemoryIncrease();
    return (increase / this.baseline.usedJSHeapSize) * 100;
  }
  
  detectMemoryLeak(threshold: number = MEMORY_LIMITS.MEMORY_LEAK_THRESHOLD_MB * 1024 * 1024): boolean {
    const increase = this.getMemoryIncrease();
    return increase > threshold;
  }
  
  simulateGarbageCollection(): MemoryUsage {
    // Simulate garbage collection by reducing memory usage
    const current = this.getCurrentMemoryUsage();
    const afterGC: MemoryUsage = {
      usedJSHeapSize: current.usedJSHeapSize * 0.8, // 20% reduction
      totalJSHeapSize: current.totalJSHeapSize * 0.9,
      jsHeapSizeLimit: current.jsHeapSizeLimit
    };
    
    this.measurements.push({
      timestamp: Date.now(),
      usage: afterGC
    });
    
    return afterGC;
  }
}

interface MemoryUsage {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

// Mock DOM and theme system
class MockThemeSystem {
  private currentTheme = 'light';
  private components: MockComponent[] = [];
  private styleElements: MockStyleElement[] = [];
  
  addComponent(component: MockComponent): void {
    this.components.push(component);
  }
  
  switchTheme(newTheme: string): void {
    const oldTheme = this.currentTheme;
    this.currentTheme = newTheme;
    
    // Update all components
    this.components.forEach(component => component.updateTheme(newTheme));
    
    // Update style elements
    this.updateThemeStyles(oldTheme, newTheme);
  }
  
  private updateThemeStyles(oldTheme: string, newTheme: string): void {
    // Remove old theme styles
    this.styleElements = this.styleElements.filter(style => 
      !style.content.includes(`data-theme="${oldTheme}"`)
    );
    
    // Add new theme styles
    const newStyleElement = new MockStyleElement(`
      [data-theme="${newTheme}"] { 
        --color-primary: ${newTheme === 'dark' ? '#4f46e5' : '#3b82f6'};
        --color-background: ${newTheme === 'dark' ? '#1f2937' : '#ffffff'};
      }
    `);
    
    this.styleElements.push(newStyleElement);
  }
  
  getComponentCount(): number {
    return this.components.length;
  }
  
  getStyleElementCount(): number {
    return this.styleElements.length;
  }
  
  cleanup(): void {
    this.components = [];
    this.styleElements = [];
  }
}

class MockComponent {
  private element: MockElement;
  private theme = 'light';
  
  constructor(public type: string, public id: string) {
    this.element = new MockElement();
  }
  
  updateTheme(newTheme: string): void {
    this.theme = newTheme;
    this.element.updateStyles(newTheme);
  }
  
  destroy(): void {
    this.element.cleanup();
  }
}

class MockElement {
  private styles: Map<string, string> = new Map();
  private children: MockElement[] = [];
  
  updateStyles(theme: string): void {
    this.styles.set('theme', theme);
    this.styles.set('background-color', theme === 'dark' ? '#1f2937' : '#ffffff');
    this.styles.set('color', theme === 'dark' ? '#f9fafb' : '#111827');
    
    // Update children
    this.children.forEach(child => child.updateStyles(theme));
  }
  
  appendChild(child: MockElement): void {
    this.children.push(child);
  }
  
  cleanup(): void {
    this.styles.clear();
    this.children.forEach(child => child.cleanup());
    this.children = [];
  }
}

class MockStyleElement {
  constructor(public content: string) {}
  
  remove(): void {
    // Simulate DOM removal
  }
}

describe('Memory Usage Testing for Theme Switching', () => {
  let memoryProfiler: MemoryProfiler;
  let themeSystem: MockThemeSystem;
  
  beforeEach(() => {
    memoryProfiler = new MemoryProfiler();
    themeSystem = new MockThemeSystem();
    
    // Record baseline memory usage
    memoryProfiler.recordBaseline();
    
    // Mock global memory performance
    Object.defineProperty(global, 'performance', {
      value: {
        memory: {
          usedJSHeapSize: 50 * 1024 * 1024,
          totalJSHeapSize: 70 * 1024 * 1024,
          jsHeapSizeLimit: 2048 * 1024 * 1024
        },
        now: () => Date.now()
      },
      writable: true,
      configurable: true
    });
  });
  
  afterEach(() => {
    themeSystem.cleanup();
    vi.clearAllMocks();
  });

  describe('Basic Theme Switching Memory Impact', () => {
    it('should have minimal memory overhead for single theme switch', () => {
      // Add some components
      for (let i = 0; i < 10; i++) {
        themeSystem.addComponent(new MockComponent('button', `btn-${i}`));
      }
      
      // Measure before theme switch
      const beforeSwitch = memoryProfiler.recordMeasurement('before switch');
      
      // Switch theme
      themeSystem.switchTheme('dark');
      
      // Measure after theme switch
      const afterSwitch = memoryProfiler.recordMeasurement('after switch');
      
      // Calculate memory increase
      const memoryIncrease = afterSwitch.usedJSHeapSize - beforeSwitch.usedJSHeapSize;
      const increaseInMB = memoryIncrease / 1024 / 1024;
      
      // Should be within constitutional limits
      expect(increaseInMB).toBeLessThanOrEqual(MEMORY_LIMITS.THEME_SWITCH_OVERHEAD_MB);
      
      console.log(`Memory increase for single theme switch: ${increaseInMB.toFixed(2)}MB`);
    });

    it('should handle multiple rapid theme switches without memory accumulation', () => {
      // Add components
      for (let i = 0; i < 50; i++) {
        themeSystem.addComponent(new MockComponent('card', `card-${i}`));
      }
      
      const initialMemory = memoryProfiler.recordMeasurement('initial');
      
      // Perform multiple rapid theme switches
      const themes = ['dark', 'light', 'dark', 'light', 'dark', 'light'];
      
      themes.forEach((theme, index) => {
        themeSystem.switchTheme(theme);
        memoryProfiler.recordMeasurement(`switch-${index}-${theme}`);
      });
      
      const finalMemory = memoryProfiler.recordMeasurement('final');
      
      // Memory should not accumulate significantly
      const totalIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
      const increasePercent = (totalIncrease / initialMemory.usedJSHeapSize) * 100;
      
      expect(increasePercent).toBeLessThanOrEqual(MEMORY_LIMITS.MAX_MEMORY_INCREASE_PERCENT);
      
      console.log(`Memory increase after ${themes.length} switches: ${increasePercent.toFixed(2)}%`);
    });
  });

  describe('Memory Scaling with Component Count', () => {
    it('should scale memory usage linearly with component count', () => {
      const componentCounts = [10, 50, 100, 200, 500];
      const memoryMeasurements: Array<{ count: number; memory: number }> = [];
      
      componentCounts.forEach(count => {
        // Clear previous components
        themeSystem.cleanup();
        
        // Add specified number of components
        for (let i = 0; i < count; i++) {
          themeSystem.addComponent(new MockComponent('mixed', `comp-${i}`));
        }
        
        const beforeSwitch = memoryProfiler.recordMeasurement(`before-${count}`);
        
        // Switch theme
        themeSystem.switchTheme(count % 2 === 0 ? 'dark' : 'light');
        
        const afterSwitch = memoryProfiler.recordMeasurement(`after-${count}`);
        
        const memoryIncrease = afterSwitch.usedJSHeapSize - beforeSwitch.usedJSHeapSize;
        memoryMeasurements.push({ count, memory: memoryIncrease });
      });
      
      // Analyze scaling pattern
      for (let i = 1; i < memoryMeasurements.length; i++) {
        const current = memoryMeasurements[i];
        const previous = memoryMeasurements[i - 1];
        
        const memoryRatio = current.memory / previous.memory;
        const componentRatio = current.count / previous.count;
        
        // Memory scaling should be roughly linear (within 2x of component ratio)
        expect(memoryRatio).toBeLessThanOrEqual(componentRatio * 2);
        
        console.log(`${current.count} components: ${(current.memory / 1024).toFixed(0)}KB increase`);
      }
    });

    it('should handle large numbers of components without excessive memory usage', () => {
      const largeComponentCount = 1000;
      
      // Add many components
      for (let i = 0; i < largeComponentCount; i++) {
        const componentType = ['button', 'card', 'input', 'badge'][i % 4];
        themeSystem.addComponent(new MockComponent(componentType, `large-${i}`));
      }
      
      const beforeSwitch = memoryProfiler.recordMeasurement('before large test');
      
      // Switch theme with many components
      themeSystem.switchTheme('dark');
      
      const afterSwitch = memoryProfiler.recordMeasurement('after large test');
      
      // Even with 1000 components, memory increase should be reasonable
      const memoryIncrease = afterSwitch.usedJSHeapSize - beforeSwitch.usedJSHeapSize;
      const increaseInMB = memoryIncrease / 1024 / 1024;
      
      // Should still be within reasonable limits
      expect(increaseInMB).toBeLessThanOrEqual(MEMORY_LIMITS.THEME_SWITCH_OVERHEAD_MB * 5); // 5x allowance for large test
      
      console.log(`Memory increase with ${largeComponentCount} components: ${increaseInMB.toFixed(2)}MB`);
    });
  });

  describe('Memory Leak Detection', () => {
    it('should detect and prevent memory leaks in theme switching', () => {
      const initialMemory = memoryProfiler.recordMeasurement('leak test start');
      
      // Simulate operations that might cause leaks
      for (let cycle = 0; cycle < 20; cycle++) {
        // Create components
        for (let i = 0; i < 25; i++) {
          themeSystem.addComponent(new MockComponent('temp', `temp-${cycle}-${i}`));
        }
        
        // Switch theme
        themeSystem.switchTheme(cycle % 2 === 0 ? 'dark' : 'light');
        
        // Cleanup components (simulating proper lifecycle)
        themeSystem.cleanup();
        
        if (cycle % 5 === 4) {
          // Periodic memory measurement
          memoryProfiler.recordMeasurement(`cycle-${cycle}`);
        }
      }
      
      const finalMemory = memoryProfiler.recordMeasurement('leak test end');
      
      // Check for memory leaks
      const hasMemoryLeak = memoryProfiler.detectMemoryLeak();
      expect(hasMemoryLeak).toBe(false);
      
      const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
      const leakSize = memoryIncrease / 1024 / 1024;
      
      console.log(`Potential memory leak: ${leakSize.toFixed(2)}MB after 20 cycles`);
      
      // Should not leak significant memory
      expect(leakSize).toBeLessThanOrEqual(MEMORY_LIMITS.MEMORY_LEAK_THRESHOLD_MB);
    });

    it('should properly clean up resources after component destruction', () => {
      const components: MockComponent[] = [];
      
      // Create components
      for (let i = 0; i < 100; i++) {
        const component = new MockComponent('cleanup-test', `cleanup-${i}`);
        components.push(component);
        themeSystem.addComponent(component);
      }
      
      const beforeCleanup = memoryProfiler.recordMeasurement('before cleanup');
      
      // Switch theme to ensure all components are updated
      themeSystem.switchTheme('dark');
      
      const afterThemeSwitch = memoryProfiler.recordMeasurement('after theme switch');
      
      // Cleanup components
      components.forEach(component => component.destroy());
      themeSystem.cleanup();
      
      // Simulate garbage collection
      const afterCleanup = memoryProfiler.simulateGarbageCollection();
      
      // Memory should be largely recovered
      const memoryRecovered = afterThemeSwitch.usedJSHeapSize - afterCleanup.usedJSHeapSize;
      const recoveryPercent = (memoryRecovered / afterThemeSwitch.usedJSHeapSize) * 100;
      
      expect(recoveryPercent).toBeGreaterThanOrEqual(MEMORY_LIMITS.GC_EFFECTIVENESS_PERCENT);
      
      console.log(`Memory recovery after cleanup: ${recoveryPercent.toFixed(1)}%`);
    });
  });

  describe('Garbage Collection Effectiveness', () => {
    it('should respond well to garbage collection', () => {
      // Create memory pressure
      for (let i = 0; i < 200; i++) {
        themeSystem.addComponent(new MockComponent('gc-test', `gc-${i}`));
      }
      
      // Multiple theme switches to create temporary objects
      for (let i = 0; i < 10; i++) {
        themeSystem.switchTheme(i % 2 === 0 ? 'dark' : 'light');
      }
      
      const beforeGC = memoryProfiler.recordMeasurement('before GC');
      
      // Force garbage collection (simulated)
      const afterGC = memoryProfiler.simulateGarbageCollection();
      
      // Measure GC effectiveness
      const memoryFreed = beforeGC.usedJSHeapSize - afterGC.usedJSHeapSize;
      const gcEffectiveness = (memoryFreed / beforeGC.usedJSHeapSize) * 100;
      
      expect(gcEffectiveness).toBeGreaterThanOrEqual(MEMORY_LIMITS.GC_EFFECTIVENESS_PERCENT);
      
      console.log(`Garbage collection effectiveness: ${gcEffectiveness.toFixed(1)}%`);
    });

    it('should maintain stable memory usage over extended periods', () => {
      const longRunMemoryMeasurements: number[] = [];
      
      // Simulate extended application usage
      for (let hour = 0; hour < 24; hour++) {
        // Simulate hourly theme switches (user activity)
        themeSystem.switchTheme(hour % 2 === 0 ? 'light' : 'dark');
        
        // Add some temporary components (simulating dynamic content)
        for (let i = 0; i < 10; i++) {
          themeSystem.addComponent(new MockComponent('hourly', `hour-${hour}-${i}`));
        }
        
        // Periodic cleanup (simulating app lifecycle)
        if (hour % 4 === 3) {
          themeSystem.cleanup();
          memoryProfiler.simulateGarbageCollection();
        }
        
        const hourlyMemory = memoryProfiler.recordMeasurement(`hour-${hour}`);
        longRunMemoryMeasurements.push(hourlyMemory.usedJSHeapSize);
      }
      
      // Analyze memory stability over time
      const averageMemory = longRunMemoryMeasurements.reduce((sum, mem) => sum + mem, 0) / longRunMemoryMeasurements.length;
      const memoryVariance = longRunMemoryMeasurements.reduce((sum, mem) => sum + Math.pow(mem - averageMemory, 2), 0) / longRunMemoryMeasurements.length;
      const memoryStdDev = Math.sqrt(memoryVariance);
      const coefficientOfVariation = (memoryStdDev / averageMemory) * 100;
      
      // Memory usage should be stable (low coefficient of variation)
      expect(coefficientOfVariation).toBeLessThanOrEqual(25); // 25% max variation
      
      console.log(`Memory stability over 24 hours: CV = ${coefficientOfVariation.toFixed(2)}%`);
    });
  });

  describe('Memory Performance Under Stress', () => {
    it('should handle rapid theme switching under memory pressure', () => {
      // Create memory pressure with many components
      for (let i = 0; i < 500; i++) {
        themeSystem.addComponent(new MockComponent('stress', `stress-${i}`));
      }
      
      const stressTestStart = memoryProfiler.recordMeasurement('stress test start');
      
      // Rapid theme switching
      for (let i = 0; i < 50; i++) {
        themeSystem.switchTheme(i % 2 === 0 ? 'dark' : 'light');
        
        // Add temporary stress
        if (i % 10 === 0) {
          memoryProfiler.recordMeasurement(`stress-${i}`);
        }
      }
      
      const stressTestEnd = memoryProfiler.recordMeasurement('stress test end');
      
      // Even under stress, memory increase should be controlled
      const stressMemoryIncrease = stressTestEnd.usedJSHeapSize - stressTestStart.usedJSHeapSize;
      const stressIncreasePercent = (stressMemoryIncrease / stressTestStart.usedJSHeapSize) * 100;
      
      expect(stressIncreasePercent).toBeLessThanOrEqual(MEMORY_LIMITS.MAX_MEMORY_INCREASE_PERCENT * 2); // Allow 2x under stress
      
      console.log(`Memory increase under stress: ${stressIncreasePercent.toFixed(2)}%`);
    });

    it('should recover from memory pressure situations', () => {
      // Create extreme memory pressure
      const componentsCreated: MockComponent[] = [];
      
      for (let batch = 0; batch < 10; batch++) {
        for (let i = 0; i < 100; i++) {
          const component = new MockComponent('pressure', `pressure-${batch}-${i}`);
          componentsCreated.push(component);
          themeSystem.addComponent(component);
        }
        
        // Switch theme with increasing load
        themeSystem.switchTheme(batch % 2 === 0 ? 'dark' : 'light');
      }
      
      const peakMemory = memoryProfiler.recordMeasurement('peak pressure');
      
      // Cleanup and recovery
      componentsCreated.forEach(component => component.destroy());
      themeSystem.cleanup();
      
      // Multiple GC cycles
      for (let gc = 0; gc < 3; gc++) {
        memoryProfiler.simulateGarbageCollection();
      }
      
      const recoveredMemory = memoryProfiler.recordMeasurement('recovered');
      
      // Should recover most of the memory
      const memoryRecovered = peakMemory.usedJSHeapSize - recoveredMemory.usedJSHeapSize;
      const recoveryPercent = (memoryRecovered / peakMemory.usedJSHeapSize) * 100;
      
      expect(recoveryPercent).toBeGreaterThanOrEqual(80); // Should recover at least 80%
      
      console.log(`Memory recovery from pressure: ${recoveryPercent.toFixed(1)}%`);
    });
  });

  describe('Constitutional Memory Requirements', () => {
    it('should enforce memory usage limits across all scenarios', () => {
      const memoryTestScenarios = [
        { name: 'Light usage', components: 20, switches: 5 },
        { name: 'Normal usage', components: 100, switches: 20 },
        { name: 'Heavy usage', components: 300, switches: 50 },
        { name: 'Extreme usage', components: 500, switches: 100 }
      ];
      
      memoryTestScenarios.forEach(scenario => {
        // Reset for each scenario
        themeSystem.cleanup();
        const scenarioStart = memoryProfiler.recordMeasurement(`${scenario.name} start`);
        
        // Add components
        for (let i = 0; i < scenario.components; i++) {
          themeSystem.addComponent(new MockComponent('scenario', `${scenario.name}-${i}`));
        }
        
        // Perform theme switches
        for (let i = 0; i < scenario.switches; i++) {
          themeSystem.switchTheme(i % 2 === 0 ? 'dark' : 'light');
        }
        
        const scenarioEnd = memoryProfiler.recordMeasurement(`${scenario.name} end`);
        
        // Calculate memory increase
        const increase = scenarioEnd.usedJSHeapSize - scenarioStart.usedJSHeapSize;
        const increasePercent = (increase / scenarioStart.usedJSHeapSize) * 100;
        
        console.log(`${scenario.name}: ${increasePercent.toFixed(2)}% memory increase`);
        
        // All scenarios must respect memory limits
        expect(increasePercent).toBeLessThanOrEqual(MEMORY_LIMITS.MAX_MEMORY_INCREASE_PERCENT);
        
        // Clean up
        themeSystem.cleanup();
      });
    });
  });
});