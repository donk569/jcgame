/**
 * 数据访问层：全站唯一的数据入口。
 *
 * 现在 DATA_SOURCE='mock'：所有查询从 src/api/mock.ts 取。
 * 接真后端时把 DATA_SOURCE 改成 'remote'，在下面的 remote 分支里填 fetch 即可，
 * 页面代码一行都不用改（它们只调用 useGames() 等 hook）。
 *
 * 注意：当前所有函数是同步的，因为 mock 数据在内存里。
 * 改成异步时，hook 层会负责 loading/错误态，页面仍然不用动。
 */
import {
  mockGames,
  mockCreators,
  mockCategories,
  mockEngines,
  mockRunModes,
  mockEngineBuildGuide,
  mockCurrentUser,
} from './mock';
import type {
  Game, Creator, Category, EngineOption, RunModeOption, EngineBuildGuide, CurrentUser,
} from './types';

/** 后端开关：接真后端时改这里（或用 VITE_DATA_SOURCE=remote 构建） */
export const DATA_SOURCE: 'mock' | 'remote' =
  import.meta.env.VITE_DATA_SOURCE === 'remote' ? 'remote' : 'mock';

/* ------------------------------------------------------------------ */
/* 查询函数                                                            */
/* ------------------------------------------------------------------ */

export function getGames(): Game[] {
  return mockGames;
}

export function getGame(slug: string): Game | undefined {
  return mockGames.find((g) => g.slug === slug);
}

export function getCreator(handle: string): Creator | undefined {
  return mockCreators.find((c) => c.handle === handle);
}

export function getCreators(): Creator[] {
  return mockCreators;
}

export function gamesByCreator(handle: string): Game[] {
  return mockGames.filter((g) => g.studio.handle === handle);
}

export function categoryCount(name: string): number {
  return mockGames.filter((g) => g.categories.includes(name)).length;
}

export function getAllTags(): string[] {
  return Array.from(new Set(mockGames.flatMap((g) => g.tags))).sort();
}

export function getCategories(): Category[] {
  return mockCategories;
}

export function getEngines(): EngineOption[] {
  return mockEngines;
}

export function getRunModes(): RunModeOption[] {
  return mockRunModes;
}

export function getEngineBuildGuide(): EngineBuildGuide {
  return mockEngineBuildGuide;
}

export function getCurrentUser(): CurrentUser {
  return mockCurrentUser;
}
