export function stringAvatar(name?: string, email?: string) {
  if (name) return name[0].toUpperCase();
  if (email) return email[0].toUpperCase();
  return '?';
}
