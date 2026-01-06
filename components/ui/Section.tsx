/**
 * @fileoverview Reusable Section wrapper component.
 * @description Provides consistent spacing and layout for page sections.
 */

import React, { memo, type ReactNode } from 'react';
import { useInView } from '../../hooks/useInView';

/**
 * Props for the Section component.
 */
interface SectionProps {
  /** Unique identifier for navigation anchoring */
  id: string;
  /** Additional CSS classes to apply */
  className?: string;
  /** Content to render inside the section */
  children: ReactNode;
  /** Whether to apply a darker background variant */
  darker?: boolean;
  /** Whether to animate on scroll (default: true) */
  animate?: boolean;
}

/**
 * A reusable page section wrapper component.
 * Provides consistent vertical padding, horizontal margins, and
 * optional darker background for visual separation between sections.
 * Includes subtle fade-in animation when scrolling into view.
 *
 * @param props - Component props
 * @returns A styled section container with centered content
 *
 * @example
 * ```tsx
 * <Section id="about" darker>
 *   <h2>About Me</h2>
 *   <p>Section content...</p>
 * </Section>
 * ```
 */
const Section: React.FC<SectionProps> = memo(
  ({ id, className = '', children, darker = false, animate = true }) => {
    const [ref, isVisible] = useInView();

    return (
      <section
        ref={ref}
        id={id}
        className={`py-20 md:py-32 px-6 md:px-12 lg:px-24 transition-colors duration-500 
                   ${darker ? 'bg-slate-900/50' : 'bg-transparent'} 
                   ${animate ? 'transition-all duration-700 ease-out' : ''}
                   ${animate && !isVisible ? 'opacity-0 translate-y-8' : 'opacity-100 translate-y-0'}
                   ${className}`}
        style={{
          // CSS containment improves Safari layout performance by isolating reflows
          contain: 'content',
          // will-change hints GPU acceleration for animations (removed after animation completes)
          willChange: animate && !isVisible ? 'transform, opacity' : 'auto',
        }}
      >
        <div className="max-w-6xl mx-auto">{children}</div>
      </section>
    );
  }
);

Section.displayName = 'Section';

export default Section;
