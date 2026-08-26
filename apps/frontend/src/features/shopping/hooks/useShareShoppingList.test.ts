import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useShareShoppingList } from './useShareShoppingList';

const successMock = vi.fn();
const errorMock = vi.fn();

vi.mock('@/shared/hooks/useToast', () => ({
  useToast: () => ({ success: successMock, error: errorMock, info: vi.fn() }),
}));

const TEXT = '*🛒 Lista de la compra — Cumple de Marta*\n\n• Pan\n\n1 item pendiente';

/** Redefine a navigator member for one test, the way TransactionForm.test.tsx does. */
const stubNavigator = (key: 'share' | 'clipboard', value: unknown) => {
  Object.defineProperty(navigator, key, { value, configurable: true, writable: true });
};

const renderShare = () => renderHook(() => useShareShoppingList()).result.current;

describe('useShareShoppingList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    stubNavigator('share', undefined);
    stubNavigator('clipboard', undefined);
    vi.unstubAllGlobals();
  });

  it('uses the native share sheet when it exists', () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    const writeTextMock = vi.fn();
    stubNavigator('share', shareMock);
    stubNavigator('clipboard', { writeText: writeTextMock });

    renderShare().shareText(TEXT);

    expect(shareMock).toHaveBeenCalledTimes(1);
    expect(shareMock).toHaveBeenCalledWith({ text: TEXT });
    expect(writeTextMock).not.toHaveBeenCalled();
    expect(successMock).not.toHaveBeenCalled();
  });

  // iOS Safari only honours share() and writeText() inside the user gesture that triggered them, so
  // nothing may be awaited before the call. Asserting in the same tick is what pins that.
  it('calls share synchronously, within the same tick as the handler', () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    stubNavigator('share', shareMock);

    const { shareText } = renderShare();
    shareText(TEXT);

    expect(shareMock).toHaveBeenCalled();
  });

  it('stays completely silent when the user dismisses the share sheet', async () => {
    const shareMock = vi.fn().mockRejectedValue(new DOMException('Share canceled', 'AbortError'));
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    stubNavigator('share', shareMock);
    stubNavigator('clipboard', { writeText: writeTextMock });

    renderShare().shareText(TEXT);
    await vi.waitFor(() => expect(shareMock).toHaveBeenCalled());

    expect(writeTextMock).not.toHaveBeenCalled();
    expect(successMock).not.toHaveBeenCalled();
    expect(errorMock).not.toHaveBeenCalled();
  });

  it('falls back to the clipboard when share fails for any other reason', async () => {
    stubNavigator('share', vi.fn().mockRejectedValue(new DOMException('Denied', 'NotAllowedError')));
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    stubNavigator('clipboard', { writeText: writeTextMock });

    renderShare().shareText(TEXT);

    await vi.waitFor(() => expect(writeTextMock).toHaveBeenCalledWith(TEXT));
    await vi.waitFor(() =>
      expect(successMock).toHaveBeenCalledWith('share_copied', undefined, undefined, {
        ns: 'shopping',
      }),
    );
  });

  it('copies to the clipboard when there is no share support', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    stubNavigator('clipboard', { writeText: writeTextMock });

    renderShare().shareText(TEXT);

    expect(writeTextMock).toHaveBeenCalledWith(TEXT);
    await vi.waitFor(() => expect(successMock).toHaveBeenCalled());
  });

  it('falls back to execCommand when neither share nor the Clipboard API exist', () => {
    const execCommandMock = vi.fn().mockReturnValue(true);
    vi.stubGlobal('document', Object.assign(document, { execCommand: execCommandMock }));

    renderShare().shareText(TEXT);

    expect(execCommandMock).toHaveBeenCalledWith('copy');
    expect(successMock).toHaveBeenCalledWith('share_copied', undefined, undefined, { ns: 'shopping' });
    // The textarea the fallback creates must not survive the copy.
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('reports an error when every copy path fails', async () => {
    const writeTextMock = vi.fn().mockRejectedValue(new Error('denied'));
    stubNavigator('clipboard', { writeText: writeTextMock });
    vi.stubGlobal('document', Object.assign(document, { execCommand: vi.fn().mockReturnValue(false) }));

    renderShare().shareText(TEXT);

    await vi.waitFor(() => expect(errorMock).toHaveBeenCalledWith('share_error', undefined, { ns: 'shopping' }));
    expect(successMock).not.toHaveBeenCalled();
  });
});
