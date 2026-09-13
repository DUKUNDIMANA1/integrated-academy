import React from 'react';

type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'orange' | 'purple' | 'teal';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  blue: 'bg-blue-100 text-blue-800',
  gray: 'bg-gray-100 text-gray-700',
  orange: 'bg-orange-100 text-orange-800',
  purple: 'bg-purple-100 text-purple-800',
  teal: 'bg-teal-100 text-teal-800',
};

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'gray', className = '' }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}>
    {children}
  </span>
);

// Status badge helpers
export const getStatusBadge = (status: string): React.ReactElement => {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    ACTIVE: { label: 'Active', variant: 'green' },
    LOCKED: { label: 'Locked', variant: 'red' },
    COMPLETED: { label: 'Completed', variant: 'teal' },
    CANCELLED: { label: 'Cancelled', variant: 'gray' },
    PENDING: { label: 'Pending', variant: 'yellow' },
    CONFIRMED: { label: 'Confirmed', variant: 'blue' },
    REJECTED: { label: 'Rejected', variant: 'red' },
    ENROLLED: { label: 'Enrolled', variant: 'green' },
    PAYMENT_PENDING: { label: 'Payment Pending', variant: 'orange' },
    PARTIALLY_PAID: { label: 'Partially Paid', variant: 'orange' },
    FULLY_PAID: { label: 'Fully Paid', variant: 'green' },
    UNPAID: { label: 'Unpaid', variant: 'red' },
    OVERDUE: { label: 'Overdue', variant: 'red' },
    DRAFT: { label: 'Draft', variant: 'gray' },
    PUBLISHED: { label: 'Published', variant: 'green' },
    ARCHIVED: { label: 'Archived', variant: 'gray' },
    OPEN: { label: 'Open', variant: 'blue' },
    IN_PROGRESS: { label: 'In Progress', variant: 'yellow' },
    RESOLVED: { label: 'Resolved', variant: 'green' },
    CLOSED: { label: 'Closed', variant: 'gray' },
    APPROVED: { label: 'Approved', variant: 'green' },
    PAID: { label: 'Paid', variant: 'green' },
    FAILED: { label: 'Failed', variant: 'red' },
    PLANNING: { label: 'Planning', variant: 'purple' },
    ON_HOLD: { label: 'On Hold', variant: 'orange' },
    WON: { label: 'Won', variant: 'green' },
    LOST: { label: 'Lost', variant: 'red' },
    NEW: { label: 'New', variant: 'blue' },
    CONTACTED: { label: 'Contacted', variant: 'teal' },
    REFUNDED: { label: 'Refunded', variant: 'purple' },
  };
  const config = map[status] || { label: status, variant: 'gray' as BadgeVariant };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};
