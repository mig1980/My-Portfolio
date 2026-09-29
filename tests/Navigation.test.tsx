/**
 * @fileoverview Unit tests for the Navigation header.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Navigation from '../components/Navigation';
import { trackEvent } from '../utils/analytics';
import { PERSONAL_INFO } from '../constants';

vi.mock('../utils/analytics', () => ({ trackEvent: vi.fn() }));

describe('Navigation', () => {
  beforeEach(() => {
    vi.mocked(trackEvent).mockClear();
  });

  it('links to the résumé in a new tab safely and tracks the download', () => {
    render(<Navigation />);
    const link = screen.getByRole('link', { name: 'Résumé' });

    expect(link).toHaveAttribute('href', PERSONAL_INFO.resumeUrl);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');

    fireEvent.click(link);
    expect(trackEvent).toHaveBeenCalledWith('resume_download', { location: 'nav' });
  });

  it('keeps the résumé link outside the mobile menu', () => {
    render(<Navigation />);

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));

    const menu = screen.getByRole('dialog', { name: 'Navigation menu' });
    expect(menu).not.toContainElement(screen.getByRole('link', { name: 'Résumé' }));
  });

  it('keeps the homepage logo square and prevents it from shrinking', () => {
    render(<Navigation />);

    const homepageLink = screen.getByRole('link', { name: 'Go to homepage' });
    const logo = screen.getByRole('img', { name: 'Michael Gavrilov' });

    expect(homepageLink).toHaveClass('shrink-0');
    expect(logo).toHaveClass('aspect-square', 'max-w-none', 'size-16');
  });
});
