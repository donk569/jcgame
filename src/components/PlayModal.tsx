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
            className="relative flex h-full w-full max-w-[1180px] flex-col overflow-hidden bg-ink-950 outline-none sm:h-auto"
            initial={{ opacity: 0, scale: 0.985, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* 画面占满整个面板，控件悬浮在画面上，不做上中下三层套壳 */}
            <div
              ref={frameRef}
              className="relative w-full flex-1 overflow-hidden bg-black sm:aspect-[16/9] sm:flex-none"
            >
              <AnimatePresence mode="wait">
                {phase === 'loading' && (
                  <motion.div
                    key="loading"
                    exit={{ opacity: 0 }}
                    className="relative flex h-full min-h-[300px] flex-col items-center justify-center gap-5 px-6"
                  >
                    <img
                      src={game.keyart ?? game.cover}
                      alt=""
                      className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20 blur-lg"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-ink-950/60" />
                    <div className="relative text-[13.5px] text-bone-dim">
                      正在启动 {game.titleCn}
                    </div>
                    <div className="relative w-full max-w-[320px]">
                      <div
                        className="h-px w-full overflow-hidden bg-white/15"
                        role="progressbar"
                        aria-valuenow={Math.round(progress)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="加载进度"
                      >
                        <div
                          className="h-full bg-brand transition-[width] duration-150 ease-linear"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="mt-2.5 flex items-center justify-between">
                        <span className="text-[11.5px] text-muted">{step}</span>
                        <span className="mono text-[11px] text-muted-dim">
                          {Math.round(progress)}%
                        </span>
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
                    <span className="absolute bottom-14 left-3 text-[10.5px] text-bone/40">
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
                      <button className="mx-1 text-brand underline-offset-4 hover:underline">
                        报告问题
                      </button>
                      。
                    </p>
                    <span className="mono text-muted-dim">JC-RUN-0x02E4</span>
                    <button className="btn btn-ghost btn-sm mt-1" onClick={start}>
                      <ArrowCounterClockwise size={14} weight="bold" /> 重新加载
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 悬浮顶栏：只在需要时可见，不占画面 */}
              <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-3 bg-gradient-to-b from-ink-950/80 to-transparent px-3 pb-8 pt-3">
                <div className="pointer-events-auto flex min-w-0 items-center gap-2.5">
                  <span
                    className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                      phase === 'running'
                        ? 'bg-teal'
                        : phase === 'error'
                          ? 'bg-danger'
                          : 'bg-brand animate-pulse'
                    }`}
                  />
                  <span className="truncate text-[13px] font-medium">{game.titleCn}</span>
                  <span className="mono hidden truncate text-[10.5px] text-bone/35 sm:block">
                    {game.webBuild?.host}
                  </span>
                </div>
                <div className="pointer-events-auto flex shrink-0 items-center gap-0.5">
                  <button
                    onClick={toggleFullscreen}
                    className="grid h-8 w-8 place-items-center text-bone/60 transition-colors hover:text-bone"
                    aria-label={fullscreen ? '退出全屏' : '全屏'}
                  >
                    {fullscreen ? <ArrowsIn size={15} /> : <ArrowsOut size={15} />}
                  </button>
                  <button
                    onClick={onClose}
                    className="grid h-8 w-8 place-items-center text-bone/60 transition-colors hover:text-bone"
                    aria-label="退出试玩"
                  >
                    <X size={16} weight="bold" />
                  </button>
                </div>
              </div>

              {/* 悬浮底栏：沙箱说明与演示开关，轻到几乎看不见 */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-ink-950/80 to-transparent px-3 pb-2.5 pt-6 text-[10.5px] text-bone/35">
                <span className="pointer-events-auto flex items-center gap-1.5">
                  <ShieldCheck size={12} />
                  独立域名沙箱运行，不共享主站登录态
                </span>
                <button
                  onClick={() => {
                    setFailNext((v) => !v);
                    start();
                  }}
                  className="pointer-events-auto transition-colors hover:text-bone/70"
                >
                  {failNext ? '恢复默认加载' : '演示：模拟失败'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
