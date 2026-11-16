// Escapes LIKE/ILIKE wildcards so user input is matched literally.
// PostgreSQL uses backslash as the default escape character.
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}
