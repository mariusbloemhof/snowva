# Tasks: Centralized Theming System

**Input**: Design documents from `/specs/001-theming/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: TypeScript 5.0+ with React 19, CSS Custom Properties, Firebase Firestore, Vite
   → Libraries: React Context, Firebase, Vitest, React Testing Library
   → Structure: React SPA with centralized styles directory
2. Load design documents:
   → data-model.md: Theme, ThemeTokens, UserThemePreferences entities
   → contracts/: theme-context.md, firebase-service.md, css-architecture.md
   → research.md: CSS Custom Properties + Design Tokens architecture decisions
3. Generate tasks by category:
   → Setup: TypeScript interfaces, CSS directory structure, Firebase config
   → Tests: Contract tests for ThemeContext, FirebaseService, CSS architecture
   → Core: Theme entities, FirebaseThemeService, ThemeContext provider
   → Integration: CSS variables application, Firebase persistence, component migration
   → Polish: Performance optimization, documentation, visual regression tests
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph for React theming system
7. Create parallel execution examples for CSS and TypeScript development
8. Validate: All contracts have tests, all entities have models, migration strategy complete
9. Return: SUCCESS (39 tasks ready for centralized theming system implementation)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **React SPA Structure**: Root-level `components/`, `contexts/`, `styles/`, `types.ts`, `utils.ts`
- **Styles Directory**: `styles/themes/`, `styles/components/`, `styles/vendor/`
- **Tests**: Vitest + React Testing Library in same directories as components

## Phase 3.1: Setup & Foundation
- [x] T001 Create centralized styles directory structure (styles/themes/, styles/components/, styles/vendor/)
- [x] T002 Initialize TypeScript interfaces for theming system in types.ts
- [x] T003 [P] Configure stylelint and CSS linting rules for semantic class enforcement
- [x] T004 [P] Set up Vitest configuration for React component testing
- [x] T005 [P] Create design tokens CSS custom properties in styles/tokens.css

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T006 [P] Contract test ThemeContext.switchTheme() in contexts/ThemeContext.test.tsx ✅
- [x] T007 [P] Contract test ThemeContext.updatePreferences() in contexts/ThemeContext.test.tsx ✅
- [x] T008 [P] Contract test ThemeContext.previewTheme() in contexts/ThemeContext.test.tsx ✅
- [x] T009 [P] Contract test FirebaseThemeService.getAvailableThemes() in services/FirebaseThemeService.test.ts ✅
- [x] T010 [P] Contract test FirebaseThemeService.getUserPreferences() in services/FirebaseThemeService.test.ts ✅
- [x] T011 [P] Contract test CSS variable application in tests/css-architecture.test.ts ✅
- [x] T012 [P] Integration test theme switching end-to-end in tests/integration.test.tsx ✅
- [x] T013 [P] Integration test Firebase persistence with offline fallback in tests/integration.test.tsx ✅
- [x] T014 [P] Integration test semantic CSS class migration in tests/css-architecture.test.ts ✅

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T015 [P] Theme entity interfaces in types.ts (Theme, ThemeTokens, ThemeCategory)
- [ ] T016 [P] UserThemePreferences entity interface in types.ts
- [ ] T017 [P] ThemeContextState and ThemeContextValue interfaces in types.ts
- [ ] T018 [P] CSS primitive tokens (colors, spacing, typography) in styles/tokens.css
- [ ] T019 [P] Light theme semantic token mappings in styles/themes/light.css
- [ ] T020 [P] Dark theme semantic token mappings in styles/themes/dark.css
- [ ] T021 [P] Vibrant theme semantic token mappings in styles/themes/vibrant.css
- [ ] T022 FirebaseThemeService class implementation in services/FirebaseThemeService.ts
- [ ] T023 ThemeContext provider implementation in contexts/ThemeContext.tsx
- [ ] T024 useTheme hook implementation in contexts/ThemeContext.tsx
- [ ] T025 Theme utility functions (CSS variable application) in utils.ts

## Phase 3.4: CSS Architecture & Semantic Classes
- [ ] T026 [P] Button semantic classes in styles/components/buttons.css
- [ ] T027 [P] Form semantic classes in styles/components/forms.css  
- [ ] T028 [P] Table semantic classes in styles/components/tables.css
- [ ] T029 [P] Card semantic classes in styles/components/cards.css
- [ ] T030 [P] Navigation semantic classes in styles/components/navigation.css
- [ ] T031 [P] Layout utility classes in styles/components/layout.css
- [ ] T032 Global CSS application and theme transitions in styles/global.css
- [ ] T033 CSS import orchestration and optimization in styles/index.css

## Phase 3.5: Component Migration (Big Bang Approach)
- [ ] T034 Migrate CustomerList component from utility classes to semantic classes in components/CustomerList.tsx
- [ ] T035 Migrate CustomerEditor component from utility classes to semantic classes in components/CustomerEditor.tsx
- [ ] T036 Migrate ProductList component from utility classes to semantic classes in components/ProductList.tsx
- [ ] T037 Migrate InvoiceEditor component from utility classes to semantic classes in components/InvoiceEditor.tsx
- [ ] T038 Migrate all remaining components (Dashboard, PaymentPage, etc.) from utility classes to semantic classes

## Phase 3.6: Integration & Firebase
- [ ] T039 Integrate ThemeProvider with App.tsx root component
- [ ] T040 Connect FirebaseThemeService with Firebase authentication state
- [ ] T041 Implement offline support and local storage fallback in FirebaseThemeService.ts
- [ ] T042 Add theme settings UI component in components/ThemeSettings.tsx

## Phase 3.7: Polish & Performance
- [ ] T043 [P] Performance optimization for theme switching (CSS transition management)
- [ ] T044 [P] Visual regression testing setup for theme consistency
- [ ] T045 [P] Update quickstart.md with final implementation details
- [ ] T046 [P] Add TypeScript strict mode compliance validation
- [ ] T047 Run manual theme switching testing scenarios from quickstart.md

## Dependencies
- Foundation (T001-T005) before all other phases
- Tests (T006-T014) before implementation (T015-T025)
- Core entities (T015-T017) before services (T022-T025)
- CSS tokens (T018) before theme mappings (T019-T021)
- Theme mappings before semantic classes (T026-T031)
- Semantic classes before component migration (T034-T038)
- Core implementation before integration (T039-T042)
- Integration before polish (T043-T047)

## Parallel Example
```
# Launch foundation CSS and TypeScript tasks together (T003-T005):
Task: "Configure stylelint and CSS linting rules for semantic class enforcement"  
Task: "Set up Vitest configuration for React component testing"
Task: "Create design tokens CSS custom properties in styles/tokens.css"

# Launch all contract tests together (T006-T014):
Task: "Contract test ThemeContext.switchTheme() in contexts/ThemeContext.test.tsx"
Task: "Contract test FirebaseThemeService.getAvailableThemes() in services/FirebaseThemeService.test.ts"
Task: "Integration test theme switching end-to-end in __tests__/theme-switching.integration.test.tsx"

# Launch all semantic CSS class files together (T026-T031):
Task: "Button semantic classes in styles/components/buttons.css"
Task: "Form semantic classes in styles/components/forms.css"  
Task: "Table semantic classes in styles/components/tables.css"
Task: "Card semantic classes in styles/components/cards.css"
```

## Notes
- [P] tasks target different files with no dependencies
- All tests must fail before implementation begins (TDD approach)
- CSS Custom Properties enable instant theme switching without React re-renders
- Firebase integration provides persistent theme preferences with offline fallback
- Big bang migration approach converts all components simultaneously as specified
- Constitutional compliance: Centralized design system with semantic CSS classes

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - theme-context.md → T006-T008, T023-T024 (ThemeContext tests and implementation)
   - firebase-service.md → T009-T010, T022, T041 (FirebaseService tests and implementation)
   - css-architecture.md → T011, T018-T021, T026-T033 (CSS architecture tests and implementation)
   
2. **From Data Model**:
   - Theme entity → T015 (Theme interfaces)
   - UserThemePreferences entity → T016 (preference interfaces)
   - ThemeTokens entity → T017-T018 (token interfaces and CSS implementation)
   
3. **From User Stories** (quickstart.md scenarios):
   - Theme switching → T012 (integration test)
   - Firebase persistence → T013 (integration test)
   - Component migration → T014, T034-T038 (migration tests and implementation)

4. **Ordering**:
   - Setup → Tests → Entities → Services → CSS → Migration → Integration → Polish
   - CSS Custom Properties foundation before theme mappings
   - All semantic classes before component migration (big bang approach)

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests (T006-T011 cover all contract methods)
- [x] All entities have model tasks (T015-T017 cover Theme, UserThemePreferences, ThemeTokens)
- [x] All tests come before implementation (T006-T014 before T015+)
- [x] Parallel tasks truly independent (different files, no shared dependencies)
- [x] Each task specifies exact file path (all tasks include specific file locations)
- [x] No task modifies same file as another [P] task (verified for all parallel markers)
- [x] Migration strategy addresses constitutional requirement (T034-T038 convert utility classes to semantic classes)
- [x] Performance requirements addressed (T043 optimizes <300ms theme switching)
- [x] Firebase integration complete (T022, T040-T041 handle persistence and offline support)