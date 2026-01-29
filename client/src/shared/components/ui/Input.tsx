// Premium Input Component
// Accessible form inputs with validation states

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, ReactNode, useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Eye, EyeOff, Search } from 'lucide-react';
import clsx from 'clsx';

// ============================================
// TYPES
// ============================================

type InputSize = 'sm' | 'md' | 'lg';
type InputState = 'default' | 'error' | 'success';

interface BaseInputProps {
  label?: string;
  helperText?: string;
  error?: string;
  size?: InputSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isRequired?: boolean;
}

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>, BaseInputProps {}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, Omit<BaseInputProps, 'leftIcon' | 'rightIcon'> {
  rows?: number;
}

// ============================================
// STYLES
// ============================================

const sizeStyles: Record<InputSize, string> = {
  sm: 'h-8 px-3 text-xs rounded-lg',
  md: 'h-10 px-3.5 text-sm rounded-xl',
  lg: 'h-12 px-4 text-base rounded-xl',
};

const stateStyles: Record<InputState, string> = {
  default: 'border-slate-300 focus:border-amber-400 focus:ring-amber-100',
  error: 'border-rose-400 focus:border-rose-400 focus:ring-rose-100',
  success: 'border-emerald-400 focus:border-emerald-400 focus:ring-emerald-100',
};

const baseInputStyles = `
  w-full bg-white text-slate-800
  border transition-all duration-200
  placeholder:text-slate-400
  focus:outline-none focus:ring-2
  disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
`;

// ============================================
// INPUT COMPONENT
// ============================================

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      size = 'md',
      leftIcon,
      rightIcon,
      isRequired = false,
      className,
      id,
      type = 'text',
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const state: InputState = error ? 'error' : 'default';

    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className={clsx('w-full', className)}>
        {label && (
          <label
            htmlFor={inputId}
            className={clsx(
              'block text-sm font-medium text-slate-700 mb-1.5',
              isRequired && "after:content-['*'] after:ml-0.5 after:text-rose-500"
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={inputType}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            className={clsx(
              baseInputStyles,
              sizeStyles[size],
              stateStyles[state],
              leftIcon && 'pl-10',
              (rightIcon || isPassword || error) && 'pr-10',
            )}
            {...props}
          />

          {/* Right side icons */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {error && (
              <AlertCircle className="w-4 h-4 text-rose-500" />
            )}
            {isPassword && !error && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            )}
            {!error && !isPassword && rightIcon && (
              <span className="text-slate-400">{rightIcon}</span>
            )}
          </div>
        </div>

        {/* Error or helper text */}
        <AnimatePresence mode="wait">
          {error ? (
            <motion.p
              key="error"
              id={`${inputId}-error`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-xs text-rose-500 mt-1.5"
            >
              {error}
            </motion.p>
          ) : helperText ? (
            <motion.p
              key="helper"
              id={`${inputId}-helper`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-slate-500 mt-1.5"
            >
              {helperText}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = 'Input';

// ============================================
// SEARCH INPUT
// ============================================

interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'type'> {
  onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, ...props }, ref) => (
    <Input
      ref={ref}
      type="search"
      leftIcon={<Search className="w-4 h-4" />}
      placeholder="Search..."
      className={className}
      {...props}
    />
  )
);

SearchInput.displayName = 'SearchInput';

// ============================================
// TEXTAREA COMPONENT
// ============================================

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      size = 'md',
      isRequired = false,
      rows = 4,
      className,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const state: InputState = error ? 'error' : 'default';

    const textareaSizeStyles: Record<InputSize, string> = {
      sm: 'px-3 py-2 text-xs rounded-lg',
      md: 'px-3.5 py-3 text-sm rounded-xl',
      lg: 'px-4 py-3.5 text-base rounded-xl',
    };

    return (
      <div className={clsx('w-full', className)}>
        {label && (
          <label
            htmlFor={textareaId}
            className={clsx(
              'block text-sm font-medium text-slate-700 mb-1.5',
              isRequired && "after:content-['*'] after:ml-0.5 after:text-rose-500"
            )}
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
          className={clsx(
            baseInputStyles,
            textareaSizeStyles[size],
            stateStyles[state],
            'resize-y min-h-[100px]'
          )}
          {...props}
        />

        <AnimatePresence mode="wait">
          {error ? (
            <motion.p
              key="error"
              id={`${textareaId}-error`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-xs text-rose-500 mt-1.5"
            >
              {error}
            </motion.p>
          ) : helperText ? (
            <motion.p
              key="helper"
              id={`${textareaId}-helper`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-slate-500 mt-1.5"
            >
              {helperText}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// ============================================
// SELECT COMPONENT
// ============================================

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<InputHTMLAttributes<HTMLSelectElement>, 'size'>, Omit<BaseInputProps, 'leftIcon' | 'rightIcon'> {
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      error,
      size = 'md',
      isRequired = false,
      options,
      placeholder,
      className,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const state: InputState = error ? 'error' : 'default';

    return (
      <div className={clsx('w-full', className)}>
        {label && (
          <label
            htmlFor={selectId}
            className={clsx(
              'block text-sm font-medium text-slate-700 mb-1.5',
              isRequired && "after:content-['*'] after:ml-0.5 after:text-rose-500"
            )}
          >
            {label}
          </label>
        )}

        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          aria-invalid={!!error}
          className={clsx(
            baseInputStyles,
            sizeStyles[size],
            stateStyles[state],
            'appearance-none pr-10',
            'bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E")]',
            'bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat'
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>

        <AnimatePresence mode="wait">
          {error ? (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-xs text-rose-500 mt-1.5"
            >
              {error}
            </motion.p>
          ) : helperText ? (
            <motion.p
              key="helper"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-slate-500 mt-1.5"
            >
              {helperText}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Input;
