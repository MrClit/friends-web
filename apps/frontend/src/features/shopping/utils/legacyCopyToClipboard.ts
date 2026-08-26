/**
 * Copy through a hidden textarea and document.execCommand.
 *
 * Reachable in practice, not dead code: navigator.clipboard is undefined on insecure origins, which
 * includes the http://localhost dev server. Synchronous by construction, so it can run inside the same
 * user gesture that iOS Safari requires.
 *
 * @param text - Text to place on the clipboard
 * @returns Whether the copy succeeded
 */
export function legacyCopyToClipboard(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  textarea.style.opacity = '0';

  document.body.appendChild(textarea);

  try {
    textarea.select();
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}
