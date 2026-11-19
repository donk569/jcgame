/**
 * 滑块拼图人机验证（带完整状态恢复）。
 * - 缺口由服务端随机生成，前端只拿到画好缺口的 SVG，永远不知道答案坐标。
 * - 拖动位移 + 耗时提交服务端校验，通过才签发一次性凭证。
 * - 失败后自动申请全新挑战并恢复可拖动；限流时提示稍后重试，不自动刷。
 * - 鼠标 / 触摸双支持；触摸时阻止页面滚动冲突。
 *
 * 状态机：idle → loading → ready → dragging → checking → passed
 *                                              └→ failed →(自动)→ loading → ready
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowsClockwise, SpinnerGap, Check, WarningCircle } from '@phosphor-icons/react';
import {
  captchaSessionId,
  createChallenge,
  verifyChallenge,
  captchaError,
  type CaptchaChallenge,
} from '@/api/captcha';

const W = 280; // 图片宽（与 captcha_new 默认一致）
const H = 150;
const RETRY_DELAY = 650; // 失败后自动换新挑战的间隔，让用户看到失败提示

type Status = 'idle' | 'loading' | 'ready' | 'dragging' | 'checking' | 'passed' | 'failed';

interface Props {
  email: string;
  onVerified: (token: string) => void;
  onReset: () => void;
}

export default function SliderCaptcha({ email, onVerified, onReset }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [challenge, setChallenge] = useState<CaptchaChallenge | null>(null);
  const [x, setX] = useState(0);
  const [pieceY, setPieceY] = useState(38);
  const [pieceSize, setPieceSize] = useState(48);
  const [msg, setMsg] = useState('');
  const [rateLimited, setRateLimited] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startTimeRef = useRef(0);
  const draggingRef = useRef(false);
  const currentXRef = useRef(0);
  const mountedRef = useRef(true);

  // 用 ref 固定父组件回调，避免父组件重渲染导致 load 引用抖动、effect 反复重载
  const onVerifiedRef = useRef(onVerified);
  const onResetRef = useRef(onReset);
  const emailRef = useRef(email);
  useEffect(() => {
    onVerifiedRef.current = onVerified;
    onResetRef.current = onReset;
  }, [onVerified, onReset]);

  // 请求序号：每次 load / verify 都 +1，异步回调只认最新序号，旧结果一律丢弃
  const genRef = useRef(0);
  // 防止重复提交：同一时刻只允许一个 verify 在飞
  const verifyingRef = useRef(false);
  // 失败自动重试的定时器，卸载/新请求时清掉
  const retryTimerRef = useRef<number | null>(null);
  const emailChangeHandledRef = useRef(email);

  const clearRetryTimer = () => {
    if (retryTimerRef.current !== null) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  /** 清空旧凭证 + 位置，交给父组件禁用提交 */
  const clearCredential = useCallback(() => {
    onResetRef.current();
    currentXRef.current = 0;
    setX(0);
    draggingRef.current = false;
  }, []);

  /** 申请一张全新挑战。gen 递增作废旧请求。 */
  const load = useCallback(async (opts?: { keepMsg?: string }) => {
    clearRetryTimer();
    const gen = ++genRef.current;
    verifyingRef.current = false;
    setStatus('loading');
    setMsg(opts?.keepMsg ?? '');
    setRateLimited(false);
    clearCredential();
    setChallenge(null); // 清掉旧挑战，避免失败状态残留 / 复用已用挑战
    try {
      const c = await createChallenge(captchaSessionId());
      if (!mountedRef.current || gen !== genRef.current) return; // 旧请求丢弃
      setChallenge(c);
      setPieceSize(c.piece);
      // 从遮罩 SVG 读缺口 y（答案 x 不在 DOM 里，前端不做通过判定）
      const yMatch = c.maskSvg.match(/<rect x="\d+" y="(\d+)"/);
      setPieceY(yMatch ? Number(yMatch[1]) : 38);
      setStatus('ready');
    } catch (ex) {
      if (!mountedRef.current || gen !== genRef.current) return;
      setStatus('failed');
      setMsg(captchaError(ex));
    }
  }, [clearCredential]);

  // 把最新的 load 放进 ref；effect 只调 ref，永不因 load 引用变化而重跑
  const loadRef = useRef(load);
  loadRef.current = load;

  // 首次加载严格一次（[] 空依赖）。StrictMode 下 cleanup 会作废在飞请求，
  // 所以 mount 时若首次请求已被作废且仍未 ready，则重新拉一次。
  const bootRef = useRef(false);
  useEffect(() => {
    mountedRef.current = true;
    if (!bootRef.current) {
      bootRef.current = true;
      void loadRef.current();
    }
    return () => {
      mountedRef.current = false;
      clearRetryTimer();
    };
  }, []);

  // 邮箱变化：凭证绑定旧邮箱，作废并换新挑战（空依赖，靠 ref 比较，不触发重载循环）
  useEffect(() => {
    if (emailChangeHandledRef.current !== email) {
      emailChangeHandledRef.current = email;
      emailRef.current = email;
      if (bootRef.current) void loadRef.current();
    }
  }, [email]);

  const beginDrag = (clientX: number) => {
    if (status !== 'ready' || verifyingRef.current) return;
    clearRetryTimer();
    draggingRef.current = true;
    startXRef.current = clientX - currentXRef.current;
    startTimeRef.current = Date.now();
    setStatus('dragging');
  };

  const moveDrag = useCallback((clientX: number) => {
    if (!draggingRef.current) return;
    const raw = clientX - startXRef.current;
    const next = Math.max(0, Math.min(W - pieceSize, raw));
    currentXRef.current = next;
    setX(next);
  }, [pieceSize]);

  /** 判断是否为限流错误（限流不自动重试，避免无限刷） */
  const isRateLimited = (ex: unknown) => {
    const m = (ex instanceof Error ? ex.message : String(ex ?? '')).toLowerCase();
    return m.includes('too many') || m.includes('rate limit');
  };

  /** 失败后：清凭证 → 提示 → 自动申请新挑战（限流除外） */
  const scheduleRetry = useCallback((reason: string, limited: boolean) => {
    setRateLimited(limited);
    setStatus('failed');
    setMsg(limited ? `${reason}（稍后点「刷新」重试）` : reason);
    if (limited) return; // 服务端限流：不自动重试
    clearRetryTimer();
    retryTimerRef.current = window.setTimeout(() => {
      retryTimerRef.current = null;
      if (!mountedRef.current) return;
      void load({ keepMsg: '' });
    }, RETRY_DELAY);
  }, [load]);

  const endDrag = useCallback(async () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;

    if (!challenge || !emailRef.current.trim()) {
      scheduleRetry('请先填写邮箱再拖动验证', false);
      return;
    }
    if (verifyingRef.current) return; // 重复提交保护
    verifyingRef.current = true;

    const myGen = genRef.current;
    const elapsed = Date.now() - startTimeRef.current;
    setStatus('checking');
    setMsg('');
    try {
      const result = await verifyChallenge(
        challenge.challengeId,
        captchaSessionId(),
        emailRef.current.trim(),
        currentXRef.current,
        elapsed,
      );
      if (!mountedRef.current || myGen !== genRef.current) return; // 旧请求/已作废，丢弃
      setStatus('passed');
      setMsg('验证通过');
      onVerifiedRef.current(result.token); // 成功凭证交父组件，一次性使用
    } catch (ex) {
      if (!mountedRef.current || myGen !== genRef.current) return;
      // 失败：绝不复用旧挑战，交给 scheduleRetry 换新挑战
      scheduleRetry(captchaError(ex), isRateLimited(ex));
    } finally {
      // 无论成功失败，释放提交锁（状态由上面分支决定，这里只保证不卡锁）
      if (myGen === genRef.current) verifyingRef.current = false;
    }
  }, [challenge, scheduleRetry]);

  // 鼠标
  useEffect(() => {
    const move = (e: MouseEvent) => moveDrag(e.clientX);
    const up = () => { void endDrag(); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [moveDrag, endDrag]);

  // 触摸（passive:false 才能 preventDefault 阻止滚动）
  useEffect(() => {
    const move = (e: TouchEvent) => {
      if (!draggingRef.current) return;
      e.preventDefault();
      moveDrag(e.touches[0].clientX);
    };
    const up = () => { void endDrag(); };
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, [moveDrag, endDrag]);

  const interactive = status === 'ready' || status === 'dragging';
  const canRefresh = status !== 'loading' && status !== 'checking';

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between">
        <span className="field-label !mb-0">人机验证</span>
        <button
          type="button"
          onClick={() => void load()}
          disabled={!canRefresh}
          className="inline-flex items-center gap-1 text-[11.5px] text-muted hover:text-bone disabled:opacity-50"
          aria-label="刷新验证"
        >
          <ArrowsClockwise size={13} /> 刷新
        </button>
      </div>

      <div
        ref={trackRef}
        className="relative overflow-hidden rounded-[4px] border border-line"
        style={{ width: W, maxWidth: '100%', height: H }}
      >
        <img
          src={`${import.meta.env.BASE_URL}art/misc/captcha-bg.webp`}
          alt="拼图背景"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ width: W, height: H }}
        />
        {challenge?.maskSvg && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{ width: W, height: H }}
            dangerouslySetInnerHTML={{ __html: challenge.maskSvg }}
          />
        )}
        {challenge && status !== 'passed' && status !== 'loading' && (
          <div
            className="absolute shadow-[0_2px_10px_rgba(0,0,0,.5)]"
            style={{
              width: pieceSize,
              height: pieceSize,
              left: x,
              top: pieceY,
              backgroundImage: `url(${import.meta.env.BASE_URL}art/misc/captcha-bg.webp)`,
              backgroundSize: `${W}px ${H}px`,
              backgroundPosition: `-${x}px -${pieceY}px`,
              borderRadius: 9,
              border: '1.5px solid rgba(255,255,255,.9)',
            }}
          />
        )}
        {(status === 'loading' || status === 'checking') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[rgba(10,14,16,.8)] text-bone-dim">
            <SpinnerGap size={24} className="animate-spin" />
            <span className="text-[12px]">{status === 'loading' ? '正在加载验证…' : '正在校验…'}</span>
          </div>
        )}
        {status === 'passed' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[rgba(10,20,18,.86)]" style={{ color: 'var(--color-ok)' }}>
            <Check size={30} weight="bold" />
            <span className="text-[13px] font-medium">验证通过</span>
          </div>
        )}
      </div>

      <div
        className="relative mt-2 h-[38px] w-full overflow-hidden rounded-[4px] border border-line bg-ink-800"
        style={{ maxWidth: W }}
      >
        <div className="absolute inset-y-0 left-0 opacity-40" style={{ width: x + pieceSize, background: 'var(--color-brand)' }} />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[11.5px] text-muted">
          {status === 'passed' ? '已完成验证'
            : status === 'failed' ? (rateLimited ? '请稍后再试' : '正在换一张新拼图…')
            : interactive ? '按住滑块，拖到缺口位置'
            : '请稍候…'}
        </span>
        <button
          type="button"
          aria-label="拖动验证滑块"
          disabled={!interactive}
          onMouseDown={(e) => { e.preventDefault(); beginDrag(e.clientX); }}
          onTouchStart={(e) => { e.preventDefault(); beginDrag(e.touches[0].clientX); }}
          className="absolute top-[3px] flex h-[30px] w-[38px] items-center justify-center rounded-[3px] border border-line text-ink-950 disabled:opacity-60"
          style={{ left: x, background: 'var(--color-paper)', cursor: interactive ? 'grab' : 'default', touchAction: 'none' }}
        >
          {status === 'passed' ? <Check size={15} weight="bold" /> : <ArrowsClockwise size={15} />}
        </button>
      </div>

      {msg && status !== 'passed' && status !== 'loading' && (
        <p className="mt-2 flex items-center gap-1 text-[11.5px]" style={{ color: 'var(--color-danger)' }}>
          <WarningCircle size={12} /> {msg}
        </p>
      )}
      {rateLimited && (
        <button type="button" onClick={() => void load()}
          className="link-underline mt-1 text-[12px] text-muted hover:text-bone">
          现在重试
        </button>
      )}
    </div>
  );
}
