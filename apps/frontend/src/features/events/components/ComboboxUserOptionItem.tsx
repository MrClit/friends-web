import { ComboboxOptionItem } from '@/shared/components/ComboboxOptionItem';
import type { GroupMember } from '@/api/groups.api';

interface ComboboxUserOptionItemProps {
  user: GroupMember;
  isHighlighted: boolean;
  onSelect: (user: GroupMember) => void;
  onHover: () => void;
}

export function ComboboxUserOptionItem({ user, isHighlighted, onSelect, onHover }: ComboboxUserOptionItemProps) {
  return (
    <ComboboxOptionItem
      avatar={user.avatar ?? undefined}
      label={user.name || user.email}
      description={user.name ? user.email : undefined}
      isHighlighted={isHighlighted}
      onSelect={() => onSelect(user)}
      onHover={onHover}
    />
  );
}
