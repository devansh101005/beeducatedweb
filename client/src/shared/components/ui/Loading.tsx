// Premium Loading Components
// Spinners, skeletons, and loading states

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

// ============================================
// TYPES
// ============================================

type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type SpinnerColor = 'primary' | 'white' | 'slate';

interface SpinnerProps {
  size?: SpinnerSize;
  color?: SpinnerColor;
  className?: string;
}

interface LoadingOverlayProps {
  isLoading: boolean;
  children: ReactNode;
  text?: string;
  blur?: boolean;
  className?: string;
}

// ============================================
// STYLES
// ============================================

const spinnerSizes: Record<SpinnerSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const spinnerColors: Record<SpinnerColor, string> = {
  primary: 'text-amber-500',
  white: 'text-white',
  slate: 'text-slate-400',
};

// ============================================
// SPINNER COMPONENT
// ============================================

export function Spinner({ size = 'md', color = 'primary', className }: SpinnerProps) {
  return (
    <svg
      className={clsx(
        'animate-spin',
        spinnerSizes[size],
        spinnerColors[color],
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Loading"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// ============================================
// DOTS LOADER - Three bouncing dots
// ============================================

export function DotsLoader({ className }: { className?: string }) {
  return (
    <div className={clsx('flex items-center gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-amber-500 rounded-full"
          animate={{
            y: [0, -6, 0],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ============================================
// PULSE LOADER - Pulsing circle
// ============================================

export function PulseLoader({ size = 'md', className }: { size?: SpinnerSize; className?: string }) {
  return (
    <div className={clsx('relative', spinnerSizes[size], className)}>
      <motion.div
        className="absolute inset-0 rounded-full bg-amber-500"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <div className="absolute inset-0 rounded-full bg-amber-500" />
    </div>
  );
}

// ============================================
// LOADING OVERLAY
// ============================================

export function LoadingOverlay({
  isLoading,
  children,
  text,
  blur = true,
  className,
}: LoadingOverlayProps) {
  return (
    <div className={clsx('relative', className)}>
      {children}

      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={clsx(
            'absolute inset-0 flex flex-col items-center justify-center',
            'bg-white/80 z-10',
            blur && 'backdrop-blur-sm'
          )}
        >
          <Spinner size="lg" />
          {text && (
            <p className="mt-3 text-sm text-slate-600">{text}</p>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ============================================
// SKELETON COMPONENTS
// ============================================

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'animate-pulse bg-slate-200 rounded',
        className
      )}
    />
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={clsx('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={clsx(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={clsx('p-5 rounded-2xl border border-slate-200 bg-white', className)}>
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

export function SkeletonStatCard({ className }: SkeletonProps) {
  return (
    <div className={clsx('p-5 rounded-2xl border border-slate-200 bg-white', className)}>
      <Skeleton className="w-12 h-12 rounded-xl mb-4" />
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4, className }: { rows?: number; columns?: number; className?: string }) {
  return (
    <div className={clsx('rounded-xl border border-slate-200 overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="px-4 py-4 flex gap-4 border-b border-slate-100 last:border-0">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className={clsx('h-4 flex-1', colIndex === 0 && 'w-20 flex-none')}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return <Skeleton className={clsx('rounded-full', sizeClasses[size], className)} />;
}

// ============================================
// FULL PAGE LOADER
// ============================================

export function PageLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-50">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center"
      >
        {/* Logo/Brand placeholder */}
        <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center mb-6">
          <span className="text-2xl font-heading font-bold text-white">B</span>
        </div>

        <DotsLoader />

        <p className="mt-4 text-sm text-slate-500">{text}</p>
      </motion.div>
    </div>
  );
}

// ============================================
// INLINE LOADER - For buttons, etc.
// ============================================

export function InlineLoader({ text }: { text?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Spinner size="sm" />
      {text && <span>{text}</span>}
    </span>
  );
}

export default Spinner;
