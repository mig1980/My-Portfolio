/**
 * @fileoverview Unit tests for the Card component.
 * @description Tests rendering, styling, and hover effect functionality.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from '../components/ui/Card';

describe('Card', () => {
  it('renders children correctly', () => {
    render(<Card>Test Content</Card>);
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('applies hover effect by default', () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.firstChild).toHaveClass('hover:border-primary-500/50');
  });

  it('disables hover effect when hoverEffect is false', () => {
    const { container } = render(<Card hoverEffect={false}>Content</Card>);
    expect(container.firstChild).not.toHaveClass('hover:border-primary-500/50');
  });

  it('has correct displayName', () => {
    expect(Card.displayName).toBe('Card');
  });
});
