/**
 * @fileoverview DOM utility functions.
 * @description Shared DOM manipulation utilities used across components.
 */

import type React from 'react';

/**
 * Handle image load error by hiding the image and showing a fallback element.
 * Expects the fallback element to be the next sibling with a 'hidden' class.
 *
 * @param e - The React synthetic event from the img onError handler
 *
 * @example
 * ```tsx
 * <img src={url} onError={handleImageError} />
 * <div className="hidden">Fallback</div>
 * ```
 */
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>): void => {
  e.currentTarget.style.display = 'none';
  const fallback = e.currentTarget.nextElementSibling;
  if (fallback) {
    fallback.classList.remove('hidden');
  }
};
