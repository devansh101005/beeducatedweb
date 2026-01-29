// Premium Avatar Component
// User avatars with fallback initials and status indicators

import { forwardRef, HTMLAttributes, useState } from 'react';
import clsx from 'clsx';

// ============================================
// TYPES
// ============================================

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type StatusType = 'online' | 'offline' | 'busy' | 'away';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  status?: StatusType;
  showStatus?: boolean;
}

// ============================================
// STYLES
// ============================================

const sizeStyles: Record<AvatarSize, { container: string; text: string; status: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-[10px]', status: 'w-2 h-2 border' },
  sm: { container: 'w-8 h-8', text: 'text-xs', status: 'w-2.5 h-2.5 border-[1.5px]' },
  md: { container: 'w-10 h-10', text: 'text-sm', status: 'w-3 h-3 border-2' },
  lg: { container: 'w-12 h-12', text: 'text-base', status: 'w-3.5 h-3.5 border-2' },
  xl: { container: 'w-16 h-16', text: 'text-lg', status: 'w-4 h-4 border-2' },
  '2xl': { container: 'w-20 h-20', text: 'text-xl', status: 'w-5 h-5 border-[3px]' },
};

const statusStyles: Record<StatusType, string> = {
  online: 'bg-emerald-500',
  offline: 'bg-slate-400',
  busy: 'bg-rose-500',
  away: 'bg-amber-500',
};

// Color palette for initials background
const colorPalette = [
  'bg-amber-500',
  'bg-emerald-500',
  'bg-sky-500',
  'bg-rose-500',
  'bg-violet-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-indigo-500',
];

// ============================================
// UTILS
// ============================================

function getInitials(name: string): string {
  if (!name) return '?';

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getColorFromName(name: string): string {
  if (!name) return colorPalette[0];

  // Simple hash function to consistently pick a color
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colorPalette.length;
  return colorPalette[index];
}

// ============================================
// AVATAR COMPONENT
// ============================================

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt,
      name = '',
      size = 'md',
      status,
      showStatus = false,
      className,
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = useState(false);
    const sizeConfig = sizeStyles[size];
    const initials = getInitials(name);
    const bgColor = getColorFromName(name);

    const shouldShowImage = src && !imageError;

    return (
      <div
        ref={ref}
        className={clsx(
          'relative inline-flex items-center justify-center rounded-full shrink-0',
          sizeConfig.container,
          !shouldShowImage && bgColor,
          className
        )}
        {...props}
      >
        {shouldShowImage ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="w-full h-full rounded-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className={clsx('font-medium text-white select-none', sizeConfig.text)}>
            {initials}
          </span>
        )}

        {/* Status indicator */}
        {showStatus && status && (
          <span
            className={clsx(
              'absolute bottom-0 right-0 rounded-full border-white',
              sizeConfig.status,
              statusStyles[status]
            )}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

// ============================================
// AVATAR GROUP - For showing multiple avatars
// ============================================

interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  avatars: Array<{
    src?: string | null;
    name?: string;
    alt?: string;
  }>;
  max?: number;
  size?: AvatarSize;
}

export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ avatars, max = 4, size = 'md', className, ...props }, ref) => {
    const visibleAvatars = avatars.slice(0, max);
    const remainingCount = avatars.length - max;
    const sizeConfig = sizeStyles[size];

    return (
      <div ref={ref} className={clsx('flex -space-x-2', className)} {...props}>
        {visibleAvatars.map((avatar, index) => (
          <Avatar
            key={index}
            src={avatar.src}
            name={avatar.name}
            alt={avatar.alt}
            size={size}
            className="ring-2 ring-white"
          />
        ))}

        {remainingCount > 0 && (
          <div
            className={clsx(
              'inline-flex items-center justify-center rounded-full',
              'bg-slate-200 ring-2 ring-white',
              sizeConfig.container
            )}
          >
            <span className={clsx('font-medium text-slate-600', sizeConfig.text)}>
              +{remainingCount}
            </span>
          </div>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup';

// ============================================
// AVATAR WITH NAME - Common pattern for user displays
// ============================================

interface AvatarWithNameProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  name: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
  status?: StatusType;
}

const avatarNameSizeConfig = {
  sm: { avatar: 'sm' as AvatarSize, name: 'text-sm', subtitle: 'text-xs' },
  md: { avatar: 'md' as AvatarSize, name: 'text-sm', subtitle: 'text-xs' },
  lg: { avatar: 'lg' as AvatarSize, name: 'text-base', subtitle: 'text-sm' },
};

export const AvatarWithName = forwardRef<HTMLDivElement, AvatarWithNameProps>(
  ({ src, name, subtitle, size = 'md', status, className, ...props }, ref) => {
    const config = avatarNameSizeConfig[size];

    return (
      <div ref={ref} className={clsx('flex items-center gap-3', className)} {...props}>
        <Avatar
          src={src}
          name={name}
          size={config.avatar}
          status={status}
          showStatus={!!status}
        />
        <div className="min-w-0 flex-1">
          <div className={clsx('font-medium text-slate-900 truncate', config.name)}>
            {name}
          </div>
          {subtitle && (
            <div className={clsx('text-slate-500 truncate', config.subtitle)}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
    );
  }
);

AvatarWithName.displayName = 'AvatarWithName';

export default Avatar;
