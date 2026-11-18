import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowCounterClockwise,
  ArrowsIn,
  ArrowsOut,
  ShieldCheck,
  X,
} from '@phosphor-icons/react';
import type { Game } from '@/api/types';
import { formatBytes } from '@/lib/format';

type Phase = 'loading' | 'running' | 'error';

export function PlayModal({ game, open, onClose }: { game: Game; open: boolean; onClose: () => void }) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [progress, setProgress] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [failNext, setFailNext] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const start = useCallback(() => {
    setPhase('loading');
    setProgress(0);
  }, []);

  useEffect(() => {
    if (!open) return;
    start();
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => panelRef.current?.focus(), 90);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = '';
    };
  }, [open, start]);

  useEffect(() => {
    if (!open || phase !== 'loading') return;
    const id = window.setInterval(() => {
      setProgress((p) => {
        const next = p + Math.random() * 9 + 3;
        if (next >= 100) {
          window.clearInterval(id);
          window.setTimeout(() => setPhase(failNext ? 'error' : 'running'), 240);
          return 100;
        }
        return next;
      });
    }, 130);
    return () => window.clearInterval(id);
  }, [open, phase, failNext]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        else onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggleFullscreen = async () => {
    if (!frameRef.current) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await frameRef.current.requestFullscreen();
    } catch {
      /* 浏览器可能拒绝全屏 */
    }
  };

  const step =
    progress < 28
      ? `下载构建产物 ${formatBytes(game.webBuild?.bytes ?? 0)}`
      : progress < 62
        ? '初始化 WebGL 上下文'
        : progress < 92
          ? '编译着色器与资源'
          : '准备就绪';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center p-0 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
        >
          <button
            className="absolute inset-0 cursor-default bg-ink-950/88 backdrop-blur-sm"
            onClick={onClose}
            aria-label="退出试玩"
            tabIndex={-1}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${game.titleCn} 网页试玩`}
            ref={panelRef}
            tabIndex={-1}
            className="relative flex h-full w-full max-w-[1180px] flex-col overflow-hidden border border-line bg-ink-850 outline-none sm:h-auto sm:rounded-none"
            initial={{ opacity: 0, scale: 0.985, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-line-soft px-3 py-2.5 sm:px-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                    phase === 'running' ? 'bg-teal' : phase === 'error' ? 'bg-danger' : 'bg-brand'
                  } ${phase === 'loading' ? 'animate-pulse' : ''}`}
                />
                <span className="truncate text-[13.5px] font-medium">{game.titleCn}</span>
                <span className="mono hidden truncate text-muted-dim sm:block">
                  {game.webBuild?.host}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={toggleFullscreen}
                  className="grid h-8 w-8 place-items-center rounded-[2px] text-muted transition-colors hover:bg-ink-700 hover:text-bone"
                  aria-label={fullscreen ? '退出全屏' : '全屏'}
                >
                  {fullscreen ? <ArrowsIn size={15} /> : <ArrowsOut size={15} />}
                </button>
                <button
                  onClick={onClose}
                  className="grid h-8 w-8 place-items-center rounded-[2px] text-muted transition-colors hover:bg-ink-700 hover:text-bone"
                  aria-label="退出试玩"
                >
                  <X size={16} weight="bold" />
                </button>
              </div>
            </div>

            <div ref={frameRef} className="relative w-full flex-1 overflow-hidden bg-black sm:aspect-[16/9] sm:flex-none">
              <AnimatePresence mode="wait">
                {phase === 'loading' && (
                  <motion.div
                    key="loading"
                    exit={{ opacity: 0 }}
                    className="relative flex h-full min-h-[300px] flex-col items-center justify-center gap-6 px-6"
                  >
                    <img
                      src={game.keyart ?? game.cover}
                      alt=""
                      className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25 blur-md"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-ink-950/55" />
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-[2px] bg-brand/15 text-brand">
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
                          className="block h-4 w-4 rounded-full border-2 border-brand border-t-transparent"
                        />
                      </span>
                      <span className="text-[13.5px] text-bone-dim">正在启动 {game.titleCn}</span>
                    </div>
                    <div className="w-full max-w-[380px]">
                      <div
                        className="h-[3px] w-full overflow-hidden rounded-full bg-white/10"
                        role="progressbar"
                        aria-valuenow={Math.round(progress)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="加载进度"
                      >
                        <div
                          className="h-full rounded-full bg-brand transition-[width] duration-150 ease-linear"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="mt-2.5 flex items-center justify-between">
                        <span className="text-[12px] text-muted">{step}</span>
                        <span className="mono text-muted-dim">{Math.round(progress)}%</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {phase === 'running' && (
                  <motion.div
                    key="running"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative h-full"
                  >
                    <img
                      src={game.shots?.[0] ?? game.keyart ?? game.cover}
                      alt={`${game.titleCn} 运行画面（演示占位）`}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 rounded-full bg-ink-950/72 px-2 py-0.5 text-[10.5px] text-bone-dim backdrop-blur">
                      演示占位：正式环境为沙箱 iframe
                    </span>
                  </motion.div>
                )}

                {phase === 'error' && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 px-6 text-center"
                  >
                    <p className="text-[15px] font-medium">游戏没能启动</p>
                    <p className="max-w-[42ch] text-[13px] leading-relaxed text-muted">
                      构建产物加载失败，可能是网络中断或开发者刚更新了版本。重新加载通常能解决；连续失败请
                      <button className="mx-1 text-brand underline-offset-4 hover:underline">报告问题</button>
                      。
                    </p>
                    <span className="mono text-muted-dim">JC-RUN-0x02E4</span>
                    <button className="btn btn-ghost btn-sm mt-1" onClick={start}>
                      <ArrowCounterClockwise size={14} weight="bold" /> 重新加载
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex flex-col gap-2 border-t border-line-soft px-3 py-2.5 text-[11.5px] text-muted-dim sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={13} />
                游戏在独立域名与沙箱 iframe 中运行，不共享主站登录态与存储
              </span>
              <button
                onClick={() => {
                  setFailNext((v) => !v);
                  start();
                }}
                className="self-start text-muted transition-colors hover:text-bone sm:self-auto"
              >
                {failNext ? '恢复默认加载' : '演示：模拟加载失败'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
