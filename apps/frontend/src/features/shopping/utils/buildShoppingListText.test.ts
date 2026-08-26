import { describe, it, expect } from 'vitest';
import type { ShoppingItem } from '@/api/types';
import { buildShoppingListText } from './buildShoppingListText';

const makeItem = (overrides: Partial<ShoppingItem> = {}): ShoppingItem => ({
  id: 'item-1',
  eventId: 'event-1',
  name: 'Pan',
  createdBy: 'user-1',
  purchasedBy: null,
  purchasedAt: null,
  createdAt: '2026-08-26T10:00:00.000Z',
  updatedAt: '2026-08-26T10:00:00.000Z',
  ...overrides,
});

const build = (items: ShoppingItem[]) =>
  buildShoppingListText({
    items,
    eventTitle: 'Cumple de Marta',
    headerLabel: 'Lista de la compra',
    countLabel: '3 items pendientes',
  });

describe('buildShoppingListText', () => {
  it('renders the exact plain-text format', () => {
    const text = build([
      makeItem({ id: '1', name: '2 cajas de cerveza' }),
      makeItem({ id: '2', name: 'Pan' }),
      makeItem({ id: '3', name: 'Hielo' }),
    ]);

    expect(text).toBe(
      '*🛒 Lista de la compra — Cumple de Marta*\n' +
        '\n' +
        '• 2 cajas de cerveza\n' +
        '• Pan\n' +
        '• Hielo\n' +
        '\n' +
        '3 items pendientes',
    );
  });

  it('leaves the purchased items out', () => {
    const text = build([
      makeItem({ id: '1', name: 'Pan' }),
      makeItem({ id: '2', name: 'Hielo', purchasedAt: '2026-08-26T11:00:00.000Z', purchasedBy: 'user-2' }),
    ]);

    expect(text).toContain('• Pan');
    expect(text).not.toContain('Hielo');
  });

  it('keeps the order of the pending items', () => {
    const text = build([
      makeItem({ id: '1', name: 'Primero' }),
      makeItem({ id: '2', name: 'Segundo' }),
      makeItem({ id: '3', name: 'Tercero' }),
    ]);

    expect(text.indexOf('Primero')).toBeLessThan(text.indexOf('Segundo'));
    expect(text.indexOf('Segundo')).toBeLessThan(text.indexOf('Tercero'));
  });

  it('emits names verbatim, without escaping formatting characters or emoji', () => {
    const text = build([makeItem({ id: '1', name: '*Vino* 🍷 • tinto' })]);

    expect(text).toContain('• *Vino* 🍷 • tinto');
  });

  it('does not truncate a name of the maximum length', () => {
    const name = 'a'.repeat(120);

    expect(build([makeItem({ id: '1', name })])).toContain(name);
  });

  it('renders header and count with no bullets when everything is purchased', () => {
    const text = build([makeItem({ id: '1', name: 'Pan', purchasedAt: '2026-08-26T11:00:00.000Z' })]);

    expect(text).toBe('*🛒 Lista de la compra — Cumple de Marta*\n\n\n3 items pendientes');
    expect(text).not.toContain('•');
  });
});
