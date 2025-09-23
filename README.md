
# Snowva Business Hub

## 1. Introduction

The Snowva Business Hub is a comprehensive, internal web application designed to streamline the sales and accounting workflows for Snowva™, a company specializing in innovative outdoor and lifestyle products. This platform serves as a central hub for managing customers, products, quotes, and invoices, providing a robust set of tools for the sales and administrative teams.

The application is built as a modern Single Page Application (SPA) with a focus on a clean user interface, responsive design, and powerful features that cater to both Business-to-Consumer (B2C) and complex Business-to-Business (B2B) sales channels.

---

## 2. Key Features

### Dashboard
A central landing page providing an at-a-glance overview of key business metrics:
- **Total Revenue:** Tracks revenue from all paid invoices.
- **Active Customers:** A count of all customers in the system.
- **Draft Quotes:** Highlights quotes that need attention.
- **Open Invoices:** Shows the number of finalized invoices awaiting payment.
- **Recent Activity:** Lists of the most recent invoices and quotes for quick access.

### Customer Management (CRM)
A powerful system for managing the customer database.
- **B2C vs. B2B Distinction:** Separate handling for individual consumers and retail businesses.
- **Hierarchical Relationships:** B2B customers can be structured as Parent Companies with multiple branches, enabling complex organizational management.
- **Detailed Profiles:** Each customer has a comprehensive profile including contact information, billing details (VAT number, legal entity name), and multiple addresses.
- **Address Management:** Dedicated billing and delivery address forms with a "Same as..." feature to speed up data entry.
- **Custom Pricing Indicator:** A visual icon in the customer list immediately identifies clients with special pricing agreements.

### Product & Pricing Management
- **Product Catalog:** A complete list of all products with item codes, descriptions, and images.
- **Date-Versioned Pricing:** A sophisticated pricing system where multiple price points (for both Retail and Consumer) can be set with specific effective dates. The system automatically applies the correct price based on the current date, allowing for future price changes to be scheduled in advance.
- **AI-Powered Image Finder:** An intelligent feature using the Google Gemini API to automatically search `snowva.com` and find a product's image URL based on its name.

### Custom Pricing Engine
This is a cornerstone feature for B2B clients, offering exceptional flexibility.
- **Per-Customer Pricing:** Define custom prices, product descriptions, and even unique item codes for a specific product on a per-customer basis.
- **Intelligent Inheritance:** Custom pricing set for a Parent Company is automatically inherited by all its child branches.
- **Branch-Level Overrides:** A branch can choose to either use the parent's special pricing or override it with its own unique pricing. It can also revert to the parent's pricing at any time.
- **Automatic Application:** When creating quotes or invoices, the system automatically detects and applies the correct pricing, description, and item code for the selected customer, ensuring accuracy and efficiency.

### Document Management
- **Quote Generation:** Create, edit, and manage sales quotes. The system automatically pulls the correct customer and product details, including any custom pricing.
- **Invoicing:** Generate professional tax invoices. Drafts can be saved, and finalized invoices are assigned a unique, sequential invoice number.
- **Payment Tracking:** Record full or partial payments against any finalized invoice. The invoice status (`Partially Paid`, `Paid`) updates automatically based on the balance due. A full payment history is maintained for each invoice.
- **PDF & Print:** View, download as a PDF, or print any finalized document directly from the browser.
- **Validation & Notifications:** The system features comprehensive inline form validation to prevent errors and a modern, non-intrusive toast notification system for clear feedback on actions like saving data or encountering an error.

---

## 3. Technology Stack & Architecture

This application is built using a modern, lightweight, and performant technology stack, avoiding a heavy build process for rapid development.

-   **Frontend Framework:** **React 19** is used for building the user interface with functional components and extensive use of React Hooks (`useState`, `useEffect`, `useMemo`, `useRef`) for state management and side effects.

-   **Routing:** **React Router DOM** (`HashRouter`) is used for client-side routing, enabling navigation between different pages and views within the single-page application.

-   **Styling:** **Tailwind CSS** is used for all styling. It's loaded via a CDN and configured directly in `index.html`. This utility-first CSS framework allows for rapid development of a consistent, responsive, and modern UI. A custom theme is configured to match Snowva's brand colors (`snowva-blue`, `snowva-orange`, etc.).

-   **AI Integration:** The **Google Gemini API** (`@google/genai`) is integrated for intelligent features, starting with the AI-powered product image finder.

-   **PDF Generation:** Client-side PDF generation is handled by **jsPDF** and **html2canvas**. `html2canvas` captures a specific part of the DOM as an image, which is then placed into a PDF document by `jsPDF`.

-   **Modules & Dependencies:** The project uses modern **ES Modules** with an **`importmap`** in `index.html`. This approach allows the browser to directly import dependencies (like React and GenAI) from a CDN, eliminating the need for a local build setup (like Webpack or Vite) and `node_modules` folder, which is ideal for this type of prototype project.

-   **Data Source:** All application data (customers, products, etc.) is currently mocked and stored in `constants.ts`. This simulates a backend API and allows the frontend to be fully self-contained. The data structures are strictly typed using TypeScript.

-   **TypeScript:** The entire application is written in TypeScript, providing static typing for better code quality, maintainability, and developer experience.
-   **State Management & Notifications:** A global notification system is implemented using **React Context** to provide toast messages (success, error, info) throughout the application, ensuring consistent user feedback.

---

## 4. Project Structure

The project is organized into a logical and maintainable structure.

```
/
├── components/               # All React components
│   ├── CustomerEditor.tsx    # Form for creating/editing customers
│   ├── CustomerList.tsx      # View for listing all customers
│   ├── CustomerPricingEditor.tsx # Component for managing custom prices
│   ├── Dashboard.tsx         # The main dashboard view
│   ├── Icons.tsx             # Reusable SVG icon components
│   ├── InvoiceEditor.tsx     # Form for creating/editing invoices
│   ├── ToastContainer.tsx    # Renders active toast notifications
│   └── ...                   # Other components
│
├── contexts/                 # React context providers
│   └── ToastContext.tsx      # Global state for toast notifications
│
├── App.tsx                   # Root component, handles routing and top-level state
├── constants.ts              # Mock data source for the application
├── index.html                # Main HTML entry point, includes CDN scripts and importmap
├── index.tsx                 # Renders the React application into the DOM
├── metadata.json             # Project metadata
├── types.ts                  # Centralized TypeScript type definitions
├── utils.ts                  # Shared helper functions
└── README.md                 # This file
```

---

## 5. Getting Started

This project is designed to run without a complex build setup.

### Prerequisites
-   A modern web browser (e.g., Chrome, Firefox).
-   A simple local web server to serve the files.

### Running the Application
1.  Clone or download the project files.
2.  Navigate to the project's root directory in your terminal.
3.  Start a local static file server. Here are two common ways:
    -   **Using Python:**
        ```bash
        python -m http.server
        ```
    -   **Using Node.js (with `serve`):**
        ```bash
        npx serve
        ```
4.  Open your web browser and navigate to the local address provided by the server (e.g., `http://localhost:8000` or `http://localhost:3000`).

### API Key
The Google Gemini API functionality requires an API key. This is expected to be available in the environment as `process.env.API_KEY`. In a real-world deployed application, this key would be managed securely as an environment variable on the server. For local development in this setup, you would need to manually ensure this value is available to the browser context if you wish to use the AI features.

---

## 6. Future Enhancements

-   **Backend Integration:** Replace the mock data in `constants.ts` with a real backend API (e.g., Node.js/Express, Firebase, or a headless CMS) for persistent data storage.
-   **Authentication:** Implement user authentication and authorization to secure the application.
-   **Statement Generation:** Build out the functionality on the "Statements" page to generate customer account statements for a given period.
-   **Quote-to-Invoice Conversion:** Add a feature to convert an accepted Quote into a new Invoice with a single click.
-   **Email Integration:** Implement functionality to email quotes and invoices directly to customers from within the application.
-   **Advanced Reporting:** Enhance the dashboard with more detailed reports, charts, and data filtering options.
-   **Global State Management:** Continue to leverage React Context for other global state needs as the application grows to mitigate prop drilling.
