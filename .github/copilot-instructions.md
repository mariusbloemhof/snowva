# Copilot Instructions for Snowva Business Hub

## Architecture Overview

This is a **React 19 + TypeScript SPA** for B2B/B2C sales management using **Vite** as the build tool. The app is built around a sophisticated **hierarchical customer pricing system** with parent companies and branches, where pricing inheritance flows down but can be overridden at any level.

**Core Data Flow**: All state lives in `App.tsx` and flows down via React Router's `useOutletContext()`. Mock data in `constants.ts` simulates a backend API. The pricing engine (`utils.ts`) resolves customer-specific pricing by checking: local customer overrides → parent company overrides → standard product pricing.

## Key Patterns & Conventions

### State Management

- **No Redux/Zustand**: Uses React Context only for global toast notifications (`contexts/ToastContext.tsx`)
- **Outlet Context Pattern**: All CRUD operations pass data via `useOutletContext<AppContextType>()`
- **Mock Data as Single Source**: `constants.ts` contains all customers, products, invoices with complex relationships

### Custom Pricing Architecture

The pricing system supports date-versioned pricing and hierarchical inheritance:

```typescript
// Customer hierarchy: Parent Company → Branches
// Pricing resolution order in getResolvedProductDetails():
// 1. Customer's own customProductPricing
// 2. Parent company's customProductPricing (if customer is branch)
// 3. Standard product pricing (with B2B/B2C rates)
```

Example from `CustomerEditor.tsx` - branches can inherit or override parent pricing via `billToParent` flag.

### Form Patterns

- **Unsaved Changes Detection**: Uses `useBlocker()` with JSON.stringify comparison for dirty state
- **Inline Validation**: Form errors stored in component state, displayed inline
- **Auto-save Indicators**: `isSaving` ref prevents double-saves during async operations

### AI Integration (Google Gemini)

- **Product Image Finder**: `ProductEditor.tsx` uses `@google/genai` to automatically find product images from snowva.com
- **Environment Setup**: API key configured in `vite.config.ts` as `process.env.GEMINI_API_KEY`
- **Error Handling**: Graceful fallbacks when AI features fail

## Development Workflow

### Running the App

```bash
npm run dev          # Starts Vite dev server on port 3000
npm run build        # Production build
npm run preview      # Preview production build
```

### Environment Variables

Create `.env` file with:

```
GEMINI_API_KEY=your_api_key_here
```

### Adding New Features

1. **New Pages**: Add route to `App.tsx` navItems array
2. **New Data Types**: Add interfaces to `types.ts`, mock data to `constants.ts`
3. **Business Logic**: Add utility functions to `utils.ts`
4. **Forms**: Follow the editor pattern in `CustomerEditor.tsx` or `ProductEditor.tsx`

## UI Components & Styling

### Tailwind Configuration

- **Custom Colors**: Snowva brand colors configured in `index.html` script tag
- **Design System**: Consistent spacing, rounded corners (rounded-2xl), and shadows
- **Icons**: Custom SVG components in `Icons.tsx`, no external icon library

### Component Patterns

- **Modal Components**: Follow `CustomerFormModal.tsx` pattern with backdrop click handling
- **List Views**: Use card-based layouts with hover states and custom pricing indicators
- **Toast Notifications**: Use `useToast()` hook for user feedback

## Key Business Logic

### Invoice Status Flow

```typescript
DocumentStatus.DRAFT → FINALIZED → PARTIALLY_PAID → PAID
```

### Payment Allocation System

- Payments are recorded against parent companies but allocated to specific invoices
- `calculateBalanceDue()` in `utils.ts` handles complex payment allocation logic
- Payment tracking supports partial payments and payment history

### Document Generation

- **PDF Export**: Uses `jsPDF` + `html2canvas` for client-side PDF generation
- **Print Styling**: Components include print-specific CSS classes
- **Company Branding**: `SNOWVA_DETAILS` constant provides invoice/statement headers

## Dependencies & External Services

### CDN Strategy

Uses `importmap` in `index.html` to load React, React Router, and other dependencies from CDN (aistudiocdn.com), avoiding local node_modules for rapid prototyping.

### Critical Libraries

- `@google/genai`: AI-powered features
- `jsPDF + html2canvas`: Client-side PDF generation
- `react-router-dom`: SPA routing with HashRouter
- `react-icons`: Icon components (though custom SVGs in `Icons.tsx` are preferred)

## Code Style Guidelines

- **TypeScript Strict Mode**: All components fully typed with interfaces from `types.ts`
- **Functional Components Only**: No class components, extensive use of React hooks
- **Error Boundaries**: Use toast notifications for user-facing errors
- **Accessibility**: Form labels, keyboard navigation, semantic HTML elements
- **Performance**: `useMemo` for expensive calculations, `useRef` for DOM access

When adding features, prioritize the hierarchical customer relationship system and ensure proper pricing inheritance flows through the component tree.
