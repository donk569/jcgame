import { rowToGame, type DbGame } from '@/api/backend';
import { supabase } from '@/api/supabase';
import type { Game } from '@/api/types';

export type ManagedState = 'pending' | 'approved' | 'rejected' | 'hidden';

/**
 * rowToGame 会把库里的相对路径（covers/x.webp）拼成 /art/...，
 * 编辑回写前要还原成相对路径，避免 /art/art/ 重复前缀。
 * 完整 URL / data: 原样保留。
 */
export function toStoredAsset(value: string | undefined): string | null {
  if (!value) return null;
  if (/^(https?:)?\/\//.test(value) || value.startsWith('data:')) return value;
  const base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
  const prefix = `${base}/art/`;
  return value.startsWith(prefix) ? value.slice(prefix.length) : value.replace(/^\/art\//, '');
}

/** 作者读取自己全部状态的作品（含待审核/驳回/已下架）。 */
export async function fetchMyGames(signal?: AbortSignal): Promise<Game[]> {
  if (!supabase) return [];
  const query = supabase.rpc('my_game_works');
  if (signal) query.abortSignal(signal);
  const { data, error } = await query;
  if (error) throw error;
  return ((data as DbGame[] | null) ?? []).map(rowToGame);
}

/** 作者改作品资料。patch 用数据库的 snake_case 字段名。 */
export async function updateMyGame(slug: string, patch: Record<string, unknown>): Promise<void> {
  if (!supabase) throw new Error('当前环境无法修改作品');
  const { error } = await supabase.rpc('update_my_game', { p_slug: slug, p_patch: patch });
  if (error) throw error;
}

/** 下架（approved → hidden）或重新提交（rejected/hidden → pending）。 */
export async function setMyGameState(slug: string, state: 'hidden' | 'pending'): Promise<void> {
  if (!supabase) throw new Error('当前环境无法修改作品状态');
  const { error } = await supabase.rpc('set_my_game_state', { p_slug: slug, p_state: state });
  if (error) throw error;
}
