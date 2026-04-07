import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

// Mock i18n
vi.mock('@/i18n', () => ({
  i18n: {
    t: (key: string, options?: { ns?: string }) => {
      const namespacedKey = options?.ns ? `${options.ns}.${key}` : key;
      const translations: Record<string, string> = {
        'errorBoundary.title': 'Something went wrong',
        'errorBoundary.message': 'An unexpected error occurred.',
        'errorBoundary.reload': 'Reload page',
        'errorBoundary.details': 'Error details',
      };
      return translations[namespacedKey] || namespacedKey;
    },
  },
}));

// Mock Logo component
vi.mock('./Logo', () => ({
  LogoIcon: ({ size }: { size?: number }) => <div data-testid="logo-icon" data-size={size} />,
}));

// Component that throws an error for testing
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>Content rendered successfully</div>;
}

describe('ErrorBoundary', () => {
  // Suppress console.error during tests since we're testing error scenarios
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('should render fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();
    expect(screen.getByText('Reload page')).toBeInTheDocument();
  });

  it('should display the logo in fallback UI', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByTestId('logo-icon')).toBeInTheDocument();
  });

  it('should show error details in dev mode', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    // import.meta.env.DEV is true in test environment
    expect(screen.getByText('Error details')).toBeInTheDocument();
    expect(screen.getByText(/Test error message/)).toBeInTheDocument();
  });

  it('should call window.location.reload when reload button is clicked', () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    fireEvent.click(screen.getByText('Reload page'));
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it('should not render children after an error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.queryByText('Content rendered successfully')).not.toBeInTheDocument();
  });
});
