/**
 * Generates an RFC 4122 v4 UUID.
 *
 * Prefers the native `crypto.randomUUID()`, which browsers only expose in secure contexts (HTTPS,
 * `localhost`). When it is missing — e.g. the Vite dev server opened from a phone over plain HTTP on
 * the LAN — it builds the UUID from `crypto.getRandomValues()`, which is available everywhere.
 */
export function randomUUID(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
