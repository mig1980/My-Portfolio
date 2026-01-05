/**
 * @fileoverview Main navigation component with responsive mobile menu.
 * @description Provides site navigation with scroll-aware styling changes.
 */

import React, { useState, useCallback, useEffect, useRef, memo } from 'react';
import { Menu, X } from 'lucide-react';
import { useScrollPosition } from '../hooks/useScrollPosition';

/** Navigation menu items configuration */
const navItems = [
  { label: 'About', href: '#about' },
  { label: 'Expertise', href: '#expertise' },
  { label: 'Experience', href: '#experience' },
  { label: 'Projects', href: '#thoughts' },
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
  // 50px threshold: trigger compact header after minimal scroll
  const isScrolled = useScrollPosition({ threshold: 50 });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  const toggleMobileMenu = useCallback((): void => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMobileMenu = useCallback((): void => {
    setIsMobileMenuOpen(false);
  }, []);

  // Escape key handler to close mobile menu
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        closeMobileMenu();
        toggleButtonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen, closeMobileMenu]);

  // Focus trap for mobile menu
  useEffect(() => {
    if (!isMobileMenuOpen || !menuRef.current) return;

    const menu = menuRef.current;
    const focusableElements = menu.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    // Focus first menu item when opening
    firstElement?.focus();

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isMobileMenuOpen]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'py-3 bg-slate-950/80 backdrop-blur-md border-b border-slate-800'
          : 'py-4 bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <a
          href="#"
          aria-label="Go to homepage"
          className="p-1 -m-1 hover:opacity-80 transition-opacity focus-ring rounded-lg"
        >
          <img
            src="/Logo.webp"
            alt="Michael Gavrilov"
            className={`w-auto transition-all duration-300 ${isScrolled ? 'h-10' : 'h-12'}`}
          />
        </a>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-8">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-slate-300 hover:text-white hover:underline decoration-primary-500 decoration-2 underline-offset-8 transition-all focus-ring rounded-sm"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Mobile Toggle */}
        <button
          ref={toggleButtonRef}
          className="md:hidden text-slate-300 hover:text-white focus-ring rounded-md p-1"
          onClick={toggleMobileMenu}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-nav-menu"
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Nav Menu */}
      {isMobileMenuOpen && (
        <div
          ref={menuRef}
          id="mobile-nav-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className="md:hidden absolute top-full left-0 right-0 bg-slate-900 border-b border-slate-800 p-6 flex flex-col gap-4 shadow-2xl animate-fade-in-up"
        >
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-lg font-medium text-slate-300 hover:text-primary-400 focus-ring-inset rounded-md px-2 py-1 -mx-2"
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
