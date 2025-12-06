import React from 'react';
import Section from './ui/Section';
import Card from './ui/Card';
import { THOUGHT_LEADERSHIP } from '../constants';
import { ExternalLink, BookOpen, Lightbulb } from 'lucide-react';

const ThoughtLeadership: React.FC = () => {
  return (
    <Section id="thoughts">
      <div className="grid md:grid-cols-2 gap-12">
        <div>
           <h2 className="text-3xl font-bold text-white mb-6">Thought Leadership</h2>
           <p className="text-slate-400 mb-8">
             I am passionate about the intersection of financial markets and Generative AI. 
             Through my writing and speaking, I explore how agentic workflows can redefine investment strategies.
           </p>
           
           <div className="space-y-6">
             {THOUGHT_LEADERSHIP.map((item, idx) => (
               <Card key={idx} hoverEffect={true} className="border-l-4 border-l-primary-500">
                 <div className="flex items-start justify-between mb-2">
                   <span className="text-xs font-bold text-primary-400 uppercase tracking-wider">{item.type}</span>
                   {item.link && item.link !== '#' && <ExternalLink className="w-4 h-4 text-slate-500" />}
                 </div>
                 <h3 className="text-xl font-bold text-slate-100 mb-2">{item.title}</h3>
                 <p className="text-slate-400 text-sm mb-4">
                   {item.description}
                 </p>
                 {item.link && item.link !== '#' && (
                   <a href={item.link} className="text-sm font-medium text-white hover:text-primary-400 underline decoration-slate-700 underline-offset-4">
                     Read Article
                   </a>
                 )}
               </Card>
             ))}
           </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-900/20 to-slate-900 rounded-3xl p-8 border border-slate-800 flex flex-col justify-center items-center text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
           
           <BookOpen className="w-12 h-12 text-primary-400 mb-6" />
           <h3 className="text-2xl font-bold text-white mb-4">Quantum Investor Digest</h3>
           <p className="text-slate-300 mb-8">
             My personal blog dedicated to using generative AI for smarter investing. Join the conversation on leveraging AI for stock market analysis.
           </p>
           <a 
             href="#contact" 
             className="inline-block px-6 py-3 bg-slate-100 text-slate-900 hover:bg-white rounded-lg font-bold transition-colors"
           >
             Contact to Subscribe
           </a>
        </div>
      </div>
    </Section>
  );
};

export default ThoughtLeadership;