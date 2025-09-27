
# Implementation Plan: Centralized Design Token System

**Branch**: `001-styling` | **Date**: 2025-09-26 | **Spec**: [001-styling/spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-styling/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
Create a comprehensive centralized design token system that transforms the current scattered Tailwind utility approach into a maintainable, semantic design system. The solution must support theming capabilities (light/dark modes), follow Design Tokens Community Group specification, and address constitutional requirements for centralized styling consistency. This involves replacing all existing Tailwind utilities with semantic CSS classes in a coordinated Big Bang migration approach.

## Technical Context
**Language/Version**: TypeScript ~5.8.2, React 19.1.1, CSS (modern standards)  
**Primary Dependencies**: Vite 6.2.0, React Router DOM 6.23.1, Tailwind CSS (via CDN), Firebase 12.3.0  
**Storage**: CSS files in `/styles/` directory, design tokens as CSS custom properties, localStorage for theme persistence  
**Testing**: NEEDS CLARIFICATION - No test framework configured, must establish TDD compliance  
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari, Edge), responsive design desktop/mobile
**Project Type**: web (React SPA with Vite bundler)  
**Performance Goals**: Theme switching <500ms (per spec clarification), CSS bundle size minimization, 60fps UI interactions  
**Constraints**: Must maintain existing CDN approach, zero-downtime Big Bang migration, Design Tokens Community Group compliance  
**Scale/Scope**: ~15 React components to migrate, ~30 Tailwind patterns to replace, light/dark theme support

**Additional Context from CENTRALIZED_STYLING_ARCHITECTURE.md**: Complete technical architecture document exists providing detailed design token hierarchies, component CSS classes, theme configurations, Vite setup, and performance budgets. Migration strategy targets constitutional compliance for semantic class system over utility-first approach.

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Principle II - Centralized Design System & Styling Consistency**: ✅ ALIGNED
- This feature directly addresses the constitutional requirement for semantic CSS classes over scattered utility classes
- Implements centralized component classes (`.table-row`, `.form-input`, `.button-primary`) as mandated
- Eliminates repeated Tailwind patterns which violate design system consistency requirements

**Principle VI - Test-Driven Development**: ⚠️ REQUIRES ATTENTION
- Current project has no test framework configured (NEEDS CLARIFICATION in Technical Context)
- Must establish testing infrastructure before implementation begins
- All design system components must achieve 100% test coverage per constitution

**Principle VII - Systematic Analysis & Verification**: ✅ ALIGNED
- Feature spec underwent systematic clarification process with 5 resolved ambiguities
- Implementation plan includes verification steps and systematic validation
- Architecture document provides evidence-based technical decisions

**Principle VIII - Truth & Accuracy Standards**: ✅ ALIGNED
- Technical context clearly identifies gaps (testing framework) rather than making assumptions
- Architecture document provides factual analysis of current state issues
- All claims about performance and compliance are measurable and verifiable

**Principle IX - Industry Best Practices Compliance**: ✅ ALIGNED
- Design Tokens Community Group specification compliance mandated
- Performance standards defined (<500ms theme switching)
- Follows modern CSS architecture patterns and React best practices

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# React SPA with design system
styles/                      # NEW - Centralized design system
├── index.css               # Main entry point  
├── tokens/                 # Design token definitions
│   ├── colors.css         # Brand colors and semantic tokens
│   ├── spacing.css        # Consistent spacing scale
│   ├── typography.css     # Font scales and line heights
│   ├── shadows.css        # Elevation system
│   ├── borders.css        # Border radius and width tokens
│   └── transitions.css    # Animation tokens
├── components/             # Component-specific styles
│   ├── buttons.css        # All button variants
│   ├── forms.css          # Input fields, labels, validation
│   ├── tables.css         # Table styling patterns
│   ├── cards.css          # Card component styles
│   ├── status-badges.css  # Status indicators
│   ├── navigation.css     # Nav and breadcrumb styles
│   ├── modals.css         # Modal and dialog styles
│   └── layouts.css        # Page layout components
└── themes/                 # Theme variants
    ├── light.css          # Light theme (default)
    ├── dark.css           # Dark theme
    └── print.css          # Print-specific styles

components/                  # Existing React components (migrate styling)
├── CustomerEditor.tsx      
├── InvoiceList.tsx        
├── Dashboard.tsx          
└── [13+ other components] 

contexts/                   # React context (add ThemeProvider)
├── ToastContext.tsx       # Existing
└── ThemeContext.tsx       # NEW - Theme management

__tests__/                  # NEW - Test infrastructure
├── components/            # Component tests
├── styles/                # Design system tests  
└── integration/           # Theme switching tests
```

**Structure Decision**: Single React SPA project with new centralized styles directory. The existing component structure is preserved but will be updated to use the new design system classes. New testing infrastructure must be established to meet constitutional TDD requirements.

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (data-model.md, contracts/, quickstart.md)
- Each design token category → token definition + validation test task [P]
- Each theme configuration → theme CSS + switching test task [P]
- Each semantic component class → component CSS + React integration test task [P]
- Each API contract → TypeScript interface + contract test task [P]
- Migration tasks for each Tailwind pattern → semantic class replacement task
- Performance validation tasks for <500ms theme switching requirement

**Ordering Strategy**:
- TDD order: Tests written before implementation code per constitutional requirement
- Dependency order: Foundation tokens → Semantic tokens → Component classes → Theme integration → Component migration
- Infrastructure first: Testing setup → Token validation → Theme system → Component system → Migration
- Mark [P] for parallel execution where tasks operate on independent files/components

**Specific Task Categories**:
1. **Infrastructure Tasks (1-5)**: Testing framework setup, Vite configuration, directory structure
2. **Foundation Tasks (6-15)**: Design token creation and validation for each category (colors, spacing, typography, etc.)
3. **Theme System Tasks (16-22)**: Theme provider, context, CSS generation, switching logic
4. **Component System Tasks (23-35)**: Semantic CSS classes for buttons, forms, tables, cards, status badges, etc.
5. **Migration Tasks (36-50)**: Component-by-component Tailwind to semantic class conversion
6. **Validation Tasks (51-55)**: Performance testing, visual regression, cross-browser validation

**Constitutional Compliance**:
- Every implementation task preceded by corresponding test task
- 100% test coverage enforced for all generated code
- Systematic verification steps included for each task
- Performance requirements (<500ms) built into validation tasks

**Estimated Output**: 55-60 numbered, ordered tasks in tasks.md with clear TDD sequencing

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning approach described (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS (with testing framework requirement noted)
- [x] Post-Design Constitution Check: PASS - All designs align with constitutional principles
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none - design fully complies)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
