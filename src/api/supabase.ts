/**
 * Supabase 客户端。
 *
 * 环境变量（.env.local）：
 *   VITE_SUPABASE_URL=https://<ref>.supabase.co
 *   VITE_SUPABASE_ANON_KEY=sb_publishable_...
 *
 * 注意：只在浏览器端用 publishable key，绝不要把 service_role key 放进前端。
 */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const SUPABASE_URL = url ?? '';
export const SUPABASE_KEY = key ?? '';

/** 是否配置了后端（没配就走纯本地模式） */
export const HAS_BACKEND = Boolean(url && key);

export const supabase = HAS_BACKEND
  ? createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // PKCE：OAuth 回调带 ?code=，由 /auth/callback 页用 exchangeCodeForSession 换取 session。
        // detectSessionInUrl 关掉，避免 SDK 自动处理与手动 exchange 冲突（否则回调参数对不上）。
        flowType: 'pkce',
        detectSessionInUrl: false,
      },
    })
  : null;
