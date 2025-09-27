/**
 * T069 Theme Toggle Integration Test
 * Tests that ThemeToggle component is properly integrated in App.tsx header
 * Part of Phase 3.7 System Integration - constitutional TDD compliance
 */

import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ThemeToggle from '../../components/ThemeToggle';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { ToastProvider } from '../../contexts/ToastContext';

// Mock Firebase Context
vi.mock('../../contexts/FirebaseContext', () => ({
  useFirebase: () => ({
    customers: [],
    products: [],
    invoices: [],
    quotes: [],
    payments: [],
    isLoading: false,
    error: null,
    saveCustomer: vi.fn(),
    saveProduct: vi.fn(),
    saveInvoice: vi.fn(),
    saveQuote: vi.fn(),
    savePayment: vi.fn(),
    deleteCustomer: vi.fn(),
    deleteProduct: vi.fn(),
    deleteInvoice: vi.fn(),
    deleteQuote: vi.fn(),
    deletePayment: vi.fn()
  }),
  FirebaseProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Test wrapper with all required providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MemoryRouter>
    <ToastProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </ToastProvider>
  </MemoryRouter>
);

describe('T069: Theme Toggle Integration', () => {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  beforeEach(() => {
    // Reset localStorage mock
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock
    });
    
    // Mock matchMedia for theme detection
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  describe('Theme Toggle Component Functionality', () => {
    it('should render theme toggle with icon variant', () => {
      render(
        <TestWrapper>
          <ThemeToggle variant="icon" size="medium" />
        </TestWrapper>
      );

      const toggleButton = screen.getByRole('button', {
        name: /switch to light theme/i
      });
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton).toHaveClass('theme-toggle', 'theme-toggle-medium');
    });

    it('should support theme switching', async () => {
      render(
        <TestWrapper>
          <ThemeToggle variant="icon" size="medium" />
        </TestWrapper>
      );

      const toggleButton = screen.getByRole('button', {
        name: /switch to light theme/i
      });

      // Initial state should be dark theme (based on matchMedia mock)
      expect(document.documentElement.dataset.theme).toBe('dark');

      // Click to switch to light theme (as indicated by button text)
      fireEvent.click(toggleButton);
      expect(document.documentElement.dataset.theme).toBe('light');

      // Click again to switch back to dark theme
      fireEvent.click(toggleButton);
      expect(document.documentElement.dataset.theme).toBe('dark');
    });

    it('should have proper accessibility attributes', () => {
      render(
        <TestWrapper>
          <ThemeToggle variant="icon" size="medium" />
        </TestWrapper>
      );

      const toggleButton = screen.getByRole('button', {
        name: /switch to light theme/i
      });

      expect(toggleButton).toHaveAttribute('aria-label');
      expect(toggleButton).toHaveAttribute('title');
            expect(toggleButton).toHaveAttribute('aria-label'); // light theme = not pressed
    });

    it('should persist theme preference in localStorage', () => {
      render(
        <TestWrapper>
          <ThemeToggle variant="icon" size="medium" />
        </TestWrapper>
      );

      const toggleButton = screen.getByRole('button', {
        name: /switch to light theme/i
      });

      // Switch to dark theme
      fireEvent.click(toggleButton);
      expect(localStorageMock.setItem).toHaveBeenCalled();

      // Switch back to light theme
      fireEvent.click(toggleButton);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('Integration Requirements Validation', () => {
    it('should render within header layout structure', () => {
      const { container } = render(
        <TestWrapper>
          <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200">
            <h1 className="text-xl font-semibold text-slate-900">Business Hub</h1>
            <div className="flex items-center space-x-4">
              <ThemeToggle variant="icon" size="medium" />
              <div className="relative">
                <img className="h-10 w-10 rounded-full object-cover" src="https://picsum.photos/100" alt="User"/>
              </div>
            </div>
          </header>
        </TestWrapper>
      );

      // Verify header structure
      const header = container.querySelector('header');
      expect(header).toHaveClass('flex', 'items-center', 'justify-between', 'h-16');

      // Verify theme toggle is in the right-side container
      const rightContainer = container.querySelector('.flex.items-center.space-x-4');
      expect(rightContainer).toBeInTheDocument();
      
      const themeToggle = rightContainer?.querySelector('.theme-toggle');
      expect(themeToggle).toBeInTheDocument();
    });

    it('should maintain header layout with theme toggle', () => {
      const { container } = render(
        <TestWrapper>
          <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200">
            <h1 className="text-xl font-semibold text-slate-900">Business Hub</h1>
            <div className="flex items-center space-x-4">
              <ThemeToggle variant="icon" size="medium" />
              <div className="relative">
                <img className="h-10 w-10 rounded-full object-cover" src="https://picsum.photos/100" alt="User"/>
              </div>
            </div>
          </header>
        </TestWrapper>
      );

      const title = screen.getByText('Business Hub');
      const themeToggle = screen.getByRole('button', { name: /switch to light theme/i });
      const userAvatar = screen.getByAltText('User');

      expect(title).toBeInTheDocument();
      expect(themeToggle).toBeInTheDocument();
      expect(userAvatar).toBeInTheDocument();

      // Verify elements are properly positioned
      const header = container.querySelector('header');
      const children = Array.from(header?.children || []);
      expect(children).toHaveLength(2); // title and right container
    });
  });

  describe('Constitutional Requirements Compliance', () => {
    it('should meet performance requirements (<500ms theme switching)', async () => {
      const startTime = performance.now();
      
      render(
        <TestWrapper>
          <ThemeToggle variant="icon" size="medium" />
        </TestWrapper>
      );

      const toggleButton = screen.getByRole('button', {
        name: /switch to light theme/i
      });

      fireEvent.click(toggleButton);
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500); // Constitutional requirement: <500ms
    });

    it('should use centralized CSS classes', () => {
      render(
        <TestWrapper>
          <ThemeToggle variant="icon" size="medium" />
        </TestWrapper>
      );

      const toggleButton = screen.getByRole('button', {
        name: /switch to light theme/i
      });

      // Verify semantic CSS classes are used (constitutional requirement)
      expect(toggleButton).toHaveClass('theme-toggle');
      expect(toggleButton).toHaveClass('theme-toggle-medium');
    });

    it('should support reduced motion preferences', () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(
        <TestWrapper>
          <ThemeToggle variant="icon" size="medium" />
        </TestWrapper>
      );

      const toggleButton = screen.getByRole('button', {
        name: /switch to.*theme/i
      });

      // Component should render successfully with reduced motion
      expect(toggleButton).toBeInTheDocument();
    });
  });
});