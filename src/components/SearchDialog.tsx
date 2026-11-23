import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowElbowDownLeft, MagnifyingGlass, X } from '@phosphor-icons/react';
import { usePagedGameSearch } from '@/hooks/useGameSearch';
import type { Game } from '@/api/types';

const HISTORY_KEY = 'jcgame.search-history';

function readHistory(): string[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]');
    return Array.isArray(data)
      ? data.filter((term): term is string => typeof term === 'string' && term.length > 0 && term.length <= 120).slice(0, 6)
      : [];
  } catch {
    return [];
  }
}

function Highlight({ text, term }: { text: string; term: string }) {
  if (!term) return text;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, index) => index % 2 === 0
    ? part
    : <mark key={index} className="bg-transparent font-semibold text-brand">{part}</mark>);
}

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [history, setHistory] = useState(readHistory);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const term = q.trim();
  const { games: results, hasNext, isLoading } = usePagedGameSearch(term, 6, page, open);

  function changeQuery(value: string) {
    setQ(value);
    setPage(0);
  }

  function updateHistory(terms: string[]) {
    setHistory(terms);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(terms));
    } catch {
      // The current session can still use search history.
    }
  }

  function openGame(game: Game) {
    if (term) {
      updateHistory([term, ...history.filter((entry) => entry.toLowerCase() !== term.toLowerCase())].slice(0, 6));
    }
    onClose();
    navigate(`/game/${game.slug}`);
  }

  useEffect(() => {
    if (open) {
      changeQuery('');
      const previousFocus = document.activeElement;
      const previousOverflow = document.body.style.overflow;
      const t = window.setTimeout(() => inputRef.current?.focus(), 80);
      document.body.style.overflow = 'hidden';
      return () => {
        window.clearTimeout(t);
        document.body.style.overflow = previousOverflow;
        if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
      };
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

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
                onChange={(e) => changeQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing && results[0]) openGame(results[0]);
                }}
                maxLength={120}
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
              {!term && history.length > 0 && (
                <div className="border-b border-line-soft px-3 pb-4 pt-2">
                  <div className="flex items-center justify-between gap-4 text-[13px] text-muted">
                    <span>最近搜索</span>
                    <button className="hover:text-bone" onClick={() => updateHistory([])}>清除记录</button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {history.map((entry) => (
                      <button className="chip max-w-full break-all" key={entry} onClick={() => changeQuery(entry)}>
                        {entry}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="px-3 py-2 text-[13px] text-muted" aria-live="polite">
                {isLoading ? '正在搜索…' : term ? `搜索结果 · 第 ${page + 1} 页` : '最近上架'}
              </div>
              {!isLoading && results.length === 0 && (
                <div className="px-3 pb-5 pt-1 text-[13.5px] text-muted">
                  没有匹配的游戏。换个关键词，或者去
                  <button
                    className="mx-1 text-brand underline-offset-4 hover:underline"
                    onClick={() => {
                      onClose();
                      navigate(term ? `/explore?q=${encodeURIComponent(term)}` : '/explore');
                    }}
                  >
                    探索页
                  </button>
                  按标签筛。
                </div>
              )}
              {results.map((g) => {
                const matched = [g.title, ...g.tags, ...g.categories]
                  .find((text) => term && text.toLowerCase().includes(term.toLowerCase()));
                return (
                  <button
                    key={g.slug}
                    onClick={() => openGame(g)}
                    className="flex w-full items-center gap-3 rounded-none px-3 py-2.5 text-left transition-colors hover:bg-ink-700"
                  >
                    <img
                      src={g.cover}
                      alt=""
                      className="h-12 w-[38px] shrink-0 rounded-[2px] object-cover"
                      loading="lazy"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium">
                        <Highlight text={g.titleCn} term={term} />
                      </span>
                      <span className="block truncate text-[12px] text-muted">
                        <Highlight text={[g.engine, g.studio.name, matched].filter(Boolean).join(' / ')} term={term} />
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
                );
              })}
              {term && (page > 0 || hasNext) && (
                <div className="flex justify-between gap-3 border-t border-line-soft px-3 pt-2">
                  <button className="btn btn-ghost btn-sm" disabled={page === 0 || isLoading} onClick={() => setPage(page - 1)}>
                    上一页
                  </button>
                  <button className="btn btn-ghost btn-sm" disabled={!hasNext || isLoading} onClick={() => setPage(page + 1)}>
                    下一页
                  </button>
                </div>
              )}
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
