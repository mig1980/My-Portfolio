/**
 * @fileoverview Reusable Card component for content containers.
 * @description Provides a consistent card styling with optional hover effects.
 */

import { memo } from 'react';
import type { ReactNode } from 'react';

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
 * A reusable card component with glassmorphism styling.
 * Features a subtle border, backdrop blur, and optional hover effects.
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
        relative p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm
        ${hoverEffect ? 'hover:border-primary-500/50 hover:bg-slate-800/80 transition-all duration-300 group' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;
