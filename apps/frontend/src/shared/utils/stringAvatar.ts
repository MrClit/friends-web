export function stringAvatar(name?: string, email?: string) {
  if (name) {
    const trimmed = name.trim();
    if (trimmed.length === 0) return '?';
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      // Use first letter of first and last name
      const first = parts[0][0];
      const last = parts[parts.length - 1][0];
      return (first + last).toUpperCase();
    }
    return trimmed[0].toUpperCase();
  }
  if (email) return email[0].toUpperCase();
  return '?';
}
