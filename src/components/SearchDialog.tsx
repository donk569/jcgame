import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowElbowDownLeft, MagnifyingGlass, X } from '@phosphor-icons/react';
import { useGameSearch } from '@/hooks/useGameSearch';

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const results = useGameSearch(q, 6);

  useEffect(() => {
    if (open) {
      setQ('');
      const t = window.setTimeout(() => inputRef.current?.focus(), 80);
      document.body.style.overflow = 'hidden';
      return () => {
        window.clearTimeout(t);
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && results[0]) {
        onClose();
        navigate(`/game/${results[0].slug}`);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, navigate, results]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
        >
          <button
            className="absolute inset-0 cursor-default bg-ink-950/80 backdrop-blur-sm"
            onClick={onClose}
            aria-label="关闭搜索"
            tabIndex={-1}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="搜索游戏"
            className="relative w-full max-w-[640px] overflow-hidden rounded-none border border-line-bright bg-ink-850 shadow-[0_40px_80px_-30px_#000]"
            initial={{ opacity: 0, y: -10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: 0.2, ease: [0.22, 0.68, 0, 1] }}
          >
            <div className="flex items-center gap-3 border-b border-line-soft px-5">
              <MagnifyingGlass size={18} weight="bold" className="shrink-0 text-muted" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="搜游戏、开发者、引擎或标签"
                className="h-16 w-full bg-transparent text-[15.5px] outline-none placeholder:text-muted-dim"
                aria-label="搜索关键词"
              />
              <button
                onClick={onClose}
                className="rounded-[2px] p-1.5 text-muted transition-colors hover:bg-ink-700 hover:text-bone"
                aria-label="关闭"
              >
                <X size={16} weight="bold" />
              </button>
            </div>

            <div className="max-h-[54vh] overflow-y-auto p-2">
              <div className="mono px-3 py-2 text-muted-dim">
                {q.trim() ? `找到 ${results.length} 个结果` : '最近上架'}
              </div>
              {results.length === 0 && (
                <div className="px-3 pb-5 pt-1 text-[13.5px] text-muted">
                  没有匹配的游戏。换个关键词，或者去
                  <button
                    className="mx-1 text-brand underline-offset-4 hover:underline"
                    onClick={() => {
                      onClose();
                      navigate('/explore');
                    }}
                  >
                    探索页
                  </button>
                  按标签筛。
                </div>
              )}
              {results.map((g) => (
                <button
                  key={g.slug}
                  onClick={() => {
                    onClose();
                    navigate(`/game/${g.slug}`);
                  }}
                  className="flex w-full items-center gap-3 rounded-none px-3 py-2.5 text-left transition-colors hover:bg-ink-700"
                >
                  <img
                    src={g.cover}
                    alt=""
                    className="h-12 w-[38px] shrink-0 rounded-[2px] object-cover"
                    loading="lazy"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium">{g.titleCn}</span>
                    <span className="mono block truncate text-muted-dim">
                      {g.engine} / {g.studio.name}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 text-[11.5px] ${
                      g.runMode === 'web' ? 'text-teal' : 'text-brand'
                    }`}
                  >
                    {g.runMode === 'web' ? '网页试玩' : '下载'}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-line-soft px-5 py-3 text-[11.5px] text-muted-dim">
              <span className="flex items-center gap-1.5">
                <ArrowElbowDownLeft size={12} weight="bold" /> 打开第一个结果
              </span>
              <span>Esc 关闭</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
