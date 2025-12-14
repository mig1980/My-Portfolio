/**
 * @fileoverview Main navigation component with responsive mobile menu.
 * @description Provides site navigation with scroll-aware styling changes.
 */

import { useState, useCallback, memo } from 'react';
import { Menu, X } from 'lucide-react';
import { useScrollPosition } from '../hooks/useScrollPosition';

/** Navigation menu items configuration */
const navItems = [
  { label: 'About', href: '#about' },
  { label: 'Expertise', href: '#expertise' },
  { label: 'Experience', href: '#experience' },
  { label: 'Thought Leadership', href: '#thoughts' },
  { label: 'Contact', href: '#contact' },
];

/**
 * Main navigation header component.
 * Features:
 * - Scroll-aware background transition (transparent to blurred)
 * - Responsive design with mobile hamburger menu
 * - Smooth animations and accessibility support
 *
 * @returns The navigation header element
 */
const Navigation: React.FC = memo(() => {
  const isScrolled = useScrollPosition({ threshold: 50 });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = useCallback((): void => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback((): void => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'py-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-800'
          : 'py-6 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <a href="#" className="hover:opacity-80 transition-opacity">
          <img src="/Logo.png" alt="Michael Gavrilov" className="h-14 w-auto" />
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-8">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-slate-300 hover:text-white hover:underline decoration-primary-500 decoration-2 underline-offset-8 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-sm"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-slate-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-md p-1"
          onClick={toggleMobileMenu}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Nav Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-slate-900 border-b border-slate-800 p-6 flex flex-col gap-4 shadow-2xl animate-fade-in-up">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-lg font-medium text-slate-300 hover:text-primary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-md px-2 py-1 -mx-2"
              onClick={closeMobileMenu}
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
});

Navigation.displayName = 'Navigation';

export default Navigation;
