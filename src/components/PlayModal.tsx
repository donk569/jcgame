import { useEffect, useRef, useState } from 'react';
import { ArrowsIn, ArrowsOut, ArrowCounterClockwise, X } from '@phosphor-icons/react';
import type { Game } from '@/api/types';

export function PlayModal({
  game,
  url,
  onClose,
  onLaunch,
}: {
  game: Game;
  url: URL;
  onClose: () => void;
  onLaunch: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const started = useRef(false);
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState(false);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    element.showModal();
    const onFullscreen = () => setFullscreen(document.fullscreenElement === element);
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreen);
      element.close();
    };
  }, []);

  useEffect(() => {
    if (loaded) return;
    const timeout = window.setTimeout(() => setSlow(true), 12000);
    return () => window.clearTimeout(timeout);
  }, [loaded, attempt]);

  function retry() {
    setLoaded(false);
    setSlow(false);
    setAttempt((value) => value + 1);
  }

  async function toggleFullscreen() {
    const element = dialog.current;
    if (!element) return;
    setFullscreenError(false);
    try {
      if (document.fullscreenElement === element) await document.exitFullscreen();
      else await element.requestFullscreen();
    } catch {
      setFullscreenError(true);
    }
  }

  return (
    <dialog
      ref={dialog}
      aria-label={`${game.titleCn} 网页试玩`}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      className="fixed inset-0 m-auto max-h-[100dvh] w-full max-w-[1180px] overflow-auto border border-line bg-ink-950 text-bone backdrop:bg-black/80"
    >
      <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-2">
        <div className="min-w-0">
          <p className="truncate font-semibold">{game.titleCn}</p>
          <p className="truncate text-[12px] text-muted">{url.hostname}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button className="btn btn-ghost btn-icon" onClick={retry} aria-label="重新加载">
            <ArrowCounterClockwise size={17} />
          </button>
          <button
            className="btn btn-ghost btn-icon hidden sm:inline-flex"
            onClick={() => void toggleFullscreen()}
            aria-label={fullscreen ? '退出全屏' : '全屏'}
          >
            {fullscreen ? <ArrowsIn size={17} /> : <ArrowsOut size={17} />}
          </button>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="退出试玩">
            <X size={17} />
          </button>
        </div>
      </div>
      <div className={fullscreen ? 'relative h-[calc(100dvh-65px)]' : 'relative aspect-[16/9] min-h-[240px]'}>
        <iframe
          key={attempt}
          ref={frame}
          className="h-full w-full bg-black"
          src={url.href}
          sandbox="allow-scripts allow-pointer-lock"
          referrerPolicy="no-referrer"
          title={game.titleCn}
          onLoad={() => {
            setLoaded(true);
            if (!started.current) {
              started.current = true;
              onLaunch();
            }
          }}
        />
        {!loaded && (
          <div className="absolute inset-0 grid place-content-center gap-3 bg-ink-950/95 px-5 text-center" role="status">
            <p>{slow ? '运行地址还未响应。' : '正在打开游戏…'}</p>
            {slow && <button className="btn btn-ghost" onClick={retry}>重新加载</button>}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-[12px] text-muted">
        <p>{fullscreenError ? '浏览器未允许全屏。' : '如果画面空白，运行站点可能禁止嵌入。'}</p>
        <button className="link-underline text-bone-dim" onClick={() => frame.current?.focus()}>把键盘焦点移到游戏</button>
      </div>
    </dialog>
  );
}
