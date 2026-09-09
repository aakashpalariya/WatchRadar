'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingInputProps {
  value: number | null;
  onChange: (rating: number) => void;
  readOnly?: boolean;
}

export default function RatingInput({ value, onChange, readOnly = false }: RatingInputProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const displayValue = hoverValue !== null ? hoverValue : value;

  const handleMouseEnter = (index: number) => {
    if (!readOnly) {
      setHoverValue(index);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoverValue(null);
    }
  };

  const handleClick = (index: number) => {
    if (!readOnly) {
      onChange(index);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div 
        className="flex items-center gap-1"
        onMouseLeave={handleMouseLeave}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((index) => {
          const isFilled = displayValue !== null && index <= displayValue;
          return (
            <button
              key={index}
              type="button"
              disabled={readOnly}
              className={`p-1 transition-transform ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-125'}`}
              onMouseEnter={() => handleMouseEnter(index)}
              onClick={() => handleClick(index)}
              aria-label={`Rate ${index} out of 10`}
            >
              <Star
                className={`w-6 h-6 transition-colors duration-200 ${
                  isFilled 
                    ? 'text-[var(--accent)] fill-[var(--accent)]' 
                    : 'text-[var(--text-muted)] fill-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>
      
      {displayValue !== null && (
        <span className="text-sm font-medium text-[var(--accent)] transition-opacity">
          {displayValue}/10
        </span>
      )}
      {displayValue === null && (
        <span className="text-sm text-[var(--text-muted)]">
          Rate this title
        </span>
      )}
    </div>
  );
}
