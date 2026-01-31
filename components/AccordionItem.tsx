import React, { useRef, useEffect, useState } from 'react';
import { WorkItem } from '../types';
import { Plus, Minus, ArrowUpRight } from 'lucide-react';

interface AccordionItemProps {
  item: WorkItem;
  isOpen: boolean;
  onClick: () => void;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({ item, isOpen, onClick }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<string>('0px');

  useEffect(() => {
    if (isOpen && contentRef.current) {
      setHeight(`${contentRef.current.scrollHeight}px`);
    } else {
      setHeight('0px');
    }
  }, [isOpen]);

  return (
    <div className="border-b border-stone-300 last:border-b-0">
      <button 
        onClick={onClick}
        className="w-full py-6 flex justify-between items-center text-left group hover:bg-stone-200/50 transition-colors duration-300 px-2"
      >
        <span className="font-serif text-xl md:text-2xl text-stone-900">{item.client}</span>
        <span className="text-stone-500 transition-transform duration-300">
          {isOpen ? <Minus size={20} /> : <Plus size={20} />}
        </span>
      </button>
      
      <div 
        style={{ height }} 
        className="overflow-hidden transition-all duration-500 ease-in-out"
      >
        <div ref={contentRef} className="pb-8 px-2 md:pl-4 grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Left spacer/services */}
          <div className="md:col-span-4 text-xs font-sans uppercase tracking-widest text-stone-500 leading-relaxed">
            {item.services.map((service, i) => (
              <div key={i}>{service}</div>
            ))}
          </div>
          
          {/* Right content */}
          <div className="md:col-span-8">
            <p className="font-serif text-lg text-stone-700 leading-relaxed mb-4">
              {item.description}
            </p>
            {item.website && (
              <a 
                href={`https://${item.website}`} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center text-sm font-bold uppercase tracking-wider border-b border-black pb-0.5 hover:text-stone-600 hover:border-stone-600 transition-colors"
              >
                Visit Site <ArrowUpRight size={14} className="ml-1" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};