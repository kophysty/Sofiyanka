
import React, { useState } from 'react';
import { CollapsibleSectionProps } from '../types';

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-200 rounded-lg">
      <details className="group" open={isOpen} onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}>
        <summary 
            className="flex justify-between items-center p-3 sm:p-4 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 rounded-t-lg transition-colors select-none" // Changed font-medium to font-semibold
            onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); }} // Handle click to toggle state for controlled behavior
        >
          {title}
          <svg className={`w-5 h-5 text-slate-500 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        {isOpen && (
            <div className="p-3 sm:p-4 border-t border-slate-200 bg-white rounded-b-lg">
             {children}
            </div>
        )}
      </details>
    </div>
  );
};

export default CollapsibleSection;
