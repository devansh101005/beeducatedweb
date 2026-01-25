// Premium Empty State Component
// Placeholder UI for empty data states

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { FileQuestion, Search, Inbox, Calendar, Users, BookOpen } from 'lucide-react';
import clsx from 'clsx';
import { Button } from './Button';
import { fadeInUp, easings, durations } from './motion';

// ============================================
// TYPES
// ============================================

type EmptyStateVariant = 'default' | 'search' | 'inbox' | 'calendar' | 'users' | 'courses';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

// ============================================
// ICONS
// ============================================

const variantIcons: Record<EmptyStateVariant, ReactNode> = {
  default: <FileQuestion className="w-full h-full" />,
  search: <Search className="w-full h-full" />,
  inbox: <Inbox className="w-full h-full" />,
  calendar: <Calendar className="w-full h-full" />,
  users: <Users className="w-full h-full" />,
  courses: <BookOpen className="w-full h-full" />,
};

// ============================================
// EMPTY STATE COMPONENT
// ============================================

export function EmptyState({
  variant = 'default',
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const IconComponent = icon || variantIcons[variant];

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      className={clsx(
        'flex flex-col items-center justify-center py-16 px-8 text-center',
        className
      )}
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: durations.slow, ease: easings.bounce }}
        className="w-20 h-20 text-slate-300 mb-6"
      >
        {IconComponent}
      </motion.div>

      {/* Title */}
      <h3 className="text-lg font-heading font-semibold text-slate-900 mb-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-slate-500 max-w-sm mb-6">
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <Button
              variant={action.variant || 'primary'}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// PRESET EMPTY STATES
// ============================================

interface PresetEmptyStateProps {
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

export function NoSearchResults({ onAction, actionLabel = 'Clear search', className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      variant="search"
      title="No results found"
      description="We couldn't find anything matching your search. Try adjusting your filters or search terms."
      action={onAction ? { label: actionLabel, onClick: onAction, variant: 'outline' } : undefined}
      className={className}
    />
  );
}

export function NoDataYet({
  title = 'No data yet',
  description = 'Get started by adding your first item.',
  onAction,
  actionLabel = 'Add new',
  className,
}: PresetEmptyStateProps & { title?: string; description?: string }) {
  return (
    <EmptyState
      variant="inbox"
      title={title}
      description={description}
      action={onAction ? { label: actionLabel, onClick: onAction } : undefined}
      className={className}
    />
  );
}

export function NoUpcomingEvents({ onAction, actionLabel = 'Schedule event', className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      variant="calendar"
      title="No upcoming events"
      description="You have no scheduled events. Create one to get started."
      action={onAction ? { label: actionLabel, onClick: onAction } : undefined}
      className={className}
    />
  );
}

export function NoStudentsFound({ onAction, actionLabel = 'Add student', className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      variant="users"
      title="No students found"
      description="There are no students matching your criteria. Try adjusting your filters."
      action={onAction ? { label: actionLabel, onClick: onAction, variant: 'outline' } : undefined}
      className={className}
    />
  );
}

export function NoCoursesAvailable({ onAction, actionLabel = 'Browse courses', className }: PresetEmptyStateProps) {
  return (
    <EmptyState
      variant="courses"
      title="No courses available"
      description="There are no courses available at the moment. Check back later."
      action={onAction ? { label: actionLabel, onClick: onAction } : undefined}
      className={className}
    />
  );
}

export default EmptyState;
