
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { Theme } from '../types';

interface ThemeToggleProps {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, toggleTheme }) => {
  return (
    <button
      onClick={toggleTheme}
      className={`relative w-14 h-8 rounded-full transition-all duration-300 focus:outline-none flex items-center px-1 ${
        theme === 'dark' ? 'bg-[#D4FF00]/20' : 'bg-slate-200'
      }`}
    >
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 transform ${
          theme === 'dark' ? 'translate-x-6 bg-[#D4FF00]' : 'translate-x-0 bg-white shadow-sm'
        }`}
      >
        {theme === 'dark' ? (
          <Moon size={14} className="text-[#0A0F1E]" />
        ) : (
          <Sun size={14} className="text-[#D4FF00]" />
        )}
      </div>
    </button>
  );
};
