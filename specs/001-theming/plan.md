
# Implementation Plan: Centralized Theming System

**Branch**: `001-theming` | **Date**: 2025-09-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-theming/spec.md`

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
Implement a comprehensive centralized theming system to replace scattered Tailwind utility classes with semantic CSS classes, while providing multiple theme variants (Light, Dark, Vibrant) with Firebase persistence. This addresses the constitutional requirement for centralized design system and user demand for theme customization. Technical approach follows CSS Custom Properties + React Context pattern with design tokens for scalable theme management.

## Technical Context
**Language/Version**: TypeScript 5.0+ with React 19 and strict mode  
**Primary Dependencies**: CSS Custom Properties, React Context, Firebase Firestore, Vite build system  
**Storage**: Firebase Firestore for theme preferences with local storage fallback  
**Testing**: Vitest for unit tests, React Testing Library for component tests  
**Target Platform**: Modern web browsers (Chrome 88+, Firefox 85+, Safari 14+)
**Project Type**: Single-page web application (React SPA)  
**Performance Goals**: <300ms theme switching, <50ms CSS variable updates, smooth transitions  
**Constraints**: Constitutional compliance (semantic CSS classes), Firebase integration, offline capability  
**Scale/Scope**: 15+ React components, 4+ theme variants, comprehensive design token system

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Principle I - Hierarchical Business Logic**: ✅ PASS - Theming system is UI-layer enhancement that preserves all business logic. Theme preferences per user don't interfere with customer hierarchies, pricing calculations, or invoice management.

**Principle II - Centralized Design System**: ✅ PASS - This feature DIRECTLY addresses constitutional requirement. Will replace scattered utility classes (`py-3`, `px-4`, `bg-blue-50`) with semantic classes (`.table-row`, `.form-input`, `.button-primary`) as mandated.

**Principle III - Firebase-First Architecture**: ✅ PASS - Theme preferences stored in Firestore with proper TypeScript interfaces. Maintains Firebase as single source of truth with offline local storage fallback.

**Principle IV - Component Composition**: ✅ PASS - Uses React Context sparingly (theme context only), maintains component single-purpose design. Theme system enhances existing components without architectural complexity.

**Principle V - Type Safety**: ✅ PASS - All theme interfaces will be strictly typed, CSS custom properties managed with TypeScript enums, proper Firebase Timestamp handling for theme change tracking.

**Technical Standards Compliance**: ✅ PASS - Aligns with React 19 functional components, maintains responsive design, includes proper loading states for theme transitions, graceful degradation for unsupported themes.

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
# React SPA Structure (current)
components/             # All React components (15+ files)
├── CustomerEditor.tsx  # Forms with scattered utility classes
├── CustomerList.tsx    # Tables with hardcoded styling  
├── Dashboard.tsx       # Main layout components
├── InvoiceEditor.tsx   # Complex forms needing theming
├── ProductEditor.tsx   # AI-enhanced forms
├── Icons.tsx          # Custom SVG components
└── ...                # 10+ other components

contexts/              # React Context providers
├── ToastContext.tsx   # Existing notification context
└── ThemeContext.tsx   # NEW - Theme management context

styles/                # NEW - Centralized styling system
├── themes/            # Theme definitions
│   ├── light.css     # Light theme variables
│   ├── dark.css      # Dark theme variables
│   ├── vibrant.css   # Vibrant theme variables
│   └── themes.ts     # Theme metadata & exports
├── components/        # Semantic component classes  
│   ├── buttons.css   # .button-primary, .button-secondary
│   ├── forms.css     # .form-input, .form-label, .form-error
│   ├── tables.css    # .table-header, .table-row, .table-cell
│   ├── cards.css     # .card, .card-header, .card-content
│   └── layout.css    # .container, .section, .grid-layout
├── tokens.css         # CSS custom properties (design tokens)
└── global.css         # Theme application & reset

# Root files (existing)
App.tsx               # Main app component (add theme provider)
types.ts              # Add theme-related TypeScript interfaces
utils.ts              # Add theme utility functions
constants.ts          # Add theme constants and defaults
```

**Structure Decision**: React SPA with centralized styles directory following CSS Custom Properties + Design Tokens architecture. This mirrors industry standards from Material-UI, Chakra UI, and Ant Design while maintaining constitutional compliance for semantic CSS classes.

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
- Load `.specify/templates/tasks-template.md` as base template structure
- Generate foundational tasks from data model entities (Theme, UserThemePreferences, ThemeContextState)
- Generate contract implementation tasks from /contracts/ directory (theme-context.md, firebase-service.md, css-architecture.md)
- Generate migration tasks for converting existing components from utility classes to semantic classes
- Generate integration tasks connecting Firebase, React Context, and CSS architecture
- Generate validation tasks from quickstart.md test scenarios

**Specific Task Categories**:
1. **Foundation Tasks [P]**: TypeScript interfaces, CSS token definitions, directory structure
2. **Service Layer Tasks [P]**: FirebaseThemeService implementation, local storage fallback, offline sync
3. **Context Layer Tasks**: ThemeContext provider, useTheme hook, state management
4. **CSS Architecture Tasks [P]**: Semantic class definitions, theme mappings, CSS custom properties
5. **Component Migration Tasks**: Automated utility class replacement, manual verification, visual testing
6. **Integration Tasks**: End-to-end theme switching, Firebase persistence, performance optimization
7. **Testing Tasks**: Unit tests, integration tests, contract validation, quickstart verification

**Ordering Strategy**:
- **Phase 1**: Foundation (types, CSS tokens, directory setup) - All parallel [P]
- **Phase 2**: Core services (Firebase, Context) - Sequential dependencies
- **Phase 3**: CSS architecture (semantic classes, theme files) - Parallel [P] 
- **Phase 4**: Component migration (big bang approach) - Coordinated parallel execution
- **Phase 5**: Integration and testing - Sequential validation chain
- **Phase 6**: Performance optimization and documentation

**Dependency Management**:
- CSS tokens must exist before theme mappings
- TypeScript interfaces required before service implementations
- ThemeContext depends on FirebaseThemeService
- Component migration requires semantic CSS classes
- Integration tests require all components migrated

**Estimated Output**: 35-40 numbered, dependency-ordered tasks optimized for React theming system implementation following industry best practices (CSS Custom Properties + Design Tokens + React Context pattern)

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
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS (All design artifacts align with constitutional principles)
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (None - design maintains constitutional compliance)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
