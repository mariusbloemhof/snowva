<!-- 
Sync Impact Report:
Version change: 1.0.0 → 1.1.0
Modified principles: Enhanced II. Centralized Design System with stricter styling consistency requirements
Added sections: 
- VI. Test-Driven Development (TDD)
- VII. Systematic Analysis & Verification
- VIII. Truth & Accuracy Standards
- IX. Industry Best Practices Compliance
- Enhanced Testing Requirements with 100% coverage mandate
Removed sections: N/A
Templates requiring updates:
✅ constitution.md - Updated with new principles
⚠ .github/copilot-instructions.md - Should align with enhanced design system and TDD principles
⚠ plan-template.md - Constitution Check section references this document
⚠ tasks-template.md - Should enforce TDD task ordering and systematic verification steps
Follow-up TODOs: 
- Establish test coverage tooling and CI/CD integration
- Review existing codebase for TDD compliance gaps
- Implement systematic verification checklists in development workflow
-->

# Snowva Business Hub Constitution

## Core Principles

### I. Hierarchical Business Logic First (NON-NEGOTIABLE)
The application MUST accurately model B2B/B2C sales with sophisticated hierarchical customer relationships. Parent companies control branches, pricing inheritance flows downward with branch-level overrides permitted. All business logic (customer management, pricing, invoicing, payments) must respect these hierarchical relationships. Features that compromise business logic accuracy are rejected.

Rationale: This is a business-critical sales management system where data integrity directly impacts revenue and customer relationships.

### II. Centralized Design System & Styling Consistency (NON-NEGOTIABLE)
All UI components MUST use centralized, semantic CSS classes instead of scattered utility classes. Create reusable component classes (`.table-row`, `.form-input`, `.button-primary`) managed in a single stylesheet. Tailwind utilities are permitted only for layout and one-off customizations, never for repeated styling patterns. Styling consistency across ALL components and screens is NON-NEGOTIABLE - every interface element must follow the established design system.

Rationale: Inconsistent styling creates poor user experience and maintenance nightmares. A unified design system ensures professional appearance and enables efficient development and maintenance.

### III. Firebase-First Data Architecture
All persistent data MUST use Firebase Firestore with proper TypeScript interfaces. Local state is temporary only - Firebase is the single source of truth. Data operations must handle Firebase Timestamps correctly, include proper error handling, and maintain referential integrity across collections (customers, products, invoices, payments).

Rationale: Ensures data persistence, enables real-time updates, and provides reliable backup/sync capabilities for business-critical data.

### IV. Component Composition Over Complexity
Components MUST be single-purpose and composable. Large components (>300 lines) should be decomposed into smaller, focused components. Use React Context sparingly - only for truly global state like notifications. Pass data via props and `useOutletContext()` for parent-child communication.

Rationale: Maintains code clarity, enables easier testing, and follows React best practices for long-term maintainability.

### V. Type Safety & Data Validation
All data structures MUST have comprehensive TypeScript interfaces. Firebase operations must include proper type checking. Form validation must be inline and user-friendly. No `any` types permitted except for third-party library integrations with explicit rationale.

Rationale: Prevents runtime errors in business-critical workflows and ensures data integrity across the application.

### VI. Test-Driven Development (NON-NEGOTIABLE)
ALL new development MUST follow Test-Driven Development (TDD) methodology. Tests must be written BEFORE implementation code. Every function, component, and feature must have comprehensive test coverage reaching 100%. No code may be merged without complete test coverage including unit tests, integration tests, and end-to-end tests where applicable.

Rationale: TDD ensures code quality, prevents regression bugs, and creates living documentation. 100% test coverage is non-negotiable for business-critical sales management system where bugs directly impact revenue.

### VII. Systematic Analysis & Verification (NON-NEGOTIABLE)  
Every task, implementation, and code change MUST undergo systematic analysis and verification. All claims about implementation status must be verified through actual testing and measurement. No assumptions or hallucinations are permitted - every statement must be backed by concrete evidence and systematic checking.

Rationale: Prevents errors, ensures accuracy, and maintains high-quality deliverables. Systematic verification catches issues before they impact production.

### VIII. Truth & Accuracy Standards (NON-NEGOTIABLE)
All communications, documentation, and status reports MUST be factually accurate. No false claims, assumptions, or hallucinations are permitted. If something cannot be verified, it must be explicitly marked as unverified or requiring investigation. Every technical claim must be backed by evidence.

Rationale: Trust and accuracy are fundamental to effective development and business operations. False information leads to bad decisions and wasted effort.

### IX. Industry Best Practices Compliance (NON-NEGOTIABLE)
ALL development practices MUST adhere to industry best practices and standards for React, TypeScript, Firebase, and web application development. This includes but is not limited to: secure coding practices, performance optimization, accessibility standards (WCAG), SEO best practices, proper error handling, and modern development workflows.

Rationale: Industry standards exist to prevent common pitfalls and ensure professional-grade applications. Deviation from best practices creates technical debt and security vulnerabilities.

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


## Development Workflow

### Code Quality Gates
- All components must pass TypeScript strict checking
- No console errors or warnings in production builds
- Consistent code formatting (use project prettier config)
- Semantic commit messages following conventional commits
- Component-level documentation for complex business logic

### Testing Requirements (NON-NEGOTIABLE)
- **100% Test Coverage**: All code must achieve 100% test coverage with no exceptions
- **TDD Compliance**: Tests written before implementation code in all cases
- Unit tests for ALL functions, utilities, and business logic (especially pricing calculations)
- Component tests for ALL React components with full interaction testing
- Integration tests for ALL Firebase operations and data flows
- End-to-end tests for ALL critical business workflows
- Performance tests for ALL user-facing operations
- Security tests for ALL data handling and authentication flows
- Accessibility tests ensuring WCAG compliance
- Manual testing protocols with systematic verification checklists
- Automated test execution in CI/CD pipeline with zero tolerance for test failures

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

**Version**: 1.1.0 | **Ratified**: 2025-09-26 | **Last Amended**: 2025-09-26