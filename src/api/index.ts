/**
 * 数据访问层：全站唯一的数据入口。
 *
 * 三种模式（按 VITE_DATA_SOURCE 决定）：
 *   mock   —— 全部读 src/api/mock.ts（离线可用，零配置）
 *   remote —— 读 Supabase，失败或未建表时自动回落到 mock
 *   auto   —— 有配置就用远程，没有就用 mock
 *
 * 关键设计：远程数据通过「快照 + 订阅」注入，
 * 页面拿到的永远是同步数据，useSyncExternalStore 负责在远端到达后刷新。
 * 所以接后端不需要改任何页面代码。
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
import { HAS_BACKEND } from './supabase';
import * as backend from './backend';

/** 数据源开关 */
export const DATA_SOURCE: 'mock' | 'remote' | 'auto' = (() => {
  const v = import.meta.env.VITE_DATA_SOURCE;
  return v === 'remote' || v === 'auto' ? v : 'mock';
})();

/** 远程是否启用（有配置且开关打开） */
export const USE_REMOTE = DATA_SOURCE !== 'mock' && HAS_BACKEND;

/* ------------------------------------------------------------------ */
/* 远端快照：订阅式注入                                                */
/* ------------------------------------------------------------------ */

export interface RemoteSnapshot {
  games: Game[];
  creators: Creator[];
  loaded: boolean;
  error: string | null;
}

let snapshot: RemoteSnapshot = {
  games: mockGames,
  creators: mockCreators,
  loaded: false,
  error: null,
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function subscribeRemote(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getRemoteSnapshot(): RemoteSnapshot {
  return snapshot;
}

/**
 * 拉一次远端数据。失败时保持 mock 快照，并把错误记在快照里（页面可显示提示）。
 * 只在远端模式下有意义。
 */
/** 远端请求超时（毫秒）。超时立刻回落 mock，不拖慢首屏。 */
const REMOTE_TIMEOUT = 4000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('远端请求超时')), ms)),
  ]);
}

export async function refreshRemote(): Promise<void> {
  if (!USE_REMOTE) return;
  try {
    const [games, creators] = await withTimeout(
      Promise.all([backend.fetchGames(), backend.fetchCreators()]),
      REMOTE_TIMEOUT,
    );
    snapshot = {
      // 数据库为空时回落 mock，避免站点空白
      games: games.length ? games : mockGames,
      creators: creators.length ? creators : mockCreators,
      loaded: true,
      error: null,
    };
  } catch (e) {
    // 表没建 / 网络不通时回落 mock，站点不至于空白
    snapshot = {
      games: mockGames,
      creators: mockCreators,
      loaded: true,
      error: e instanceof Error ? e.message : String(e),
    };
  }
  emit();
}

/* ------------------------------------------------------------------ */
/* 查询函数                                                            */
/* ------------------------------------------------------------------ */

export function getGames(): Game[] {
  return USE_REMOTE ? snapshot.games : mockGames;
}

export function getGame(slug: string): Game | undefined {
  return getGames().find((g) => g.slug === slug);
}

export function getCreator(handle: string): Creator | undefined {
  return getCreators().find((c) => c.handle === handle);
}

export function getCreators(): Creator[] {
  return USE_REMOTE ? snapshot.creators : mockCreators;
}

export function gamesByCreator(handle: string): Game[] {
  return getGames().filter((g) => g.studio.handle === handle);
}

export function categoryCount(name: string): number {
  return getGames().filter((g) => g.categories.includes(name)).length;
}

export function getAllTags(): string[] {
  return Array.from(new Set(getGames().flatMap((g) => g.tags))).sort();
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
