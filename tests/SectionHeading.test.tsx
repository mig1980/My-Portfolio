/**
 * @fileoverview Unit tests for the SectionHeading component.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SectionHeading from '../components/ui/SectionHeading';

describe('SectionHeading', () => {
  it('renders the eyebrow and an h2 title', () => {
    render(<SectionHeading number="01" label="About" title="About me" />);
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'About me' })).toBeInTheDocument();
  });

  it('renders the intro only when provided', () => {
    const { rerender } = render(<SectionHeading number="02" label="Approach" title="How I work" />);
    expect(screen.queryByText('Intro text')).not.toBeInTheDocument();

    rerender(<SectionHeading number="02" label="Approach" title="How I work" intro="Intro text" />);
    expect(screen.getByText('Intro text')).toBeInTheDocument();
  });

  it('uses light title text on dark backgrounds', () => {
    render(<SectionHeading number="07" label="Contact" title="Let's connect" onDark />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveClass('text-paper');
  });

  it('has correct displayName', () => {
    expect(SectionHeading.displayName).toBe('SectionHeading');
  });
});
