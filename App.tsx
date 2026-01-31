import React, { useState } from 'react';
import { Header } from './components/Header';
import { SectionLabel } from './components/SectionLabel';
import { AccordionItem } from './components/AccordionItem';
import { WORK_HISTORY, EMAIL, PORTFOLIO_OWNER } from './constants';
import { ArrowDown, Linkedin, Instagram } from 'lucide-react';

const App: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen w-full bg-[#EAEAE5] text-[#1c1c1c]">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 md:px-12 md:pt-48 md:pb-32 border-b border-stone-300/50">
        <div className="max-w-7xl mx-auto">
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-[1.1] tracking-tight max-w-5xl mb-12">
            Strategist, creative writer, <br className="hidden md:block" /> 
            <span className="italic font-light text-stone-500">and </span> 
            problem solver.
          </h1>
          
          <div className="flex justify-end">
             <a href="#about" className="group flex items-center gap-2 text-sm font-bold uppercase tracking-widest">
                Read More 
                <span className="bg-stone-900 text-[#EAEAE5] rounded-full p-2 group-hover:translate-y-1 transition-transform">
                  <ArrowDown size={16} />
                </span>
             </a>
          </div>
        </div>
      </section>

      {/* About / Services Split */}
      <section id="about" className="py-20 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-y-12 md:gap-8 mb-24">
          <div className="md:col-span-3 pt-2">
            <SectionLabel title="The Strategy" />
          </div>
          <div className="md:col-span-9 lg:col-span-8 font-serif text-xl md:text-2xl leading-relaxed text-stone-800">
            <p>
              I analyze markets, dissect audiences, and find the "white space" where brands can truly breathe. Whether it's a startup finding its footing or a legacy company needing a pivot, I build the foundational strategy that makes creative work actually work.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-y-12 md:gap-8">
          <div className="md:col-span-3 pt-2">
            <SectionLabel title="The Words" />
          </div>
          <div className="md:col-span-9 lg:col-span-8 font-serif text-xl md:text-2xl leading-relaxed text-stone-800">
            <p>
              Words are the bridge between a product and a person. I craft copy that doesn't just sound good—it feels right. From punchy headlines to long-form editorial pieces, I ensure every sentence serves a purpose and carries the brand's unique voice.
            </p>
          </div>
        </div>
      </section>

      {/* Quote & Image Section */}
      <section className="bg-[#DCDCD7] py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="font-serif text-4xl md:text-5xl leading-tight mb-8">
              "From technical SaaS documentation to lifestyle editorial, I translate complexity into clarity."
            </h2>
            <p className="font-sans text-sm font-bold uppercase tracking-widest text-stone-500">
              — Me, regarding my philosophy
            </p>
          </div>
          <div className="relative">
            {/* Abstract Shape Image Container */}
            <div className="aspect-[4/3] w-full overflow-hidden rounded-tr-[80px] rounded-bl-[80px] md:rounded-tr-[120px] md:rounded-bl-[120px]">
              <img 
                src="https://picsum.photos/800/600?grayscale" 
                alt="Portrait" 
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Work History (Accordion) */}
      <section id="work" className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <h2 className="font-serif text-4xl md:text-5xl mb-16">I've worked on...</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="hidden lg:block lg:col-span-3">
             <SectionLabel title="Experience" />
          </div>
          <div className="lg:col-span-9 border-t border-stone-300">
            {WORK_HISTORY.map((item, index) => (
              <AccordionItem 
                key={index}
                item={item}
                isOpen={openIndex === index}
                onClick={() => toggleAccordion(index)}
              />
            ))}
          </div>
        </div>
        
        <div className="mt-16 text-center lg:text-right">
           <button className="bg-stone-900 text-[#EAEAE5] px-8 py-4 rounded-none text-sm font-bold uppercase tracking-widest hover:bg-stone-700 transition-colors">
             Download Full Resume
           </button>
        </div>
      </section>

      {/* Footer / Contact */}
      <section id="contact" className="bg-stone-900 text-[#EAEAE5] py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
            <div className="font-serif text-3xl md:text-4xl">
              For visuals alongside these words, <br /> 
              <a href="#" className="underline decoration-1 underline-offset-4 hover:text-stone-300 transition-colors">view my portfolio deck.</a>
            </div>
          </div>

          <div className="border-t border-stone-700 pt-20 grid grid-cols-1 md:grid-cols-12 gap-12">
            <div className="md:col-span-4">
               <div className="flex items-center mb-4">
                <div className="w-8 h-px bg-stone-500 mr-3"></div>
                <span className="font-sans text-xs font-bold uppercase tracking-widest text-stone-400">
                  The Contact Stuff
                </span>
              </div>
              <p className="font-serif text-lg text-stone-300 mb-8">
                Available for freelance projects and consultation starting Q4 2023.
              </p>
            </div>
            
            <div className="md:col-span-8 flex flex-col items-start">
              <h2 className="font-serif text-5xl md:text-7xl lg:text-8xl mb-8 text-white">
                Get in touch.
              </h2>
              <a 
                href={`mailto:${EMAIL}`} 
                className="text-xl md:text-2xl font-light border-b border-stone-600 pb-1 hover:border-white transition-colors"
              >
                {EMAIL}
              </a>

              <div className="flex gap-6 mt-12">
                <a href="#" className="p-2 border border-stone-700 rounded-full hover:bg-stone-800 transition-colors">
                  <Linkedin size={20} />
                </a>
                <a href="#" className="p-2 border border-stone-700 rounded-full hover:bg-stone-800 transition-colors">
                  <Instagram size={20} />
                </a>
              </div>
            </div>
          </div>
          
          <div className="mt-24 pt-8 border-t border-stone-800 flex flex-col md:flex-row justify-between text-xs uppercase tracking-widest text-stone-500">
            <p>&copy; {new Date().getFullYear()} {PORTFOLIO_OWNER}</p>
            <div className="flex gap-8 mt-4 md:mt-0">
              <span>Berlin, Germany</span>
              <span>Made with Coffee</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default App;