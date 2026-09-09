import { getStatusLabel, getStatusColor } from '@/lib/utils/format';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const label = getStatusLabel(status);
  const colorClass = getStatusColor(status);
  
  const sizeClasses = size === 'sm' 
    ? 'text-[10px] px-2 py-0.5' 
    : 'text-xs px-2.5 py-1';

  return (
    <span className={`badge font-semibold rounded-md uppercase tracking-wider ${sizeClasses} ${colorClass}`}>
      {label}
    </span>
  );
}
