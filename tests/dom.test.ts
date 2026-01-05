/**
 * @fileoverview Unit tests for DOM utility functions.
 * @author Michael Gavrilov
 */

import { describe, it, expect } from 'vitest';
import { handleImageError } from '../utils/dom';

describe('handleImageError', () => {
  it('hides the image element', () => {
    const img = document.createElement('img');
    img.style.display = 'block';

    const event = {
      currentTarget: img,
    } as React.SyntheticEvent<HTMLImageElement>;

    handleImageError(event);

    expect(img.style.display).toBe('none');
  });

  it('shows the fallback sibling element', () => {
    const container = document.createElement('div');
    const img = document.createElement('img');
    const fallback = document.createElement('div');
    fallback.classList.add('hidden');

    container.appendChild(img);
    container.appendChild(fallback);

    const event = {
      currentTarget: img,
    } as React.SyntheticEvent<HTMLImageElement>;

    handleImageError(event);

    expect(fallback.classList.contains('hidden')).toBe(false);
  });

  it('handles missing fallback sibling gracefully', () => {
    const img = document.createElement('img');

    const event = {
      currentTarget: img,
    } as React.SyntheticEvent<HTMLImageElement>;

    // Should not throw
    expect(() => handleImageError(event)).not.toThrow();
    expect(img.style.display).toBe('none');
  });

  it('does not affect other siblings', () => {
    const container = document.createElement('div');
    const img = document.createElement('img');
    const fallback = document.createElement('div');
    const otherSibling = document.createElement('span');

    fallback.classList.add('hidden');
    otherSibling.classList.add('hidden');

    container.appendChild(img);
    container.appendChild(fallback);
    container.appendChild(otherSibling);

    const event = {
      currentTarget: img,
    } as React.SyntheticEvent<HTMLImageElement>;

    handleImageError(event);

    // Only immediate sibling should be unhidden
    expect(fallback.classList.contains('hidden')).toBe(false);
    expect(otherSibling.classList.contains('hidden')).toBe(true);
  });
});
