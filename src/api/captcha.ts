/**
 * 滑块拼图人机验证 · 前端只调服务端 RPC，永远拿不到答案。
 * - captcha_new    服务端随机生成缺口，返回画好缺口的 SVG（不含答案数值）
 * - captcha_verify 服务端比对拖动结果，通过才签发一次性凭证 token
 * - captcha_consume 注册提交时服务端原子消费凭证（重复调用必失败）
 */
import { supabase } from './supabase';

/** 网络请求超时（毫秒）：防止服务端/网络卡住时前端永久停在等待态 */
const RPC_TIMEOUT = 12000;

/** 给 thenable（supabase rpc 返回的是 PostgREST builder）加超时；超时后抛可识别错误 */
function withTimeout<T>(thenable: PromiseLike<T>, ms = RPC_TIMEOUT): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('请求超时，请检查网络后重试')), ms);
    Promise.resolve(thenable).then(
      (v) => { window.clearTimeout(timer); resolve(v); },
      (e) => { window.clearTimeout(timer); reject(e); },
    );
  });
}

export interface CaptchaChallenge {
  challengeId: string;
  maskSvg: string;
  piece: number;
  expiresAt: string;
}

/** 每个浏览器标签页一个稳定 session id，用于把挑战和凭证绑定到当前会话 */
const SESSION_KEY = 'jcgame:captcha-session';
export function captchaSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
}

/** 同一 session 在飞行中的 captcha_new 去重：组件可能被 StrictMode/HMR 重复挂载，
 *  这里保证并发只发一个请求，避免限流表主键冲突(409)与挑战浪费。 */
const pendingBySession = new Map<string, Promise<CaptchaChallenge>>();

export function createChallenge(sessionId: string): Promise<CaptchaChallenge> {
  const inflight = pendingBySession.get(sessionId);
  if (inflight) return inflight;
  const p = doCreateChallenge(sessionId).finally(() => pendingBySession.delete(sessionId));
  pendingBySession.set(sessionId, p);
  return p;
}

async function doCreateChallenge(sessionId: string): Promise<CaptchaChallenge> {
  if (!supabase) throw new Error('未配置后端');
  const { data, error } = await withTimeout<{ data: unknown; error: { message: string } | null }>(
    supabase.rpc('captcha_new', { p_session: sessionId }),
  );
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.challenge_id) throw new Error('人机验证服务未就绪，请稍后重试');
  return {
    challengeId: row.challenge_id,
    maskSvg: row.mask_svg,
    piece: row.piece,
    expiresAt: row.expires_at,
  };
}

/** p_x = 拖动位移；p_elapsed_ms = 从按下到松手的耗时，服务端据此识别脚本瞬移 */
export async function verifyChallenge(
  challengeId: string,
  sessionId: string,
  email: string,
  x: number,
  elapsedMs: number,
): Promise<{ token: string; expiresAt: string }> {
  if (!supabase) throw new Error('未配置后端');
  const { data, error } = await withTimeout<{ data: unknown; error: { message: string } | null }>(
    supabase.rpc('captcha_verify', {
      p_challenge_id: challengeId,
      p_session: sessionId,
      p_email: email,
      p_x: Math.round(x),
      p_elapsed_ms: Math.round(elapsedMs),
    }),
  );
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.token) throw new Error('验证没通过，请再试一次');
  return { token: row.token, expiresAt: row.expires_at };
}

/** 注册提交时调用：服务端原子消费，返回 false = 凭证无效/已用/过期/邮箱不符 */
export async function consumeCaptchaToken(token: string, email: string): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await withTimeout<{ data: unknown; error: { message: string } | null }>(
    supabase.rpc('captcha_consume', { p_token: token, p_email: email }),
  );
  if (error) return false;
  return data === true;
}

/** 把服务端英文错误翻成人话 */
export function captchaError(err: unknown): string {
  const m = (err instanceof Error ? err.message : String(err ?? '')).toLowerCase();
  if (m.includes('too many')) return '操作太频繁了，稍等一分钟再试';
  if (m.includes('duplicate key') || m.includes('already exists')) return '验证请求冲突，请点刷新重试';
  if (m.includes('expired')) return '验证已过期，点刷新重试';
  if (m.includes('already used')) return '这次验证已用过，点刷新重新获取';
  if (m.includes('session mismatch')) return '验证会话不匹配，点刷新重试';
  if (m.includes('suspiciously fast') || m.includes('mismatch')) return '没对准缺口，再试一次';
  if (m.includes('too many attempts')) return '失败次数太多，点刷新重新获取';
  if (m.includes('function') && m.includes('does not exist')) return '人机验证服务尚未配置，请联系管理员';
  if (m.includes('not found')) return '验证已失效，点刷新重试';
  if (m.includes('invalid session') || m.includes('invalid email')) return '请先填写邮箱再验证';
  if (m.includes('请求超时') || m.includes('timeout')) return '验证超时，请检查网络后重试';
  if (m.includes('failed to fetch') || m.includes('network')) return '网络异常，请检查连接后重试';
  return err instanceof Error ? err.message : '人机验证失败，请重试';
}
