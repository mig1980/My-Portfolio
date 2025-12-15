/**
 * @fileoverview Page wrapper component with consistent styling.
 * @description Provides the main page container with theme styling.
 */

import React, { memo, type ReactNode } from 'react';

/**
 * Props for the PageWrapper component.
 */
interface PageWrapperProps {
  /** Content to render inside the wrapper */
  children: ReactNode;
}

/**
 * Page wrapper component providing consistent main styling.
 * Used to wrap page content with theme background and text colors.
 *
 * @param props - Component props
 * @returns The wrapped page content
 */
const PageWrapper: React.FC<PageWrapperProps> = memo(({ children }) => (
  <main className="bg-slate-950 min-h-screen text-slate-200 selection:bg-primary-500/30">
    {children}
  </main>
));

PageWrapper.displayName = 'PageWrapper';

export default PageWrapper;
