import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FormErrorAlert } from './FormErrorAlert';

describe('FormErrorAlert', () => {
  it('should return null when message is null', () => {
    const { container } = render(<FormErrorAlert message={null} />);
    expect(container.innerHTML).toBe('');
  });

  it('should render the error message when provided', () => {
    render(<FormErrorAlert message="Validation failed" />);
    expect(screen.getByText('Validation failed')).toBeInTheDocument();
  });

  it('should have role="alert" for screen reader announcement', () => {
    render(<FormErrorAlert message="Some error" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should render with error styling', () => {
    render(<FormErrorAlert message="Error text" />);
    const alert = screen.getByText('Error text');
    expect(alert).toHaveClass('text-red-800');
  });

  it('should render different messages correctly', () => {
    const { rerender } = render(<FormErrorAlert message="First error" />);
    expect(screen.getByText('First error')).toBeInTheDocument();

    rerender(<FormErrorAlert message="Second error" />);
    expect(screen.getByText('Second error')).toBeInTheDocument();
    expect(screen.queryByText('First error')).not.toBeInTheDocument();
  });

  it('should hide when message changes to null', () => {
    const { container, rerender } = render(<FormErrorAlert message="Error" />);
    expect(screen.getByText('Error')).toBeInTheDocument();

    rerender(<FormErrorAlert message={null} />);
    expect(container.innerHTML).toBe('');
  });
});
