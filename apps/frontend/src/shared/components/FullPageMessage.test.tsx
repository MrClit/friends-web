import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MdSearchOff } from 'react-icons/md';
import { FullPageMessage } from './FullPageMessage';

function renderMessage(props: Partial<Parameters<typeof FullPageMessage>[0]> = {}) {
  return render(
    <MemoryRouter>
      <FullPageMessage
        icon={MdSearchOff}
        title="Page not found"
        message="Nothing here"
        primaryAction={{ label: 'Go home', to: '/' }}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe('FullPageMessage', () => {
  it('renders the title as the page heading and the message', () => {
    renderMessage();
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('hides the icon from assistive technology', () => {
    const { container } = renderMessage();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders a link action as a link to its route', () => {
    renderMessage();
    expect(screen.getByRole('link', { name: 'Go home' })).toHaveAttribute('href', '/');
  });

  it('renders a handler action as a button that calls it', () => {
    const onClick = vi.fn();
    renderMessage({ primaryAction: { label: 'Retry', onClick } });
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders only the primary action when there is no secondary one', () => {
    renderMessage();
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders the secondary action after the primary one', () => {
    renderMessage({
      primaryAction: { label: 'Retry', onClick: vi.fn() },
      secondaryAction: { label: 'Go home', to: '/' },
    });
    const retry = screen.getByRole('button', { name: 'Retry' });
    const home = screen.getByRole('link', { name: 'Go home' });
    expect(retry.compareDocumentPosition(home) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
