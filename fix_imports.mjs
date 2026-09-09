import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}
const files = [...walk('app'), ...walk('components')];
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let newContent = content;
  
  newContent = newContent.replace(/import\s*\{?\s*MediaCard\s*\}?\s*from\s*'@\/components\/(ui|media)\/MediaCard';/g, "import MediaCard from '@/components/media/MediaCard';");
  newContent = newContent.replace(/import\s*\{?\s*StatsBar\s*\}?\s*from\s*'@\/components\/(ui|dashboard)\/StatsBar';/g, "import StatsBar from '@/components/dashboard/StatsBar';");
  newContent = newContent.replace(/import\s*\{?\s*SearchResultCard\s*\}?\s*from\s*'@\/components\/(ui|media)\/SearchResultCard';/g, "import SearchResultCard from '@/components/media/SearchResultCard';");
  newContent = newContent.replace(/import\s*\{?\s*EpisodeProgress\s*\}?\s*from\s*'@\/components\/(ui|series)\/EpisodeProgress';/g, "import EpisodeProgress from '@/components/series/EpisodeProgress';");
  newContent = newContent.replace(/import\s*\{?\s*RecommendationCard\s*\}?\s*from\s*'@\/components\/(ui|tonight)\/RecommendationCard';/g, "import RecommendationCard from '@/components/tonight/RecommendationCard';");
  newContent = newContent.replace(/import\s*\{?\s*ContinueWatching\s*\}?\s*from\s*'@\/components\/(ui|dashboard)\/ContinueWatching';/g, "import ContinueWatching from '@/components/dashboard/ContinueWatching';");
  newContent = newContent.replace(/import\s*\{?\s*FilterSheet\s*\}?\s*from\s*'@\/components\/(ui|library)\/FilterSheet';/g, "import FilterSheet from '@/components/library/FilterSheet';");
  newContent = newContent.replace(/import\s*\{?\s*AddToLibrarySheet\s*\}?\s*from\s*'@\/components\/(ui|library)\/AddToLibrarySheet';/g, "import AddToLibrarySheet from '@/components/ui/AddToLibrarySheet';");

  
  newContent = newContent.replace(/@\/components\/ui\/RatingBadge/g, "@/components/shared/RatingBadge");
  newContent = newContent.replace(/@\/components\/ui\/StatusBadge/g, "@/components/shared/StatusBadge");
  newContent = newContent.replace(/@\/components\/ui\/FavoriteButton/g, "@/components/shared/FavoriteButton");
  newContent = newContent.replace(/@\/components\/ui\/RatingInput/g, "@/components/shared/RatingInput");
  newContent = newContent.replace(/@\/components\/ui\/EmptyState/g, "@/components/shared/EmptyState");
  newContent = newContent.replace(/@\/components\/ui\/LoadingSkeleton/g, "@/components/shared/LoadingSkeleton");
  newContent = newContent.replace(/@\/components\/ui\/ConfirmDialog/g, "@/components/shared/ConfirmDialog");
  
  if (content !== newContent) {
    fs.writeFileSync(f, newContent, 'utf8');
    console.log('Fixed imports in ' + f);
  }
});
