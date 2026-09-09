'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import { CustomSelect, SelectOption } from './CustomSelect';

interface DatePickerProps {
  value?: string; // YYYY-MM-DD format
  onChange: (dateStr: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_OPTIONS: SelectOption[] = MONTH_NAMES.map((mName, idx) => ({
  value: String(idx),
  label: mName,
}));

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS: SelectOption[] = Array.from(
  { length: CURRENT_YEAR - 1920 + 6 },
  (_, i) => CURRENT_YEAR + 4 - i
).map((y) => ({
  value: String(y),
  label: String(y),
}));

export function DatePicker({
  value = '',
  onChange,
  label,
  placeholder = 'Select date...',
  className = '',
  disabled = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial selected date or current date for view
  const initialDateObj = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState<number>(
    isNaN(initialDateObj.getFullYear()) ? new Date().getFullYear() : initialDateObj.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState<number>(
    isNaN(initialDateObj.getMonth()) ? new Date().getMonth() : initialDateObj.getMonth()
  );

  // Keep view aligned when value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  // Close calendar popover on click outside or escape key
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

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (dayNum: number) => {
    const monthStr = String(viewMonth + 1).padStart(2, '0');
    const dayStr = String(dayNum).padStart(2, '0');
    const isoStr = `${viewYear}-${monthStr}-${dayStr}`;
    onChange(isoStr);
    setIsOpen(false);
  };

  const handleSetToday = () => {
    const today = new Date();
    const yearStr = today.getFullYear();
    const monthStr = String(today.getMonth() + 1).padStart(2, '0');
    const dayStr = String(today.getDate()).padStart(2, '0');
    const todayIso = `${yearStr}-${monthStr}-${dayStr}`;
    setViewYear(yearStr);
    setViewMonth(today.getMonth());
    onChange(todayIso);
    setIsOpen(false);
  };

  const handleSetYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yearStr = yesterday.getFullYear();
    const monthStr = String(yesterday.getMonth() + 1).padStart(2, '0');
    const dayStr = String(yesterday.getDate()).padStart(2, '0');
    const yestIso = `${yearStr}-${monthStr}-${dayStr}`;
    setViewYear(yearStr);
    setViewMonth(yesterday.getMonth());
    onChange(yestIso);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const formatDateDisplay = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const parts = isoStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const dateObj = new Date(y, m, d);
        if (!isNaN(dateObj.getTime())) {
          return dateObj.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
        }
      }
    } catch {
      return isoStr;
    }
    return isoStr;
  };

  // Calendar math
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const todayObj = new Date();
  const isTodayMonth = todayObj.getFullYear() === viewYear && todayObj.getMonth() === viewMonth;
  const todayDateNum = todayObj.getDate();

  const selectedDateParts = value ? value.split('-') : [];
  const selectedYear = selectedDateParts.length === 3 ? parseInt(selectedDateParts[0], 10) : null;
  const selectedMonth = selectedDateParts.length === 3 ? parseInt(selectedDateParts[1], 10) - 1 : null;
  const selectedDayNum = selectedDateParts.length === 3 ? parseInt(selectedDateParts[2], 10) : null;

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`}>
      {label && <label className="form-label mb-1">{label}</label>}

      {/* Custom Trigger Control Box */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`input flex items-center justify-between gap-2 transition-all duration-200 text-left ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${isOpen ? 'border-[var(--accent)] ring-2 ring-[var(--accent-dim)]' : ''}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1 truncate">
          <CalendarIcon className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
          {value ? (
            <span className="text-sm font-normal text-[var(--text-primary)] truncate">
              {formatDateDisplay(value)}
            </span>
          ) : (
            <span className="text-sm font-normal text-[var(--text-muted)] truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {value && (
            <span
              onClick={handleClear}
              className="p-1 rounded-md text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Clear date"
            >
              <X className="w-4 h-4" />
            </span>
          )}
        </div>
      </button>

      {/* Custom Interactive Calendar Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-slide-up p-4 space-y-3 min-w-[280px]">
          {/* Calendar Header: Month + Year Dropdowns & Step Navigation */}
          <div className="flex items-center justify-between gap-1 pb-2 border-b border-[var(--border)]">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] border border-[var(--border)] transition-colors flex-shrink-0"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 flex-1 justify-center min-w-0">
              {/* Month CustomSelect */}
              <div className="w-[115px]">
                <CustomSelect
                  options={MONTH_OPTIONS}
                  value={String(viewMonth)}
                  onChange={(val) => setViewMonth(parseInt(val, 10))}
                  size="sm"
                />
              </div>

              {/* Year CustomSelect */}
              <div className="w-[85px]">
                <CustomSelect
                  options={YEAR_OPTIONS}
                  value={String(viewYear)}
                  onChange={(val) => setViewYear(parseInt(val, 10))}
                  size="sm"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] border border-[var(--border)] transition-colors flex-shrink-0"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Labels Header */}
          <div className="grid grid-cols-7 text-center text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
            {WEEKDAYS.map((wd) => (
              <div key={wd} className="py-1">
                {wd}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {/* Empty offset padding cells before 1st of month */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-8" />
            ))}

            {/* Days of month */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((dayNum) => {
              const isSelected =
                selectedYear === viewYear &&
                selectedMonth === viewMonth &&
                selectedDayNum === dayNum;
              const isToday = isTodayMonth && todayDateNum === dayNum;

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`h-8 w-8 mx-auto rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/30 scale-105'
                      : isToday
                      ? 'bg-[var(--accent-dim)] text-[var(--accent)] border border-[var(--accent)]/50'
                      : 'text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--accent)]'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Quick Action Footer Bar */}
          <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-1 text-xs">
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={handleSetToday}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-500/15 text-[var(--accent)] border border-purple-500/30 hover:bg-purple-500/25 transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-purple-400" /> Today
              </button>
              <button
                type="button"
                onClick={handleSetYesterday}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                Yesterday
              </button>
            </div>

            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="text-[11px] font-semibold text-[var(--text-muted)] hover:text-red-400 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DatePicker;
