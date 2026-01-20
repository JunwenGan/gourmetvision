import React, { useEffect, useRef } from 'react';
import { Dish } from '../types';

interface DishCardProps {
  dish: Dish;
  onGenerate: (dishId: string) => void;
  onRetry: (dishId: string) => void;
}

const DishCard: React.FC<DishCardProps> = ({ dish, onGenerate, onRetry }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // If we already have an image, are loading, or have failed (and thus have attempted), don't observe.
    if (dish.generatedImageUrl || dish.isLoadingImage || dish.hasAttemptedGeneration) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Trigger generation when visible
          onGenerate(dish.id);
          observer.disconnect();
        }
      },
      {
        root: null, // viewport
        rootMargin: '100px', // Preload 100px before it comes into view
        threshold: 0.1,
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [dish.id, dish.generatedImageUrl, dish.isLoadingImage, dish.hasAttemptedGeneration, onGenerate]);

  return (
    <div ref={cardRef} className="group bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1">
      {/* Image Area */}
      <div className="relative w-full aspect-[4/3] bg-gray-50 overflow-hidden">
        {dish.generatedImageUrl ? (
          <img 
            src={dish.generatedImageUrl} 
            alt={dish.englishTranslation} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            {dish.isLoadingImage ? (
              // Skeleton Loader
              <>
                 <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse" />
                 <div className="relative z-10 flex flex-col items-center opacity-50">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-gray-400 mb-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                     </svg>
                     <span className="text-xs font-medium text-gray-500">Preparing...</span>
                 </div>
              </>
            ) : !dish.hasAttemptedGeneration ? (
               // Waiting to scroll into view
               <div className="flex flex-col items-center opacity-40">
                  <span className="text-xs text-gray-400 font-medium tracking-wide uppercase">Scroll to view</span>
               </div>
            ) : (
              // Failed state
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10 mb-2 text-gray-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.008v.008h-.008V15.75z" />
                </svg>
                <span className="text-xs text-gray-400 font-medium">Image unavailable</span>
              </>
            )}
          </div>
        )}
        
        {dish.generatedImageUrl && (
            <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md text-white text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm">
                AI Generated
            </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <div className="mb-4">
          {dish.category && (
              <span className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-1 block">
                {dish.category}
              </span>
          )}
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="font-serif text-lg font-bold text-gray-900 leading-tight">
                {dish.englishTranslation}
            </h3>
            {dish.price && (
                <span className="shrink-0 bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-1 rounded-md border border-emerald-100">
                    {dish.price}
                </span>
            )}
          </div>
          
          {dish.originalName !== dish.englishTranslation && (
            <p className="text-sm text-stone-500 font-medium italic mb-2 opacity-90">
              "{dish.originalName}"
            </p>
          )}
          <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed mt-3">
            {dish.description}
          </p>
        </div>

        {/* Retry Button only if failed */}
        {!dish.generatedImageUrl && !dish.isLoadingImage && dish.hasAttemptedGeneration && (
          <div className="mt-auto pt-4 border-t border-gray-50">
            <button
              onClick={() => onRetry(dish.id)}
              className="w-full py-2 px-4 rounded-lg font-medium text-xs uppercase tracking-wide bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DishCard;
