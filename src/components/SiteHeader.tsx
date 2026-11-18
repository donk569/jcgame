import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { List, MagnifyingGlass, X } from '@phosphor-icons/react';
import { Logo } from './Logo';
import { SearchDialog } from './SearchDialog';
import { useGameSearch } from '@/hooks/useGameSearch';
import { useAppStore } from '@/store/AppStore';

const nav = [
  { to: '/explore', label: '探索' },
  { to: '/me', label: '工作台' },
];

export function SiteHeader() {
  const { user } = useAppStore();
  const [scrolled, setScrolled] = useState(false);
  const [inlineOpen, setInlineOpen] = useState(false);
  const [q, setQ] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const results = useGameSearch(q, 5);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setInlineOpen(false);
    setQ('');
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setInlineOpen(false);
        setDialogOpen(true);
      }
      if (e.key === 'Escape') {
        setInlineOpen(false);
        setQ('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!inlineOpen) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 120);
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setInlineOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('mousedown', onClick);
    };
  }, [inlineOpen]);

  return (
    <>
      <header className="sticky top-0 z-50">
        <div
          className={`transition-colors duration-300 ${
            scrolled ? 'border-b border-line bg-ink-900/88 backdrop-blur-xl' : 'border-b border-transparent'
          }`}
        >
          <div className="wrap flex h-[64px] items-center justify-between gap-3">
            <div className="flex items-center gap-6">
              <Logo />
              <nav className="relative hidden items-center md:flex" aria-label="主导航">
                {nav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `relative px-2.5 py-[22px] text-[13.5px] transition-colors duration-200 ${
                        isActive ? 'text-bone' : 'text-muted hover:text-bone'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {item.label}
                        {isActive && (
                          <motion.span
                            layoutId="nav-underline"
                            className="absolute inset-x-1.5 bottom-0 h-[2px] rounded-full bg-brand"
                            transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-2">
              {/* 内联展开搜索（桌面） */}
              <div ref={wrapRef} className="relative hidden md:block">
                <motion.div
                  initial={false}
                  animate={{ width: inlineOpen ? 244 : 42 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                  className={`flex h-[42px] items-center overflow-hidden rounded-none border ${
                    inlineOpen
                      ? 'border-line-bright bg-ink-950'
                      : 'border-transparent bg-transparent hover:border-line'
                  }`}
                >
                  <button
                    onClick={() => setInlineOpen((v) => !v)}
                    className="grid h-full w-[42px] shrink-0 place-items-center text-muted transition-colors hover:text-bone"
                    aria-label="搜索游戏"
                    aria-expanded={inlineOpen}
                  >
                    <MagnifyingGlass size={17} weight="bold" />
                  </button>
                  <input
                    ref={inputRef}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    tabIndex={inlineOpen ? 0 : -1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && results[0]) {
                        setInlineOpen(false);
                        setQ('');
                        navigate(`/game/${results[0].slug}`);
                      }
                    }}
                    placeholder="搜游戏、引擎、开发者"
                    aria-label="搜索关键词"
                    className="w-full bg-transparent pr-2 text-[13.5px] outline-none placeholder:text-muted-dim"
                  />
                  <kbd className="mono mr-2 shrink-0 rounded-[4px] border border-line px-1 text-[10px] text-muted-dim">
                    ⌘K
                  </kbd>
                </motion.div>

                <AnimatePresence>
                  {inlineOpen && q.trim().length > 0 && (
                    <motion.div
                      initial={reduce ? false : { opacity: 0, y: -6, scale: 0.99 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.99 }}
                      transition={{ duration: 0.18, ease: [0.22, 0.68, 0, 1] }}
                      className="absolute right-0 top-[50px] w-[340px] overflow-hidden rounded-none border border-line bg-ink-850 p-1.5 shadow-[0_28px_60px_-24px_#000]"
                    >
                      {results.length === 0 ? (
                        <p className="px-3 py-4 text-[13px] text-muted">
                          没有匹配。换个词，或者去探索页按标签筛。
                        </p>
                      ) : (
                        results.map((g) => (
                          <button
                            key={g.slug}
                            onClick={() => {
                              setInlineOpen(false);
                              setQ('');
                              navigate(`/game/${g.slug}`);
                            }}
                            className="flex w-full items-center gap-3 rounded-[2px] px-2 py-2 text-left transition-colors hover:bg-ink-700"
                          >
                            <img
                              src={g.cover}
                              alt=""
                              className="h-11 w-9 shrink-0 rounded-[2px] object-cover"
                              loading="lazy"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13.5px] font-medium">
                                {g.titleCn}
                              </span>
                              <span className="mono block truncate text-muted-dim">
                                {g.engine} / {g.studio.name}
                              </span>
                            </span>
                          </button>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => setDialogOpen(true)}
                className="grid h-[40px] w-[40px] place-items-center text-muted transition-colors hover:text-bone md:hidden"
                aria-label="搜索游戏"
              >
                <MagnifyingGlass size={18} weight="bold" />
              </button>

              <Link to="/upload" className="btn btn-primary btn-sm hidden sm:inline-flex">
                发布游戏
              </Link>

              {user ? (
                <Link
                  to="/me"
                  className="avatar-sq hidden h-[28px] w-[28px] border border-line text-[11px] transition-colors hover:border-brand hover:text-brand sm:grid"
                  aria-label="我的工作台"
                  title={user.name}
                >
                  {user.name.slice(0, 1).toUpperCase()}
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="link-underline hidden text-[12.5px] text-muted hover:text-bone sm:inline"
                >
                  登录
                </Link>
              )}

              <button
                onClick={() => setMenuOpen(true)}
                className="grid h-[40px] w-[40px] place-items-center text-bone md:hidden"
                aria-label="打开菜单"
                aria-expanded={menuOpen}
              >
                <List size={18} weight="bold" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-[80] overflow-y-auto bg-ink-950 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div className="wrap flex h-[74px] items-center justify-between">
              <Logo />
              <button
                onClick={() => setMenuOpen(false)}
                className="grid h-[42px] w-[42px] place-items-center rounded-none border border-line"
                aria-label="关闭菜单"
              >
                <X size={18} weight="bold" />
              </button>
            </div>
            <nav className="wrap pb-10 pt-4" aria-label="移动导航">
              {nav.map((item, i) => (
                <motion.div
                  key={item.to}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * i + 0.05, duration: 0.35, ease: [0.22, 0.68, 0, 1] }}
                >
                  <Link
                    to={item.to}
                    className="block border-b border-line-soft py-5 text-[30px] font-bold tracking-[-0.03em]"
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
              <Link to="/upload" className="btn btn-primary btn-block mt-8">
                发布我的游戏
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
}
