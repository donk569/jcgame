import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Eye, EyeSlash, GithubLogo } from '@phosphor-icons/react';
import { motion, useReducedMotion } from 'framer-motion';
import { LogoMark } from '@/components/Logo';
import { useAppStore } from '@/store/AppStore';
import { HAS_BACKEND, friendlyAuthError } from '@/api/auth';

/** 登录页：简洁高效，快速返回游戏世界。注册是独立页面 /register。 */
export default function Login() {
  const store = useAppStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const reduce = useReducedMotion();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [handle, setHandle] = useState('jc');
  const [name, setName] = useState('jc');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const from = params.get('from') || '/me';
  const finish = () => navigate(from, { replace: true });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (HAS_BACKEND) {
      if (!email.trim() || !password) {
        setErr('请填写邮箱和密码');
        return;
      }
      setBusy(true);
      try {
        await store.signIn(email.trim(), password);
        finish();
      } catch (ex) {
        setErr(friendlyAuthError(ex));
      } finally {
        setBusy(false);
      }
      return;
    }
    if (!handle.trim()) return;
    store.login(handle.trim(), name.trim() || handle.trim());
    finish();
  };

  const github = async () => {
    setErr('');
    setBusy(true);
    try {
      await store.signInGithub(from);
    } catch (ex) {
      setErr(friendlyAuthError(ex));
      setBusy(false);
    }
  };

  return (
    <div className="wrap inner-page auth-page">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, ease: [0.22, 0.68, 0, 1] }}
        className="auth-form"
      >
        <LogoMark size={34} />
        <h1>登录 JCGame</h1>

        <form onSubmit={submit} className="mt-9 space-y-4">
          {HAS_BACKEND ? (
            <>
              <div>
                <label className="field-label" htmlFor="login-email">邮箱</label>
                <input
                  id="login-email"
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="field-label" htmlFor="login-password">密码</label>
                  <Link to="/reset-password" className="link-underline text-[12px] text-bone-dim">忘记密码？</Link>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPw ? 'text' : 'password'}
                    className="input pr-11"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="输入密码"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-bone"
                    aria-label={showPw ? '隐藏密码' : '显示密码'}
                  >
                    {showPw ? <EyeSlash size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="field-label" htmlFor="login-handle">用户名</label>
                <input id="login-handle" className="input" value={handle}
                  onChange={(e) => setHandle(e.target.value)} placeholder="jc" autoComplete="username" />
              </div>
              <div>
                <label className="field-label" htmlFor="login-name">显示名称</label>
                <input id="login-name" className="input" value={name}
                  onChange={(e) => setName(e.target.value)} placeholder="jc" />
              </div>
            </>
          )}

          {err && (
            <p className="text-[12px] leading-relaxed" style={{ color: 'var(--color-danger)' }}>{err}</p>
          )}

          <button type="submit" disabled={busy} className="btn btn-primary mt-2 h-[46px] w-full justify-center gap-2 text-[14px]">
            {busy ? '登录中…' : !HAS_BACKEND ? '进入工作室' : '登录'}
            {!busy && <ArrowRight size={15} weight="bold" />}
          </button>

          {HAS_BACKEND && (
            <>
              <div className="flex items-center gap-3 py-1">
                <span className="h-px flex-1 bg-line" aria-hidden="true" />
                <span className="mono text-[10.5px] text-muted-dim">或</span>
                <span className="h-px flex-1 bg-line" aria-hidden="true" />
              </div>
              <button type="button" onClick={() => void github()} disabled={busy}
                className="btn btn-ghost h-[42px] w-full justify-center gap-2">
                <GithubLogo size={16} weight="fill" /> 用 GitHub 登录
              </button>
            </>
          )}
        </form>

        <div className="mt-8 border-t border-line-soft pt-5 text-[13px]">
          <span className="text-muted">还没有账号？</span>
          <Link to={`/register${from !== '/me' ? `?from=${encodeURIComponent(from)}` : ''}`}
            className="link-underline ml-1 text-bone hover:text-bone">
            立即注册
          </Link>
          <span className="mt-2 block text-[12px] text-muted-dim">
            不想登录？<Link to="/explore" className="link-underline ml-1 text-bone-dim hover:text-bone">直接逛探索页</Link>
          </span>
        </div>
      </motion.div>
    </div>
  );
}
