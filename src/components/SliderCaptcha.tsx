/**
 * 滑块拼图人机验证。
 * - 缺口由服务端随机生成，前端只拿到画好缺口的 SVG，永远不知道答案坐标。
 * - 拖动位移 + 耗时提交服务端校验，通过才签发一次性凭证。
 * - 鼠标 / 触摸双支持；触摸时阻止页面滚动冲突。
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

type Status = 'idle' | 'loading' | 'ready' | 'dragging' | 'checking' | 'passed' | 'failed';

interface Props {
  email: string;
  /** 校验通过后回传服务端签发的一次性凭证 */
  onVerified: (token: string) => void;
  /** 凭证失效（刷新/改邮箱/过期）时清空，父组件据此禁用提交 */
  onReset: () => void;
}

export default function SliderCaptcha({ email, onVerified, onReset }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [challenge, setChallenge] = useState<CaptchaChallenge | null>(null);
  const [x, setX] = useState(0);
  const [pieceY, setPieceY] = useState(38);
  const [pieceSize, setPieceSize] = useState(48);
  const [msg, setMsg] = useState('');

  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startTimeRef = useRef(0);
  const draggingRef = useRef(false);
  const currentXRef = useRef(0);
  const passedTokenRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const maxX = W - pieceSize;

  const reset = useCallback((reason?: string) => {
    passedTokenRef.current = null;
    onReset();
    setX(0);
    currentXRef.current = 0;
    draggingRef.current = false;
    setMsg(reason ?? '');
  }, [onReset]);

  const load = useCallback(async () => {
    setStatus('loading');
    setMsg('');
    reset();
    try {
      const c = await createChallenge(captchaSessionId());
      if (!mountedRef.current) return;
      setChallenge(c);
      setPieceSize(c.piece);
      // 从遮罩 SVG 里读出缺口 y（前端需要它来摆放图块；答案 x 不在 DOM 里）
      const yMatch = c.maskSvg.match(/<rect x="\d+" y="(\d+)"/);
      setPieceY(yMatch ? Number(yMatch[1]) : 38);
      setStatus('ready');
    } catch (ex) {
      if (!mountedRef.current) return;
      setStatus('failed');
      setMsg(captchaError(ex));
    }
  }, [reset]);

  useEffect(() => {
    mountedRef.current = true;
    void load();
    return () => { mountedRef.current = false; };
  }, [load]);

  // 邮箱变化时，已签发的凭证绑定旧邮箱，必须作废
  const emailRef = useRef(email);
  useEffect(() => {
    if (emailRef.current !== email) {
      emailRef.current = email;
      if (status === 'passed') void load();
    }
  }, [email, status, load]);

  const beginDrag = (clientX: number) => {
    if (status !== 'ready') return;
    draggingRef.current = true;
    startXRef.current = clientX - currentXRef.current;
    startTimeRef.current = Date.now();
    setStatus('dragging');
  };

  const moveDrag = useCallback((clientX: number) => {
    if (!draggingRef.current) return;
    const raw = clientX - startXRef.current;
    const next = Math.max(0, Math.min(maxX, raw));
    currentXRef.current = next;
    setX(next);
  }, [maxX]);

  const endDrag = useCallback(async () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (!challenge || !email.trim()) {
      setStatus('failed');
      setMsg('请先填写邮箱再拖动验证');
      return;
    }
    setStatus('checking');
    const elapsed = Date.now() - startTimeRef.current;
    try {
      const result = await verifyChallenge(
        challenge.challengeId,
        captchaSessionId(),
        email.trim(),
        currentXRef.current,
        elapsed,
      );
      if (!mountedRef.current) return;
      passedTokenRef.current = result.token;
      setStatus('passed');
      setMsg('验证通过');
      onVerified(result.token);
    } catch (ex) {
      if (!mountedRef.current) return;
      setStatus('failed');
      setMsg(captchaError(ex));
      // 失败后重发挑战（服务端的失败挑战通常已被标记，需换新挑战）
      onReset();
    }
  }, [challenge, email, onVerified, onReset]);

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

  return (
    <div className="select-none">
      <div className="mb-2 flex items-center justify-between">
        <span className="field-label !mb-0">人机验证</span>
        <button
          type="button"
          onClick={() => void load()}
          disabled={status === 'loading' || status === 'checking'}
          className="inline-flex items-center gap-1 text-[11.5px] text-muted hover:text-bone disabled:opacity-50"
          aria-label="刷新验证"
        >
          <ArrowsClockwise size={13} /> 刷新
        </button>
      </div>

      <div
        className="relative overflow-hidden rounded-[4px] border border-line"
        style={{ width: W, maxWidth: '100%', height: H }}
      >
        {/* 底图 */}
        <img
          src={`${import.meta.env.BASE_URL}art/misc/captcha-bg.webp`}
          alt="拼图背景"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ width: W, height: H }}
        />
        {/* 服务端生成的遮罩（含缺口），前端不解析答案 x */}
        {challenge?.maskSvg && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{ width: W, height: H }}
            dangerouslySetInnerHTML={{ __html: challenge.maskSvg }}
          />
        )}
        {/* 可拖动拼图块：背景对齐同一张图，靠 background-position 平移 */}
        {challenge && status !== 'passed' && (
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
        {/* 状态遮罩 */}
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

      {/* 滑块轨道 */}
      <div
        ref={trackRef}
        className="relative mt-2 h-[38px] w-full rounded-[4px] border border-line bg-ink-800 overflow-hidden"
        style={{ maxWidth: W }}
      >
        <div
          className="absolute inset-y-0 left-0 opacity-40"
          style={{
            width: x + pieceSize,
            background: 'var(--color-brand)',
          }}
        />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[11.5px] text-muted">
          {status === 'passed' ? '已完成验证' : interactive ? '按住滑块，拖到缺口位置' : '请稍候…'}
        </span>
        <button
          type="button"
          aria-label="拖动验证滑块"
          disabled={!interactive}
          onMouseDown={(e) => { e.preventDefault(); beginDrag(e.clientX); }}
          onTouchStart={(e) => { e.preventDefault(); beginDrag(e.touches[0].clientX); }}
          className="absolute top-[3px] flex h-[30px] w-[38px] items-center justify-center rounded-[3px] border border-line text-ink-950 disabled:opacity-60"
          style={{
            left: x,
            background: 'var(--color-paper)',
            cursor: interactive ? 'grab' : 'default',
            touchAction: 'none',
          }}
        >
          {status === 'passed' ? <Check size={15} weight="bold" /> : <ArrowsClockwise size={15} />}
        </button>
      </div>

      {msg && status !== 'passed' && (
        <p className="mt-2 flex items-center gap-1 text-[11.5px]" style={{ color: 'var(--color-danger)' }}>
          <WarningCircle size={12} /> {msg}
        </p>
      )}
    </div>
  );
}
