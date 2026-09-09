'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  size?: 'sm' | 'md';
  showCheckmark?: boolean;
}

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  className = '',
  label,
  icon,
  disabled = false,
  size = 'md',
  showCheckmark = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Auto-scroll selected item into view when popover opens
  useEffect(() => {
    if (isOpen && selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen]);

  // Close popover on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`}>
      {label && <label className="form-label mb-1">{label}</label>}

      {/* Main Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full border font-semibold flex items-center justify-between gap-2 transition-all duration-200 text-left bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)]/50 focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-dim)] ${
          size === 'sm'
            ? 'min-h-[34px] px-2.5 py-1 text-xs rounded-lg'
            : 'min-h-[42px] px-3.5 py-2 text-xs sm:text-sm rounded-xl'
        } ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${isOpen ? 'border-[var(--accent)] ring-2 ring-[var(--accent-dim)]' : ''}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
          {icon && <span className="text-[var(--accent)] flex-shrink-0">{icon}</span>}
          {selectedOption ? (
            <span className="flex items-center gap-2 truncate font-bold text-[var(--text-primary)]">
              {selectedOption.icon && <span className="flex-shrink-0">{selectedOption.icon}</span>}
              <span className="truncate">{selectedOption.label}</span>
            </span>
          ) : (
            <span className="text-[var(--text-muted)] truncate">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[var(--text-muted)] flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[var(--accent)]' : ''
          }`}
        />
      </button>

      {/* Popover Menu for both Mobile and Desktop (No popup modal on mobile) */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-slide-up p-1 space-y-0.5 max-h-60 overflow-y-auto">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                ref={isSelected ? selectedItemRef : null}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full font-semibold flex items-center justify-between gap-1.5 transition-colors text-left ${
                  size === 'sm'
                    ? 'px-2.5 py-1.5 rounded-lg text-xs'
                    : 'px-3 py-2.5 rounded-xl text-xs sm:text-sm'
                } ${
                  isSelected
                    ? 'bg-purple-500/20 text-[var(--accent)] font-bold'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
                  <div>
                    <div className="truncate">{opt.label}</div>
                    {opt.description && (
                      <div className="text-[10px] text-[var(--text-muted)] font-normal truncate">
                        {opt.description}
                      </div>
                    )}
                  </div>
                </div>
                {showCheckmark && isSelected && (
                  <Check className="w-4 h-4 text-[var(--accent)] flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CustomSelect;
