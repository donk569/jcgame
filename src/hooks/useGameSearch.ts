import { useMemo } from 'react';
import { getGames } from '@/api';
import type { Game } from '@/api/types';

/** 全站共用的搜索逻辑：导航内联搜索、⌘K 面板、探索页都用它 */
export function filterGames(key: string, limit = 6): Game[] {
  const q = key.trim().toLowerCase();
  if (!q) return getGames().slice(0, limit);
  return getGames()
    .filter((g) =>
      [g.title, g.titleCn, g.engine, g.studio.name, ...g.tags, ...g.categories]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
    .slice(0, limit);
}

export function useGameSearch(query: string, limit = 6) {
  return useMemo(() => filterGames(query, limit), [query, limit]);
}
