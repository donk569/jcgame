import { useMemo } from 'react';
import { getGames } from '@/api';
import type { Game } from '@/api/types';
import { useAppStore } from '@/store/AppStore';

/** 全站共用的游戏池：mock + 本人在本地发布的游戏 */
export function useGamesPool(): Game[] {
  const { published } = useAppStore();
  return useMemo(() => [...published, ...getGames()], [published]);
}

/** 全站共用的搜索逻辑：导航内联搜索、⌘K 面板、探索页都用它 */
export function useGameSearch(query: string, limit = 6): Game[] {
  const pool = useGamesPool();
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? pool.filter((g) =>
          [g.title, g.titleCn, g.engine, g.studio.name, ...g.tags, ...g.categories]
            .join(' ')
            .toLowerCase()
            .includes(q),
        )
      : pool;
    return list.slice(0, limit);
  }, [pool, query, limit]);
}
