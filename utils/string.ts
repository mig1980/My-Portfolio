/**
 * @fileoverview String utility functions.
 * @description Shared string manipulation utilities used across components.
 */

/**
 * Get initials from a name string (e.g., "Systematica Group" → "SG")
 * @param name - The name to extract initials from
 * @returns Two-character uppercase initials
 */
export const getInitials = (name: string): string => {
  const words = name.split(' ').filter((word) => word.length > 0);
  if (words.length >= 2) {
    const first = words[0]?.[0] ?? '';
    const second = words[1]?.[0] ?? '';
    return (first + second).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};
