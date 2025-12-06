import React from 'react';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import About from './components/About';
import Expertise from './components/Expertise';
import Experience from './components/Experience';
import ThoughtLeadership from './components/ThoughtLeadership';
import Education from './components/Education';
import Contact from './components/Contact';

const App: React.FC = () => {
  return (
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
  );
};

export default App;