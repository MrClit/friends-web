import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ErrorState } from './ErrorState';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'common.errorLoading': 'Could not load data. Please try again.',
        'common.retry': 'Retry',
      };
      return translations[key] || key;
    },
  }),
}));

describe('ErrorState', () => {
  it('should render default error message when no message prop is provided', () => {
    render(<ErrorState />);
    expect(screen.getByText('Could not load data. Please try again.')).toBeInTheDocument();
  });

  it('should render custom error message when provided', () => {
    render(<ErrorState message="Custom error occurred" />);
    expect(screen.getByText('Custom error occurred')).toBeInTheDocument();
  });

  it('should not render retry button when onRetry is not provided', () => {
    render(<ErrorState />);
    expect(screen.queryByText('Retry')).not.toBeInTheDocument();
  });

  it('should render retry button when onRetry is provided', () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should call onRetry when retry button is clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);

    fireEvent.click(screen.getByText('Retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should render both custom message and retry button', () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Network error" onRetry={onRetry} />);

    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });
});
