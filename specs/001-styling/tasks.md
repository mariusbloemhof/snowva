# Tasks: Centralized Design Token System

**Status**: Phase 3.7 System Integration Complete - Task T072 completed (72/87 tasks complete - 82.8% progress)
**Input**: Design documents from `/specs/001-styling/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/theme-management-api.md

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → Tech stack: TypeScript ~5.8.2, React 19.1.1, CSS, Vite 6.2.0
   → Structure: React SPA with centralized styles/ directory
2. Load design documents:
   → data-model.md: 4 entities (DesignToken, ThemeConfiguration, SemanticComponentClass, StatusIndicator)
   → contracts/theme-management-api.md: 6 API contracts for theme management
   → research.md: Testing framework (Vitest), performance (<500ms), DTCG compliance
3. Generate tasks by category:
   → Setup: Testing framework, CSS processing, directory structure
   → Tests: Contract tests, component tests, integration tests  
   → Foundation: Design tokens, theme system, component classes
   → Migration: Component-by-component Tailwind replacement
   → Validation: Performance, visual regression, cross-browser
4. Apply TDD ordering: Tests before implementation per constitutional requirement
5. Mark [P] for parallel execution where files are independent
6. 100% test coverage mandatory - no exceptions
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

React SPA structure with centralized design system:
- `styles/` - Design system CSS files
- `contexts/` - React Context providers  
- `utils/` - TypeScript utilities
- `__tests__/` - Test files with 100% coverage requirement
- `components/` - Existing React components (to be migrated)

## Phase 3.1: Setup & Infrastructure

- [x] **T001** Create design system directory structure: `styles/tokens/`, `styles/components/`, `styles/themes/`, `styles/utilities/`
- [x] **T002** Install and configure Vitest testing framework with 100% coverage requirement in `vitest.config.ts`
- [x] **T003** [P] Install testing dependencies: `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`
- [x] **T004** [P] Install Playwright for end-to-end testing with `playwright.config.ts`
- [x] **T005** [P] Configure PostCSS and CSS processing in `vite.config.ts` for design token optimization
- [x] **T006** Create test setup file `src/test-setup.ts` with custom matchers and global test configuration
- [x] **T007** [P] Update `package.json` scripts for testing, validation, and CSS building
- [x] **T008** Create test directory structure: `__tests__/components/`, `__tests__/styles/`, `__tests__/integration/`, `__tests__/utils/`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CONSTITUTIONAL REQUIREMENT: These tests MUST be written and MUST FAIL before ANY implementation**
**100% TEST COVERAGE MANDATORY - NO EXCEPTIONS**

### Contract Tests (API Interfaces)
- [x] **T009** [P] Contract test ThemeProvider Context interface in `__tests__/contracts/ThemeProvider.contract.test.tsx`
- [x] **T010** [P] Contract test Theme Performance contract (<500ms requirement) in `__tests__/contracts/ThemePerformance.contract.test.ts`
- [x] **T011** [P] Contract test Token API interface in `__tests__/contracts/TokenAPI.contract.test.ts`
- [x] **T012** [P] Contract test Component Class API interface in `__tests__/contracts/ComponentClassAPI.contract.test.ts`
- [x] **T013** [P] Contract test Status API interface in `__tests__/contracts/StatusAPI.contract.test.ts`
- [x] **T014** [P] Contract test CSS Generation API interface in `__tests__/contracts/CSSGenerationAPI.contract.test.ts`

### Entity Validation Tests  
- [x] **T015** [P] Design token validation tests in `__tests__/contracts/DesignTokenEntity.contract.test.ts`
- [x] **T016** [P] Theme configuration validation tests in `__tests__/contracts/ThemeEntity.contract.test.ts`
- [x] **T017** [P] Component class validation tests in `__tests__/contracts/SemanticComponentClass.contract.test.ts`
- [x] **T018** [P] Status indicator validation tests in `__tests__/contracts/StatusIndicator.contract.test.ts`

### Integration Tests
- [x] **T019** [P] Theme switching integration test (light ↔ dark) in `__tests__/contracts/themeSwitching.integration.test.tsx`
- [x] **T020** [P] Theme persistence integration test (localStorage) in `__tests__/contracts/themePersistence.integration.test.ts`
- [x] **T021** [P] Token resolution integration test in `__tests__/contracts/tokenResolution.integration.test.ts`
- [x] **T022** [P] Component styling integration test in `__tests__/contracts/componentStyling.integration.test.tsx`

### Performance Tests
- [x] **T023** [P] Theme switching performance test (<500ms) in `__tests__/contracts/themeSwitching.performance.test.ts`
- [x] **T024** [P] CSS bundle size performance test (<20KB) in `__tests__/contracts/bundleSize.performance.test.ts`

## Phase 3.3: Foundation Implementation (ONLY after tests are failing)

### Design Token System
- [x] **T025** [P] Create color tokens in `styles/tokens/colors.css` with Snowva brand colors and semantic abstractions
- [x] **T026** [P] Create spacing tokens in `styles/tokens/spacing.css` with consistent 4px base scale
- [x] **T027** [P] Create typography tokens in `styles/tokens/typography.css` with font scales and weights
- [x] **T028** [P] Create shadow tokens in `styles/tokens/shadows.css` with elevation system
- [x] **T029** [P] Create border tokens in `styles/tokens/borders.css` with radius and width values
- [x] **T030** [P] Create transition tokens in `styles/tokens/transitions.css` with animation durations

### TypeScript Utilities & Validation
- [x] **T031** [P] Design token TypeScript interfaces in `styles/tokens/types.ts` matching data model specifications
- [x] **T032** [P] Token validation utility in `styles/tokens/validation.ts` with DTCG compliance checking
- [x] **T033** [P] Token resolution utility in `styles/tokens/resolution.ts` for reference resolution and circular detection
- [x] **T034** [P] CSS class builder utility in `styles/tokens/classBuilder.ts` for dynamic component class generation

### Theme System Core
- [x] **T035** Theme provider context implementation in `contexts/ThemeContext.tsx` with <500ms switching requirement
- [x] **T036** [P] Light theme definition in `styles/themes/light.css` with complete token overrides
- [x] **T037** [P] Dark theme definition in `styles/themes/dark.css` with complete token overrides  
- [x] **T038** [P] Theme utility functions in `utils/themeUtils.ts` for theme validation and performance monitoring

## Phase 3.5: Component System Implementation

### Semantic CSS Classes  
- [x] **T039** [P] Button component classes in `styles/components/buttons.css` with all variants (primary, secondary, danger, ghost, sizes)
- [x] **T040** [P] Form component classes in `styles/components/forms.css` with inputs, labels, validation states
- [x] **T041** [P] Table component classes in `styles/components/tables.css` with header, body, cell styling
- [x] **T042** [P] Card component classes in `styles/components/cards.css` with header, body, footer, interactive states
- [x] **T043** [P] Status badge classes in `styles/components/status-badges.css` with business entity status indicators
- [x] **T044** [P] Navigation component classes in `styles/components/navigation.css` with nav and breadcrumb patterns
- [x] **T045** [P] Modal component classes in `styles/components/modals.css` with dialog and backdrop styling
- [x] **T046** [P] Layout component classes in `styles/components/layouts.css` with page layout patterns

### Status System
- [x] **T047** [P] Status utility functions in `utils/statusUtils.ts` for business entity status mapping
- [x] **T048** [P] Status color system in `utils/statusColors.ts` with contrast validation

### Main Stylesheet Integration
- [x] **T049** Main stylesheet assembly in `styles/index.css` importing all tokens, components, and themes in correct order
- [x] **T050** Vite configuration updates in `vite.config.ts` for CSS processing aliases and optimization

## Phase 3.6: Component Migration (Big Bang Approach)

### Core Components Migration
- [x] **T051** [C] App.tsx stylesheet import
- [x] **T052** [C] ThemeContext integration  
- [x] **T053** [C] Update component class references - Buttons
- [x] **T054** [C] Update component class references - Forms
- [x] **T055** [C] Update component class references - Status badges
- [x] **T056** [C] Update component class references - Tables
- [x] **T057** [C] Update component class references - Cards
- [x] **T058** [C] Update component class references - Navigation

### Form and Modal Components Migration  
- [x] **T059** [C] Update component class references - Modals
- [x] **T060** [C] Update component class references - Layouts
- [x] **T061** [C] Component migration - Forms and inputs
- [x] **T062** [C] Component migration - Interactive elements

### Document and Viewer Components Migration
- [x] **T063** [C] Component migration - Status systems
- [x] **T064** [C] Component migration - Data displays
- [x] **T065** [C] Component migration - Navigation elements
- [x] **T066** [C] Component migration - Layout structures

## Phase 3.7: System Integration

### Theme Integration  
- [x] **T067** [I] Component integration testing
- [x] **T068** Add theme switching UI component with toggle button and theme selection
- [x] **T069** Update `App.tsx` to use design system imports and theme context

### CSS Processing & Optimization
- [x] **T070** CSS bundle optimization and purging script in `utils/cssProcessing.ts`
- [x] **T071** Design token validation script in `utils/tokenValidation.ts` with DTCG compliance checking
- [x] **T072** Migration validation script in `utils/migrationValidation.ts` for visual equivalency

## Phase 3.8: Validation & Polish

### Visual Regression Testing
- [ ] **T073** [P] Component visual regression tests with Playwright in `__tests__/visual/components.visual.test.ts`
- [ ] **T074** [P] Theme switching visual tests in `__tests__/visual/themes.visual.test.ts`
- [ ] **T075** [P] Cross-browser compatibility tests in `__tests__/visual/crossBrowser.visual.test.ts`

### Performance Validation
- [ ] **T076** [P] Final performance validation suite in `__tests__/performance/designSystemPerformance.test.ts`
- [ ] **T077** [P] Bundle size analysis and reporting in `__tests__/performance/bundleAnalysis.test.ts`
- [ ] **T078** [P] Memory usage testing for theme switching in `__tests__/performance/memoryUsage.test.ts`

### Documentation & Cleanup
- [ ] **T079** [P] Update component documentation with design system usage examples
- [ ] **T080** [P] Create design system style guide documentation in `docs/DESIGN_SYSTEM.md`
- [ ] **T081** Remove all Tailwind CDN references from `index.html` after migration validation
- [ ] **T082** Final cleanup: remove unused CSS classes and optimize imports

### Missing Coverage Tasks
- [ ] **T083** [P] Print-friendly CSS implementation in `styles/themes/print.css` with brand identity preservation for PDF documents
- [ ] **T084** [P] Responsive design utilities in `styles/utilities/responsive.css` for desktop/tablet/mobile breakpoints
- [ ] **T085** [P] Typography hierarchy validation in `__tests__/styles/typographyHierarchy.test.ts` ensuring consistent visual hierarchy
- [ ] **T086** Print CSS integration test in `__tests__/integration/printStyling.integration.test.tsx`
- [ ] **T087** Responsive breakpoint test in `__tests__/integration/responsiveDesign.integration.test.tsx`

## Dependencies

**Setup Dependencies**:
- T001 blocks T025-T030 (tokens need directory structure)
- T002-T008 must complete before any test creation

**TDD Dependencies** (CONSTITUTIONAL REQUIREMENT):
- T009-T024 (all tests) must complete and FAIL before T025-T082 (implementation)
- Tests must achieve 100% coverage when implementation completes

**Foundation Dependencies**:
- T025-T030 (tokens) block T039-T048 (component classes)
- T031-T034 (utilities) block T035, T047-T048 (theme and status systems)
- T035-T038 (theme system) blocks T067-T068 (theme integration)

**Migration Dependencies**:
- T039-T048 (component classes) block T051-T066 (component migration)
- T049-T050 (stylesheet integration) blocks T067 (theme provider integration)
- T051-T066 (migration) must complete before T081 (Tailwind removal)

**Validation Dependencies**:
- T067-T072 (integration) blocks T073-T082 (validation and cleanup)
- Performance tests T076-T078 validate T023-T024 requirements

**Missing Coverage Dependencies**:
- T027 (typography tokens) blocks T085 (hierarchy validation)
- T049 (stylesheet integration) blocks T083 (print CSS)
- T084-T087 run in parallel with other validation tasks (T073-T082)

## Parallel Execution Examples

### Setup Phase (T001-T008)
```
# Run infrastructure setup in parallel:
Task: "Install and configure Vitest with 100% coverage in vitest.config.ts"
Task: "Install testing dependencies: @testing-library/react, jest-dom, user-event"  
Task: "Install Playwright for E2E testing with playwright.config.ts"
Task: "Configure PostCSS and CSS processing in vite.config.ts"
Task: "Update package.json scripts for testing and validation"
```

### Contract Tests (T009-T024)
```
# All contract tests can run in parallel (different files):
Task: "Contract test ThemeProvider Context in __tests__/contracts/ThemeProvider.contract.test.tsx"
Task: "Contract test Theme Performance (<500ms) in __tests__/contracts/ThemePerformance.contract.test.ts"
Task: "Contract test Token API in __tests__/contracts/TokenAPI.contract.test.ts" 
Task: "Design token validation tests in __tests__/styles/DesignToken.validation.test.ts"
Task: "Theme switching integration test in __tests__/integration/themeSwitching.integration.test.tsx"
```

### Token Creation (T025-T030)
```
# Token files are independent and can be created in parallel:
Task: "Create color tokens in styles/tokens/colors.css with Snowva brand colors"
Task: "Create spacing tokens in styles/tokens/spacing.css with 4px base scale"
Task: "Create typography tokens in styles/tokens/typography.css with font scales"
Task: "Create shadow tokens in styles/tokens/shadows.css with elevation system"
```

### Component Classes (T039-T046)  
```
# Component CSS files are independent:
Task: "Button component classes in styles/components/buttons.css with variants"
Task: "Form component classes in styles/components/forms.css with validation states"
Task: "Table component classes in styles/components/tables.css"
Task: "Status badge classes in styles/components/status-badges.css"
```

## Performance Requirements

- Theme switching must complete under 500ms maximum (validated by T023, T076)
- CSS bundle size under 20KB (validated by T024, T077)  
- 100% test coverage mandatory (enforced by T002 Vitest configuration)
- Zero visual regressions during migration (validated by T073-T075)
- Print-friendly styling maintains brand identity (validated by T083, T086)
- Responsive design works across all breakpoints (validated by T084, T087)

## Constitutional Compliance

- **TDD Order**: All tests (T009-T024) before implementation (T025-T082)
- **Systematic Verification**: Each phase includes validation tasks
- **Centralized Design System**: Replaces scattered Tailwind utilities with semantic classes
- **100% Test Coverage**: No exceptions per constitutional requirement
- **Performance Standards**: <500ms theme switching enforced throughout

## Notes

- [P] tasks operate on different files with no dependencies  
- All tests must fail initially to satisfy TDD requirement
- Migration tasks follow Big Bang approach with feature-flag safety
- Performance requirements tested continuously throughout implementation
- Visual regression testing ensures migration equivalency
- **Total Tasks**: 87 tasks (T001-T087) providing complete requirement coverage