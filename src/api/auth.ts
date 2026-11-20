/**
 * 认证：优先用 Supabase Auth，没配置后端时回落到本地演示登录。
 *
 * 接 GitHub OAuth 需要在 Supabase Dashboard → Authentication → Providers 里
 * 启用 GitHub，并填 GitHub OAuth App 的 Client ID / Secret，
 * 再把回调地址（Redirect URLs）填成：<站点根>/auth/callback
 *
 * 邮箱验证码需要在 Dashboard → Authentication → Providers → Email 打开
 * Confirm email，并把确认邮件模板里的链接换成数字码 {{ .Token }}。
 */
import { supabase, HAS_BACKEND } from './supabase';
import type { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  handle: string;
  name: string;
  email: string;
}

export interface SignUpResult {
  user: AuthUser;
  /** true = 后台要求邮箱确认，前端要进入验证码步骤 */
  needsConfirmation: boolean;
}

/** 从 email 派生一个 handle（@ 前面那段，去掉非法字符） */
export function handleFromEmail(email: string): string {
  const raw = email.split('@')[0] ?? 'player';
  const clean = raw.toLowerCase().replace(/[^a-z0-9_\-]/g, '');
  return clean || 'player';
}

/** 密码强度前端规则：至少 8 位，且同时含字母和数字 */
export function passwordError(pw: string): string | null {
  if (pw.length < 8) return '密码至少 8 位';
  if (!/[a-zA-Z]/.test(pw) || !/\d/.test(pw)) return '密码要同时包含字母和数字';
  return null;
}

/** 注册前查该邮箱是否已有【已验证】账号（服务端 RPC，只返回布尔，不泄露任何用户信息） */
export async function emailHasVerifiedAccount(email: string): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc('email_has_verified_account', { p_email: email });
  if (error) return false; // 检查失败不阻断注册，交给后续流程
  return data === true;
}

/** 把 Supabase 的英文错误翻成人话，兜底显示原文 */
export function friendlyAuthError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials')) return '邮箱或密码不对，再试一次';
  if (m.includes('email not confirmed')) return '邮箱还没验证，请查收验证邮件或输入验证码';
  if (m.includes('user already registered')) return '这个邮箱已经注册过了，直接去登录吧';
  if (m.includes('password should be at least')) return '密码太短了，至少要 8 位';
  if (m.includes('unable to validate email')) return '邮箱格式不太对，检查一下';
  if (m.includes('rate limit') || m.includes('too many')) return '尝试太多次了，稍等几分钟再来';
  if (m.includes('expired')) return '验证码过期了，点「重新发送」再试';
  if (m.includes('invalid token') || m.includes('otp') || m.includes('verification')) return '验证码不对，检查后重新输入';
  if (m.includes('provider is not enabled') || m.includes('unsupported') || m.includes('404')) return 'GitHub 登录还没在后台启用，请联系管理员';
  return msg || '操作失败，请稍后重试';
}

export async function signInWithEmail(email: string, password: string): Promise<AuthUser> {
  if (!supabase) throw new Error('未配置后端');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('登录失败，请重试');
  return toAuthUser(data.user);
}

/**
 * 注册：只有滑块凭证经服务端校验通过，才会走到这里创建未激活用户。
 * 注意 Supabase Auth 的机制：signUp 会先建一条「未确认」用户记录并发出验证码，
 * 但该记录在 verifyOtp 之前没有任何 session、无法通过 RLS 读写业务数据，
 * 等同「未注册成功」——这与需求里「验证通过前不能真正注册」的安全目标一致。
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  captchaToken: string,
  handle?: string,
  name?: string,
): Promise<SignUpResult> {
  if (!supabase) throw new Error('未配置后端');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // captcha_token 写进元数据，由 auth.users 的 BEFORE INSERT Trigger
      // 在服务端原子消费校验——前端或 API 直接调用都无法绕过。
      data: {
        handle: handle || handleFromEmail(email),
        name: name || handle || handleFromEmail(email),
        captcha_token: captchaToken,
      },
    },
  });
  if (error) throw error;
  if (!data.user) throw new Error('注册失败，请重试');
  // data.session 为空 = 后台开了邮箱确认，需要引导用户输入验证码
  return { user: toAuthUser(data.user), needsConfirmation: !data.session };
}

/** 用邮箱收到的 6 位数字码完成注册确认 */
export async function verifyEmailCode(email: string, token: string): Promise<AuthUser> {
  if (!supabase) throw new Error('未配置后端');
  const { data, error } = await supabase.auth.verifyOtp({ email, token: token.trim(), type: 'signup' });
  if (error) throw error;
  if (!data.user) throw new Error('验证失败，请重新输入验证码');
  return toAuthUser(data.user);
}

/** 重新发送注册验证码 */
export async function resendConfirmation(email: string): Promise<void> {
  if (!supabase) throw new Error('未配置后端');
  const { error } = await supabase.auth.resend({ type: 'signup', email });
  if (error) throw error;
}

/** from = 登录成功后要回到的页面，会写进 OAuth 回调 URL */
export async function signInWithGithub(from = '/me'): Promise<void> {
  if (!supabase) throw new Error('未配置后端');
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const redirectTo = `${window.location.origin}${base}/auth/callback?from=${encodeURIComponent(from)}`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo },
  });
  if (error) throw error;
}

/** OAuth 回调页用：把 URL 里的 code 换成 session（PKCE 流程） */
export async function exchangeOAuthCode(code: string): Promise<void> {
  if (!supabase) throw new Error('未配置后端');
  const { error } = await supabase.auth.exchangeCodeForSession(code);
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
