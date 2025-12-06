import React, { ReactNode } from 'react';

interface SectionProps {
  id: string;
  className?: string;
  children: ReactNode;
  darker?: boolean;
}

const Section: React.FC<SectionProps> = ({ id, className = "", children, darker = false }) => {
  return (
    <section 
      id={id} 
      className={`py-20 md:py-32 px-6 md:px-12 lg:px-24 transition-colors duration-500 ${darker ? 'bg-slate-900/50' : 'bg-transparent'} ${className}`}
    >
      <div className="max-w-6xl mx-auto">
        {children}
      </div>
    </section>
  );
};

export default Section;