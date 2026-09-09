'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  fromPath?: string | null;
  defaultHref?: string;
  defaultLabel?: string;
}

export default function BackButton({
  fromPath,
  defaultHref = '/library',
  defaultLabel = 'Back to Library',
}: BackButtonProps) {
  const router = useRouter();

  const isCollection = fromPath?.startsWith('/collections');
  const isFavorites = fromPath?.startsWith('/favorites');
  const isHistory = fromPath?.startsWith('/history');
  const isSearch = fromPath?.startsWith('/search');

  let label = defaultLabel;
  if (isCollection) label = 'Back to Collection';
  else if (isFavorites) label = 'Back to Favorites';
  else if (isHistory) label = 'Back to History';
  else if (isSearch) label = 'Back to Search';
  else if (fromPath && fromPath !== defaultHref) label = 'Back';

  const targetHref = fromPath || defaultHref;

  const handleClick = (e: React.MouseEvent) => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      e.preventDefault();
      router.back();
    }
  };

  return (
    <Link
      href={targetHref}
      onClick={handleClick}
      className="p-2.5 rounded-xl bg-black/60 border border-white/10 text-white hover:bg-black/80 transition-colors flex items-center gap-2 text-xs font-semibold backdrop-blur-md"
    >
      <ArrowLeft className="w-4 h-4" /> {label}
    </Link>
  );
}
