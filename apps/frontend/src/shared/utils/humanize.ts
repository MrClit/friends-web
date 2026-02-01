/**
 * Convert a snake_case or underscored key into a human readable label.
 * Example: "directions_car" -> "Directions Car"
 */
export function humanize(input: string): string {
  if (!input) return '';
  return input.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
