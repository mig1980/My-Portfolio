/**
 * @fileoverview Hero section component - the landing/above-the-fold content.
 * @description Displays the main headline, personal introduction, and CTA buttons.
 */

import React, { memo } from 'react';
import { ArrowRight } from 'lucide-react';
import { PERSONAL_INFO } from '../constants';
import { useScrollPosition } from '../hooks/useScrollPosition';

/**
 * Hero section component for the portfolio landing area.
 * Features:
 * - Animated gradient background elements
 * - Personal photo with overlay
 * - Call-to-action buttons
 * - Scroll indicator animation (auto-hides after scroll)
 *
 * @returns The hero section with intro content and visual elements
 */
const Hero: React.FC = memo(() => {
  const hasScrolled = useScrollPosition({ threshold: 100 });

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] md:w-[600px] md:h-[600px] lg:w-[800px] lg:h-[800px] bg-primary-900/20 rounded-full blur-[60px] md:blur-[100px] lg:blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[200px] h-[200px] md:w-[400px] md:h-[400px] lg:w-[600px] lg:h-[600px] bg-indigo-900/10 rounded-full blur-[50px] md:blur-[80px] lg:blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        <div className="order-2 md:order-1 space-y-8 animate-fade-in-up">
          <div className="inline-flex items-center px-3 py-1 rounded-full border border-primary-500/30 bg-primary-500/10 text-primary-300 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-primary-400 mr-2 animate-pulse"></span>
            Open to Strategic Conversations
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
            {PERSONAL_INFO.tagline} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-400">
              {PERSONAL_INFO.taglineHighlight}
            </span>
          </h1>

          <p className="text-xl text-slate-300 max-w-lg leading-relaxed">
            Strategic Account Director at Microsoft, leading AI transformation for Fortune 500
            accounts—turning executive vision into multi-year partnerships, measurable adoption, and
            governance-ready deployments.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4">
            <a
              href="#contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-semibold transition-all shadow-lg shadow-primary-900/20 focus-ring"
            >
              Start a Conversation
              <ArrowRight className="ml-2 w-5 h-5" />
            </a>
            <a
              href="#experience"
              className="inline-flex items-center justify-center px-8 py-4 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white rounded-lg font-semibold transition-all focus-ring"
            >
              View Experience
            </a>
          </div>
        </div>

        <div className="order-1 md:order-2 flex justify-center md:justify-end relative">
          {/* Professional Headshot */}
          <div className="relative w-72 h-72 md:w-96 md:h-96 rounded-2xl overflow-hidden border-2 border-slate-800 shadow-2xl bg-slate-900 group">
            <picture>
              <source srcSet="/michael-gavrilov-headshot.webp" type="image/webp" />
              <img
                src="/michael-gavrilov-headshot.jpg"
                alt="Michael Gavrilov - Strategic Account Director at Microsoft specializing in Enterprise AI"
                loading="eager"
                fetchPriority="high"
                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
              />
            </picture>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="text-white font-bold text-lg">{PERSONAL_INFO.name}</div>
              <div className="text-slate-400 text-sm">{PERSONAL_INFO.title}</div>
            </div>
          </div>

          {/* Decorative elements behind image */}
          <div className="absolute -z-10 top-10 right-10 w-full h-full border border-slate-800 rounded-2xl hidden md:block" />
        </div>
      </div>

      {/* Scroll Indicator - hides after scrolling */}
      {!hasScrolled && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500 animate-bounce motion-reduce:animate-none">
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <ArrowRight className="w-4 h-4 rotate-90" />
        </div>
      )}
    </section>
  );
});

Hero.displayName = 'Hero';

export default Hero;
