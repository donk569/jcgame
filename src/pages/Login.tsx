import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, GithubLogo } from '@phosphor-icons/react';
import { motion, useReducedMotion } from 'framer-motion';
import { LogoMark } from '@/components/Logo';
import { useAppStore } from '@/store/AppStore';
import { HAS_BACKEND } from '@/api/auth';

/**
 * 登录页。
 * 配置了 Supabase 时用邮箱密码 / GitHub OAuth；没配置则走本地演示登录。
 */
export default function Login() {
  const store = useAppStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const reduce = useReducedMotion();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      if (!email.trim() || password.length < 6) {
        setErr('填邮箱和至少 6 位密码');
        return;
      }
      setBusy(true);
      try {
        if (mode === 'signup') await store.signUp(email.trim(), password);
        else await store.signIn(email.trim(), password);
        finish();
      } catch (ex) {
        setErr(ex instanceof Error ? ex.message : '登录失败');
      } finally {
        setBusy(false);
      }
      return;
    }
    // 本地演示登录
    if (!handle.trim()) return;
    store.login(handle.trim(), name.trim() || handle.trim());
    finish();
  };

  return (
    <div className="wrap flex min-h-[68vh] items-center justify-center py-16">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.22, 0.68, 0, 1] }}
        className="w-full max-w-[420px]"
      >
        <LogoMark size={36} />
        <h1 className="serif-title mt-7 text-[28px]">回到工作室</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          {HAS_BACKEND
            ? '登录后可以发布游戏、管理草稿，查看作品数据。'
            : '当前未连接后端，使用本地演示账号，数据只保存在你的浏览器里。'}
        </p>

        <form onSubmit={submit} className="mt-8 space-y-5">
          {HAS_BACKEND ? (
            <>
              <div>
                <label className="field-label" htmlFor="login-email">
                  邮箱
                </label>
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
                <label className="field-label" htmlFor="login-password">
                  密码
                </label>
                <input
                  id="login-password"
                  type="password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 6 位"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
              </div>
              {err && (
                <p className="text-[12px]" style={{ color: 'var(--color-danger)' }}>
                  {err}
                </p>
              )}
              <button type="submit" disabled={busy} className="btn btn-primary w-full justify-center gap-2">
                {busy ? '处理中…' : mode === 'signup' ? '注册并进入' : '登录'}
                <ArrowRight size={14} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setErr('');
                }}
                className="link-underline w-full text-center text-[12.5px] text-muted hover:text-bone"
              >
                {mode === 'signin' ? '还没有账号？去注册' : '已有账号？去登录'}
              </button>
              <div className="flex items-center gap-3 pt-1">
                <span className="h-px flex-1 bg-line" aria-hidden="true" />
                <span className="mono text-[10.5px] text-muted-dim">或</span>
                <span className="h-px flex-1 bg-line" aria-hidden="true" />
              </div>
              <button
                type="button"
                onClick={() => void store.signInGithub()}
                className="btn btn-ghost w-full justify-center gap-2"
              >
                <GithubLogo size={15} weight="fill" /> 用 GitHub 登录
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="field-label" htmlFor="login-handle">
                  用户名
                </label>
                <input
                  id="login-handle"
                  className="input"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="jc"
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="field-label" htmlFor="login-name">
                  显示名称
                </label>
                <input
                  id="login-name"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="jc"
                />
              </div>
              <button type="submit" className="btn btn-primary w-full justify-center gap-2">
                进入工作室 <ArrowRight size={14} weight="bold" />
              </button>
            </>
          )}
        </form>

        <p className="mt-6 border-t border-line-soft pt-4 text-[12px] leading-relaxed text-muted-dim">
          不想登录？
          <Link to="/explore" className="link-underline ml-1 text-bone-dim hover:text-bone">
            直接逛探索页
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
