/**
 * @fileoverview Root application component for the AboutMe portfolio.
 * @description Composes all page sections into a single-page application.
 * @author Michael Gavrilov
 * @version 1.0.0
 */

import React from 'react';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import About from './components/About';
import Expertise from './components/Expertise';
import Experience from './components/Experience';
import ThoughtLeadership from './components/ThoughtLeadership';
import Education from './components/Education';
import Contact from './components/Contact';
import BackToTop from './components/BackToTop';
import Privacy from './components/Privacy';
import Terms from './components/Terms';

/**
 * Root application component.
 * Renders the complete portfolio as a single-page application with
 * navigation, hero section, and multiple content sections.
 *
 * @returns The complete portfolio application
 */
const App: React.FC = () => {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const normalizedPathname =
    pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;

  if (normalizedPathname === '/privacy') {
    return (
      <main className="bg-slate-950 min-h-screen text-slate-200 selection:bg-primary-500/30">
        <Privacy />
      </main>
    );
  }

  if (normalizedPathname === '/terms') {
    return (
      <main className="bg-slate-950 min-h-screen text-slate-200 selection:bg-primary-500/30">
        <Terms />
      </main>
    );
  }

  return (
    <>
      {/* Skip to main content link for accessibility */}
      <a
        href="#about"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:font-semibold"
      >
        Skip to main content
      </a>
      <main className="bg-slate-950 min-h-screen text-slate-200 selection:bg-primary-500/30">
        <Navigation />
        <Hero />
        <About />
        <Expertise />
        <Experience />
        <ThoughtLeadership />
        <Education />
        <Contact />
      </main>
      <BackToTop />
    </>
  );
};

export default App;
