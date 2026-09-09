'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/format';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'default';
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
  variant = 'default',
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (open && e.key === 'Escape') {
        onCancel();
      }
    };
    
    if (open) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onCancel]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in font-[var(--font-texturina)]">
      <div 
        className="absolute inset-0" 
        onClick={onCancel}
        aria-hidden="true"
      />
      
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
        className="relative bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slide-up z-10"
      >
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-lg hover:bg-[var(--bg-elevated)]"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 id="dialog-title" className="text-xl font-bold text-[var(--text-primary)] mb-2 pr-8">
          {title}
        </h2>
        
        <p id="dialog-description" className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
          {description}
        </p>
        
        <div className="flex justify-end gap-3 pt-2">
          <button 
            onClick={onCancel}
            className="btn btn-ghost text-xs font-semibold px-4 py-2"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className={cn("btn text-xs font-bold px-4 py-2", variant === 'danger' ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30' : 'btn-primary')}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
