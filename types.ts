import { Dispatch, SetStateAction } from 'react';

export enum CustomerType {
  B2C = 'Consumer',
  B2B = 'Retail',
}

export enum PaymentTerm {
  COD = 'Cash on Delivery',
  DAYS_30 = '30 Days',
  DAYS_60 = '60 Days',
  EOM_30 = 'End of Month + 30 Days',
}

export interface Address {
  id: string;
  type: 'billing' | 'delivery';
  isPrimary: boolean;
  addressLine1: string;
  addressLine2?: string;
  suburb?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface CustomerProductPrice {
  id: string;
  productId: string;
  customItemCode?: string;
  customDescription?: string;
  customNote?: string;
  prices: Price[];
}

export interface Customer {
  id:string;
  name: string;
  type: CustomerType;
  branchNumber?: string;
  vatNumber?: string;
  legalEntityName?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  addresses: Address[];
  parentCompanyId?: string;
  invoiceLevel?: 'parent' | 'branch';
  defaultInvoiceNotes?: string;
  customProductPricing?: CustomerProductPrice[];
  paymentTerm?: PaymentTerm;
  billToParent?: boolean;
}

export interface Price {
  id: string;
  effectiveDate: Timestamp;
  retail: number;
  consumer: number;
}

export interface Product {
  id: string;
  itemCode: string;
  name: string;
  description: string;
  prices: Price[];
  imageUrl?: string;
  ecommerceLink?: string;
}

export interface LineItem {
  id: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  itemCode?: string;
}

export enum PaymentMethod {
  EFT = 'EFT',
  CARD = 'Card',
  CASH = 'Cash',
}

export interface PaymentAllocation {
  invoiceNumber: string;
  amount: number;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  customerId: string;
  date: Timestamp;
  totalAmount: number;
  method: PaymentMethod;
  reference?: string;
  allocations: PaymentAllocation[];
}

export enum DocumentStatus {
  DRAFT = 'Draft',
  FINALIZED = 'Finalized',
  PARTIALLY_PAID = 'Partially Paid',
  PAID = 'Paid',
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
}

import { Timestamp } from 'firebase/firestore';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  issueDate: Timestamp;
  dueDate?: Timestamp;
  date?: Timestamp; // For backward compatibility with components
  poNumber?: string;
  orderNumber?: string; // For backward compatibility with components
  type?: string;
  lineItems: LineItem[];
  items?: LineItem[]; // For backward compatibility with components
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  shippingAmount: number;
  shipping?: number; // For backward compatibility with components
  totalAmount: number;
  status: DocumentStatus;
  notes?: string;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  date: Timestamp;
  validUntil: Timestamp;
  items: LineItem[];
  status: DocumentStatus;
  notes?: string;
  shipping?: number;
}

export interface StatementTransaction {
  date: Timestamp;
  type: 'Invoice' | 'Payment';
  reference: string; // Invoice # or Payment #
  sourceId: string; // The original ID of the invoice or payment
  debit: number;
  credit: number;
  balance: number;
}

export interface AgingAnalysis {
  current: number;
  days30: number;
  days60: number;
  days90: number;
  days120plus: number;
}

export interface AppContextType {
    customers: Customer[];
    setCustomers: Dispatch<SetStateAction<Customer[]>>;
    products: Product[];
    setProducts: Dispatch<SetStateAction<Product[]>>;
    invoices: Invoice[];
    setInvoices: Dispatch<SetStateAction<Invoice[]>>;
    payments: Payment[];
    setPayments: Dispatch<SetStateAction<Payment[]>>;
    quotes: Quote[];
    setQuotes: Dispatch<SetStateAction<Quote[]>>;
}

// ================================
// THEMING SYSTEM TYPES
// ================================

export enum ThemeCategory {
  LIGHT = 'light',
  DARK = 'dark', 
  HIGH_CONTRAST = 'high-contrast',
  COLORFUL = 'colorful',
  CUSTOM = 'custom'
}

export enum FontSizePreference {
  SMALL = 'small',
  NORMAL = 'normal', 
  LARGE = 'large'
}

export enum ColorBlindnessType {
  PROTANOPIA = 'protanopia',
  DEUTERANOPIA = 'deuteranopia', 
  TRITANOPIA = 'tritanopia'
}

export interface ColorScale {
  50: string;   // Lightest shade
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;  // Base color
  600: string;
  700: string;
  800: string;
  900: string;  // Darkest shade
}

export interface FontScale {
  xs: string;    // Extra small
  sm: string;    // Small
  base: string;  // Base size
  lg: string;    // Large
  xl: string;    // Extra large
  '2xl': string; // 2X large
  '3xl': string; // 3X large
  '4xl': string; // 4X large
}

export interface SpacingScale {
  0: string;     // No spacing
  0.5: string;   // 2px
  1: string;     // 4px
  2: string;     // 8px
  3: string;     // 12px
  4: string;     // 16px
  5: string;     // 20px
  6: string;     // 24px
  8: string;     // 32px
  10: string;    // 40px
  12: string;    // 48px
  16: string;    // 64px
  20: string;    // 80px
  24: string;    // 96px
}

export interface FontWeightScale {
  light: string;
  normal: string;
  medium: string;
  semibold: string;
  bold: string;
}

export interface LineHeightScale {
  tight: string;
  normal: string;
  relaxed: string;
}

export interface RadiusScale {
  none: string;
  sm: string;
  base: string;
  lg: string;
  xl: string;
  full: string;
}

export interface ShadowScale {
  sm: string;
  base: string;
  lg: string;
  xl: string;
}

export interface TypographyStyle {
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing?: string;
}

export interface ButtonTokens {
  padding: {
    sm: string;     // Small button padding
    md: string;     // Medium button padding
    lg: string;     // Large button padding
  };
  fontSize: {
    sm: string;     // Small button font size
    md: string;     // Medium button font size
    lg: string;     // Large button font size
  };
  borderRadius: string;  // Button border radius
  fontWeight: string;    // Button font weight
  minHeight: string;     // Minimum button height
}

export interface FormTokens {
  input: {
    padding: string;      // Input field padding
    fontSize: string;     // Input font size
    borderRadius: string; // Input border radius
    borderWidth: string;  // Input border width
    minHeight: string;    // Minimum input height
  };
  label: {
    fontSize: string;     // Label font size
    fontWeight: string;   // Label font weight
    marginBottom: string; // Label bottom margin
  };
  error: {
    fontSize: string;     // Error text font size
    marginTop: string;    // Error text top margin
  };
}

export interface TableTokens {
  cell: {
    padding: string;      // Table cell padding
    fontSize: string;     // Table cell font size
    lineHeight: string;   // Table cell line height
  };
  header: {
    padding: string;      // Table header padding
    fontSize: string;     // Table header font size
    fontWeight: string;   // Table header font weight
    borderBottom: string; // Header border bottom
  };
  row: {
    minHeight: string;    // Minimum row height
    borderBottom: string; // Row border bottom
  };
}

export interface CardTokens {
  padding: string;        // Card padding
  borderRadius: string;   // Card border radius
  borderWidth: string;    // Card border width
  boxShadow: string;      // Card box shadow
}

export interface NavigationTokens {
  padding: string;        // Navigation padding
  fontSize: string;       // Navigation font size
  fontWeight: string;     // Navigation font weight
}

export interface ThemeTokens {
  // Primitive Tokens (Raw Values)
  primitive: {
    colors: {
      gray: ColorScale;          // Gray color scale (50, 100, 200...900)
      blue: ColorScale;          // Primary brand color scale
      green: ColorScale;         // Success color scale
      red: ColorScale;           // Error color scale
      yellow: ColorScale;        // Warning color scale
      indigo: ColorScale;        // Secondary brand color scale
    };
    typography: {
      fontFamily: {
        sans: string;            // Sans-serif font stack
        mono: string;            // Monospace font stack
      };
      fontSize: FontScale;       // Font size scale (xs, sm, base, lg, xl...)
      fontWeight: FontWeightScale; // Font weight values (light, normal, medium...)
      lineHeight: LineHeightScale; // Line height values (tight, normal, relaxed...)
    };
    spacing: SpacingScale;       // Spacing scale (0.5, 1, 2, 3, 4...)
    borderRadius: RadiusScale;   // Border radius scale (none, sm, base, lg...)
    shadows: ShadowScale;        // Box shadow scale (sm, base, lg, xl...)
  };
  
  // Semantic Tokens (Contextual Mappings)
  semantic: {
    colors: {
      text: {
        primary: string;         // Primary text color
        secondary: string;       // Secondary text color
        tertiary: string;        // Tertiary text color
        inverse: string;         // Inverse text color (on dark backgrounds)
        disabled: string;        // Disabled text color
      };
      background: {
        primary: string;         // Primary background color
        secondary: string;       // Secondary background color
        tertiary: string;        // Tertiary background color
        overlay: string;         // Modal/overlay background
        elevated: string;        // Elevated surface background
      };
      border: {
        default: string;         // Default border color
        subtle: string;          // Subtle border color
        strong: string;          // Strong border color
        focus: string;           // Focus ring border color
        error: string;           // Error state border color
      };
      interactive: {
        primary: string;         // Primary interactive color (links, buttons)
        primaryHover: string;    // Primary hover state
        secondary: string;       // Secondary interactive color
        secondaryHover: string;  // Secondary hover state
        disabled: string;        // Disabled interactive color
      };
      status: {
        success: string;         // Success state color
        warning: string;         // Warning state color
        error: string;           // Error state color
        info: string;            // Info state color
      };
    };
    spacing: {
      none: string;              // No spacing
      xs: string;                // Extra small spacing
      sm: string;                // Small spacing
      md: string;                // Medium spacing
      lg: string;                // Large spacing
      xl: string;                // Extra large spacing
      xxl: string;               // Extra extra large spacing
    };
    typography: {
      heading: TypographyStyle;  // Heading text styles
      body: TypographyStyle;     // Body text styles
      caption: TypographyStyle;  // Caption text styles
      label: TypographyStyle;    // Label text styles
    };
  };
  
  // Component Tokens (Component-Specific Overrides)
  components: {
    button: ButtonTokens;
    form: FormTokens;
    table: TableTokens;
    card: CardTokens;
    navigation: NavigationTokens;
  };
}

export interface Theme {
  id: string;                    // Unique theme identifier (e.g., 'light', 'dark', 'vibrant')
  name: string;                  // Display name for user selection
  description: string;           // Brief description of theme characteristics
  cssVariables: ThemeTokens;     // Complete set of CSS custom property values
  isDefault: boolean;           // Whether this is the default theme
  category: ThemeCategory;      // Theme categorization for grouping
  previewImage?: string;        // Optional preview image URL
  supportedFeatures: string[];  // List of supported UI features
  version: string;              // Theme version for compatibility
  createdAt: Date;             // Theme creation timestamp
  updatedAt: Date;             // Last modification timestamp
}

export interface UserThemePreferences {
  userId: string;               // Reference to user document
  selectedTheme: string;        // Current active theme ID
  customizations: {
    fontSize: FontSizePreference; // User font size preference
    reducedMotion: boolean;     // Motion preference setting
    highContrast: boolean;      // High contrast preference
    colorBlindness?: ColorBlindnessType; // Accessibility accommodation
  };
  recentThemes: string[];       // Recently used theme IDs (max 5)
  createdAt: Timestamp;         // Firebase Timestamp
  updatedAt: Timestamp;         // Firebase Timestamp
}

export interface ThemeContextState {
  currentTheme: Theme;          // Currently active theme
  availableThemes: Theme[];     // All available themes
  isLoading: boolean;          // Theme switching loading state
  error: string | null;        // Theme loading/switching error
  preferences: UserThemePreferences | null; // Current user preferences
  isPreviewMode: boolean;      // Whether in preview mode
  previewTheme: Theme | null;  // Theme being previewed
}

export interface ThemeContextActions {
  switchTheme: (themeId: string) => Promise<void>;
  updatePreferences: (preferences: Partial<UserThemePreferences>) => Promise<void>;
  previewTheme: (themeId: string) => void;
  exitPreview: () => void;
  refreshThemes: () => Promise<void>;
  resetToDefault: () => Promise<void>;
}

export type ThemeContextValue = ThemeContextState & ThemeContextActions;