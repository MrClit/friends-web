import { cn, stringAvatar } from '@/shared/utils';
import { useState } from 'react';

interface AvatarProps {
  avatar?: string | null;
  name?: string;
  email?: string;
  alt?: string;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
}

/**
 * Reusable avatar component that renders the image when available
 * and falls back to the string avatar when not.
 */
export default function Avatar({
  avatar,
  name,
  email,
  alt,
  className,
  imageClassName,
  fallbackClassName,
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const hasAvatar = Boolean(avatar && avatar.trim() !== '' && !hasError);
  const resolvedAlt = alt ?? name ?? email ?? 'User';

  console.log('Avatar rendered with:', { avatar, name, email, hasAvatar, hasError }); // Debug log to check props and state

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
