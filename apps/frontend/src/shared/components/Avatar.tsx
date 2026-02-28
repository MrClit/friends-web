import { cn, stringAvatar } from '@/shared/utils';
import { useState } from 'react';
import { FaPiggyBank } from 'react-icons/fa';

interface AvatarProps {
  avatar?: string | null;
  name?: string;
  email?: string;
  alt?: string;
  isPot?: boolean;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
}

/**
 * Reusable avatar component that renders the image when available
 * and falls back to the string avatar when not.
 */
export function Avatar({ avatar, name, email, alt, isPot, className, imageClassName, fallbackClassName }: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const hasAvatar = Boolean(avatar && avatar.trim() !== '' && !hasError);
  const resolvedAlt = alt ?? name ?? email ?? 'User';

  if (isPot) {
    return (
      <div
        className={cn(
          'rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold',
          className,
          fallbackClassName,
        )}
        aria-label={resolvedAlt}
      >
        <FaPiggyBank className="text-lg" />
      </div>
    );
  }

  if (hasAvatar) {
    return (
      <img
        src={avatar as string}
        alt={resolvedAlt}
        className={cn(className, imageClassName)}
        onError={() => setHasError(true)}
      />
    );
  }

  return <span className={cn(className, fallbackClassName)}>{stringAvatar(name, email)}</span>;
}
