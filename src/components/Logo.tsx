import { Link } from 'react-router-dom';

/**
 * JCGame 标记：一个切掉右上角的方块（"开着的口"），里面是 J（墨色）和 C（珊瑚色）。
 * 切角与 C 的开口对着同一个方向 —— 平台是开着的，游戏从这里出去。
 */
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
      <path
        d="M11 2 H21 L30 11 V21 A9 9 0 0 1 21 30 H11 A9 9 0 0 1 2 21 V11 A9 9 0 0 1 11 2 Z"
        fill="var(--color-paper)"
      />
      <path
        d="M13.4 8.6 V17.6 a3.1 3.1 0 0 1 -6.2 0"
        stroke="var(--color-ink-950)"
        strokeWidth="2.9"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M23.2 12.2 A5.1 5.1 0 1 0 23.2 19.8"
        stroke="var(--color-brand)"
        strokeWidth="2.9"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className="group inline-flex items-center gap-2.5"
      aria-label="JCGame 首页"
    >
      <span className="transition-transform duration-300 ease-[cubic-bezier(.22,.68,0,1)] group-hover:-rotate-6">
        <LogoMark size={26} />
      </span>
      {!compact && (
        <span className="flex items-baseline gap-[3px] leading-none">
          <span className="text-[17px] font-extrabold tracking-[-0.02em] text-bone">JC</span>
          <span className="text-[12.5px] font-medium tracking-[0.14em] text-bone-dim">GAME</span>
        </span>
      )}
    </Link>
  );
}

/** 纯图形版（用于 favicon / 加载页 / 404） */
export function LogoLockup({ size = 40 }: { size?: number }) {
  return (
    <span className="flex items-center gap-3">
      <LogoMark size={size} />
      <span className="flex items-baseline gap-1 leading-none">
        <span style={{ fontSize: size * 0.64 }} className="font-extrabold tracking-[-0.02em]">
          JC
        </span>
        <span
          style={{ fontSize: size * 0.44 }}
          className="font-medium tracking-[0.14em] text-bone-dim"
        >
          GAME
        </span>
      </span>
    </span>
  );
}
