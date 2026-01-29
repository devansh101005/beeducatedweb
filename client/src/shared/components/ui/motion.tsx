// Motion utilities and animation presets
// Framer Motion configurations for consistent animations across the app

import { motion, HTMLMotionProps, Variants } from 'framer-motion';
import { forwardRef, ReactNode } from 'react';

// ============================================
// ANIMATION PRESETS
// ============================================

export const easings = {
  smooth: [0.4, 0, 0.2, 1] as const,
  bounce: [0.68, -0.55, 0.265, 1.55] as const,
  snap: [0, 0, 0.2, 1] as const,
  elastic: [0.68, -0.6, 0.32, 1.6] as const,
};

export const durations = {
  fast: 0.15,
  normal: 0.25,
  slow: 0.4,
  slower: 0.6,
};

// ============================================
// VARIANT PRESETS
// ============================================

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 16 },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

export const fadeInLeft: Variants = {
  initial: { opacity: 0, x: -24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

export const fadeInRight: Variants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 24 },
};

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const slideInFromBottom: Variants = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
};

// Stagger container for children
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: easings.smooth,
    },
  },
};

// Card hover effect
export const cardHover: Variants = {
  initial: {},
  hover: {
    y: -2,
    transition: {
      duration: 0.2,
      ease: easings.smooth,
    },
  },
  tap: {
    y: 0,
    scale: 0.98,
  },
};

// Button press effect
export const buttonPress = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: { duration: 0.15 },
};

// ============================================
// MOTION COMPONENTS
// ============================================

interface MotionDivProps extends HTMLMotionProps<'div'> {
  children?: ReactNode;
}

// Page transition wrapper
export const PageTransition = forwardRef<HTMLDivElement, MotionDivProps>(
  ({ children, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: durations.slow, ease: easings.smooth }}
      {...props}
    >
      {children}
    </motion.div>
  )
);
PageTransition.displayName = 'PageTransition';

// Fade in component
export const FadeIn = forwardRef<HTMLDivElement, MotionDivProps & { delay?: number }>(
  ({ children, delay = 0, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: durations.normal, delay, ease: easings.smooth }}
      {...props}
    >
      {children}
    </motion.div>
  )
);
FadeIn.displayName = 'FadeIn';

// Slide up component
export const SlideUp = forwardRef<HTMLDivElement, MotionDivProps & { delay?: number }>(
  ({ children, delay = 0, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: durations.slow, delay, ease: easings.smooth }}
      {...props}
    >
      {children}
    </motion.div>
  )
);
SlideUp.displayName = 'SlideUp';

// Stagger children wrapper
interface StaggerProps extends MotionDivProps {
  staggerDelay?: number;
  childDelay?: number;
}

export const Stagger = forwardRef<HTMLDivElement, StaggerProps>(
  ({ children, staggerDelay = 0.08, childDelay = 0.1, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial="initial"
      animate="animate"
      variants={{
        initial: {},
        animate: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: childDelay,
          },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
);
Stagger.displayName = 'Stagger';

// Stagger item
export const StaggerItem = forwardRef<HTMLDivElement, MotionDivProps>(
  ({ children, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={staggerItem}
      {...props}
    >
      {children}
    </motion.div>
  )
);
StaggerItem.displayName = 'StaggerItem';

// Hover scale component
interface HoverScaleProps extends MotionDivProps {
  scale?: number;
}

export const HoverScale = forwardRef<HTMLDivElement, HoverScaleProps>(
  ({ children, scale = 1.02, ...props }, ref) => (
    <motion.div
      ref={ref}
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      {...props}
    >
      {children}
    </motion.div>
  )
);
HoverScale.displayName = 'HoverScale';

// Animated presence wrapper for conditional rendering
export { AnimatePresence } from 'framer-motion';

// Re-export motion for custom usage
export { motion };
