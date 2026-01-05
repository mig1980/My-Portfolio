/**
 * @fileoverview Root application component for the AboutMe portfolio.
 * @description Composes all page sections into a single-page application.
 * @author Michael Gavrilov
 * @version 1.0.0
 */

import React from 'react';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import Stats from './components/Stats';
import About from './components/About';
import MyApproach from './components/MyApproach';
import Expertise from './components/Expertise';
import Timeline from './components/Timeline';
import ThoughtLeadership from './components/ThoughtLeadership';
import Education from './components/Education';
import Contact from './components/Contact';
import BackToTop from './components/BackToTop';
import ChatWidget from './components/ChatWidget';
import Legal from './components/Legal';
import NotFound from './components/NotFound';
import PageWrapper from './components/ui/PageWrapper';

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

  if (normalizedPathname === '/legal') {
    return (
      <PageWrapper>
        <Legal />
      </PageWrapper>
    );
  }

  // Show 404 for unknown routes (except hash routes on home page)
  if (normalizedPathname !== '/' && !normalizedPathname.startsWith('/#')) {
    return (
      <PageWrapper>
        <NotFound />
      </PageWrapper>
    );
  }

  return (
    <>
      {/* Skip to main content link for accessibility */}
      <a
        href="#hero"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:font-semibold"
      >
        Skip to main content
      </a>
      <PageWrapper>
        <Navigation />
        <Hero />
        <Stats />
        <About />
        <MyApproach />
        <Expertise />
        <Timeline />
        <Education />
        <ThoughtLeadership />
        <Contact />
      </PageWrapper>
      <BackToTop />
      <ChatWidget />
    </>
  );
};

export default App;
