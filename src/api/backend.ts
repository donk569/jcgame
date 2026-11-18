/**
 * 后端数据源：把 Supabase 的行（snake_case）映射成前端契约（camelCase）。
 *
 * 页面层永远只认 '@/api/types' 里的形状，这里的转换是唯一的边界。
 */
import { supabase, HAS_BACKEND } from './supabase';
import type { Game, Creator, Comment, Draft, DraftForm } from './types';

export interface DbGame {
  slug: string;
  title: string;
  title_cn: string;
  tagline: string;
  description: unknown;
  studio: unknown;
  engine: string;
  engine_version: string;
  categories: unknown;
  tags: unknown;
  run_mode: string;
  platforms: unknown;
  version: string;
  updated_at: string | null;
  released_at: string | null;
  plays: number;
  likes: number;
  price: string;
  cover: string;
  keyart: string | null;
  shots: unknown;
  web_build: unknown;
  download: unknown;
  changelog: unknown;
  featured: boolean;
  owner: string | null;
}

const arr = <T,>(v: unknown, fallback: T[] = []): T[] => (Array.isArray(v) ? (v as T[]) : fallback);

/**
 * 远端存的图片是相对路径（covers/xx.webp），前端要拼回 /art/。
 * 如果已经是完整 URL（上传后存的对象存储地址）就原样返回。
 */
const asset = (p: string | null | undefined): string => {
  if (!p) return '';
  if (/^(https?:)?\/\//.test(p) || p.startsWith('data:')) return p;
  const base = (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';
  return `${base}art/${p.replace(/^\//, '')}`;
};

export function rowToGame(r: DbGame): Game {
  const studio = (r.studio ?? {}) as { name?: string; handle?: string };
  return {
    slug: r.slug,
    title: r.title,
    titleCn: r.title_cn,
    tagline: r.tagline ?? '',
    description: arr<string>(r.description),
    studio: { name: studio.name ?? '', handle: studio.handle ?? '' },
    engine: r.engine ?? '',
    engineVersion: r.engine_version ?? '',
    categories: arr<string>(r.categories),
    tags: arr<string>(r.tags),
    runMode: (r.run_mode === 'download' ? 'download' : 'web') as Game['runMode'],
    platforms: arr<string>(r.platforms),
    version: r.version ?? '0.1.0',
    updatedAt: r.updated_at ?? '',
    releasedAt: r.released_at ?? '',
    plays: r.plays ?? 0,
    likes: r.likes ?? 0,
    price: (r.price === 'paid' ? 'paid' : 'free') as Game['price'],
    cover: asset(r.cover),
    keyart: r.keyart ? asset(r.keyart) : undefined,
    shots: arr<string>(r.shots).map(asset),
    webBuild: (r.web_build as Game['webBuild']) ?? undefined,
    download: (r.download as Game['download']) ?? undefined,
    changelog: arr<Game['changelog'] extends (infer T)[] | undefined ? T : never>(r.changelog),
    featured: r.featured ?? false,
  };
}

export interface DbCreator {
  handle: string;
  name: string;
  bio: string;
  followers: number;
  since: string | null;
  location: string | null;
  accent: string | null;
  links: unknown;
}

export function rowToCreator(r: DbCreator): Creator {
  return {
    handle: r.handle,
    name: r.name,
    bio: r.bio ?? '',
    followers: r.followers ?? 0,
    since: r.since ?? '',
    location: r.location ?? '',
    links: arr<{ label: string; url: string }>(r.links),
    accent: r.accent ?? '#f0603c',
  };
}

/* ------------------------------------------------------------------ */
/* 查询                                                                */
/* ------------------------------------------------------------------ */

export async function fetchGames(): Promise<Game[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('games').select('*').order('released_at', { ascending: false });
  if (error) throw error;
  return (data as DbGame[]).map(rowToGame);
}

export async function fetchCreators(): Promise<Creator[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('creators').select('*');
  if (error) throw error;
  return (data as DbCreator[]).map(rowToCreator);
}

/* ------------------------------------------------------------------ */
/* 草稿                                                                */
/* ------------------------------------------------------------------ */

export interface DbDraft {
  id: string;
  owner: string;
  title: string;
  payload: unknown;
  progress: number;
  updated_at: string;
}

export function rowToDraft(r: DbDraft): Draft {
  const payload = (r.payload ?? {}) as Partial<DraftForm>;
  return {
    id: r.id,
    progress: r.progress ?? 0,
    form: {
      title: payload.title ?? r.title ?? '',
      titleEn: payload.titleEn ?? '',
      tagline: payload.tagline ?? '',
      developer: payload.developer ?? '',
      cats: arr<string>(payload.cats),
      tags: arr<string>(payload.tags),
      coverName: payload.coverName ?? '',
      shotNames: arr<string>(payload.shotNames),
      runMode: (payload.runMode === 'download' ? 'download' : 'web') as 'web' | 'download',
      engine: payload.engine ?? '',
      engineOther: payload.engineOther ?? '',
      version: payload.version ?? '0.1.0',
      changelog: payload.changelog ?? '',
      savedAt: r.updated_at?.slice(0, 16).replace('T', ' ') ?? '',
    },
  };
}

export async function fetchDrafts(): Promise<Draft[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('drafts').select('*').order('updated_at', { ascending: false });
  if (error) throw error;
  return (data as DbDraft[]).map(rowToDraft);
}

export async function insertDraft(form: DraftForm, progress: number): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('drafts').insert({
    title: form.title,
    payload: form,
    progress,
  });
  if (error) throw error;
}

export async function deleteDraft(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('drafts').delete().eq('id', id);
  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/* 收藏 / 点赞 / 关注                                                 */
/* ------------------------------------------------------------------ */

export async function fetchUserGames(userId: string): Promise<{ saved: string[]; liked: string[] }> {
  if (!supabase) return { saved: [], liked: [] };
  const { data, error } = await supabase.from('user_games').select('*').eq('user_id', userId);
  if (error) throw error;
  const rows = data ?? [];
  return {
    saved: rows.filter((r) => r.saved).map((r) => r.slug),
    liked: rows.filter((r) => r.liked).map((r) => r.slug),
  };
}

export async function setUserGame(userId: string, slug: string, field: 'saved' | 'liked', on: boolean): Promise<void> {
  if (!supabase) return;
  const { data: existing } = await supabase
    .from('user_games')
    .select('*')
    .eq('user_id', userId)
    .eq('slug', slug)
    .maybeSingle();
  if (existing) {
    const { error } = await supabase
      .from('user_games')
      .update({ [field]: on })
      .eq('user_id', userId)
      .eq('slug', slug);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('user_games')
      .insert({ user_id: userId, slug, [field]: on });
    if (error) throw error;
  }
}

export async function fetchFollowing(userId: string): Promise<string[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from('follows').select('handle').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.handle as string);
}

export async function setFollowing(userId: string, handle: string, on: boolean): Promise<void> {
  if (!supabase) return;
  if (on) {
    const { error } = await supabase.from('follows').insert({ user_id: userId, handle });
    if (error) throw error;
  } else {
    const { error } = await supabase.from('follows').delete().eq('user_id', userId).eq('handle', handle);
    if (error) throw error;
  }
}

/* ------------------------------------------------------------------ */
/* 资料                                                                */
/* ------------------------------------------------------------------ */

export async function fetchProfile(userId: string): Promise<{ name: string; bio: string; site: string } | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { name: data.name, bio: data.bio ?? '', site: data.site ?? '' };
}

export async function saveProfile(
  userId: string,
  handle: string,
  profile: { name: string; bio: string; site: string },
): Promise<void> {
  if (!supabase) return;
  const { data: existing } = await supabase.from('profiles').select('id').eq('id', userId).maybeSingle();
  if (existing) {
    const { error } = await supabase.from('profiles').update(profile).eq('id', userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('profiles').insert({ id: userId, handle, ...profile });
    if (error) throw error;
  }
}

/* ------------------------------------------------------------------ */
/* 发布                                                                */
/* ------------------------------------------------------------------ */

export async function insertGame(game: Game, ownerId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('games').insert({
    slug: game.slug,
    title: game.title,
    title_cn: game.titleCn,
    tagline: game.tagline,
    description: game.description,
    studio: game.studio,
    engine: game.engine,
    engine_version: game.engineVersion,
    categories: game.categories,
    tags: game.tags,
    run_mode: game.runMode,
    platforms: game.platforms,
    version: game.version,
    updated_at: game.updatedAt,
    released_at: game.releasedAt,
    plays: game.plays,
    likes: game.likes,
    price: game.price,
    cover: game.cover,
    keyart: game.keyart ?? null,
    shots: game.shots ?? [],
    web_build: game.webBuild ?? null,
    download: game.download ?? null,
    changelog: game.changelog ?? [],
    featured: game.featured ?? false,
    owner: ownerId,
  });
  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/* 留言                                                                */
/* ------------------------------------------------------------------ */

export interface DbComment {
  id: string;
  game_slug: string | null;
  author: string | null;
  author_name: string;
  body: string;
  reply: string | null;
  created_at: string;
}

export function rowToComment(r: DbComment): Comment {
  return {
    id: r.id,
    name: r.author_name,
    text: r.body,
    time: r.created_at?.slice(0, 10) ?? '',
    target: r.game_slug ?? '',
    unread: !r.reply,
    reply: r.reply ?? undefined,
  };
}

export async function fetchComments(gameSlug?: string): Promise<Comment[]> {
  if (!supabase) return [];
  let q = supabase.from('comments').select('*').order('created_at', { ascending: false });
  if (gameSlug) q = q.eq('game_slug', gameSlug);
  const { data, error } = await q;
  if (error) throw error;
  return (data as DbComment[]).map(rowToComment);
}

export async function replyComment(id: string, reply: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('comments')
    .update({ reply, replied_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export { HAS_BACKEND };
