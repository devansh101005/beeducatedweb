// Premium Card Component
// Flexible card system with multiple variants and animations

import { forwardRef, HTMLAttributes, ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import clsx from 'clsx';
import { cardHover, easings, durations } from './motion';

// ============================================
// TYPES
// ============================================

type CardVariant = 'default' | 'elevated' | 'outlined' | 'ghost';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  isHoverable?: boolean;
  isClickable?: boolean;
  noPadding?: boolean;
}

// ============================================
// STYLES
// ============================================

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-white border border-slate-200/60 shadow-soft-sm',
  elevated: 'bg-white shadow-elevated border-0',
  outlined: 'bg-transparent border border-slate-200',
  ghost: 'bg-slate-50/50 border-0',
};

const baseStyles = 'rounded-2xl transition-all duration-250';

// ============================================
// CARD COMPONENT
// ============================================

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      isHoverable = false,
      isClickable = false,
      noPadding = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const cardClassName = clsx(
      baseStyles,
      variantStyles[variant],
      !noPadding && 'p-5',
      (isHoverable || isClickable) && 'hover:shadow-elevated hover:border-slate-200',
      isClickable && 'cursor-pointer',
      className
    );

    if (isHoverable || isClickable) {
      return (
        <motion.div
          ref={ref}
          className={cardClassName}
          variants={cardHover}
          initial="initial"
          whileHover="hover"
          whileTap={isClickable ? 'tap' : undefined}
          {...(props as HTMLMotionProps<'div'>)}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div ref={ref} className={cardClassName} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// ============================================
// CARD HEADER
// ============================================

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ title, subtitle, action, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(
        'flex items-start justify-between gap-4 pb-4 border-b border-slate-100',
        className
      )}
      {...props}
    >
      {(title || subtitle) ? (
        <div className="min-w-0 flex-1">
          {title && (
            <h3 className="text-heading-md text-slate-900 truncate">{title}</h3>
          )}
          {subtitle && (
            <p className="text-body-sm text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      ) : children}
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

// ============================================
// CARD BODY
// ============================================

export const CardBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={clsx('py-4', className)} {...props}>
      {children}
    </div>
  )
);

CardBody.displayName = 'CardBody';

// ============================================
// CARD FOOTER
// ============================================

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(
        'flex items-center gap-3 pt-4 border-t border-slate-100',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);

CardFooter.displayName = 'CardFooter';

// ============================================
// STAT CARD - Dashboard Statistics
// ============================================

interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  icon?: ReactNode;
  iconColor?: 'amber' | 'emerald' | 'sky' | 'rose' | 'slate';
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  isLoading?: boolean;
}

const iconColorStyles = {
  amber: 'bg-amber-100 text-amber-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  sky: 'bg-sky-100 text-sky-600',
  rose: 'bg-rose-100 text-rose-600',
  slate: 'bg-slate-100 text-slate-600',
};

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      title,
      value,
      icon,
      iconColor = 'amber',
      trend,
      isLoading = false,
      className,
      ...props
    },
    ref
  ) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: durations.slow, ease: easings.smooth }}
      className={clsx(
        'bg-white rounded-2xl border border-slate-200/60 shadow-soft-sm p-5',
        'hover:shadow-soft-md transition-shadow duration-250',
        className
      )}
      {...(props as HTMLMotionProps<'div'>)}
    >
      {icon && (
        <div className={clsx(
          'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
          iconColorStyles[iconColor]
        )}>
          {icon}
        </div>
      )}

      {isLoading ? (
        <>
          <div className="h-8 w-24 bg-slate-200 rounded animate-pulse mb-1" />
          <div className="h-4 w-16 bg-slate-100 rounded animate-pulse" />
        </>
      ) : (
        <>
          <div className="text-2xl font-heading font-semibold text-slate-900 mb-1">
            {value}
          </div>
          <div className="text-sm text-slate-500">{title}</div>

          {trend && (
            <div className={clsx(
              'inline-flex items-center gap-1 text-xs font-medium mt-3',
              trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
            )}>
              <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
              {trend.label && (
                <span className="text-slate-400">{trend.label}</span>
              )}
            </div>
          )}
        </>
      )}
    </motion.div>
  )
);

StatCard.displayName = 'StatCard';

// ============================================
// METRIC CARD - Compact version for grids
// ============================================

interface MetricCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: ReactNode;
  color?: 'amber' | 'emerald' | 'sky' | 'rose' | 'slate';
}

export const MetricCard = forwardRef<HTMLDivElement, MetricCardProps>(
  ({ label, value, subValue, icon, color = 'slate', className, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(
        'flex items-center gap-4 p-4 rounded-xl bg-slate-50/50',
        className
      )}
      {...props}
    >
      {icon && (
        <div className={clsx(
          'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
          iconColorStyles[color]
        )}>
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-lg font-semibold text-slate-900">{value}</div>
        <div className="text-xs text-slate-500 truncate">{label}</div>
        {subValue && (
          <div className="text-xs text-slate-400 mt-0.5">{subValue}</div>
        )}
      </div>
    </div>
  )
);

MetricCard.displayName = 'MetricCard';

export default Card;
