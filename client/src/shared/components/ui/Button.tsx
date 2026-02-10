// Premium Button Component
// Accessible, animated buttons with multiple variants

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

// ============================================
// TYPES
// ============================================

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'outline-primary' | 'success' | 'danger' | 'warning';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loading?: boolean;
  isFullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children: ReactNode;
}

// ============================================
// STYLES
// ============================================

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-amber-500 text-white
    hover:bg-amber-600
    active:bg-amber-700
    shadow-soft-sm hover:shadow-amber-glow
    focus-visible:ring-amber-500
  `,
  secondary: `
    bg-slate-800 text-white
    hover:bg-slate-900
    active:bg-slate-950
    shadow-soft-sm hover:shadow-soft-md
    focus-visible:ring-slate-500
  `,
  ghost: `
    bg-transparent text-slate-700
    hover:bg-slate-100
    active:bg-slate-200
    focus-visible:ring-slate-500
  `,
  outline: `
    bg-transparent text-slate-700
    border border-slate-300
    hover:bg-slate-50 hover:border-slate-400
    active:bg-slate-100
    focus-visible:ring-slate-500
  `,
  'outline-primary': `
    bg-transparent text-amber-600
    border border-amber-300
    hover:bg-amber-50 hover:border-amber-400
    active:bg-amber-100
    focus-visible:ring-amber-500
  `,
  success: `
    bg-emerald-500 text-white
    hover:bg-emerald-600
    active:bg-emerald-700
    shadow-soft-sm hover:shadow-emerald-glow
    focus-visible:ring-emerald-500
  `,
  danger: `
    bg-rose-500 text-white
    hover:bg-rose-600
    active:bg-rose-700
    shadow-soft-sm hover:shadow-rose-glow
    focus-visible:ring-rose-500
  `,
  warning: `
    bg-orange-500 text-white
    hover:bg-orange-600
    active:bg-orange-700
    shadow-soft-sm hover:shadow-orange-glow
    focus-visible:ring-orange-500
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1',
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2',
  xl: 'h-12 px-6 text-base gap-2.5',
};

const baseStyles = `
  inline-flex items-center justify-center
  font-medium rounded-xl
  transition-colors duration-200
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
  select-none
`;

// ============================================
// COMPONENT
// ============================================

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading: isLoadingProp = false,
      loading = false,
      isFullWidth = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const isLoading = isLoadingProp || loading;
    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        whileHover={!isDisabled ? { scale: 1.01 } : undefined}
        whileTap={!isDisabled ? { scale: 0.98 } : undefined}
        transition={{ duration: 0.15 }}
        className={clsx(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          isFullWidth && 'w-full',
          className
        )}
        disabled={isDisabled}
        {...(props as HTMLMotionProps<'button'>)}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : leftIcon ? (
          <span className="shrink-0">{leftIcon}</span>
        ) : null}

        <span>{children}</span>

        {!isLoading && rightIcon && (
          <span className="shrink-0">{rightIcon}</span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

// ============================================
// ICON BUTTON VARIANT
// ============================================

interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon?: ReactNode;
  children?: ReactNode;
  'aria-label'?: string;
}

const iconSizeStyles: Record<ButtonSize, string> = {
  xs: 'h-7 w-7',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-11 w-11',
  xl: 'h-12 w-12',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = 'ghost',
      size = 'md',
      isLoading: isLoadingProp = false,
      loading = false,
      icon,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const isLoading = isLoadingProp || loading;
    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        whileHover={!isDisabled ? { scale: 1.05 } : undefined}
        whileTap={!isDisabled ? { scale: 0.95 } : undefined}
        transition={{ duration: 0.15 }}
        className={clsx(
          'inline-flex items-center justify-center',
          'rounded-xl',
          'transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          variantStyles[variant],
          iconSizeStyles[size],
          className
        )}
        disabled={isDisabled}
        {...(props as HTMLMotionProps<'button'>)}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          icon || children
        )}
      </motion.button>
    );
  }
);

IconButton.displayName = 'IconButton';

export default Button;
