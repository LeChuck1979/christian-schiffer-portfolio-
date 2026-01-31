import React from 'react';
import { PORTFOLIO_OWNER } from '../constants';

export const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 w-full px-6 py-6 md:px-12 md:py-8 flex justify-between items-center z-50 mix-blend-difference text-[#EAEAE5]">
      <div className="font-serif font-semibold text-lg tracking-wide">
        {PORTFOLIO_OWNER}
      </div>
      <nav className="hidden md:flex gap-8 text-sm font-medium uppercase tracking-widest">
        <a href="#work" className="hover:underline decoration-1 underline-offset-4">Selected Work</a>
        <a href="#about" className="hover:underline decoration-1 underline-offset-4">About</a>
        <a href="#contact" className="hover:underline decoration-1 underline-offset-4">Contact</a>
      </nav>
    </header>
  );
};