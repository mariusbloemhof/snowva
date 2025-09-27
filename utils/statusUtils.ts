/**
 * Status Utility Functions
 * 
 * Snowva Business Hub - Centralized Design System
 * Business entity status mapping utilities
 * 
 * Provides status classification, color mapping, and business logic
 */

import { DocumentStatus } from '../types';

/* ========================================
   STATUS TYPES & INTERFACES
   ======================================== */

export type CustomerStatus = 'active' | 'inactive' | 'suspended' | 'archived';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
export type ProductStatus = 'active' | 'discontinued' | 'out-of-stock' | 'low-stock';
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
export type PriorityStatus = 'low' | 'medium' | 'high' | 'urgent';
export type ProcessingStatus = 'queued' | 'processing' | 'completed' | 'error';

export interface StatusInfo {
  status: string;
  displayName: string;
  cssClass: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon?: string;
  description?: string;
  isActionable?: boolean;
  sortOrder: number;
}

export interface StatusTransition {
  from: string;
  to: string;
  label: string;
  isAllowed: boolean;
  requiresConfirmation?: boolean;
  warningMessage?: string;
}

/* ========================================
   DOCUMENT STATUS UTILITIES (DocumentStatus enum)
   ======================================== */

/**
 * Maps DocumentStatus enum values to CSS classes and display information
 */
export function getDocumentStatusInfo(status: DocumentStatus): StatusInfo {
  const statusMap: Record<DocumentStatus, StatusInfo> = {
    [DocumentStatus.DRAFT]: {
      status: 'draft',
      displayName: 'Draft',
      cssClass: 'status-draft',
      color: 'var(--color-gray-700)',
      bgColor: 'var(--color-gray-100)',
      borderColor: 'var(--color-gray-300)',
      icon: '📝',
      description: 'Document is being prepared',
      isActionable: true,
      sortOrder: 1
    },
    [DocumentStatus.FINALIZED]: {
      status: 'finalized',
      displayName: 'Finalized',
      cssClass: 'status-finalized',
      color: 'var(--color-primary-700)',
      bgColor: 'var(--color-primary-100)',
      borderColor: 'var(--color-primary-300)',
      icon: '📋',
      description: 'Document is finalized and ready',
      isActionable: true,
      sortOrder: 2
    },
    [DocumentStatus.PARTIALLY_PAID]: {
      status: 'partially-paid',
      displayName: 'Partially Paid',
      cssClass: 'status-partially-paid',
      color: 'var(--color-warning-700)',
      bgColor: 'var(--color-warning-100)',
      borderColor: 'var(--color-warning-300)',
      icon: '⏳',
      description: 'Partial payment received',
      isActionable: true,
      sortOrder: 3
    },
    [DocumentStatus.PAID]: {
      status: 'paid',
      displayName: 'Paid',
      cssClass: 'status-paid',
      color: 'var(--color-success-700)',
      bgColor: 'var(--color-success-100)',
      borderColor: 'var(--color-success-300)',
      icon: '✅',
      description: 'Payment completed',
      isActionable: false,
      sortOrder: 4
    },
    [DocumentStatus.ACCEPTED]: {
      status: 'accepted',
      displayName: 'Accepted',
      cssClass: 'status-accepted',
      color: 'var(--color-success-700)',
      bgColor: 'var(--color-success-100)',
      borderColor: 'var(--color-success-300)',
      icon: '✅',
      description: 'Document accepted',
      isActionable: false,
      sortOrder: 5
    },
    [DocumentStatus.REJECTED]: {
      status: 'rejected',
      displayName: 'Rejected',
      cssClass: 'status-rejected',
      color: 'var(--color-danger-700)',
      bgColor: 'var(--color-danger-100)',
      borderColor: 'var(--color-danger-300)',
      icon: '❌',
      description: 'Document rejected',
      isActionable: false,
      sortOrder: 6
    }
  };

  return statusMap[status] || statusMap[DocumentStatus.DRAFT];
}

/**
 * Gets allowed status transitions for DocumentStatus
 */
export function getDocumentStatusTransitions(currentStatus: DocumentStatus): StatusTransition[] {
  const transitions: Record<DocumentStatus, StatusTransition[]> = {
    [DocumentStatus.DRAFT]: [
      {
        from: DocumentStatus.DRAFT,
        to: DocumentStatus.FINALIZED,
        label: 'Finalize Document',
        isAllowed: true,
        requiresConfirmation: true,
        warningMessage: 'Finalizing will prevent further edits. Continue?'
      }
    ],
    [DocumentStatus.FINALIZED]: [
      {
        from: DocumentStatus.FINALIZED,
        to: DocumentStatus.PARTIALLY_PAID,
        label: 'Record Partial Payment',
        isAllowed: true,
        requiresConfirmation: false
      },
      {
        from: DocumentStatus.FINALIZED,
        to: DocumentStatus.PAID,
        label: 'Mark as Paid',
        isAllowed: true,
        requiresConfirmation: false
      },
      {
        from: DocumentStatus.FINALIZED,
        to: DocumentStatus.DRAFT,
        label: 'Revert to Draft',
        isAllowed: true,
        requiresConfirmation: true,
        warningMessage: 'This will allow editing but may affect reporting. Continue?'
      }
    ],
    [DocumentStatus.PARTIALLY_PAID]: [
      {
        from: DocumentStatus.PARTIALLY_PAID,
        to: DocumentStatus.PAID,
        label: 'Complete Payment',
        isAllowed: true,
        requiresConfirmation: false
      }
    ],
    [DocumentStatus.PAID]: [
      {
        from: DocumentStatus.PAID,
        to: DocumentStatus.PARTIALLY_PAID,
        label: 'Adjust to Partially Paid',
        isAllowed: true,
        requiresConfirmation: true,
        warningMessage: 'This indicates payment issues. Continue?'
      }
    ],
    [DocumentStatus.ACCEPTED]: [],
    [DocumentStatus.REJECTED]: []
  };

  return transitions[currentStatus] || [];
}

/**
 * Determines if a document is overdue based on status and due date
 */
export function isDocumentOverdue(status: DocumentStatus, dueDate?: Date): boolean {
  if (!dueDate || status === DocumentStatus.PAID) {
    return false;
  }

  const now = new Date();
  return dueDate < now && (status === DocumentStatus.FINALIZED || status === DocumentStatus.PARTIALLY_PAID);
}

/* ========================================
   CUSTOMER STATUS UTILITIES
   ======================================== */

export function getCustomerStatusInfo(status: CustomerStatus): StatusInfo {
  const statusMap: Record<CustomerStatus, StatusInfo> = {
    active: {
      status: 'active',
      displayName: 'Active',
      cssClass: 'status-customer-active',
      color: 'var(--color-success-700)',
      bgColor: 'var(--color-success-100)',
      borderColor: 'var(--color-success-300)',
      icon: '✅',
      description: 'Customer account is active',
      isActionable: true,
      sortOrder: 1
    },
    inactive: {
      status: 'inactive',
      displayName: 'Inactive',
      cssClass: 'status-customer-inactive',
      color: 'var(--color-gray-600)',
      bgColor: 'var(--color-gray-100)',
      borderColor: 'var(--color-gray-300)',
      icon: '⏸️',
      description: 'Customer account is inactive',
      isActionable: true,
      sortOrder: 2
    },
    suspended: {
      status: 'suspended',
      displayName: 'Suspended',
      cssClass: 'status-customer-suspended',
      color: 'var(--color-warning-700)',
      bgColor: 'var(--color-warning-100)',
      borderColor: 'var(--color-warning-300)',
      icon: '⚠️',
      description: 'Customer account is suspended',
      isActionable: true,
      sortOrder: 3
    },
    archived: {
      status: 'archived',
      displayName: 'Archived',
      cssClass: 'status-customer-archived',
      color: 'var(--color-gray-500)',
      bgColor: 'var(--color-gray-100)',
      borderColor: 'var(--color-gray-300)',
      icon: '📦',
      description: 'Customer account is archived',
      isActionable: false,
      sortOrder: 4
    }
  };

  return statusMap[status];
}

/* ========================================
   PAYMENT STATUS UTILITIES
   ======================================== */

export function getPaymentStatusInfo(status: PaymentStatus): StatusInfo {
  const statusMap: Record<PaymentStatus, StatusInfo> = {
    pending: {
      status: 'pending',
      displayName: 'Pending',
      cssClass: 'status-payment-pending',
      color: 'var(--color-warning-700)',
      bgColor: 'var(--color-warning-100)',
      borderColor: 'var(--color-warning-300)',
      icon: '⏳',
      description: 'Payment is pending',
      isActionable: true,
      sortOrder: 1
    },
    processing: {
      status: 'processing',
      displayName: 'Processing',
      cssClass: 'status-payment-processing',
      color: 'var(--color-primary-700)',
      bgColor: 'var(--color-primary-100)',
      borderColor: 'var(--color-primary-300)',
      icon: '⚙️',
      description: 'Payment is being processed',
      isActionable: false,
      sortOrder: 2
    },
    completed: {
      status: 'completed',
      displayName: 'Completed',
      cssClass: 'status-payment-completed',
      color: 'var(--color-success-700)',
      bgColor: 'var(--color-success-100)',
      borderColor: 'var(--color-success-300)',
      icon: '✅',
      description: 'Payment completed successfully',
      isActionable: false,
      sortOrder: 3
    },
    failed: {
      status: 'failed',
      displayName: 'Failed',
      cssClass: 'status-payment-failed',
      color: 'var(--color-danger-700)',
      bgColor: 'var(--color-danger-100)',
      borderColor: 'var(--color-danger-300)',
      icon: '❌',
      description: 'Payment failed',
      isActionable: true,
      sortOrder: 4
    },
    refunded: {
      status: 'refunded',
      displayName: 'Refunded',
      cssClass: 'status-payment-refunded',
      color: 'var(--color-gray-700)',
      bgColor: 'var(--color-gray-100)',
      borderColor: 'var(--color-gray-300)',
      icon: '↩️',
      description: 'Payment was refunded',
      isActionable: false,
      sortOrder: 5
    }
  };

  return statusMap[status];
}

/* ========================================
   PRODUCT STATUS UTILITIES
   ======================================== */

export function getProductStatusInfo(status: ProductStatus): StatusInfo {
  const statusMap: Record<ProductStatus, StatusInfo> = {
    active: {
      status: 'active',
      displayName: 'Active',
      cssClass: 'status-product-active',
      color: 'var(--color-success-700)',
      bgColor: 'var(--color-success-100)',
      borderColor: 'var(--color-success-300)',
      icon: '✅',
      description: 'Product is available for sale',
      isActionable: true,
      sortOrder: 1
    },
    discontinued: {
      status: 'discontinued',
      displayName: 'Discontinued',
      cssClass: 'status-product-discontinued',
      color: 'var(--color-warning-700)',
      bgColor: 'var(--color-warning-100)',
      borderColor: 'var(--color-warning-300)',
      icon: '⚠️',
      description: 'Product is discontinued',
      isActionable: false,
      sortOrder: 2
    },
    'out-of-stock': {
      status: 'out-of-stock',
      displayName: 'Out of Stock',
      cssClass: 'status-product-out-of-stock',
      color: 'var(--color-danger-700)',
      bgColor: 'var(--color-danger-100)',
      borderColor: 'var(--color-danger-300)',
      icon: '❌',
      description: 'Product is out of stock',
      isActionable: true,
      sortOrder: 3
    },
    'low-stock': {
      status: 'low-stock',
      displayName: 'Low Stock',
      cssClass: 'status-product-low-stock',
      color: 'var(--color-warning-700)',
      bgColor: 'var(--color-warning-100)',
      borderColor: 'var(--color-warning-300)',
      icon: '⚠️',
      description: 'Product stock is running low',
      isActionable: true,
      sortOrder: 4
    }
  };

  return statusMap[status];
}

/* ========================================
   QUOTE STATUS UTILITIES
   ======================================== */

export function getQuoteStatusInfo(status: QuoteStatus): StatusInfo {
  const statusMap: Record<QuoteStatus, StatusInfo> = {
    draft: {
      status: 'draft',
      displayName: 'Draft',
      cssClass: 'status-quote-draft',
      color: 'var(--color-gray-700)',
      bgColor: 'var(--color-gray-100)',
      borderColor: 'var(--color-gray-300)',
      icon: '📝',
      description: 'Quote is being prepared',
      isActionable: true,
      sortOrder: 1
    },
    sent: {
      status: 'sent',
      displayName: 'Sent',
      cssClass: 'status-quote-sent',
      color: 'var(--color-primary-700)',
      bgColor: 'var(--color-primary-100)',
      borderColor: 'var(--color-primary-300)',
      icon: '📤',
      description: 'Quote has been sent to customer',
      isActionable: false,
      sortOrder: 2
    },
    accepted: {
      status: 'accepted',
      displayName: 'Accepted',
      cssClass: 'status-quote-accepted',
      color: 'var(--color-success-700)',
      bgColor: 'var(--color-success-100)',
      borderColor: 'var(--color-success-300)',
      icon: '✅',
      description: 'Quote accepted by customer',
      isActionable: true,
      sortOrder: 3
    },
    rejected: {
      status: 'rejected',
      displayName: 'Rejected',
      cssClass: 'status-quote-rejected',
      color: 'var(--color-danger-700)',
      bgColor: 'var(--color-danger-100)',
      borderColor: 'var(--color-danger-300)',
      icon: '❌',
      description: 'Quote rejected by customer',
      isActionable: false,
      sortOrder: 4
    },
    expired: {
      status: 'expired',
      displayName: 'Expired',
      cssClass: 'status-quote-expired',
      color: 'var(--color-gray-600)',
      bgColor: 'var(--color-gray-100)',
      borderColor: 'var(--color-gray-300)',
      icon: '⏰',
      description: 'Quote has expired',
      isActionable: false,
      sortOrder: 5
    }
  };

  return statusMap[status];
}

/* ========================================
   PRIORITY STATUS UTILITIES
   ======================================== */

export function getPriorityStatusInfo(status: PriorityStatus): StatusInfo {
  const statusMap: Record<PriorityStatus, StatusInfo> = {
    low: {
      status: 'low',
      displayName: 'Low Priority',
      cssClass: 'status-priority-low',
      color: 'var(--color-gray-600)',
      bgColor: 'var(--color-gray-100)',
      borderColor: 'var(--color-gray-300)',
      icon: '🔻',
      description: 'Low priority item',
      isActionable: true,
      sortOrder: 1
    },
    medium: {
      status: 'medium',
      displayName: 'Medium Priority',
      cssClass: 'status-priority-medium',
      color: 'var(--color-primary-700)',
      bgColor: 'var(--color-primary-100)',
      borderColor: 'var(--color-primary-300)',
      icon: '🔶',
      description: 'Medium priority item',
      isActionable: true,
      sortOrder: 2
    },
    high: {
      status: 'high',
      displayName: 'High Priority',
      cssClass: 'status-priority-high',
      color: 'var(--color-warning-700)',
      bgColor: 'var(--color-warning-100)',
      borderColor: 'var(--color-warning-300)',
      icon: '🔺',
      description: 'High priority item',
      isActionable: true,
      sortOrder: 3
    },
    urgent: {
      status: 'urgent',
      displayName: 'Urgent',
      cssClass: 'status-priority-urgent',
      color: 'var(--color-danger-700)',
      bgColor: 'var(--color-danger-100)',
      borderColor: 'var(--color-danger-300)',
      icon: '🚨',
      description: 'Urgent priority item',
      isActionable: true,
      sortOrder: 4
    }
  };

  return statusMap[status];
}

/* ========================================
   PROCESSING STATUS UTILITIES
   ======================================== */

export function getProcessingStatusInfo(status: ProcessingStatus): StatusInfo {
  const statusMap: Record<ProcessingStatus, StatusInfo> = {
    queued: {
      status: 'queued',
      displayName: 'Queued',
      cssClass: 'status-queued',
      color: 'var(--color-gray-700)',
      bgColor: 'var(--color-gray-100)',
      borderColor: 'var(--color-gray-300)',
      icon: '⏰',
      description: 'Item is queued for processing',
      isActionable: false,
      sortOrder: 1
    },
    processing: {
      status: 'processing',
      displayName: 'Processing',
      cssClass: 'status-processing',
      color: 'var(--color-primary-700)',
      bgColor: 'var(--color-primary-100)',
      borderColor: 'var(--color-primary-300)',
      icon: '⚙️',
      description: 'Item is currently being processed',
      isActionable: false,
      sortOrder: 2
    },
    completed: {
      status: 'completed',
      displayName: 'Completed',
      cssClass: 'status-completed',
      color: 'var(--color-success-700)',
      bgColor: 'var(--color-success-100)',
      borderColor: 'var(--color-success-300)',
      icon: '✅',
      description: 'Processing completed successfully',
      isActionable: false,
      sortOrder: 3
    },
    error: {
      status: 'error',
      displayName: 'Error',
      cssClass: 'status-error',
      color: 'var(--color-danger-700)',
      bgColor: 'var(--color-danger-100)',
      borderColor: 'var(--color-danger-300)',
      icon: '❌',
      description: 'Processing encountered an error',
      isActionable: true,
      sortOrder: 4
    }
  };

  return statusMap[status];
}

/* ========================================
   GENERAL STATUS UTILITIES
   ======================================== */

/**
 * Generic status info getter that handles multiple status types
 */
export function getStatusInfo(status: string, type: 'document' | 'customer' | 'payment' | 'product' | 'quote' | 'priority' | 'processing'): StatusInfo | null {
  switch (type) {
    case 'document':
      return getDocumentStatusInfo(status as DocumentStatus);
    case 'customer':
      return getCustomerStatusInfo(status as CustomerStatus);
    case 'payment':
      return getPaymentStatusInfo(status as PaymentStatus);
    case 'product':
      return getProductStatusInfo(status as ProductStatus);
    case 'quote':
      return getQuoteStatusInfo(status as QuoteStatus);
    case 'priority':
      return getPriorityStatusInfo(status as PriorityStatus);
    case 'processing':
      return getProcessingStatusInfo(status as ProcessingStatus);
    default:
      return null;
  }
}

/**
 * Determines if a status represents a final/completed state
 */
export function isStatusFinal(status: string, type: 'document' | 'customer' | 'payment' | 'product' | 'quote' | 'priority' | 'processing'): boolean {
  const finalStates = {
    document: [DocumentStatus.PAID, DocumentStatus.ACCEPTED, DocumentStatus.REJECTED],
    customer: ['archived'],
    payment: ['completed', 'failed', 'refunded'],
    product: ['discontinued'],
    quote: ['accepted', 'rejected', 'expired'],
    priority: [], // Priority can always change
    processing: ['completed', 'error']
  };

  return finalStates[type]?.includes(status as any) || false;
}

/**
 * Sorts status values by their logical order
 */
export function sortStatusValues<T extends string>(statuses: T[], type: 'document' | 'customer' | 'payment' | 'product' | 'quote' | 'priority' | 'processing'): T[] {
  return statuses.sort((a, b) => {
    const aInfo = getStatusInfo(a, type);
    const bInfo = getStatusInfo(b, type);
    
    if (!aInfo || !bInfo) return 0;
    
    return aInfo.sortOrder - bInfo.sortOrder;
  });
}

/**
 * Groups statuses by their actionability
 */
export function groupStatusesByActionability<T extends string>(statuses: T[], type: 'document' | 'customer' | 'payment' | 'product' | 'quote' | 'priority' | 'processing'): {
  actionable: T[];
  readonly: T[];
} {
  const actionable: T[] = [];
  const readonly: T[] = [];

  statuses.forEach(status => {
    const info = getStatusInfo(status, type);
    if (info?.isActionable) {
      actionable.push(status);
    } else {
      readonly.push(status);
    }
  });

  return { actionable, readonly };
}

/* ========================================
   DATE-BASED STATUS UTILITIES
   ======================================== */

/**
 * Determines time-sensitive status modifiers
 */
export function getDateBasedStatusModifier(dueDate: Date, currentDate: Date = new Date()): {
  modifier: 'due-soon' | 'due-today' | 'past-due' | null;
  cssClass: string;
  urgency: number; // 0-3, higher is more urgent
} {
  const timeDiff = dueDate.getTime() - currentDate.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  if (daysDiff < 0) {
    return {
      modifier: 'past-due',
      cssClass: 'status-badge-past-due',
      urgency: 3
    };
  } else if (daysDiff === 0) {
    return {
      modifier: 'due-today',
      cssClass: 'status-badge-due-today',
      urgency: 2
    };
  } else if (daysDiff <= 3) {
    return {
      modifier: 'due-soon',
      cssClass: 'status-badge-due-soon',
      urgency: 1
    };
  }

  return {
    modifier: null,
    cssClass: '',
    urgency: 0
  };
}

/* ========================================
   STATUS VALIDATION UTILITIES
   ======================================== */

/**
 * Validates if a status transition is allowed
 */
export function isStatusTransitionValid(from: string, to: string, type: 'document' | 'customer' | 'payment' | 'product' | 'quote'): boolean {
  // For now, implement basic validation logic
  // This can be expanded with specific business rules
  
  if (from === to) return false;
  
  switch (type) {
    case 'document':
      const docTransitions = getDocumentStatusTransitions(from as DocumentStatus);
      return docTransitions.some(t => t.to === to && t.isAllowed);
    
    case 'customer':
      // Customer status transitions are generally allowed except to/from archived
      if (from === 'archived' || to === 'archived') return false;
      return true;
    
    case 'payment':
      // Payment status transitions follow specific rules
      const paymentRules = {
        pending: ['processing', 'failed'],
        processing: ['completed', 'failed'],
        completed: ['refunded'],
        failed: ['pending'],
        refunded: []
      };
      return paymentRules[from as PaymentStatus]?.includes(to) || false;
    
    case 'product':
      // Product status transitions
      const productRules = {
        active: ['discontinued', 'out-of-stock', 'low-stock'],
        discontinued: [],
        'out-of-stock': ['active', 'low-stock'],
        'low-stock': ['active', 'out-of-stock']
      };
      return productRules[from as ProductStatus]?.includes(to) || false;
    
    case 'quote':
      // Quote status transitions
      const quoteRules = {
        draft: ['sent'],
        sent: ['accepted', 'rejected', 'expired'],
        accepted: [],
        rejected: [],
        expired: []
      };
      return quoteRules[from as QuoteStatus]?.includes(to) || false;
    
    default:
      return false;
  }
}

/* ========================================
   EXPORT ALL STATUS UTILITIES
   ======================================== */

export default {
  getDocumentStatusInfo,
  getDocumentStatusTransitions,
  isDocumentOverdue,
  getCustomerStatusInfo,
  getPaymentStatusInfo,
  getProductStatusInfo,
  getQuoteStatusInfo,
  getPriorityStatusInfo,
  getProcessingStatusInfo,
  getStatusInfo,
  isStatusFinal,
  sortStatusValues,
  groupStatusesByActionability,
  getDateBasedStatusModifier,
  isStatusTransitionValid
};