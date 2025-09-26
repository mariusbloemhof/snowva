# Research: Centralized Theming System

**Feature**: 001-theming | **Phase**: 0 | **Date**: 2025-09-26

## Research Tasks Completed

### CSS Custom Properties vs CSS-in-JS for React Theming

**Decision**: CSS Custom Properties (CSS Variables) with design tokens
**Rationale**: 
- Performance: CSS variables update without React re-renders, meeting <300ms requirement
- Browser support: Excellent in target browsers (Chrome 88+, Firefox 85+, Safari 14+)
- Constitutional compliance: Enables semantic CSS classes as required
- Maintainability: Single source of truth for design tokens
- Theme switching: Instant visual updates through CSS variable cascading

**Alternatives considered**:
- Styled Components: Rejected due to runtime CSS generation overhead
- Emotion: Rejected due to CSS-in-JS performance concerns for theme switching
- Sass variables: Rejected due to compile-time limitations (can't switch themes dynamically)

### Design Token Architecture Pattern

**Decision**: Multi-tier token system (Primitive → Semantic → Component)
**Rationale**: Industry standard from design systems like Material Design, Human Interface Guidelines, and Carbon Design System
- Primitive tokens: Raw values (colors, spacing, typography scales)
- Semantic tokens: Contextual mappings (primary-color, text-color, spacing-large)
- Component tokens: Component-specific overrides (button-padding, table-row-height)

**Alternatives considered**:
- Flat token structure: Rejected due to maintainability issues at scale
- Component-only tokens: Rejected due to duplication and inconsistency risk

### React Context Pattern for Theme Management

**Decision**: Single ThemeContext with reducer pattern
**Rationale**:
- Minimal React Context usage per constitutional requirements
- Clean separation: context for theme state, CSS variables for styling
- Performance: Context changes only on theme switch, not style updates
- Testability: Easy to mock and test theme switching logic

**Alternatives considered**:
- Multiple contexts: Rejected due to constitutional guidance on sparing Context use
- Global state library: Rejected due to architectural simplicity requirements
- Direct DOM manipulation: Rejected due to React best practices

### Firebase Integration Pattern

**Decision**: User preferences subcollection with offline sync
**Rationale**:
- Scalable: `/users/{userId}/preferences/theme` document structure
- Offline capable: Local storage fallback when Firebase unavailable
- Type safety: Proper TypeScript interfaces for Firestore operations
- Performance: Cached locally, sync in background

**Alternatives considered**:
- Main user document field: Rejected due to potential document size concerns
- Separate collection: Rejected due to additional security rule complexity
- No offline support: Rejected due to constitutional offline requirements

### Theme Switching Performance Optimization

**Decision**: CSS class swapping with transition management
**Rationale**:
- Browser-optimized: CSS transitions handled by compositor thread
- Smooth UX: 300ms transition duration with loading indicator
- Memory efficient: Only active theme CSS loaded, others lazy-loaded
- Accessible: Respects user's motion preferences (prefers-reduced-motion)

**Alternatives considered**:
- JavaScript-driven animations: Rejected due to main thread blocking
- Instant switching: Rejected due to jarring user experience
- Multiple concurrent themes: Rejected due to bundle size concerns

### Component Migration Strategy

**Decision**: Automated utility class replacement with manual verification
**Rationale**:
- Big bang approach per specification clarification
- AST-based transformation for accuracy and speed
- Manual review gates for business-critical components
- Rollback plan through git branching strategy

**Alternatives considered**:
- Manual component-by-component: Rejected due to time constraints and error risk
- Gradual rollout: Rejected per user specification for simultaneous conversion
- No migration tooling: Rejected due to human error probability at scale

## Technical Specifications Resolved

### Browser Compatibility Matrix
- **Chrome**: 88+ (CSS Custom Properties full support)
- **Firefox**: 85+ (CSS Custom Properties full support)  
- **Safari**: 14+ (CSS Custom Properties full support)
- **Edge**: 88+ (Chromium-based, full support)
- **Mobile**: iOS Safari 14+, Chrome Mobile 88+

### Performance Benchmarks
- **Theme switching**: <300ms total (CSS variable update <50ms + transition 250ms)
- **Bundle impact**: +15-20KB for complete theming system (acceptable for SPA)
- **Runtime memory**: +2-5MB for theme data structures (negligible impact)
- **First paint**: No impact (critical CSS inlined, theme CSS lazy-loaded)

### Accessibility Considerations
- **High contrast**: Automatic theme variants for accessibility users
- **Motion preferences**: Respect `prefers-reduced-motion` for transitions
- **Color contrast**: WCAG AA compliance for all theme variants (>4.5:1 ratio)
- **Focus indicators**: Theme-aware focus rings with sufficient contrast

## Architecture Decisions Record

### ADR-001: CSS Custom Properties Over CSS-in-JS
**Status**: Accepted  
**Context**: Need theme switching with <300ms performance requirement  
**Decision**: Use CSS Custom Properties with design token architecture  
**Consequences**: Excellent performance, constitutional compliance, industry standard pattern

### ADR-002: Multi-Tier Design Token System  
**Status**: Accepted  
**Context**: Need scalable design system supporting multiple themes  
**Decision**: Implement primitive → semantic → component token hierarchy  
**Consequences**: Maintainable at scale, follows design system best practices

### ADR-003: Single Theme Context Pattern
**Status**: Accepted  
**Context**: Constitutional requirement for minimal React Context usage  
**Decision**: One ThemeContext managing theme state, CSS variables for styling  
**Consequences**: Clean architecture, good performance, easy testing

### ADR-004: Firebase Subcollection Storage
**Status**: Accepted  
**Context**: Need persistent theme preferences with offline capability  
**Decision**: User preferences subcollection with local storage fallback  
**Consequences**: Scalable, offline-capable, type-safe

### ADR-005: Big Bang Migration Strategy
**Status**: Accepted  
**Context**: User specification for simultaneous component conversion  
**Decision**: Automated AST transformation with manual verification gates  
**Consequences**: Fast execution, consistent results, requires careful testing

## Integration Points Identified

### Firebase Integration
- Collection: `users/{userId}/preferences/theme`
- Document structure: `{ selectedTheme: string, customizations: object, updatedAt: Timestamp }`
- Security rules: User can only read/write their own preferences
- Offline sync: Local storage mirror with conflict resolution

### React Router Integration
- Theme context wraps entire app in `App.tsx`
- Theme settings accessible via `/settings/appearance` route
- Theme preview mode for settings page
- URL state preservation during theme switches

### Vite Build Integration
- CSS module bundling for theme files
- PostCSS processing for custom property optimization
- Tree shaking for unused theme variants
- Development HMR support for theme development

## Risks & Mitigation Strategies

### Risk: CSS Custom Property Browser Support
**Likelihood**: Low | **Impact**: High  
**Mitigation**: Polyfill for older browsers, graceful degradation to default theme

### Risk: Theme Switching Performance
**Likelihood**: Medium | **Impact**: Medium  
**Mitigation**: CSS transition optimization, loading indicators, performance monitoring

### Risk: Component Migration Errors
**Likelihood**: Medium | **Impact**: High  
**Mitigation**: Automated testing, visual regression tests, staged rollout plan

### Risk: Firebase Connectivity Issues
**Likelihood**: Medium | **Impact**: Low  
**Mitigation**: Local storage fallback, offline-first design, connection retry logic

## Next Phase Requirements

All NEEDS CLARIFICATION items resolved. Ready for Phase 1 design and contracts generation.

**Key Outputs for Phase 1**:
- Theme entity data model with TypeScript interfaces
- ThemeContext API contract and provider implementation
- Firebase theme preference service contract
- Component semantic class migration mapping
- Visual regression test contracts for theme validation