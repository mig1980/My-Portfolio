/**
 * @fileoverview Unit tests for the Section component.
 * @description Tests rendering, ID attributes, and styling variants.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Section from '../components/ui/Section';

describe('Section', () => {
  it('renders children correctly', () => {
    render(<Section id="test">Test Content</Section>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('sets the id attribute', () => {
    render(<Section id="test-section">Content</Section>);
    expect(document.getElementById('test-section')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <Section id="test" className="custom-class">
        Content
      </Section>
    );
    const section = container.querySelector('section');
    expect(section).toHaveClass('custom-class');
  });

  it('applies darker background when darker prop is true', () => {
    const { container } = render(
      <Section id="test" darker>
        Content
      </Section>
    );
    const section = container.querySelector('section');
    expect(section).toHaveClass('bg-slate-900/50');
  });

  it('applies transparent background by default', () => {
    const { container } = render(<Section id="test">Content</Section>);
    const section = container.querySelector('section');
    expect(section).toHaveClass('bg-transparent');
  });

  it('has correct displayName', () => {
    expect(Section.displayName).toBe('Section');
  });
});
