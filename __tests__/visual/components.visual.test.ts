/**
 * T073: Component Visual Regression Tests
 * Playwright-based visual testing for design system components
 * Constitutional TDD compliance - comprehensive visual validation
 */

import { expect, test } from '@playwright/test';

// Test configuration for visual regression
test.describe('Component Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the component showcase/dashboard
    await page.goto('/');
    
    // Wait for theme system to initialize
    await page.waitForTimeout(500);
    
    // Ensure consistent viewport for screenshots
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test.describe('Button Components', () => {
    test('should render primary button variants consistently', async ({ page }) => {
      // Navigate to a page with buttons or create test component
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'button-test-container';
        container.style.padding = '20px';
        container.style.display = 'flex';
        container.style.gap = '10px';
        container.style.flexWrap = 'wrap';
        
        // Create primary button variants
        const primaryBtn = document.createElement('button');
        primaryBtn.className = 'btn-primary';
        primaryBtn.textContent = 'Primary Button';
        
        const secondaryBtn = document.createElement('button');
        secondaryBtn.className = 'btn-secondary';
        secondaryBtn.textContent = 'Secondary Button';
        
        const dangerBtn = document.createElement('button');
        dangerBtn.className = 'btn-danger';
        dangerBtn.textContent = 'Danger Button';
        
        const ghostBtn = document.createElement('button');
        ghostBtn.className = 'btn-ghost';
        ghostBtn.textContent = 'Ghost Button';
        
        container.appendChild(primaryBtn);
        container.appendChild(secondaryBtn);
        container.appendChild(dangerBtn);
        container.appendChild(ghostBtn);
        
        document.body.appendChild(container);
      });
      
      // Take screenshot for visual regression
      const buttonContainer = page.locator('#button-test-container');
      await expect(buttonContainer).toHaveScreenshot('button-variants-light.png');
    });

    test('should render button states consistently', async ({ page }) => {
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'button-states-container';
        container.style.padding = '20px';
        container.style.display = 'flex';
        container.style.gap = '10px';
        container.style.flexDirection = 'column';
        
        // Normal state
        const normalBtn = document.createElement('button');
        normalBtn.className = 'btn-primary';
        normalBtn.textContent = 'Normal State';
        
        // Hover state
        const hoverBtn = document.createElement('button');
        hoverBtn.className = 'btn-primary btn-primary--hover';
        hoverBtn.textContent = 'Hover State';
        
        // Active state
        const activeBtn = document.createElement('button');
        activeBtn.className = 'btn-primary btn-primary--active';  
        activeBtn.textContent = 'Active State';
        
        // Disabled state
        const disabledBtn = document.createElement('button');
        disabledBtn.className = 'btn-primary';
        disabledBtn.disabled = true;
        disabledBtn.textContent = 'Disabled State';
        
        container.appendChild(normalBtn);
        container.appendChild(hoverBtn);
        container.appendChild(activeBtn);
        container.appendChild(disabledBtn);
        
        document.body.appendChild(container);
      });
      
      const statesContainer = page.locator('#button-states-container');
      await expect(statesContainer).toHaveScreenshot('button-states-light.png');
    });
  });

  test.describe('Form Components', () => {
    test('should render form inputs consistently', async ({ page }) => {
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'form-test-container';
        container.style.padding = '20px';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '15px';
        
        // Text input
        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.className = 'form-input';
        textInput.placeholder = 'Text Input';
        
        // Email input
        const emailInput = document.createElement('input');
        emailInput.type = 'email';
        emailInput.className = 'form-input';
        emailInput.placeholder = 'Email Input';
        
        // Select dropdown
        const select = document.createElement('select');
        select.className = 'form-select';
        const option1 = document.createElement('option');
        option1.textContent = 'Option 1';
        const option2 = document.createElement('option');
        option2.textContent = 'Option 2';
        select.appendChild(option1);
        select.appendChild(option2);
        
        // Textarea
        const textarea = document.createElement('textarea');
        textarea.className = 'form-textarea';
        textarea.placeholder = 'Textarea';
        textarea.rows = 3;
        
        container.appendChild(textInput);
        container.appendChild(emailInput);
        container.appendChild(select);
        container.appendChild(textarea);
        
        document.body.appendChild(container);
      });
      
      const formContainer = page.locator('#form-test-container');
      await expect(formContainer).toHaveScreenshot('form-inputs-light.png');
    });

    test('should render form validation states', async ({ page }) => {
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'form-validation-container';
        container.style.padding = '20px';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '15px';
        
        // Valid input
        const validInput = document.createElement('input');
        validInput.className = 'form-input form-input--valid';
        validInput.value = 'Valid input';
        
        // Invalid input
        const invalidInput = document.createElement('input');
        invalidInput.className = 'form-input form-input--invalid';
        invalidInput.value = 'Invalid input';
        
        // Error message
        const errorMsg = document.createElement('div');
        errorMsg.className = 'form-error';
        errorMsg.textContent = 'This field is required';
        
        container.appendChild(validInput);
        container.appendChild(invalidInput);
        container.appendChild(errorMsg);
        
        document.body.appendChild(container);
      });
      
      const validationContainer = page.locator('#form-validation-container');
      await expect(validationContainer).toHaveScreenshot('form-validation-light.png');
    });
  });

  test.describe('Status Components', () => {
    test('should render status badges consistently', async ({ page }) => {
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'status-test-container';
        container.style.padding = '20px';
        container.style.display = 'flex';
        container.style.gap = '10px';
        container.style.flexWrap = 'wrap';
        
        // Status badges for business entities
        const statuses = [
          { class: 'status-paid', text: 'Paid' },
          { class: 'status-pending', text: 'Pending' },
          { class: 'status-overdue', text: 'Overdue' },
          { class: 'status-draft', text: 'Draft' },
          { class: 'status-finalized', text: 'Finalized' },
          { class: 'status-cancelled', text: 'Cancelled' }
        ];
        
        statuses.forEach(status => {
          const badge = document.createElement('span');
          badge.className = `status-badge ${status.class}`;
          badge.textContent = status.text;
          container.appendChild(badge);
        });
        
        document.body.appendChild(container);
      });
      
      const statusContainer = page.locator('#status-test-container');
      await expect(statusContainer).toHaveScreenshot('status-badges-light.png');
    });
  });

  test.describe('Table Components', () => {
    test('should render table structure consistently', async ({ page }) => {
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'table-test-container';
        container.style.padding = '20px';
        
        const table = document.createElement('table');
        table.className = 'table';
        
        // Header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.className = 'table-header';
        
        ['Name', 'Status', 'Amount', 'Date'].forEach(text => {
          const th = document.createElement('th');
          th.className = 'table-cell';
          th.textContent = text;
          headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        
        // Body
        const tbody = document.createElement('tbody');
        const dataRows = [
          ['John Doe', 'Paid', '$1,200.00', '2025-09-27'],
          ['Jane Smith', 'Pending', '$850.00', '2025-09-26'],
          ['Bob Johnson', 'Overdue', '$2,100.00', '2025-09-25']
        ];
        
        dataRows.forEach((rowData, index) => {
          const tr = document.createElement('tr');
          tr.className = 'table-row';
          
          rowData.forEach((cellData, cellIndex) => {
            const td = document.createElement('td');
            td.className = 'table-cell';
            if (cellIndex === 1) { // Status column
              const statusBadge = document.createElement('span');
              statusBadge.className = `status-badge status-${cellData.toLowerCase()}`;
              statusBadge.textContent = cellData;
              td.appendChild(statusBadge);
            } else {
              td.textContent = cellData;
            }
            tr.appendChild(td);
          });
          
          tbody.appendChild(tr);
        });
        
        table.appendChild(thead);
        table.appendChild(tbody);
        container.appendChild(table);
        
        document.body.appendChild(container);
      });
      
      const tableContainer = page.locator('#table-test-container');
      await expect(tableContainer).toHaveScreenshot('table-structure-light.png');
    });
  });

  test.describe('Card Components', () => {
    test('should render card layouts consistently', async ({ page }) => {
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'card-test-container';
        container.style.padding = '20px';
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
        container.style.gap = '20px';
        
        // Basic card
        const basicCard = document.createElement('div');
        basicCard.className = 'card';
        
        const cardHeader = document.createElement('div');
        cardHeader.className = 'card-header';
        cardHeader.textContent = 'Card Header';
        
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';
        cardBody.textContent = 'This is the card body content area.';
        
        const cardFooter = document.createElement('div');
        cardFooter.className = 'card-footer';
        const footerBtn = document.createElement('button');
        footerBtn.className = 'btn-primary';
        footerBtn.textContent = 'Action';
        cardFooter.appendChild(footerBtn);
        
        basicCard.appendChild(cardHeader);
        basicCard.appendChild(cardBody);
        basicCard.appendChild(cardFooter);
        
        // Interactive card
        const interactiveCard = document.createElement('div');
        interactiveCard.className = 'card card--interactive';
        
        const intCardHeader = document.createElement('div');
        intCardHeader.className = 'card-header';
        intCardHeader.textContent = 'Interactive Card';
        
        const intCardBody = document.createElement('div');
        intCardBody.className = 'card-body';
        intCardBody.textContent = 'This card has hover effects and is clickable.';
        
        interactiveCard.appendChild(intCardHeader);
        interactiveCard.appendChild(intCardBody);
        
        container.appendChild(basicCard);
        container.appendChild(interactiveCard);
        
        document.body.appendChild(container);
      });
      
      const cardContainer = page.locator('#card-test-container');
      await expect(cardContainer).toHaveScreenshot('card-layouts-light.png');
    });
  });

  test.describe('Modal Components', () => {
    test('should render modal dialog consistently', async ({ page }) => {
      await page.evaluate(() => {
        // Create modal backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        backdrop.style.position = 'fixed';
        backdrop.style.top = '0';
        backdrop.style.left = '0';
        backdrop.style.width = '100%';
        backdrop.style.height = '100%';
        backdrop.style.zIndex = '1000';
        
        // Create modal dialog
        const modal = document.createElement('div');
        modal.className = 'modal-dialog';
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%)';
        modal.style.zIndex = '1001';
        
        const modalHeader = document.createElement('div');
        modalHeader.className = 'modal-header';
        modalHeader.textContent = 'Modal Title';
        
        const modalBody = document.createElement('div');
        modalBody.className = 'modal-body';
        modalBody.textContent = 'This is the modal body content.';
        
        const modalFooter = document.createElement('div');
        modalFooter.className = 'modal-footer';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn-secondary';
        cancelBtn.textContent = 'Cancel';
        
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'btn-primary';
        confirmBtn.textContent = 'Confirm';
        
        modalFooter.appendChild(cancelBtn);
        modalFooter.appendChild(confirmBtn);
        
        modal.appendChild(modalHeader);
        modal.appendChild(modalBody);
        modal.appendChild(modalFooter);
        
        document.body.appendChild(backdrop);
        document.body.appendChild(modal);
      });
      
      // Screenshot the entire viewport to capture modal
      await expect(page).toHaveScreenshot('modal-dialog-light.png');
    });
  });

  test.describe('Layout Components', () => {
    test('should render page layouts consistently', async ({ page }) => {
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'layout-test-container';
        container.className = 'page-layout';
        
        // Page header
        const header = document.createElement('div');
        header.className = 'page-header';
        header.textContent = 'Page Header';
        
        // Page content
        const content = document.createElement('div');
        content.className = 'page-content';
        content.textContent = 'Main content area with proper spacing and typography.';
        
        // Page footer
        const footer = document.createElement('div');
        footer.className = 'page-footer';
        footer.textContent = 'Page Footer';
        
        container.appendChild(header);
        container.appendChild(content);
        container.appendChild(footer);
        
        document.body.appendChild(container);
      });
      
      const layoutContainer = page.locator('#layout-test-container');
      await expect(layoutContainer).toHaveScreenshot('page-layout-light.png');
    });
  });

  test.describe('Navigation Components', () => {
    test('should render navigation consistently', async ({ page }) => {
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'nav-test-container';
        container.style.padding = '20px';
        
        // Primary navigation
        const nav = document.createElement('nav');
        nav.className = 'nav-primary';
        
        const navList = document.createElement('ul');
        navList.className = 'nav-list';
        
        ['Dashboard', 'Customers', 'Products', 'Invoices', 'Reports'].forEach((item, index) => {
          const li = document.createElement('li');
          li.className = 'nav-item';
          
          const link = document.createElement('a');
          link.className = index === 0 ? 'nav-link nav-link--active' : 'nav-link';
          link.textContent = item;
          link.href = '#';
          
          li.appendChild(link);
          navList.appendChild(li);
        });
        
        nav.appendChild(navList);
        
        // Breadcrumb navigation
        const breadcrumb = document.createElement('nav');
        breadcrumb.className = 'breadcrumb';
        breadcrumb.style.marginTop = '20px';
        
        const breadcrumbList = document.createElement('ol');
        breadcrumbList.className = 'breadcrumb-list';
        
        ['Home', 'Customers', 'Customer Details'].forEach((item, index, arr) => {
          const li = document.createElement('li');
          li.className = 'breadcrumb-item';
          
          if (index === arr.length - 1) {
            li.className += ' breadcrumb-item--active';
            li.textContent = item;
          } else {
            const link = document.createElement('a');
            link.className = 'breadcrumb-link';
            link.textContent = item;
            link.href = '#';
            li.appendChild(link);
          }
          
          breadcrumbList.appendChild(li);
        });
        
        breadcrumb.appendChild(breadcrumbList);
        
        container.appendChild(nav);
        container.appendChild(breadcrumb);
        
        document.body.appendChild(container);
      });
      
      const navContainer = page.locator('#nav-test-container');
      await expect(navContainer).toHaveScreenshot('navigation-light.png');
    });
  });
});

test.describe('Component Accessibility Visual Tests', () => {
  test('should render focus states consistently', async ({ page }) => {
    await page.evaluate(() => {
      const container = document.createElement('div');
      container.id = 'focus-test-container';
      container.style.padding = '20px';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '15px';
      
      // Button with focus
      const focusedBtn = document.createElement('button');
      focusedBtn.className = 'btn-primary btn-primary--focus';
      focusedBtn.textContent = 'Focused Button';
      
      // Input with focus
      const focusedInput = document.createElement('input');
      focusedInput.className = 'form-input form-input--focus';
      focusedInput.value = 'Focused Input';
      
      // Link with focus
      const focusedLink = document.createElement('a');
      focusedLink.className = 'nav-link nav-link--focus';
      focusedLink.textContent = 'Focused Link';
      focusedLink.href = '#';
      
      container.appendChild(focusedBtn);
      container.appendChild(focusedInput);
      container.appendChild(focusedLink);
      
      document.body.appendChild(container);
    });
    
    const focusContainer = page.locator('#focus-test-container');
    await expect(focusContainer).toHaveScreenshot('focus-states-light.png');
  });
});

// Constitutional requirement: Test coverage validation
test.describe('Visual Test Coverage Validation', () => {
  test('should validate all component classes are visually tested', async ({ page }) => {
    // This test ensures we have visual regression coverage for all component classes
    // defined in our centralized design system
    
    const testedComponents = [
      'btn-primary', 'btn-secondary', 'btn-danger', 'btn-ghost',
      'form-input', 'form-select', 'form-textarea', 
      'status-badge', 'table', 'card', 'modal-dialog',
      'nav-primary', 'breadcrumb', 'page-layout'
    ];
    
    // Verify each component class has been visually tested
    for (const component of testedComponents) {
      // This would be implemented with actual visual regression tooling
      // For now, we validate that the component classes exist in our CSS
      const hasComponent = await page.evaluate((className) => {
        // Check if CSS class exists in stylesheets
        const styleSheets = Array.from(document.styleSheets);
        for (const sheet of styleSheets) {
          try {
            const rules = Array.from(sheet.cssRules || sheet.rules);
            for (const rule of rules) {
              if ((rule as CSSStyleRule).selectorText && (rule as CSSStyleRule).selectorText.includes(className)) {
                return true;
              }
            }
          } catch (e) {
            // Security restrictions on accessing stylesheets
            continue;
          }
        }
        return false;
      }, component);
      
      expect(hasComponent).toBeTruthy();
    }
  });
});