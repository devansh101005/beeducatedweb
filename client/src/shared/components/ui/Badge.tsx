// Premium Badge Component
// Status indicators and labels

import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

// ============================================
// TYPES
// ============================================

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: ReactNode;
}

// ============================================
// STYLES
// ============================================

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-700',
  primary: 'bg-amber-100 text-amber-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-orange-100 text-orange-700',
  danger: 'bg-rose-100 text-rose-700',
  info: 'bg-sky-100 text-sky-700',
};

const dotStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-500',
  primary: 'bg-amber-500',
  success: 'bg-emerald-500',
  warning: 'bg-orange-500',
  danger: 'bg-rose-500',
  info: 'bg-sky-500',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

// ============================================
// BADGE COMPONENT
// ============================================

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'md',
      dot = false,
      icon,
      className,
      children,
      ...props
    },
    ref
  ) => (
    <span
      ref={ref}
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={clsx('w-1.5 h-1.5 rounded-full', dotStyles[variant])} />
      )}
      {icon && <span className="w-3.5 h-3.5">{icon}</span>}
      {children}
    </span>
  )
);

Badge.displayName = 'Badge';

// ============================================
// STATUS BADGE - For showing online/offline status
// ============================================

type StatusType = 'online' | 'offline' | 'busy' | 'away';

interface StatusBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  status: StatusType;
  showLabel?: boolean;
}

const statusConfig: Record<StatusType, { color: string; label: string }> = {
  online: { color: 'bg-emerald-500', label: 'Online' },
  offline: { color: 'bg-slate-400', label: 'Offline' },
  busy: { color: 'bg-rose-500', label: 'Busy' },
  away: { color: 'bg-amber-500', label: 'Away' },
};

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, showLabel = false, className, ...props }, ref) => {
    const config = statusConfig[status];

    return (
      <span
        ref={ref}
        className={clsx(
          'inline-flex items-center gap-1.5',
          showLabel && 'text-xs text-slate-600',
          className
        )}
        {...props}
      >
        <span className={clsx('w-2 h-2 rounded-full', config.color)} />
        {showLabel && <span>{config.label}</span>}
      </span>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

// ============================================
// COUNT BADGE - For notifications, etc.
// ============================================

interface CountBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  count: number;
  maxCount?: number;
  variant?: 'primary' | 'danger';
  showZero?: boolean;
}

export const CountBadge = forwardRef<HTMLSpanElement, CountBadgeProps>(
  (
    {
      count,
      maxCount = 99,
      variant = 'danger',
      showZero = false,
      className,
      ...props
    },
    ref
  ) => {
    if (count === 0 && !showZero) return null;

    const displayCount = count > maxCount ? `${maxCount}+` : count;
    const isSmall = count <= 9;

    return (
      <span
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center text-xs font-semibold text-white rounded-full',
          isSmall ? 'min-w-[18px] h-[18px] px-1' : 'min-w-[20px] h-[20px] px-1.5',
          variant === 'primary' ? 'bg-amber-500' : 'bg-rose-500',
          className
        )}
        {...props}
      >
        {displayCount}
      </span>
    );
  }
);

CountBadge.displayName = 'CountBadge';

// ============================================
// PAYMENT STATUS BADGE - Specific for payment states
// ============================================

type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'cancelled';

interface PaymentStatusBadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  status: PaymentStatus;
}

const paymentStatusConfig: Record<PaymentStatus, { variant: BadgeVariant; label: string }> = {
  pending: { variant: 'warning', label: 'Pending' },
  processing: { variant: 'info', label: 'Processing' },
  completed: { variant: 'success', label: 'Completed' },
  failed: { variant: 'danger', label: 'Failed' },
  refunded: { variant: 'default', label: 'Refunded' },
  cancelled: { variant: 'default', label: 'Cancelled' },
};

export const PaymentStatusBadge = forwardRef<HTMLSpanElement, PaymentStatusBadgeProps>(
  ({ status, className, ...props }, ref) => {
    const config = paymentStatusConfig[status];

    return (
      <Badge
        ref={ref}
        variant={config.variant}
        dot
        className={className}
        {...props}
      >
        {config.label}
      </Badge>
    );
  }
);

PaymentStatusBadge.displayName = 'PaymentStatusBadge';

export default Badge;
