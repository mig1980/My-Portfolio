/**
 * @fileoverview Reusable Section wrapper component.
 * @description Provides consistent spacing and layout for page sections.
 */

import { memo } from 'react';
import type { ReactNode } from 'react';

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
}

/**
 * A reusable page section wrapper component.
 * Provides consistent vertical padding, horizontal margins, and
 * optional darker background for visual separation between sections.
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
  ({ id, className = '', children, darker = false }) => {
    return (
      <section
        id={id}
        className={`py-20 md:py-32 px-6 md:px-12 lg:px-24 transition-colors duration-500 ${darker ? 'bg-slate-900/50' : 'bg-transparent'} ${className}`}
      >
        <div className="max-w-6xl mx-auto">{children}</div>
      </section>
    );
  }
);

Section.displayName = 'Section';

export default Section;
