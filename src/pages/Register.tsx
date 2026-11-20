import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Eye, EyeSlash, Envelope, WarningCircle } from '@phosphor-icons/react';
import { motion, useReducedMotion } from 'framer-motion';
import { LogoMark } from '@/components/Logo';
import SliderCaptcha from '@/components/SliderCaptcha';
import { useAppStore } from '@/store/AppStore';
import { HAS_BACKEND, passwordError, friendlyAuthError, emailHasVerifiedAccount } from '@/api/auth';

// 邮箱格式校验：本地部分不含空格、不能连续点/首尾点；域名含点且顶级域至少 2 位字母。
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
const emailError = (v: string): string | null => {
  const e = v.trim();
  if (!e) return '请填写邮箱';
  if (e.includes('..') || e.startsWith('.') || e.split('@')[0]?.endsWith('.')) return '邮箱格式不对，检查 "." 的位置';
  if (!EMAIL_RE.test(e)) return '邮箱格式不对，例如 you@example.com';
  if (e.length > 254) return '邮箱地址太长了';
  return null;
};

/**
 * 注册页：完整纵向引导表单，与简洁登录页形成明显差异。
 * 安全关卡（全部在服务端）：滑块凭证一次性消费 → 创建未激活用户 → 邮箱验证码激活。
 */
export default function Register() {
  const store = useAppStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const reduce = useReducedMotion();
  const [step, setStep] = useState<'form' | 'code'>('form');

  const [handle, setHandle] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [code, setCode] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [captchaReset, setCaptchaReset] = useState(0); // 递增=强制滑块换新挑战

  const [busy, setBusy] = useState(false);
  const [emailExists, setEmailExists] = useState(false); // 邮箱已有验证账号
  const [err, setErr] = useState('');
  const [notice, setNotice] = useState('');
  const [countdown, setCountdown] = useState(0);

  const from = params.get('from') || '/me';
  const finish = () => navigate(from, { replace: true });

  useEffect(() => {
    if (countdown <= 0) return;
    const t = window.setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [countdown]);

  // 滑块凭证绑定邮箱；邮箱一改就作废，要求重新验证
  const onCaptchaVerified = (token: string) => { setCaptchaToken(token); setErr(''); };
  const onCaptchaReset = () => setCaptchaToken('');

  const validate = (): string | null => {
    if (!handle.trim()) return '请填写用户名';
    if (!/^[a-zA-Z0-9_\-]{2,24}$/.test(handle.trim())) return '用户名只能用字母、数字、下划线和横线，2–24 位';
    const eErr = emailError(email);
    if (eErr) return eErr;
    const pwErr = passwordError(password);
    if (pwErr) return pwErr;
    if (password !== confirm) return '两次输入的密码不一致';
    if (!captchaToken) return '请先完成人机验证';
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setNotice('');

    if (step === 'code') {
      if (code.trim().length !== 6) { setErr('请输入邮箱里的 6 位验证码'); return; }
      setBusy(true);
      try {
        await store.verifyEmail(email.trim(), code);
        finish();
      } catch (ex) {
        setErr(friendlyAuthError(ex));
      } finally {
        setBusy(false);
      }
      return;
    }

    const v = validate();
    if (v) { setErr(v); return; }

    // 注册前查邮箱：已有验证账号就直接提示去登录，不让用户干等一封不会来的验证码
    if (HAS_BACKEND) {
      setBusy(true);
      try {
        if (await emailHasVerifiedAccount(email.trim())) {
          setEmailExists(true);
          setErr('这个邮箱已经注册过了，请直接登录');
          return;
        }
      } catch { /* 检查异常不阻断注册 */ }
      finally { setBusy(false); }
    }

    setBusy(true);
    try {
      // 服务端先原子消费滑块凭证，通过后才创建用户并发出验证码
      const result = await store.signUp(email.trim(), password, captchaToken, handle.trim());
      if (result.needsConfirmation) {
        setStep('code');
        setNotice(`验证码已发到 ${result.email}，请查收邮件（含垃圾箱）`);
        setCountdown(60);
      } else {
        finish();
      }
    } catch (ex) {
      const msg = friendlyAuthError(ex);
      setErr(msg);
      // 凭证不可复用：清空并强制滑块换一张新挑战，避免"显示通过但提交说没验证"的死卡
      setCaptchaToken('');
      if (msg.includes('人机验证') || msg.includes('凭证') || msg.includes('验证')) {
        setCaptchaReset((n) => n + 1);
      }
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (countdown > 0 || busy) return;
    setErr('');
    setBusy(true);
    try {
      await store.resendCode(email.trim());
      setCountdown(60);
      setNotice('验证码已重新发送，请查收邮件');
    } catch (ex) {
      setErr(friendlyAuthError(ex));
    } finally {
      setBusy(false);
    }
  };

  const pwOk = password && !passwordError(password);
  const confirmOk = confirm && confirm === password;

  return (
    <div className="wrap flex min-h-[72vh] justify-center py-14">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, ease: [0.22, 0.68, 0, 1] }}
        className="w-full max-w-[440px]"
      >
        <div className="flex items-center justify-between">
          <LogoMark size={34} />
          <span className="mono text-[11px] tracking-[0.12em] text-muted-dim">
            {step === 'code' ? '02 / 02' : '01 / 02'}
          </span>
        </div>

        <p className="mono mt-6 text-[11px] uppercase tracking-[0.22em] text-muted">加入 JCGame</p>
        <h1 className="serif-title mt-2 text-[32px] leading-tight">
          {step === 'code' ? '验证你的邮箱' : '创建账号'}
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          {step === 'code'
            ? `输入发到 ${email} 的 6 位数字码，验证后即可进入工作室。`
            : '创建账号，发布你的作品，发现更多有趣的游戏。'}
        </p>

        {step === 'code' && (
          <button type="button" onClick={() => { setStep('form'); setErr(''); setNotice(''); setCode(''); }}
            className="link-underline mt-4 inline-flex items-center gap-1 text-[12.5px] text-muted hover:text-bone">
            <ArrowLeft size={13} /> 返回修改信息
          </button>
        )}

        <form onSubmit={submit} className="mt-8 space-y-5">
          {step === 'form' ? (
            <>
              {/* 账号信息 */}
              <section className="space-y-4">
                <p className="flex items-center gap-2 text-[12px] font-medium text-bone-dim">
                  <span className="mono text-[11px] text-brand">01</span> 账号信息
                </p>
                <div>
                  <label className="field-label" htmlFor="reg-handle">用户名</label>
                  <input id="reg-handle" className="input" value={handle}
                    onChange={(e) => setHandle(e.target.value)} placeholder="你的代号" autoComplete="username" />
                  <p className="mt-1 text-[11px] text-muted-dim">2–24 位，字母 / 数字 / 下划线 / 横线</p>
                </div>
                <div>
                  <label className="field-label" htmlFor="reg-email">邮箱</label>
                  <input id="reg-email" type="email" className="input" value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailExists(false); }} placeholder="you@example.com" autoComplete="email"
                    aria-invalid={email.length > 0 && emailError(email) !== null} />
                  {email.length > 0 && (
                    <p className="mt-1 flex items-center gap-1 text-[11px]"
                      style={{ color: emailError(email) ? 'var(--color-danger)' : 'var(--color-ok)' }}>
                      {emailError(email) ? <><WarningCircle size={11} /> {emailError(email)}</> : <><Check size={11} weight="bold" /> 邮箱格式正确</>}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="field-label" htmlFor="reg-pw">密码</label>
                    <div className="relative">
                      <input id="reg-pw" type={showPw ? 'text' : 'password'} className="input pr-11"
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="至少 8 位" autoComplete="new-password" />
                      <button type="button" onClick={() => setShowPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-bone"
                        aria-label={showPw ? '隐藏密码' : '显示密码'}>
                        {showPw ? <EyeSlash size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                    {password && (
                      <p className="mt-1 flex items-center gap-1 text-[11px]"
                        style={{ color: pwOk ? 'var(--color-ok)' : 'var(--color-muted)' }}>
                        {pwOk && <Check size={11} weight="bold" />}
                        {pwOk ? '强度合格' : '至少 8 位，含字母和数字'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="field-label" htmlFor="reg-confirm">确认密码</label>
                    <input id="reg-confirm" type={showPw ? 'text' : 'password'} className="input"
                      value={confirm} onChange={(e) => setConfirm(e.target.value)}
                      placeholder="再输一次" autoComplete="new-password" />
                    {confirm && (
                      <p className="mt-1 text-[11px]" style={{ color: confirmOk ? 'var(--color-ok)' : 'var(--color-danger)' }}>
                        {confirmOk ? '两次一致' : '两次密码不一致'}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* 安全验证 */}
              <section className="space-y-3 border-t border-line-soft pt-5">
                <p className="flex items-center gap-2 text-[12px] font-medium text-bone-dim">
                  <span className="mono text-[11px] text-brand">02</span> 安全验证
                </p>
                {HAS_BACKEND ? (
                  <SliderCaptcha email={email} onVerified={onCaptchaVerified} onReset={onCaptchaReset} resetSignal={captchaReset} />
                ) : (
                  <p className="text-[12px] text-muted">本地演示模式，无需人机验证。</p>
                )}
              </section>
            </>
          ) : (
            <section className="space-y-4">
              <div className="flex items-start gap-2 rounded-[4px] border border-line bg-ink-800 p-3 text-[12px] leading-relaxed text-bone-dim">
                <Envelope size={16} className="mt-0.5 shrink-0 text-brand" />
                <span>{notice}</span>
              </div>
              <div>
                <label className="field-label" htmlFor="reg-code">验证码</label>
                <input id="reg-code" type="text" inputMode="numeric" autoComplete="one-time-code"
                  maxLength={6} className="input mono tracking-[0.35em] text-[18px]" value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000" />
              </div>
              <button type="button" onClick={() => void resend()} disabled={countdown > 0 || busy}
                className="link-underline text-[12.5px] text-muted hover:text-bone disabled:opacity-50 disabled:cursor-default">
                {countdown > 0 ? `${countdown} 秒后可重发` : '没收到？重新发送验证码'}
              </button>
            </section>
          )}

          {err && !emailExists && (
            <p className="text-[12px] leading-relaxed" style={{ color: 'var(--color-danger)' }}>{err}</p>
          )}

          {emailExists && (
            <div className="rounded-[4px] border p-3 text-[12px] leading-relaxed" style={{ borderColor: 'var(--color-warm)', background: 'var(--color-warm-soft)' }}>
              <p className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--color-warm)' }}>
                <WarningCircle size={14} /> 这个邮箱已经注册过了
              </p>
              <p className="mt-1 text-bone-dim">不用重复注册，直接登录就能进入工作室。</p>
              <Link to={`/login${from !== '/me' ? `?from=${encodeURIComponent(from)}` : ''}`}
                className="btn btn-soft mt-2 w-full justify-center gap-2">
                去登录 <ArrowRight size={14} weight="bold" />
              </Link>
            </div>
          )}

          <button type="submit" disabled={busy || emailExists} className="btn btn-primary mt-1 h-[46px] w-full justify-center gap-2 text-[14px]">
            {busy ? '处理中…' : step === 'code' ? '验证并进入' : '创建账号'}
            {!busy && <ArrowRight size={15} weight="bold" />}
          </button>
        </form>

        <div className="mt-8 border-t border-line-soft pt-5 text-[13px]">
          <span className="text-muted">已经有账号？</span>
          <Link to={`/login${from !== '/me' ? `?from=${encodeURIComponent(from)}` : ''}`}
            className="link-underline ml-1 text-bone hover:text-bone">立即登录</Link>
        </div>
      </motion.div>
    </div>
  );
}
