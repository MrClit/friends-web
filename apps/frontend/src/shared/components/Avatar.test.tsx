import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Avatar } from './Avatar';

const stringAvatarMock = vi.fn((name?: string, email?: string) =>
  name ? name.slice(0, 1).toUpperCase() : email?.[0]?.toUpperCase() || '?',
);

vi.mock('@/shared/utils', () => ({
  cn: (...classes: Array<string | undefined | null | false>) => classes.filter(Boolean).join(' '),
  stringAvatar: (name?: string, email?: string) => stringAvatarMock(name, email),
}));

describe('Avatar', () => {
  it('renders pot avatar variant with resolved aria-label', () => {
    render(<Avatar isPot alt="Shared pot" className="size-10" />);

    expect(screen.getByLabelText('Shared pot')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders image avatar when valid avatar URL is provided', () => {
    render(<Avatar avatar="https://example.com/user.png" name="Alice" />);

    const image = screen.getByRole('img', { name: 'Alice' });
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/user.png');
  });

  it('falls back to text avatar after image load error', () => {
    render(<Avatar avatar="https://example.com/broken.png" name="Bob" />);

    const image = screen.getByRole('img', { name: 'Bob' });
    fireEvent.error(image);

    expect(screen.queryByRole('img', { name: 'Bob' })).not.toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(stringAvatarMock).toHaveBeenCalledWith('Bob', undefined);
  });

  it('renders fallback text when avatar is empty and uses email when name is missing', () => {
    render(<Avatar avatar="   " email="zeta@example.com" />);

    expect(screen.getByText('Z')).toBeInTheDocument();
    expect(stringAvatarMock).toHaveBeenCalledWith(undefined, 'zeta@example.com');
  });
});
