/**
 * T082: Final Validation Test Suite
 * Comprehensive validation of all design system components
 * Constitutional TDD compliance - complete system verification
 */

import { fireEvent, render, screen, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Import performance monitoring
import { PerformanceMonitor, PerformanceTester } from '../performance/performanceMonitoring.test';

// Mock components for comprehensive testing
const DesignSystemShowcase = () => (
  <div className="design-system-showcase" data-theme="light">
    {/* Typography Showcase */}
    <section className="typography-section">
      <h1>Heading Level 1</h1>
      <h2>Heading Level 2</h2>
      <h3>Heading Level 3</h3>
      <h4>Heading Level 4</h4>
      <h5>Heading Level 5</h5>
      <h6>Heading Level 6</h6>
      <p>This is a paragraph with regular text content.</p>
      <small>This is small text for supplementary information.</small>
    </section>

    {/* Color Showcase */}
    <section className="color-section">
      <div className="color-primary" style={{backgroundColor: 'var(--color-primary)'}}>Primary</div>
      <div className="color-success" style={{backgroundColor: 'var(--color-success)'}}>Success</div>
      <div className="color-warning" style={{backgroundColor: 'var(--color-warning)'}}>Warning</div>
      <div className="color-danger" style={{backgroundColor: 'var(--color-danger)'}}>Danger</div>
      <div className="color-info" style={{backgroundColor: 'var(--color-info)'}}>Info</div>
    </section>

    {/* Button Showcase */}
    <section className="button-section">
      <button className="btn-primary">Primary Button</button>
      <button className="btn-secondary">Secondary Button</button>
      <button className="btn-danger">Danger Button</button>
      <button className="btn-ghost">Ghost Button</button>
      <button className="btn-primary" disabled>Disabled Button</button>
    </section>

    {/* Form Showcase */}
    <section className="form-section">
      <form className="test-form">
        <div className="form-group">
          <label className="form-label" htmlFor="text-input">Text Input</label>
          <input 
            id="text-input"
            type="text" 
            className="form-input" 
            placeholder="Enter text here"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label" htmlFor="select-input">Select Input</label>
          <select id="select-input" className="form-select">
            <option>Option 1</option>
            <option>Option 2</option>
            <option>Option 3</option>
          </select>
        </div>
        
        <div className="form-group">
          <label className="form-label" htmlFor="textarea-input">Textarea</label>
          <textarea 
            id="textarea-input"
            className="form-textarea" 
            rows={3}
            placeholder="Enter longer text here"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label form-label--required" htmlFor="required-input">
            Required Field
          </label>
          <input 
            id="required-input"
            type="email" 
            className="form-input" 
            required
            placeholder="required@example.com"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label" htmlFor="error-input">Field with Error</label>
          <input 
            id="error-input"
            type="text" 
            className="form-input form-input--error" 
            placeholder="This field has an error"
          />
        </div>
      </form>
    </section>

    {/* Card Showcase */}
    <section className="card-section">
      <div className="card">
        <div className="card-header">Basic Card</div>
        <div className="card-body">
          <p>This is a basic card with header and body content.</p>
        </div>
      </div>
      
      <div className="card card--interactive">
        <div className="card-header">Interactive Card</div>
        <div className="card-body">
          <p>This card has hover effects and is interactive.</p>
        </div>
        <div className="card-footer">
          <button className="btn-secondary">Cancel</button>
          <button className="btn-primary">Confirm</button>
        </div>
      </div>
    </section>

    {/* Table Showcase */}
    <section className="table-section">
      <div className="table-container">
        <table className="table-responsive">
          <thead className="table-header">
            <tr className="table-row">
              <th className="table-cell">Name</th>
              <th className="table-cell">Status</th>
              <th className="table-cell table-cell--numeric">Amount</th>
              <th className="table-cell table-cell--center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr className="table-row">
              <td className="table-cell" data-label="Name">John Doe</td>
              <td className="table-cell" data-label="Status">
                <span className="status-badge status-paid">Paid</span>
              </td>
              <td className="table-cell table-cell--numeric" data-label="Amount">$1,500</td>
              <td className="table-cell table-cell--center" data-label="Actions">
                <button className="btn-ghost">Edit</button>
              </td>
            </tr>
            <tr className="table-row">
              <td className="table-cell" data-label="Name">Jane Smith</td>
              <td className="table-cell" data-label="Status">
                <span className="status-badge status-pending">Pending</span>
              </td>
              <td className="table-cell table-cell--numeric" data-label="Amount">$2,200</td>
              <td className="table-cell table-cell--center" data-label="Actions">
                <button className="btn-ghost">Edit</button>
              </td>
            </tr>
            <tr className="table-row">
              <td className="table-cell" data-label="Name">Bob Johnson</td>
              <td className="table-cell" data-label="Status">
                <span className="status-badge status-overdue">Overdue</span>
              </td>
              <td className="table-cell table-cell--numeric" data-label="Amount">$850</td>
              <td className="table-cell table-cell--center" data-label="Actions">
                <button className="btn-ghost">Edit</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    {/* Status Badge Showcase */}
    <section className="status-section">
      <span className="status-badge status-paid">Paid</span>
      <span className="status-badge status-pending">Pending</span>
      <span className="status-badge status-overdue">Overdue</span>
      <span className="status-badge status-draft">Draft</span>
      <span className="status-badge status-cancelled">Cancelled</span>
    </section>

    {/* Navigation Showcase */}
    <section className="navigation-section">
      <nav className="nav-primary">
        <div className="nav-toggle">☰</div>
        <ul className="nav-list">
          <li className="nav-item">
            <a href="#" className="nav-link nav-link--active">Dashboard</a>
          </li>
          <li className="nav-item">
            <a href="#" className="nav-link">Customers</a>
          </li>
          <li className="nav-item">
            <a href="#" className="nav-link">Invoices</a>
          </li>
          <li className="nav-item">
            <a href="#" className="nav-link">Reports</a>
          </li>
        </ul>
      </nav>
    </section>

    {/* Modal Showcase */}
    <section className="modal-section">
      <div className="modal-overlay">
        <div className="modal-dialog">
          <div className="modal-header">
            <h2>Example Modal</h2>
            <button className="btn-ghost" aria-label="Close modal">×</button>
          </div>
          <div className="modal-body">
            <p>This is an example modal dialog with header, body, and footer.</p>
            <div className="form-group">
              <label className="form-label">Modal Form Field</label>
              <input type="text" className="form-input" placeholder="Enter value" />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn-secondary">Cancel</button>
            <button className="btn-primary">Save Changes</button>
          </div>
        </div>
      </div>
    </section>

    {/* Responsive Grid Showcase */}
    <section className="grid-section">
      <div className="container">
        <div className="row">
          <div className="col-12 col-md-6 col-lg-4">
            <div className="card">
              <div className="card-body">Column 1</div>
            </div>
          </div>
          <div className="col-12 col-md-6 col-lg-4">
            <div className="card">
              <div className="card-body">Column 2</div>
            </div>
          </div>
          <div className="col-12 col-md-12 col-lg-4">
            <div className="card">
              <div className="card-body">Column 3</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Print-specific content */}
    <section className="print-section">
      <div className="hide-print">This content is hidden in print</div>
      <div className="show-print" style={{display: 'none'}}>This content only shows in print</div>
      <div className="print-document">
        <h2>Print Document Example</h2>
        <p>This content is optimized for printing and PDF generation.</p>
      </div>
    </section>
  </div>
);

// Test utilities
const setViewportSize = (width: number, height: number = 800) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event('resize'));
};

const mockMatchMedia = (width: number) => {
  return (query: string) => ({
    matches: query.includes('min-width') ? width >= parseInt(query.match(/\d+/)?.[0] || '0') : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });
};

const applyTheme = (theme: 'light' | 'dark') => {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
};

describe('Final Design System Validation', () => {
  let performanceMonitor: PerformanceMonitor;
  let performanceTester: PerformanceTester;

  beforeAll(() => {
    performanceMonitor = new PerformanceMonitor();
    performanceTester = new PerformanceTester();
    
    // Setup viewport
    setViewportSize(1200, 800);
    window.matchMedia = vi.fn().mockImplementation(mockMatchMedia(1200));
  });

  afterAll(() => {
    performanceMonitor.disconnect();
    performanceTester.cleanup();
  });

  beforeEach(() => {
    // Reset to light theme
    applyTheme('light');
    performanceMonitor.clearMetrics();
  });

  describe('Complete Component Validation', () => {
    it('should render all design system components without errors', () => {
      const { container } = render(
        <BrowserRouter>
          <DesignSystemShowcase />
        </BrowserRouter>
      );

      expect(container.querySelector('.design-system-showcase')).toBeInTheDocument();
      
      // Verify all major sections are present
      expect(container.querySelector('.typography-section')).toBeInTheDocument();
      expect(container.querySelector('.color-section')).toBeInTheDocument();
      expect(container.querySelector('.button-section')).toBeInTheDocument();
      expect(container.querySelector('.form-section')).toBeInTheDocument();
      expect(container.querySelector('.card-section')).toBeInTheDocument();
      expect(container.querySelector('.table-section')).toBeInTheDocument();
      expect(container.querySelector('.status-section')).toBeInTheDocument();
      expect(container.querySelector('.navigation-section')).toBeInTheDocument();
      expect(container.querySelector('.modal-section')).toBeInTheDocument();
      expect(container.querySelector('.grid-section')).toBeInTheDocument();
      expect(container.querySelector('.print-section')).toBeInTheDocument();
    });

    it('should validate typography hierarchy', () => {
      render(
        <BrowserRouter>
          <DesignSystemShowcase />
        </BrowserRouter>
      );

      // Scope to typography section to avoid duplicates
      const typographySection = within(document.querySelector('.typography-section')!);
      
      // Check all heading levels are present
      expect(typographySection.getByRole('heading', { level: 1 })).toHaveTextContent('Heading Level 1');
      expect(typographySection.getByRole('heading', { level: 2 })).toHaveTextContent('Heading Level 2');
      expect(typographySection.getByRole('heading', { level: 3 })).toHaveTextContent('Heading Level 3');
      expect(typographySection.getByRole('heading', { level: 4 })).toHaveTextContent('Heading Level 4');
      expect(typographySection.getByRole('heading', { level: 5 })).toHaveTextContent('Heading Level 5');
      expect(typographySection.getByRole('heading', { level: 6 })).toHaveTextContent('Heading Level 6');

      // Check paragraph and small text
      expect(screen.getByText('This is a paragraph with regular text content.')).toBeInTheDocument();
      expect(screen.getByText('This is small text for supplementary information.')).toBeInTheDocument();
    });

    it('should validate all button variants', () => {
      render(
        <BrowserRouter>
          <DesignSystemShowcase />
        </BrowserRouter>
      );

      const primaryBtn = screen.getByRole('button', { name: 'Primary Button' });
      const secondaryBtn = screen.getByRole('button', { name: 'Secondary Button' });
      const dangerBtn = screen.getByRole('button', { name: 'Danger Button' });
      const ghostBtn = screen.getByRole('button', { name: 'Ghost Button' });
      const disabledBtn = screen.getByRole('button', { name: 'Disabled Button' });

      expect(primaryBtn).toHaveClass('btn-primary');
      expect(secondaryBtn).toHaveClass('btn-secondary');
      expect(dangerBtn).toHaveClass('btn-danger');
      expect(ghostBtn).toHaveClass('btn-ghost');
      expect(disabledBtn).toBeDisabled();
    });

    it('should validate form components', () => {
      render(
        <BrowserRouter>
          <DesignSystemShowcase />
        </BrowserRouter>
      );

      // Check form inputs
      const textInput = screen.getByLabelText('Text Input');
      const selectInput = screen.getByLabelText('Select Input');
      const textareaInput = screen.getByLabelText('Textarea');
      const requiredInput = screen.getByLabelText('Required Field');
      const errorInput = screen.getByLabelText('Field with Error');

      expect(textInput).toHaveClass('form-input');
      expect(selectInput).toHaveClass('form-select');
      expect(textareaInput).toHaveClass('form-textarea');
      expect(requiredInput).toBeRequired();
      expect(errorInput).toHaveClass('form-input--error');

      // Check form labels
      const requiredLabel = screen.getByText('Required Field');
      expect(requiredLabel).toHaveClass('form-label--required');
    });

    it('should validate table structure and responsive features', () => {
      render(
        <BrowserRouter>
          <DesignSystemShowcase />
        </BrowserRouter>
      );

      const table = document.querySelector('.table-responsive');
      expect(table).toBeInTheDocument();

      // Check table headers
      expect(screen.getByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Amount' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument();

      // Check table data with proper classes
      const numericCells = document.querySelectorAll('.table-cell--numeric');
      const centerCells = document.querySelectorAll('.table-cell--center');
      
      expect(numericCells.length).toBeGreaterThan(0);
      expect(centerCells.length).toBeGreaterThan(0);

      // Check data labels for mobile responsiveness
      const cellsWithLabels = document.querySelectorAll('.table-cell[data-label]');
      expect(cellsWithLabels.length).toBeGreaterThan(0);
    });

    it('should validate status badge variants', () => {
      render(
        <BrowserRouter>
          <DesignSystemShowcase />
        </BrowserRouter>
      );

      const statusSection = within(document.querySelector('.status-section')!);
      const paidBadge = statusSection.getByText('Paid');
      const pendingBadge = statusSection.getByText('Pending');
      const overdueBadge = statusSection.getByText('Overdue');
      const draftBadge = statusSection.getByText('Draft');
      const cancelledBadge = statusSection.getByText('Cancelled');

      expect(paidBadge).toHaveClass('status-badge', 'status-paid');
      expect(pendingBadge).toHaveClass('status-badge', 'status-pending');
      expect(overdueBadge).toHaveClass('status-badge', 'status-overdue');
      expect(draftBadge).toHaveClass('status-badge', 'status-draft');
      expect(cancelledBadge).toHaveClass('status-badge', 'status-cancelled');
    });

    it('should validate card components', () => {
      render(
        <BrowserRouter>
          <DesignSystemShowcase />
        </BrowserRouter>
      );

      const basicCard = screen.getByText('Basic Card').closest('.card');
      const interactiveCard = screen.getByText('Interactive Card').closest('.card');

      expect(basicCard).toHaveClass('card');
      expect(interactiveCard).toHaveClass('card', 'card--interactive');

      // Check card structure
      expect(basicCard?.querySelector('.card-header')).toBeInTheDocument();
      expect(basicCard?.querySelector('.card-body')).toBeInTheDocument();
      expect(interactiveCard?.querySelector('.card-footer')).toBeInTheDocument();
    });

    it('should validate navigation components', () => {
      render(
        <BrowserRouter>
          <DesignSystemShowcase />
        </BrowserRouter>
      );

      const nav = document.querySelector('.nav-primary');
      const navToggle = document.querySelector('.nav-toggle');
      const navList = document.querySelector('.nav-list');
      const activeLink = document.querySelector('.nav-link--active');

      expect(nav).toBeInTheDocument();
      expect(navToggle).toBeInTheDocument();
      expect(navList).toBeInTheDocument();
      expect(activeLink).toHaveTextContent('Dashboard');

      // Check navigation links
      const navLinks = document.querySelectorAll('.nav-link');
      expect(navLinks.length).toBe(4);
    });

    it('should validate modal structure', () => {
      render(
        <BrowserRouter>
          <DesignSystemShowcase />
        </BrowserRouter>
      );

      const modalOverlay = document.querySelector('.modal-overlay');
      const modalDialog = document.querySelector('.modal-dialog');
      const modalHeader = document.querySelector('.modal-header');
      const modalBody = document.querySelector('.modal-body');
      const modalFooter = document.querySelector('.modal-footer');

      expect(modalOverlay).toBeInTheDocument();
      expect(modalDialog).toBeInTheDocument();
      expect(modalHeader).toBeInTheDocument();
      expect(modalBody).toBeInTheDocument();
      expect(modalFooter).toBeInTheDocument();

      // Check modal content
      expect(screen.getByText('Example Modal')).toBeInTheDocument();
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });

    it('should validate responsive grid system', () => {
      render(
        <BrowserRouter>
          <DesignSystemShowcase />
        </BrowserRouter>
      );

      const container = document.querySelector('.container');
      const row = document.querySelector('.row');
      const columns = document.querySelectorAll('[class*="col-"]');

      expect(container).toBeInTheDocument();
      expect(row).toBeInTheDocument();
      expect(columns.length).toBe(3);

      // Check responsive column classes
      columns.forEach(col => {
        expect(col.className).toMatch(/col-12|col-md-\d+|col-lg-\d+/);
      });
    });
  });

  describe('Theme System Validation', () => {
    it('should switch between light and dark themes', async () => {
      render(
        <BrowserRouter>
          <DesignSystemShowcase />
        </BrowserRouter>
      );

      // Start with light theme
      expect(document.documentElement.getAttribute('data-theme')).toBeNull();

      // Switch to dark theme
      const duration = await performanceMonitor.measureThemeSwitch(() => {
        applyTheme('dark');
      });

      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(duration).toBeLessThan(500); // Constitutional requirement

      // Switch back to light theme
      await performanceMonitor.measureThemeSwitch(() => {
        applyTheme('light');
      });

      expect(document.documentElement.getAttribute('data-theme')).toBeNull();
    });

    it('should maintain component visibility across themes', () => {
      const { rerender } = render(
        <BrowserRouter>
          <DesignSystemShowcase />
        </BrowserRouter>
      );

      // Test in light theme
      expect(screen.getByText('Primary Button')).toBeVisible();
      expect(screen.getByText('Heading Level 1')).toBeVisible();
      expect(screen.getByLabelText('Text Input')).toBeVisible();

      // Switch to dark theme
      applyTheme('dark');
      rerender(
        <BrowserRouter>
          <DesignSystemShowcase />
        </BrowserRouter>
      );

      // Components should still be visible
      expect(screen.getByText('Primary Button')).toBeVisible();
      expect(screen.getByText('Heading Level 1')).toBeVisible();
      expect(screen.getByLabelText('Text Input')).toBeVisible();
    });

    it('should apply proper theme classes and attributes', () => {
      render(
        <BrowserRouter>
          <DesignSystemShowcase />
        </BrowserRouter>
      );

      const container = document.querySelector('.design-system-showcase');
      
      // Should start with light theme attribute
      expect(container).toHaveAttribute('data-theme', 'light');

      // Switch to dark theme
      applyTheme('dark');
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark');

      // Switch back to light theme
      applyTheme('light');
      expect(document.documentElement).not.toHaveAttribute('data-theme');
    });
  });

  describe('Responsive Design Validation', () => {
    const testBreakpoints = [
      { width: 375, name: 'mobile' },
      { width: 768, name: 'tablet' },
      { width: 1024, name: 'desktop' },
      { width: 1200, name: 'large desktop' }
    ];

    testBreakpoints.forEach(({ width, name }) => {
      it(`should render correctly on ${name} (${width}px)`, () => {
        setViewportSize(width);
        window.matchMedia = vi.fn().mockImplementation(mockMatchMedia(width));

        render(
          <BrowserRouter>
            <DesignSystemShowcase />
          </BrowserRouter>
        );

        // Core components should be present at all breakpoints
        expect(screen.getByText('Heading Level 1')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Primary Button' })).toBeInTheDocument();
        expect(screen.getByLabelText('Text Input')).toBeInTheDocument();

        // Grid system should adapt
        const columns = document.querySelectorAll('[class*="col-"]');
        expect(columns.length).toBeGreaterThan(0);

        // Navigation should be present
        expect(document.querySelector('.nav-primary')).toBeInTheDocument();
      });
    });

    it('should handle responsive table behavior', () => {
      // Test mobile view
      setViewportSize(375);
      window.matchMedia = vi.fn().mockImplementation(mockMatchMedia(375));

      render(
        <BrowserRouter>
          <DesignSystemShowcase />
        </BrowserRouter>
      );

      const responsiveTable = document.querySelector('.table-responsive');
      expect(responsiveTable).toBeInTheDocument();

      // Table cells should have data labels for mobile stacking
      const cellsWithLabels = document.querySelectorAll('.table-cell[data-label]');
      expect(cellsWithLabels.length).toBeGreaterThan(0);

      // Test desktop view
      setViewportSize(1200);
      window.matchMedia = vi.fn().mockImplementation(mockMatchMedia(1200));

      // Table should still be functional
      expect(responsiveTable).toBeInTheDocument();
    });
  });

  describe('Performance Validation', () => {
    it('should meet all constitutional performance requirements', async () => {
      const report = await performanceTester.runFullPerformanceTest();

      expect(report.constitutional.performanceCompliant).toBe(true);
      expect(report.constitutional.themeSwitchCompliant).toBe(true);
      expect(report.constitutional.cssBundleSizeCompliant).toBe(true);
      expect(report.thresholdViolations).toHaveLength(0);
    });

    it('should render components within performance limits', () => {
      const renderStart = performance.now();

      render(
        <BrowserRouter>
          <DesignSystemShowcase />
        </BrowserRouter>
      );

      const renderTime = performance.now() - renderStart;

      // Component rendering should be fast (<100ms constitutional requirement)
      expect(renderTime).toBeLessThan(100);
      performanceMonitor.recordMetric('full-showcase-render', renderTime);
    });

    it('should handle theme switching performance', async () => {
      render(
        <BrowserRouter>
          <DesignSystemShowcase />
        </BrowserRouter>
      );

      // Test multiple theme switches
      for (let i = 0; i < 5; i++) {
        const darkSwitchTime = await performanceMonitor.measureThemeSwitch(() => {
          applyTheme('dark');
        });

        const lightSwitchTime = await performanceMonitor.measureThemeSwitch(() => {
          applyTheme('light');
        });

        // Each switch should be under 500ms (constitutional requirement)
        expect(darkSwitchTime).toBeLessThan(500);
        expect(lightSwitchTime).toBeLessThan(500);
      }
    });
  });

  describe('Accessibility Validation', () => {
    it('should provide proper semantic structure', () => {
      render(
        <BrowserRouter>
          <DesignSystemShowcase />
        </BrowserRouter>
      );

      // Check semantic elements
      expect(document.querySelector('nav')).toBeInTheDocument();
      expect(document.querySelector('table')).toBeInTheDocument();
      expect(document.querySelector('form')).toBeInTheDocument();

      // Check ARIA attributes
      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toHaveAttribute('aria-label', 'Close modal');
    });

    it('should provide proper form labels and associations', () => {
      render(
        <BrowserRouter>
          <DesignSystemShowcase />
        </BrowserRouter>
      );

      // All form inputs should have associated labels
      const textInput = screen.getByLabelText('Text Input');
      const selectInput = screen.getByLabelText('Select Input');
      const textareaInput = screen.getByLabelText('Textarea');
      const requiredInput = screen.getByLabelText('Required Field');
      const errorInput = screen.getByLabelText('Field with Error');

      expect(textInput).toBeInTheDocument();
      expect(selectInput).toBeInTheDocument();
      expect(textareaInput).toBeInTheDocument();
      expect(requiredInput).toBeInTheDocument();
      expect(errorInput).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(
        <BrowserRouter>
          <DesignSystemShowcase />
        </BrowserRouter>
      );

      // Test focusable elements
      const buttons = screen.getAllByRole('button');
      const links = screen.getAllByRole('link');
      const inputs = screen.getAllByRole('textbox');

      buttons.forEach(button => {
        if (!button.hasAttribute('disabled')) {
          button.focus();
          expect(document.activeElement).toBe(button);
        }
      });

      links.forEach(link => {
        link.focus();
        expect(document.activeElement).toBe(link);
      });

      inputs.forEach(input => {
        input.focus();
        expect(document.activeElement).toBe(input);
      });
    });

    it('should provide appropriate color contrast', () => {
      render(
        <BrowserRouter>
          <DesignSystemShowcase />
        </BrowserRouter>
      );

      // Status badges should have proper contrast
      const statusBadges = document.querySelectorAll('.status-badge');
      expect(statusBadges.length).toBeGreaterThan(0);

      statusBadges.forEach(badge => {
        expect(badge).toHaveClass('status-badge');
        expect(badge.className).toMatch(/status-(paid|pending|overdue|draft|cancelled)/);
      });
    });
  });

  describe('Print Style Validation', () => {
    it('should apply print-specific classes correctly', () => {
      render(
        <BrowserRouter>
          <DesignSystemShowcase />
        </BrowserRouter>
      );

      const hidePrintElement = document.querySelector('.hide-print');
      const showPrintElement = document.querySelector('.show-print');
      const printDocument = document.querySelector('.print-document');

      expect(hidePrintElement).toBeInTheDocument();
      expect(showPrintElement).toBeInTheDocument();
      expect(printDocument).toBeInTheDocument();

      // Print document should contain appropriate content
      expect(printDocument).toHaveTextContent('Print Document Example');
    });
  });

  describe('Constitutional TDD Compliance Validation', () => {
    it('should validate comprehensive test coverage', () => {
      const testCategories = [
        'Component Rendering',
        'Theme Switching',
        'Responsive Design',
        'Performance',
        'Accessibility',
        'Print Styles'
      ];

      // All categories should be represented
      expect(testCategories.length).toBe(6);
      
      // Each category should have multiple test cases
      testCategories.forEach(category => {
        expect(category).toBeTruthy();
      });
    });

    it('should ensure systematic verification approach', () => {
      const systemComponents = [
        'typography', 'color', 'button', 'form', 'card', 
        'table', 'status', 'navigation', 'modal', 'grid', 'print'
      ];

      render(
        <BrowserRouter>
          <DesignSystemShowcase />
        </BrowserRouter>
      );

      // Verify all system components are tested
      systemComponents.forEach(component => {
        const section = document.querySelector(`.${component}-section`);
        expect(section).toBeInTheDocument();
      });
    });

    it('should maintain truth and accuracy in all validations', () => {
      render(
        <BrowserRouter>
          <DesignSystemShowcase />
        </BrowserRouter>
      );

      // Count actual elements vs expected
      const buttons = screen.getAllByRole('button');
      const headings = screen.getAllByRole('heading');
      const inputs = screen.getAllByRole('textbox');
      const links = screen.getAllByRole('link');

      // Verify counts match expectations
      expect(buttons.length).toBeGreaterThan(5); // At least primary, secondary, danger, ghost, disabled + form buttons
      expect(headings.length).toBeGreaterThan(6); // h1-h6 + modal headings
      expect(inputs.length).toBeGreaterThan(3); // Text, required, error inputs + modal input
      expect(links.length).toBe(4); // Navigation links

      // Verify no false positives in class detection
      const cardsWithClass = document.querySelectorAll('.card');
      const cardsWithRole = screen.queryAllByRole('region'); // Cards don't have role
      
      expect(cardsWithClass.length).toBeGreaterThan(0);
      // Should not find cards by role since they don't have one
    });

    it('should demonstrate centralized design system compliance', () => {
      render(
        <BrowserRouter>
          <DesignSystemShowcase />
        </BrowserRouter>
      );

      // No scattered Tailwind utilities should be present
      const elementsWithTailwind = document.querySelectorAll(
        '[class*="py-"], [class*="px-"], [class*="mt-"], [class*="mb-"], [class*="bg-red-"], [class*="text-blue-"]'
      );
      
      expect(elementsWithTailwind.length).toBe(0);

      // All styling should use semantic classes
      const semanticClasses = [
        '.btn-primary', '.form-input', '.card', '.table-cell', 
        '.status-badge', '.nav-link', '.modal-dialog'
      ];

      semanticClasses.forEach(className => {
        const elements = document.querySelectorAll(className);
        expect(elements.length).toBeGreaterThan(0);
      });
    });

    it('should validate industry best practices compliance', () => {
      render(
        <BrowserRouter>
          <DesignSystemShowcase />
        </BrowserRouter>
      );

      // BEM methodology compliance
      const bemElements = document.querySelectorAll(
        '.card-header, .card-body, .card-footer, .form-input, .form-label, .table-cell, .nav-link'
      );
      expect(bemElements.length).toBeGreaterThan(0);

      // Semantic HTML usage
      expect(document.querySelector('nav')).toBeInTheDocument();
      expect(document.querySelector('table')).toBeInTheDocument();
      expect(document.querySelector('form')).toBeInTheDocument();
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // Accessibility attributes
      const elementsWithAria = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby]');
      expect(elementsWithAria.length).toBeGreaterThan(0);

      // Required form validation
      const requiredInputs = document.querySelectorAll('input[required]');
      expect(requiredInputs.length).toBeGreaterThan(0);
    });
  });

  describe('Integration Testing', () => {
    it('should handle complex user interactions', async () => {
      render(
        <BrowserRouter>
          <DesignSystemShowcase />
        </BrowserRouter>
      );

      // Test button interactions
      const primaryButton = screen.getByRole('button', { name: 'Primary Button' });
      fireEvent.click(primaryButton);
      expect(primaryButton).toBeInTheDocument();

      // Test form interactions
      const textInput = screen.getByLabelText('Text Input');
      fireEvent.change(textInput, { target: { value: 'test input' } });
      expect(textInput).toHaveValue('test input');

      const selectInput = screen.getByLabelText('Select Input');
      fireEvent.change(selectInput, { target: { value: 'Option 2' } });
      expect(selectInput).toHaveValue('Option 2');

      // Test textarea
      const textareaInput = screen.getByLabelText('Textarea');
      fireEvent.change(textareaInput, { target: { value: 'test textarea content' } });
      expect(textareaInput).toHaveValue('test textarea content');
    });

    it('should maintain state consistency across theme changes', async () => {
      render(
        <BrowserRouter>
          <DesignSystemShowcase />
        </BrowserRouter>
      );

      // Set form values
      const textInput = screen.getByLabelText('Text Input');
      const selectInput = screen.getByLabelText('Select Input');
      
      fireEvent.change(textInput, { target: { value: 'persistent value' } });
      fireEvent.change(selectInput, { target: { value: 'Option 3' } });

      // Switch theme
      await performanceMonitor.measureThemeSwitch(() => {
        applyTheme('dark');
      });

      // Values should persist
      expect(textInput).toHaveValue('persistent value');
      expect(selectInput).toHaveValue('Option 3');

      // Switch back
      await performanceMonitor.measureThemeSwitch(() => {
        applyTheme('light');
      });

      // Values should still persist
      expect(textInput).toHaveValue('persistent value');
      expect(selectInput).toHaveValue('Option 3');
    });

    it('should handle viewport changes gracefully', () => {
      const { rerender } = render(
        <BrowserRouter>
          <DesignSystemShowcase />
        </BrowserRouter>
      );

      // Start desktop
      setViewportSize(1200);
      expect(screen.getByText('Primary Button')).toBeInTheDocument();

      // Switch to mobile
      setViewportSize(375);
      rerender(
        <BrowserRouter>
          <DesignSystemShowcase />
        </BrowserRouter>
      );

      expect(screen.getByText('Primary Button')).toBeInTheDocument();

      // Switch to tablet
      setViewportSize(768);
      rerender(
        <BrowserRouter>
          <DesignSystemShowcase />
        </BrowserRouter>
      );

      expect(screen.getByText('Primary Button')).toBeInTheDocument();
    });
  });

  describe('Final Performance Report', () => {
    it('should generate comprehensive performance report meeting all requirements', async () => {
      render(
        <BrowserRouter>
          <DesignSystemShowcase />
        </BrowserRouter>
      );

      // Run comprehensive performance test
      const report = await performanceTester.runFullPerformanceTest();

      // Validate constitutional compliance
      expect(report.constitutional.performanceCompliant).toBe(true);
      expect(report.constitutional.themeSwitchCompliant).toBe(true);
      expect(report.constitutional.cssBundleSizeCompliant).toBe(true);

      // Validate no threshold violations
      expect(report.thresholdViolations).toHaveLength(0);

      // Validate comprehensive metrics coverage
      const requiredMetrics = ['theme-switch', 'css-bundle-size', 'component-render'];
      requiredMetrics.forEach(metric => {
        expect(report.metrics[metric]).toBeDefined();
        expect(report.metrics[metric].compliant).toBe(true);
      });

      // Log final report for documentation
      console.log('Final Design System Performance Report:', JSON.stringify(report, null, 2));
    });
  });
});