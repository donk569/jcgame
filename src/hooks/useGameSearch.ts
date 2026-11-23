import { useEffect, useMemo, useState } from 'react';
import { USE_REMOTE } from '@/api';
import { searchGames } from '@/api/backend';
import type { Game } from '@/api/types';
import { useGames } from './useData';

interface RemotePage {
  key: string;
  games: Game[] | null;
}

export function usePagedGameSearch(query: string, size = 6, page = 0, enabled = true) {
  const pool = useGames();
  const term = query.trim().slice(0, 120);
  const key = JSON.stringify([term, size, page]);
  const remote = USE_REMOTE && enabled && term.length > 0;
  const [remotePage, setRemotePage] = useState<RemotePage>();

  useEffect(() => {
    if (!remote) return;
    const abort = new AbortController();
    const timeout = window.setTimeout(() => {
      abort.abort();
      setRemotePage({ key, games: null });
    }, 5000);
    const timer = window.setTimeout(() => {
      searchGames(term, size + 1, page * size, abort.signal).then(
        (games) => {
          if (!abort.signal.aborted) setRemotePage({ key, games });
        },
        () => {
          if (!abort.signal.aborted) setRemotePage({ key, games: null });
        },
      ).finally(() => window.clearTimeout(timeout));
    }, 250);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(timeout);
      abort.abort();
    };
  }, [remote, term, page, size, key]);

  const waiting = remote && remotePage?.key !== key;
  const remoteGames = remote && !waiting ? remotePage?.games : null;
  const windowed = useMemo(() => {
    if (!enabled || waiting) return [];
    if (remoteGames) return remoteGames;
    const needle = term.toLowerCase();
    const candidates = needle
      ? pool.filter((game) =>
          [game.title, game.titleCn, game.engine, game.studio.name, ...game.tags, ...game.categories]
            .join(' ')
            .toLowerCase()
            .includes(needle),
        )
      : pool;
    const ordered = [...candidates].sort((left, right) => {
      const rank = (game: Game) => {
        if (!needle) return 2;
        const titles = [game.title, game.titleCn].map((title) => title.toLowerCase());
        if (titles.includes(needle)) return 0;
        return titles.some((title) => title.startsWith(needle)) ? 1 : 2;
      };
      return rank(left) - rank(right)
        || right.releasedAt.localeCompare(left.releasedAt)
        || left.slug.localeCompare(right.slug);
    });
    return ordered.slice(page * size, (page + 1) * size + 1);
  }, [enabled, waiting, remoteGames, term, pool, page, size]);

  return {
    games: windowed.slice(0, size),
    hasNext: windowed.length > size,
    isLoading: waiting,
  };
}

export function useGameSearch(query: string, limit = 6): Game[] {
  return usePagedGameSearch(query, limit).games;
}
