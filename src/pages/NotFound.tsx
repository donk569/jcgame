import { Link } from 'react-router-dom';
import { LogoMark } from '@/components/Logo';

export default function NotFound() {
  return (
    <div className="wrap inner-page missing-page">
      <LogoMark size={40} />
      <h1 className="mt-6 text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-0.04em]">
        找不到这个页面
      </h1>
      <p className="mt-3 max-w-[36ch] text-[13.5px] leading-relaxed text-muted">
        链接可能已失效，或作品已下架。
      </p>
      <div className="mt-6 flex gap-2">
        <Link to="/explore" className="btn btn-primary btn-sm">
          去探索
        </Link>
        <Link to="/" className="btn btn-ghost btn-sm">
          回首页
        </Link>
      </div>
    </div>
  );
}
