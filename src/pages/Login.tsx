import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight } from '@phosphor-icons/react';
import { motion, useReducedMotion } from 'framer-motion';
import { LogoMark } from '@/components/Logo';
import { useAppStore } from '@/store/AppStore';

/**
 * 演示登录页。
 * 接真后端时：把 handleLogin 换成 GitHub OAuth 跳转，其余不变。
 */
export default function Login() {
  const store = useAppStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const reduce = useReducedMotion();
  const [handle, setHandle] = useState('jc');
  const [name, setName] = useState('jc');

  const from = params.get('from') || '/me';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) return;
    store.login(handle.trim(), name.trim() || handle.trim());
    navigate(from, { replace: true });
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
          登录后可以发布游戏、管理草稿，查看作品数据。
          <br />
          演示环境使用本地账号，数据只保存在你的浏览器里。
        </p>

        <form onSubmit={submit} className="mt-8 space-y-5">
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
        </form>

        <p className="mt-6 border-t border-line-soft pt-4 text-[12px] leading-relaxed text-muted-dim">
          继续即表示你同意演示用途。不想登录？
          <Link to="/explore" className="link-underline ml-1 text-bone-dim hover:text-bone">
            直接逛探索页
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
