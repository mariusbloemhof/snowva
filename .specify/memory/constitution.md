<!-- 
Sync Impact Report:
Version change: Initial → 1.0.0
Modified principles: N/A (Initial creation)
Added sections: All core principles, Technical Standards, Development Workflow, Governance
Removed sections: N/A
Templates requiring updates:
✅ constitution.md - Initial creation
⚠ .github/copilot-instructions.md - Should align with Centralized Design System principle
⚠ plan-template.md - Constitution Check section references this document
Follow-up TODOs: Review CSS architecture in existing components for centralized design system compliance
-->

# Snowva Business Hub Constitution

## Core Principles

### I. Hierarchical Business Logic First (NON-NEGOTIABLE)
The application MUST accurately model B2B/B2C sales with sophisticated hierarchical customer relationships. Parent companies control branches, pricing inheritance flows downward with branch-level overrides permitted. All business logic (customer management, pricing, invoicing, payments) must respect these hierarchical relationships. Features that compromise business logic accuracy are rejected.

Rationale: This is a business-critical sales management system where data integrity directly impacts revenue and customer relationships.

### II. Centralized Design System
All UI components MUST use centralized, semantic CSS classes instead of scattered utility classes. Create reusable component classes (`.table-row`, `.form-input`, `.button-primary`) managed in a single stylesheet. Tailwind utilities are permitted only for layout and one-off customizations, never for repeated styling patterns.

Rationale: Current codebase has maintenance nightmare with hardcoded `py-3`, `px-4` scattered across components. Centralized design system enables consistent UX and efficient maintenance.

### III. Firebase-First Data Architecture
All persistent data MUST use Firebase Firestore with proper TypeScript interfaces. Local state is temporary only - Firebase is the single source of truth. Data operations must handle Firebase Timestamps correctly, include proper error handling, and maintain referential integrity across collections (customers, products, invoices, payments).

Rationale: Ensures data persistence, enables real-time updates, and provides reliable backup/sync capabilities for business-critical data.

### IV. Component Composition Over Complexity
Components MUST be single-purpose and composable. Large components (>300 lines) should be decomposed into smaller, focused components. Use React Context sparingly - only for truly global state like notifications. Pass data via props and `useOutletContext()` for parent-child communication.

Rationale: Maintains code clarity, enables easier testing, and follows React best practices for long-term maintainability.

### V. Type Safety & Data Validation
All data structures MUST have comprehensive TypeScript interfaces. Firebase operations must include proper type checking. Form validation must be inline and user-friendly. No `any` types permitted except for third-party library integrations with explicit rationale.

Rationale: Prevents runtime errors in business-critical workflows and ensures data integrity across the application.

## Technical Standards

### React Architecture Requirements
- React 19 + TypeScript with strict mode enabled
- Functional components only (no class components)
- Custom hooks for shared logic extraction
- `useBlocker()` for unsaved changes detection in forms
- Proper error boundaries for graceful error handling

### Firebase Integration Standards
- Firestore for all persistent data with proper indexing
- Firebase Timestamp objects for all date/time data
- Proper offline support and error handling
- Security rules must restrict data access appropriately
- Regular backups and migration scripts maintained

### UI/UX Requirements
- Responsive design with mobile-first approach
- Inline form validation with clear error messages
- Toast notifications for user feedback (no alert() calls)
- Loading states for all async operations
- Print-friendly styles for documents (invoices, statements)

### AI Integration Guidelines
- Google Gemini API for product image discovery only
- Graceful degradation when AI features fail
- API keys properly secured in environment variables
- Rate limiting and error handling for external API calls

## Development Workflow

### Code Quality Gates
- All components must pass TypeScript strict checking
- No console errors or warnings in production builds
- Consistent code formatting (use project prettier config)
- Semantic commit messages following conventional commits
- Component-level documentation for complex business logic

### Testing Requirements
- Unit tests for utility functions (especially pricing calculations)
- Integration tests for Firebase operations
- Manual testing of critical business workflows before deployment
- Form validation testing across different data scenarios

### Performance Standards
- Bundle size must remain under reasonable limits for SPA
- Lazy loading for large components where appropriate
- Efficient re-rendering with proper React optimization
- Database queries optimized to minimize reads

### Security & Privacy
- No sensitive data in client-side code or logs
- Proper input sanitization for all form fields  
- Firebase security rules prevent unauthorized access
- Environment variables for all API keys and secrets

## Governance

This constitution supersedes all other development practices and guidelines. All feature implementations, code reviews, and architectural decisions must align with these principles.

**Amendment Process**: Constitutional changes require documentation of rationale, impact analysis, and migration plan. Version numbering follows semantic versioning (MAJOR.MINOR.PATCH).

**Compliance Review**: All pull requests must verify constitutional compliance. Violations must be justified with explicit rationale or the implementation must be refactored to comply.

**Runtime Guidance**: Use `.github/copilot-instructions.md` for detailed development patterns and component examples.

**Version**: 1.0.0 | **Ratified**: 2025-09-26 | **Last Amended**: 2025-09-26