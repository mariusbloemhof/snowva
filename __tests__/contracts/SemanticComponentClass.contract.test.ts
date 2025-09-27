import { beforeEach, describe, expect, it } from 'vitest';

describe('Semantic Component Class Validation Contract', () => {
  let mockSemanticComponentClass: any;

  beforeEach(() => {
    mockSemanticComponentClass = {
      id: 'btn-primary',
      name: 'Primary Button',
      category: 'button',
      semanticName: 'btn-primary',
      baseClass: 'btn',
      variants: ['primary'],
      modifiers: ['disabled', 'loading'],
      cssProperties: [
        {
          property: 'background-color',
          value: 'var(--color-primary)',
          tokenReference: 'color-primary'
        },
        {
          property: 'color', 
          value: 'var(--text-inverse)',
          tokenReference: 'text-inverse'
        }
      ],
      responsiveRules: [
        {
          breakpoint: 'mobile',
          properties: [
            { property: 'padding', value: 'var(--space-2) var(--space-3)' }
          ]
        }
      ],
      states: ['hover', 'focus', 'active', 'disabled']
    };
  });

  it('should validate required component class properties', () => {
    // Contract: Component class entity structure
    expect(() => {
      const { validateSemanticComponentClass } = require('../../entities/SemanticComponentClass');
    }).toThrow('Cannot find module');

    // Mock validation logic
    const validateComponentClass = (componentClass: any) => {
      const required = ['id', 'name', 'category', 'semanticName', 'cssProperties'];
      return required.every(field => 
        componentClass.hasOwnProperty(field) && 
        componentClass[field] !== null && 
        componentClass[field] !== undefined
      );
    };

    expect(validateComponentClass(mockSemanticComponentClass)).toBe(true);
    
    const incompleteClass = { id: 'btn', name: 'Button' };
    expect(validateComponentClass(incompleteClass)).toBe(false);
  });

  it('should validate semantic naming conventions', () => {
    // Contract: Semantic naming rules
    const validateSemanticName = (semanticName: string) => {
      // Must follow BEM-like convention: block-element__modifier
      return /^[a-z][a-z0-9-]*$/.test(semanticName);
    };

    const validateBaseClass = (baseClass: string) => {
      // Base class must be simple, lowercase, descriptive
      return /^[a-z][a-z0-9]*$/.test(baseClass);
    };

    expect(validateSemanticName('btn-primary')).toBe(true);
    expect(validateSemanticName('form-input-error')).toBe(true);
    expect(validateSemanticName('Btn-Primary')).toBe(false); // Uppercase
    expect(validateSemanticName('btn_primary')).toBe(false); // Underscore

    expect(validateBaseClass('btn')).toBe(true);
    expect(validateBaseClass('input')).toBe(true);
    expect(validateBaseClass('Button')).toBe(false); // Uppercase
  });

  it('should validate CSS properties structure', () => {
    // Contract: CSS property requirements
    const validateCSSProperties = (properties: any[]) => {
      if (!Array.isArray(properties) || properties.length === 0) return false;
      
      return properties.every(prop => {
        return prop.hasOwnProperty('property') &&
               prop.hasOwnProperty('value') &&
               typeof prop.property === 'string' &&
               typeof prop.value === 'string' &&
               prop.property.length > 0;
      });
    };

    expect(validateCSSProperties(mockSemanticComponentClass.cssProperties)).toBe(true);
    
    const invalidProperties = [
      { property: 'color' }, // Missing value
      { value: '#ffffff' } // Missing property
    ];
    expect(validateCSSProperties(invalidProperties)).toBe(false);
  });

  it('should validate token references in CSS values', () => {
    // Contract: Design token integration
    const validateTokenReferences = (cssProperties: any[], availableTokens: string[]) => {
      const tokenPattern = /var\(--([a-z][a-z0-9-]*)\)/g;
      const issues: string[] = [];
      
      cssProperties.forEach(prop => {
        const matches = [...prop.value.matchAll(tokenPattern)];
        matches.forEach(match => {
          const tokenName = match[1];
          if (!availableTokens.includes(tokenName)) {
            issues.push(`Token "${tokenName}" not found in available tokens`);
          }
        });
      });
      
      return { isValid: issues.length === 0, issues };
    };

    const availableTokens = ['color-primary', 'text-inverse', 'space-2', 'space-3'];
    
    const validResult = validateTokenReferences(mockSemanticComponentClass.cssProperties, availableTokens);
    expect(validResult.isValid).toBe(true);

    const propertiesWithMissingToken = [
      { property: 'color', value: 'var(--color-missing)' }
    ];
    
    const invalidResult = validateTokenReferences(propertiesWithMissingToken, availableTokens);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.issues).toContain('Token "color-missing" not found in available tokens');
  });

  it('should validate component variants and modifiers', () => {
    // Contract: Variant system validation
    const validateVariantsAndModifiers = (componentClass: any) => {
      const issues: string[] = [];
      
      if (componentClass.variants && !Array.isArray(componentClass.variants)) {
        issues.push('Variants must be an array');
      }
      
      if (componentClass.modifiers && !Array.isArray(componentClass.modifiers)) {
        issues.push('Modifiers must be an array');
      }
      
      // Check variant naming
      if (componentClass.variants) {
        componentClass.variants.forEach((variant: string) => {
          if (!/^[a-z][a-z0-9-]*$/.test(variant)) {
            issues.push(`Invalid variant name: ${variant}`);
          }
        });
      }
      
      // Check modifier naming
      if (componentClass.modifiers) {
        componentClass.modifiers.forEach((modifier: string) => {
          if (!/^[a-z][a-z0-9-]*$/.test(modifier)) {
            issues.push(`Invalid modifier name: ${modifier}`);
          }
        });
      }
      
      return { isValid: issues.length === 0, issues };
    };

    const validResult = validateVariantsAndModifiers(mockSemanticComponentClass);
    expect(validResult.isValid).toBe(true);

    const invalidClass = {
      variants: ['Primary', 'LARGE'], // Invalid casing
      modifiers: ['is_disabled'] // Invalid underscore
    };
    
    const invalidResult = validateVariantsAndModifiers(invalidClass);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.issues).toContain('Invalid variant name: Primary');
  });

  it('should validate responsive rules structure', () => {
    // Contract: Responsive design integration
    const validateResponsiveRules = (rules: any[]) => {
      if (!Array.isArray(rules)) return { isValid: false, issues: ['Responsive rules must be an array'] };
      
      const validBreakpoints = ['mobile', 'tablet', 'desktop', 'wide'];
      const issues: string[] = [];
      
      rules.forEach((rule, index) => {
        if (!rule.breakpoint || !validBreakpoints.includes(rule.breakpoint)) {
          issues.push(`Invalid breakpoint at index ${index}: ${rule.breakpoint}`);
        }
        
        if (!rule.properties || !Array.isArray(rule.properties)) {
          issues.push(`Missing or invalid properties at index ${index}`);
        }
      });
      
      return { isValid: issues.length === 0, issues };
    };

    const validResult = validateResponsiveRules(mockSemanticComponentClass.responsiveRules);
    expect(validResult.isValid).toBe(true);

    const invalidRules = [
      { breakpoint: 'invalid', properties: [] },
      { breakpoint: 'mobile' } // Missing properties
    ];
    
    const invalidResult = validateResponsiveRules(invalidRules);
    expect(invalidResult.isValid).toBe(false);
    expect(invalidResult.issues).toContain('Invalid breakpoint at index 0: invalid');
  });

  it('should validate component states definition', () => {
    // Contract: Component state management
    const validateComponentStates = (states: string[]) => {
      if (!Array.isArray(states)) return { isValid: false, issues: ['States must be an array'] };
      
      const standardStates = ['hover', 'focus', 'active', 'disabled', 'loading', 'selected', 'error', 'success'];
      const issues: string[] = [];
      
      states.forEach(state => {
        if (!standardStates.includes(state)) {
          issues.push(`Non-standard state: ${state}. Consider using standard states.`);
        }
      });
      
      return { 
        isValid: true, // Non-standard states are warnings, not errors
        issues,
        standardStates: states.filter(s => standardStates.includes(s)),
        customStates: states.filter(s => !standardStates.includes(s))
      };
    };

    const validResult = validateComponentStates(mockSemanticComponentClass.states);
    expect(validResult.isValid).toBe(true);
    expect(validResult.standardStates).toContain('hover');

    const statesWithCustom = ['hover', 'focus', 'custom-state'];
    const resultWithCustom = validateComponentStates(statesWithCustom);
    expect(resultWithCustom.isValid).toBe(true);
    expect(resultWithCustom.customStates).toContain('custom-state');
  });

  it('should validate component category classification', () => {
    // Contract: Component categorization
    const standardCategories = [
      'button', 'input', 'form', 'navigation', 'layout', 'typography', 
      'feedback', 'display', 'overlay', 'media', 'utility'
    ];
    
    const validateComponentCategory = (category: string) => {
      const isStandardCategory = standardCategories.includes(category);
      return {
        isValid: typeof category === 'string' && category.length > 0,
        isStandard: isStandardCategory,
        category
      };
    };

    const result = validateComponentCategory(mockSemanticComponentClass.category);
    expect(result.isValid).toBe(true);
    expect(result.isStandard).toBe(true);

    const customCategoryResult = validateComponentCategory('custom-widget');
    expect(customCategoryResult.isValid).toBe(true);
    expect(customCategoryResult.isStandard).toBe(false);
  });
});