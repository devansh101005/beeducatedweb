// Premium Modal Component
// Accessible dialog/modal with animations

import { Fragment, ReactNode, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import clsx from 'clsx';
import { IconButton } from './Button';
import { easings, durations } from './motion';

// ============================================
// TYPES
// ============================================

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: ModalSize;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
  className?: string;
}

interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

// ============================================
// STYLES
// ============================================

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
};

// ============================================
// ANIMATION VARIANTS
// ============================================

const backdropVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: durations.normal,
      ease: easings.smooth,
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: durations.fast,
    }
  },
};

// ============================================
// MODAL COMPONENT
// ============================================

export function Modal({
  isOpen,
  onClose,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className,
}: ModalProps) {
  // Handle escape key
  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    },
    [onClose, closeOnEscape]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  return (
    <AnimatePresence>
      {isOpen && (
        <Fragment>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            variants={backdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: durations.fast }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm"
            onClick={closeOnBackdrop ? onClose : undefined}
            aria-hidden="true"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="modal"
              role="dialog"
              aria-modal="true"
              variants={modalVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={clsx(
                'w-full pointer-events-auto',
                'bg-white rounded-2xl shadow-elevated-lg',
                'max-h-[calc(100vh-2rem)] overflow-hidden',
                'flex flex-col',
                sizeStyles[size],
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </motion.div>
          </div>
        </Fragment>
      )}
    </AnimatePresence>
  );
}

// ============================================
// MODAL HEADER
// ============================================

export function ModalHeader({
  title,
  subtitle,
  onClose,
  showCloseButton = true,
  className,
}: ModalHeaderProps) {
  return (
    <div
      className={clsx(
        'flex items-start justify-between gap-4 px-6 py-4',
        'border-b border-slate-100',
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-heading font-semibold text-slate-900">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>

      {showCloseButton && onClose && (
        <IconButton
          icon={<X className="w-5 h-5" />}
          aria-label="Close modal"
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="-mr-1 -mt-1"
        />
      )}
    </div>
  );
}

// ============================================
// MODAL BODY
// ============================================

export function ModalBody({ children, className }: ModalBodyProps) {
  return (
    <div
      className={clsx(
        'flex-1 overflow-y-auto px-6 py-5',
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================
// MODAL FOOTER
// ============================================

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={clsx(
        'flex items-center justify-end gap-3 px-6 py-4',
        'border-t border-slate-100 bg-slate-50/50',
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================
// CONFIRM MODAL - Common pattern for confirmations
// ============================================

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'default';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  isLoading = false,
}: ConfirmModalProps) {
  const confirmButtonClass = {
    danger: 'btn-danger',
    warning: 'btn-primary',
    default: 'btn-primary',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader title={title} onClose={onClose} />
      <ModalBody>
        <p className="text-slate-600">{description}</p>
      </ModalBody>
      <ModalFooter>
        <button
          className="btn-ghost"
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelText}
        </button>
        <button
          className={confirmButtonClass[variant]}
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : confirmText}
        </button>
      </ModalFooter>
    </Modal>
  );
}

export default Modal;
