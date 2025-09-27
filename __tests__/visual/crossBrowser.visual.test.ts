/**
 * T075: Cross-browser Compatibility Tests
 * Playwright-based cross-browser visual regression testing
 * Constitutional TDD compliance - comprehensive browser validation
 */

import { devices, expect, test } from '@playwright/test';

// Define browsers and devices for testing
const browserConfigs = [
  { name: 'chromium', device: 'Desktop Chrome' },
  { name: 'firefox', device: 'Desktop Firefox' },
  { name: 'webkit', device: 'Desktop Safari' },
  { name: 'chromium', device: 'iPhone 12' },
  { name: 'chromium', device: 'iPad Pro' },
  { name: 'chromium', device: 'Galaxy S21' }
];

// Test across different browsers and devices
for (const config of browserConfigs) {
  test.describe(`Cross-browser Tests - ${config.device}`, () => {
    // Configure device if specified
    if (config.device !== 'Desktop Chrome' && config.device !== 'Desktop Firefox' && config.device !== 'Desktop Safari') {
      test.use({ ...devices[config.device] });
    }

    test.beforeEach(async ({ page }) => {
      // Navigate to the app
      await page.goto('/');
      
      // Wait for theme system to initialize
      await page.waitForTimeout(500);
      
      // Set consistent theme for cross-browser comparison
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'light');
      });
      
      await page.waitForTimeout(300);
    });

    test(`should render design system consistently on ${config.device}`, async ({ page }) => {
      // Create comprehensive component showcase for cross-browser testing
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'cross-browser-showcase';
        container.style.padding = '20px';
        container.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        
        container.innerHTML = `
          <div style="margin-bottom: 30px;">
            <h1>Cross-browser Compatibility Test</h1>
            <p>Design system components across different browsers and devices</p>
          </div>
          
          <!-- Buttons Section -->
          <section style="margin-bottom: 30px;">
            <h2>Buttons</h2>
            <div style="display: flex; gap: 10px; flex-wrap: wrap; margin: 15px 0;">
              <button class="btn-primary">Primary Button</button>
              <button class="btn-secondary">Secondary Button</button>
              <button class="btn-danger">Danger Button</button>
              <button class="btn-ghost">Ghost Button</button>
              <button class="btn-primary" disabled>Disabled Button</button>
            </div>
          </section>
          
          <!-- Forms Section -->
          <section style="margin-bottom: 30px;">
            <h2>Form Controls</h2>
            <div style="display: grid; gap: 15px; max-width: 400px; margin: 15px 0;">
              <input type="text" class="form-input" placeholder="Text Input" value="Sample text" />
              <input type="email" class="form-input" placeholder="Email Input" value="test@example.com" />
              <select class="form-select">
                <option>Select Option</option>
                <option selected>Selected Option</option>
                <option>Another Option</option>
              </select>
              <textarea class="form-textarea" placeholder="Textarea" rows="3">Sample textarea content</textarea>
            </div>
          </section>
          
          <!-- Status Badges Section -->
          <section style="margin-bottom: 30px;">
            <h2>Status Indicators</h2>
            <div style="display: flex; gap: 10px; flex-wrap: wrap; margin: 15px 0;">
              <span class="status-badge status-paid">Paid</span>
              <span class="status-badge status-pending">Pending</span>
              <span class="status-badge status-overdue">Overdue</span>
              <span class="status-badge status-draft">Draft</span>
              <span class="status-badge status-finalized">Finalized</span>
              <span class="status-badge status-cancelled">Cancelled</span>
            </div>
          </section>
          
          <!-- Cards Section -->
          <section style="margin-bottom: 30px;">
            <h2>Cards</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 15px 0;">
              <div class="card">
                <div class="card-header">Basic Card</div>
                <div class="card-body">
                  <p>This is a basic card with header, body, and footer sections.</p>
                  <p>Content should render consistently across browsers.</p>
                </div>
                <div class="card-footer">
                  <button class="btn-primary">Primary Action</button>
                  <button class="btn-secondary">Secondary Action</button>
                </div>
              </div>
              
              <div class="card card--interactive">
                <div class="card-header">Interactive Card</div>
                <div class="card-body">
                  <p>This card has interactive hover effects.</p>
                  <div style="margin: 10px 0;">
                    <span class="status-badge status-paid">Status</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          <!-- Table Section -->
          <section style="margin-bottom: 30px;">
            <h2>Data Tables</h2>
            <table class="table" style="width: 100%; margin: 15px 0;">
              <thead>
                <tr class="table-header">
                  <th class="table-cell">Name</th>
                  <th class="table-cell">Status</th>
                  <th class="table-cell">Amount</th>
                  <th class="table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                <tr class="table-row">
                  <td class="table-cell">John Doe</td>
                  <td class="table-cell"><span class="status-badge status-paid">Paid</span></td>
                  <td class="table-cell">$1,200.00</td>
                  <td class="table-cell">2025-09-27</td>
                </tr>
                <tr class="table-row">
                  <td class="table-cell">Jane Smith</td>
                  <td class="table-cell"><span class="status-badge status-pending">Pending</span></td>
                  <td class="table-cell">$850.00</td>
                  <td class="table-cell">2025-09-26</td>
                </tr>
                <tr class="table-row">
                  <td class="table-cell">Bob Johnson</td>
                  <td class="table-cell"><span class="status-badge status-overdue">Overdue</span></td>
                  <td class="table-cell">$2,100.00</td>
                  <td class="table-cell">2025-09-25</td>
                </tr>
              </tbody>
            </table>
          </section>
        `;
        
        document.body.appendChild(container);
      });
      
      // Take screenshot for cross-browser comparison
      const showcase = page.locator('#cross-browser-showcase');
      await expect(showcase).toHaveScreenshot(`cross-browser-${config.device.toLowerCase().replace(/\s+/g, '-')}.png`);
    });

    test(`should handle theme switching consistently on ${config.device}`, async ({ page }) => {
      // Create theme switching test
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'theme-switch-test';
        container.style.padding = '20px';
        
        container.innerHTML = `
          <div style="text-align: center; margin-bottom: 30px;">
            <h1>Theme Switching Test</h1>
            <button class="theme-toggle theme-toggle--text" id="theme-toggle-btn">
              Switch to Dark Theme
            </button>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
            <div class="card">
              <div class="card-header">Light Theme Card</div>
              <div class="card-body">
                <button class="btn-primary">Primary</button>
                <span class="status-badge status-paid">Paid</span>
              </div>
            </div>
            
            <div class="card card--interactive">
              <div class="card-header">Interactive Card</div>
              <div class="card-body">
                <input type="text" class="form-input" value="Form input" />
              </div>
            </div>
          </div>
        `;
        
        document.body.appendChild(container);
        
        // Add theme toggle functionality
        const toggleBtn = document.getElementById('theme-toggle-btn');
        toggleBtn.addEventListener('click', () => {
          const currentTheme = document.documentElement.getAttribute('data-theme');
          const newTheme = currentTheme === 'light' ? 'dark' : 'light';
          document.documentElement.setAttribute('data-theme', newTheme);
          toggleBtn.textContent = newTheme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme';
        });
      });
      
      // Test light theme
      const testContainer = page.locator('#theme-switch-test');
      await expect(testContainer).toHaveScreenshot(`theme-light-${config.device.toLowerCase().replace(/\s+/g, '-')}.png`);
      
      // Switch to dark theme
      await page.click('#theme-toggle-btn');
      await page.waitForTimeout(600); // Allow for transition
      
      // Test dark theme
      await expect(testContainer).toHaveScreenshot(`theme-dark-${config.device.toLowerCase().replace(/\s+/g, '-')}.png`);
    });

    test(`should render responsive layouts correctly on ${config.device}`, async ({ page }) => {
      // Get viewport dimensions
      const viewport = page.viewportSize();
      
      await page.evaluate((viewport) => {
        const container = document.createElement('div');
        container.id = 'responsive-test';
        container.style.padding = '20px';
        
        container.innerHTML = `
          <div style="margin-bottom: 20px;">
            <h1>Responsive Test</h1>
            <p>Viewport: ${viewport.width}x${viewport.height}</p>
          </div>
          
          <!-- Responsive Grid -->
          <section style="margin-bottom: 30px;">
            <h2>Responsive Grid</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
              ${Array.from({ length: 6 }, (_, i) => `
                <div class="card">
                  <div class="card-header">Card ${i + 1}</div>
                  <div class="card-body">
                    <p>Responsive card content that adapts to different screen sizes.</p>
                    <button class="btn-primary">Action</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </section>
          
          <!-- Responsive Navigation -->
          <section style="margin-bottom: 30px;">
            <h2>Navigation</h2>
            <nav class="nav-primary">
              <ul class="nav-list" style="display: flex; flex-wrap: wrap; gap: 10px; list-style: none; padding: 0;">
                <li class="nav-item"><a class="nav-link nav-link--active" href="#">Dashboard</a></li>
                <li class="nav-item"><a class="nav-link" href="#">Customers</a></li>
                <li class="nav-item"><a class="nav-link" href="#">Products</a></li>
                <li class="nav-item"><a class="nav-link" href="#">Reports</a></li>
              </ul>
            </nav>
          </section>
          
          <!-- Responsive Form -->
          <section style="margin-bottom: 30px;">
            <h2>Responsive Form</h2>
            <div style="display: grid; gap: 15px; max-width: 100%;">
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <input type="text" class="form-input" placeholder="First Name" />
                <input type="text" class="form-input" placeholder="Last Name" />
              </div>
              <input type="email" class="form-input" placeholder="Email Address" />
              <textarea class="form-textarea" placeholder="Message" rows="4"></textarea>
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button class="btn-primary">Submit</button>
                <button class="btn-secondary">Cancel</button>
              </div>
            </div>
          </section>
        `;
        
        document.body.appendChild(container);
      }, viewport);
      
      // Take screenshot for responsive comparison
      const responsiveContainer = page.locator('#responsive-test');
      await expect(responsiveContainer).toHaveScreenshot(`responsive-${config.device.toLowerCase().replace(/\s+/g, '-')}.png`);
    });

    test(`should handle interactive states consistently on ${config.device}`, async ({ page }) => {
      // Test interactive states across browsers
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'interactive-states-test';
        container.style.padding = '20px';
        
        container.innerHTML = `
          <h1>Interactive States Test</h1>
          
          <!-- Focus States -->
          <section style="margin-bottom: 30px;">
            <h2>Focus States</h2>
            <div style="display: flex; flex-direction: column; gap: 15px; max-width: 300px;">
              <button class="btn-primary btn-primary--focus">Focused Button</button>
              <input type="text" class="form-input form-input--focus" value="Focused Input" />
              <select class="form-select form-select--focus">
                <option>Focused Select</option>
              </select>
            </div>
          </section>
          
          <!-- Hover States -->
          <section style="margin-bottom: 30px;">
            <h2>Hover States</h2>
            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
              <button class="btn-primary btn-primary--hover">Hovered Primary</button>
              <button class="btn-secondary btn-secondary--hover">Hovered Secondary</button>
              <div class="card card--interactive card--hover" style="max-width: 200px;">
                <div class="card-body">Hovered Card</div>
              </div>
            </div>
          </section>
          
          <!-- Active States -->
          <section style="margin-bottom: 30px;">
            <h2>Active States</h2>
            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
              <button class="btn-primary btn-primary--active">Active Primary</button>
              <button class="btn-danger btn-danger--active">Active Danger</button>
            </div>
          </section>
          
          <!-- Disabled States -->
          <section style="margin-bottom: 30px;">
            <h2>Disabled States</h2>
            <div style="display: flex; flex-direction: column; gap: 15px; max-width: 300px;">
              <button class="btn-primary" disabled>Disabled Button</button>
              <input type="text" class="form-input" disabled value="Disabled Input" />
              <select class="form-select" disabled>
                <option>Disabled Select</option>
              </select>
              <textarea class="form-textarea" disabled>Disabled Textarea</textarea>
            </div>
          </section>
        `;
        
        document.body.appendChild(container);
      });
      
      // Take screenshot for interactive states comparison
      const interactiveContainer = page.locator('#interactive-states-test');
      await expect(interactiveContainer).toHaveScreenshot(`interactive-states-${config.device.toLowerCase().replace(/\s+/g, '-')}.png`);
    });
  });
}

// Cross-browser compatibility validation tests
test.describe('Cross-browser Compatibility Validation', () => {
  test('should validate CSS custom properties support across browsers', async ({ page }) => {
    // Test CSS custom properties (CSS variables) support
    await page.goto('/');
    
    const cssVariablesSupport = await page.evaluate(() => {
      // Create test element with custom properties
      const testDiv = document.createElement('div');
      testDiv.style.setProperty('--test-color', '#ff0000');
      testDiv.style.color = 'var(--test-color)';
      document.body.appendChild(testDiv);
      
      const computedStyle = window.getComputedStyle(testDiv);
      const colorValue = computedStyle.color;
      
      document.body.removeChild(testDiv);
      
      // Check if custom property was resolved
      return colorValue === 'rgb(255, 0, 0)' || colorValue === '#ff0000';
    });
    
    expect(cssVariablesSupport).toBe(true);
  });

  test('should validate flexbox and grid support across browsers', async ({ page }) => {
    await page.goto('/');
    
    const layoutSupport = await page.evaluate(() => {
      // Test flexbox support
      const flexTest = document.createElement('div');
      flexTest.style.display = 'flex';
      document.body.appendChild(flexTest);
      
      const flexSupported = window.getComputedStyle(flexTest).display === 'flex';
      
      // Test grid support
      const gridTest = document.createElement('div');
      gridTest.style.display = 'grid';
      document.body.appendChild(gridTest);
      
      const gridSupported = window.getComputedStyle(gridTest).display === 'grid';
      
      document.body.removeChild(flexTest);
      document.body.removeChild(gridTest);
      
      return {
        flexbox: flexSupported,
        grid: gridSupported
      };
    });
    
    expect(layoutSupport.flexbox).toBe(true);
    expect(layoutSupport.grid).toBe(true);
  });

  test('should validate design token resolution across browsers', async ({ page }) => {
    await page.goto('/');
    
    // Wait for stylesheets to load
    await page.waitForTimeout(1000);
    
    const tokenResolution = await page.evaluate(() => {
      // Create elements using design system classes
      const button = document.createElement('button');
      button.className = 'btn-primary';
      document.body.appendChild(button);
      
      const input = document.createElement('input');
      input.className = 'form-input';
      document.body.appendChild(input);
      
      const badge = document.createElement('span');
      badge.className = 'status-badge status-paid';
      document.body.appendChild(badge);
      
      // Check computed styles
      const buttonStyle = window.getComputedStyle(button);
      const inputStyle = window.getComputedStyle(input);
      const badgeStyle = window.getComputedStyle(badge);
      
      const results = {
        buttonHasBackground: buttonStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' && buttonStyle.backgroundColor !== 'transparent',
        inputHasBorder: inputStyle.borderWidth !== '0px' && inputStyle.borderWidth !== '',
        badgeHasColor: badgeStyle.color !== 'rgba(0, 0, 0, 0)' && badgeStyle.color !== 'transparent'
      };
      
      // Cleanup
      document.body.removeChild(button);
      document.body.removeChild(input);
      document.body.removeChild(badge);
      
      return results;
    });
    
    expect(tokenResolution.buttonHasBackground).toBe(true);
    expect(tokenResolution.inputHasBorder).toBe(true);
    expect(tokenResolution.badgeHasColor).toBe(true);
  });
});

// Performance validation across browsers
test.describe('Cross-browser Performance Validation', () => {
  test('should validate theme switching performance across browsers', async ({ page, browserName }) => {
    await page.goto('/');
    
    // Create performance test environment
    await page.evaluate(() => {
      const container = document.createElement('div');
      container.id = 'perf-test';
      
      // Create multiple components for stress testing
      container.innerHTML = Array.from({ length: 20 }, (_, i) => `
        <div class="card">
          <div class="card-header">Performance Test Card ${i + 1}</div>
          <div class="card-body">
            <button class="btn-primary">Button ${i + 1}</button>
            <span class="status-badge status-paid">Status ${i + 1}</span>
          </div>
        </div>
      `).join('');
      
      document.body.appendChild(container);
    });
    
    // Measure theme switching performance
    const startTime = await page.evaluate(() => Date.now());
    
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    
    // Wait for transition to complete
    await page.waitForTimeout(500);
    
    const endTime = await page.evaluate(() => Date.now());
    const transitionTime = endTime - startTime;
    
    // Constitutional requirement: <500ms across all browsers
    expect(transitionTime).toBeLessThanOrEqual(500);
    
    // Log performance for different browsers
    console.log(`Theme switching time on ${browserName}: ${transitionTime}ms`);
  });
});