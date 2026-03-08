import { ComboboxOptionItem } from '@/shared/components/ComboboxOptionItem';
import type { User } from '@/features/auth/types';

interface ComboboxUserOptionItemProps {
  user: User;
  isHighlighted: boolean;
  onSelect: (user: User) => void;
  onHover: () => void;
}

export function ComboboxUserOptionItem({ user, isHighlighted, onSelect, onHover }: ComboboxUserOptionItemProps) {
  return (
    <ComboboxOptionItem
      avatar={user.avatar}
      label={user.name || user.email}
      description={user.name ? user.email : undefined}
      isHighlighted={isHighlighted}
      onSelect={() => onSelect(user)}
      onHover={onHover}
    />
  );
}
