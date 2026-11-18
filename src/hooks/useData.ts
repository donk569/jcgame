/**
 * 全站数据 hooks。
 *
 * 页面只认这一层，不直接 import 数据文件。
 * 接真后端时：把 api/index.ts 的查询函数改成异步 + 在这里加 loading/错误态，
 * 页面代码不需要改动（这是 P0 拆分数据层的全部意义）。
 */
import { useMemo } from 'react';
import * as api from '@/api';

export function useGames() {
  return api.getGames();
}

export function useGame(slug: string | undefined) {
  return useMemo(
    () => (slug ? api.getGame(slug) : undefined),
    [slug],
  );
}

export function useCreator(handle: string | undefined) {
  return useMemo(
    () => (handle ? api.getCreator(handle) : undefined),
    [handle],
  );
}

export function useCreators() {
  return api.getCreators();
}

export function useGamesByCreator(handle: string | undefined) {
  return useMemo(
    () => (handle ? api.gamesByCreator(handle) : []),
    [handle],
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
  return useMemo(() => {
    const game = slug ? api.getGame(slug) : undefined;
    if (!game) return [];
    return api.getGames()
      .filter(
        (g) =>
          g.slug !== slug &&
          (g.engine === game.engine ||
            g.categories.some((c) => game.categories.includes(c))),
      )
      .slice(0, count);
  }, [slug, count]);
}
