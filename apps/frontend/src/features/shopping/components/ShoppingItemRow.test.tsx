import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ShoppingItem } from '@/api/types';
import { ShoppingItemRow } from './ShoppingItemRow';

vi.mock('@/config/env', () => ({
  ENV: { API_URL: 'http://test.api' },
}));

vi.mock('react-i18next', async () => {
  const actual = await vi.importActual<typeof import('react-i18next')>('react-i18next');

  return {
    ...actual,
    // Interpolates so the per-item accessible names stay assertable.
    useTranslation: () => ({
      t: (key: string, options?: { name?: string }) => (options?.name ? `${key}:${options.name}` : key),
    }),
  };
});

const makeItem = (overrides: Partial<ShoppingItem> = {}): ShoppingItem => ({
  id: 'item-1',
  eventId: 'event-1',
  name: '2 cajas de cerveza',
  createdBy: 'user-1',
  purchasedBy: null,
  purchasedAt: null,
  createdAt: '2026-08-26T10:00:00.000Z',
  updatedAt: '2026-08-26T10:00:00.000Z',
  ...overrides,
});

const onToggle = vi.fn();
const onRename = vi.fn();
const onRequestDelete = vi.fn();

const renderRow = (item = makeItem()) =>
  render(<ShoppingItemRow item={item} onToggle={onToggle} onRename={onRename} onRequestDelete={onRequestDelete} />);

describe('ShoppingItemRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reflects the purchased state in the checkbox and strikes the name through', () => {
    const item = makeItem({ purchasedAt: '2026-08-26T11:00:00.000Z', purchasedBy: 'user-2' });
    renderRow(item);

    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(screen.getByRole('button', { name: item.name })).toHaveClass('line-through');
  });

  it('gives the checkbox the item name as its accessible name', () => {
    const item = makeItem();
    renderRow(item);

    expect(screen.getByRole('checkbox', { name: item.name })).toBeInTheDocument();
  });

  it('toggles the item when the checkbox is clicked', () => {
    const item = makeItem();
    renderRow(item);

    fireEvent.click(screen.getByRole('checkbox'));

    expect(onToggle).toHaveBeenCalledWith(item, true);
  });

  it('turns the name into an input carrying the current value', () => {
    const item = makeItem();
    renderRow(item);

    fireEvent.click(screen.getByRole('button', { name: item.name }));

    expect(screen.getByRole('textbox')).toHaveValue(item.name);
  });

  it('commits the trimmed value on Enter', () => {
    const item = makeItem();
    renderRow(item);

    fireEvent.click(screen.getByRole('button', { name: item.name }));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '  3 cajas de cerveza  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onRename).toHaveBeenCalledWith(item, '3 cajas de cerveza');
  });

  it('commits on blur', () => {
    const item = makeItem();
    renderRow(item);

    fireEvent.click(screen.getByRole('button', { name: item.name }));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Hielo' } });
    fireEvent.blur(input);

    expect(onRename).toHaveBeenCalledWith(item, 'Hielo');
  });

  // Escape moves the focus, which fires blur right after. Without the guard, the discarded value
  // would be saved by that blur.
  it('cancels on Escape and does not rename even though blur follows', () => {
    const item = makeItem();
    renderRow(item);

    fireEvent.click(screen.getByRole('button', { name: item.name }));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Descartado' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    fireEvent.blur(input);

    expect(onRename).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: item.name })).toBeInTheDocument();
  });

  it('does not rename when the value is unchanged', () => {
    const item = makeItem();
    renderRow(item);

    fireEvent.click(screen.getByRole('button', { name: item.name }));
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });

    expect(onRename).not.toHaveBeenCalled();
  });

  it('treats an emptied field as a cancel, never as a delete', () => {
    const item = makeItem();
    renderRow(item);

    fireEvent.click(screen.getByRole('button', { name: item.name }));
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onRename).not.toHaveBeenCalled();
    expect(onRequestDelete).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: item.name })).toBeInTheDocument();
  });

  it('names the delete button after the item it removes', () => {
    const item = makeItem();
    renderRow(item);

    const deleteButton = screen.getByRole('button', { name: `item.delete:${item.name}` });
    fireEvent.click(deleteButton);

    expect(onRequestDelete).toHaveBeenCalledWith(item);
  });

  it('caps the edit input at the backend maximum length', () => {
    const item = makeItem();
    renderRow(item);

    fireEvent.click(screen.getByRole('button', { name: item.name }));

    expect(screen.getByRole('textbox')).toHaveAttribute('maxlength', '120');
  });
});
