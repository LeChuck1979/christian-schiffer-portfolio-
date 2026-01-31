import React from 'react';

interface SectionLabelProps {
  title: string;
}

export const SectionLabel: React.FC<SectionLabelProps> = ({ title }) => {
  return (
    <div className="flex items-center mb-4 md:mb-0">
      <div className="w-8 h-px bg-stone-400 mr-3"></div>
      <span className="font-sans text-xs font-bold uppercase tracking-widest text-stone-600">
        {title}
      </span>
    </div>
  );
};