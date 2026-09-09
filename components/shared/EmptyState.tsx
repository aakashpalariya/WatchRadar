import { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils/format';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 text-center min-h-[400px] rounded-xl bg-gradient-to-b from-[var(--bg-card)] to-[var(--bg-muted)] border border-[var(--border)]",
      className
    )}>
      {icon && (
        <div className="mb-6 p-4 rounded-full bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border)]">
          {icon}
        </div>
      )}
      
      <h3 className="font-texturina text-2xl font-bold text-[var(--text-primary)] mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-[var(--text-secondary)] max-w-md mb-8">
          {description}
        </p>
      )}
      
      {action && (
        <Link href={action.href} className="btn btn-primary">
          {action.label}
        </Link>
      )}
    </div>
  );
}
