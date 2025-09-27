import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, expect, vi } from 'vitest';

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia for theme testing
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage for theme persistence testing
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock performance.now for theme switching performance tests
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now())
  }
});

// Custom matchers for design system testing
expect.extend({
  toHaveDesignToken(element, tokenName) {
    const computedStyle = window.getComputedStyle(element);
    const tokenValue = computedStyle.getPropertyValue(`--${tokenName}`);
    
    return {
      message: () => `expected element to have design token --${tokenName}`,
      pass: tokenValue !== ''
    };
  },
  
  toHaveSemanticClass(element, className) {
    const classList = Array.from(element.classList);
    const hasClass = classList.includes(className);
    
    return {
      message: () => `expected element to have semantic class ${className}`,
      pass: hasClass
    };
  }
});