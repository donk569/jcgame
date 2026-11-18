/**
 * 全站数据 hooks。
 *
 * 页面只认这一层，不直接 import 数据文件。
 * 接真后端时：把 api/index.ts 的查询函数改成异步 + 在这里加 loading/错误态，
 * 页面代码不需要改动（这是 P0 拆分数据层的全部意义）。
 */
import { useEffect, useMemo, useSyncExternalStore } from 'react';
import * as api from '@/api';
import { useAppStore } from '@/store/AppStore';
import {
  subscribeRemote,
  getRemoteSnapshot,
  refreshRemote,
  USE_REMOTE,
} from '@/api';

/**
 * 远端快照订阅。远端数据到达后自动触发重渲染。
 * 只在 remote 模式下才发请求。
 */
export function useRemoteData() {
  const snap = useSyncExternalStore(subscribeRemote, getRemoteSnapshot, getRemoteSnapshot);
  useEffect(() => {
    if (USE_REMOTE) void refreshRemote();
  }, []);
  return snap;
}

export function useGames() {
  const { published } = useAppStore();
  const snap = useRemoteData();
  return useMemo(
    () => [...published, ...snap.games],
    [published, snap.games],
  );
}

export function useGame(slug: string | undefined) {
  const games = useGames();
  return useMemo(
    () => (slug ? games.find((g) => g.slug === slug) : undefined),
    [slug, games],
  );
}

export function useCreator(handle: string | undefined) {
  return useMemo(
    () => (handle ? api.getCreator(handle) : undefined),
    [handle],
  );
}

export function useCreators() {
  const snap = useRemoteData();
  return snap.creators;
}

export function useGamesByCreator(handle: string | undefined) {
  const games = useGames();
  return useMemo(
    () => (handle ? games.filter((g) => g.studio.handle === handle) : []),
    [handle, games],
  );
}

export function useGameCategoryCount(name: string) {
  return useMemo(() => api.categoryCount(name), [name]);
}

export function useCategories() {
  return api.getCategories();
}

export function useEngines() {
  return api.getEngines();
}

export function useRunModes() {
  return api.getRunModes();
}

export function useEngineBuildGuide() {
  return api.getEngineBuildGuide();
}

export function useCurrentUser() {
  return api.getCurrentUser();
}

/** 探索页相关：派生数据都在 hook 里算，页面只拿结果 */
export function useRelatedGames(slug: string | undefined, count = 4) {
  const games = useGames();
  return useMemo(() => {
    const game = slug ? games.find((g) => g.slug === slug) : undefined;
    if (!game) return [];
    return games
      .filter(
        (g) =>
          g.slug !== slug &&
          (g.engine === game.engine ||
            g.categories.some((c) => game.categories.includes(c))),
      )
      .slice(0, count);
  }, [slug, count, games]);
}
