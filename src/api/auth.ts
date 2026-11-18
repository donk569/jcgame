/**
 * 认证：优先用 Supabase Auth，没配置后端时回落到本地演示登录。
 *
 * 接 GitHub OAuth 需要在 Supabase Dashboard → Authentication → Providers 里
 * 启用 GitHub，并填 GitHub OAuth App 的 Client ID / Secret，
 * 再把回调地址填成：<你的域名>/auth/callback
 */
import { supabase, HAS_BACKEND } from './supabase';
import type { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  handle: string;
  name: string;
  email: string;
}

/** 从 email 派生一个 handle（@ 前面那段，去掉非法字符） */
export function handleFromEmail(email: string): string {
  const raw = email.split('@')[0] ?? 'player';
  const clean = raw.toLowerCase().replace(/[^a-z0-9_\-]/g, '');
  return clean || 'player';
}

export async function signInWithEmail(email: string, password: string): Promise<AuthUser> {
  if (!supabase) throw new Error('未配置后端');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return toAuthUser(data.user);
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthUser> {
  if (!supabase) throw new Error('未配置后端');
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('注册后需要到邮箱确认');
  return toAuthUser(data.user);
}

export async function signInWithGithub(): Promise<void> {
  if (!supabase) throw new Error('未配置后端');
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: `${window.location.origin}${window.location.pathname}` },
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function getSession(): Promise<AuthUser | null> {
  if (!supabase) return Promise.resolve(null);
  return supabase.auth.getSession().then(({ data }) => (data.session ? toAuthUser(data.session.user) : null));
}

export function onAuthChange(cb: (user: AuthUser | null) => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    cb(session ? toAuthUser(session.user) : null);
  });
  return () => data.subscription.unsubscribe();
}

function toAuthUser(u: User): AuthUser {
  const meta = (u.user_metadata ?? {}) as { handle?: string; name?: string };
  return {
    id: u.id,
    handle: meta.handle ?? handleFromEmail(u.email ?? ''),
    name: meta.name ?? meta.handle ?? (u.email ?? '玩家').split('@')[0],
    email: u.email ?? '',
  };
}

export { HAS_BACKEND };
