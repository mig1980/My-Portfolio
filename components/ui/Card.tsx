/**
 * @fileoverview Reusable Card component for content containers.
 * @description Provides a consistent card styling with optional hover effects.
 */

import React, { memo, type ReactNode } from 'react';

/**
 * Props for the Card component.
 */
interface CardProps {
  /** Content to render inside the card */
  children: ReactNode;
  /** Additional CSS classes to apply */
  className?: string;
  /** Whether to apply hover animation effects */
  hoverEffect?: boolean;
}

/**
 * A reusable card component with a clean editorial style.
 * Features a subtle border on a white surface and optional hover effects.
 *
 * @param props - Component props
 * @returns A styled card container
 *
 * @example
 * ```tsx
 * <Card hoverEffect={true} className="my-4">
 *   <h3>Card Title</h3>
 *   <p>Card content goes here</p>
 * </Card>
 * ```
 */
const Card: React.FC<CardProps> = memo(({ children, className = '', hoverEffect = true }) => {
  return (
    <div
      className={`
        relative p-6 rounded-lg border border-stone-200 bg-white
        ${hoverEffect ? 'hover:border-stone-400 hover:shadow-md hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 transition-[border-color,box-shadow,transform] duration-300 group' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
