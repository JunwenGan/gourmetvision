import React from 'react';
import { PhotoStyle } from '../types';

interface StyleSelectorProps {
  currentStyle: PhotoStyle;
  onStyleChange: (style: PhotoStyle) => void;
}

const StyleSelector: React.FC<StyleSelectorProps> = ({ currentStyle, onStyleChange }) => {
  const styles = [
    {
      id: PhotoStyle.RUSTIC,
      label: 'Rustic & Dark',
      description: 'Moody, wood textures, dramatic lighting.',
      color: 'bg-stone-800 text-stone-100 border-stone-600',
      activeColor: 'ring-2 ring-orange-400'
    },
    {
      id: PhotoStyle.BRIGHT,
      label: 'Bright & Modern',
      description: 'Airy, white marble, soft natural light.',
      color: 'bg-slate-50 text-slate-900 border-slate-200',
      activeColor: 'ring-2 ring-blue-400'
    },
    {
      id: PhotoStyle.SOCIAL,
      label: 'Social Media',
      description: 'Top-down, vibrant, trendy flat lay.',
      color: 'bg-pink-50 text-pink-900 border-pink-200',
      activeColor: 'ring-2 ring-pink-500'
    },
  ];

  return (
    <div className="w-full mb-8">
      <h3 className="text-sm uppercase tracking-wider text-gray-500 font-semibold mb-3">Select Aesthetic</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {styles.map((style) => (
          <button
            key={style.id}
            onClick={() => onStyleChange(style.id)}
            className={`
              relative p-4 rounded-xl border text-left transition-all duration-200 shadow-sm hover:shadow-md
              ${style.color}
              ${currentStyle === style.id ? style.activeColor : 'opacity-70 hover:opacity-100'}
            `}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-serif font-bold text-lg">{style.label}</span>
              {currentStyle === style.id && (
                <span className="bg-white/20 p-1 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </span>
              )}
            </div>
            <p className="text-xs opacity-80">{style.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StyleSelector;
