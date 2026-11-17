import { Link } from 'react-router-dom';
import { LogoMark } from '@/components/Logo';

export default function NotFound() {
  return (
    <div className="wrap flex min-h-[58vh] flex-col items-center justify-center py-20 text-center">
      <LogoMark size={40} />
      <h1 className="mt-6 text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-0.04em]">
        这个页面不在货架上
      </h1>
      <p className="mt-3 max-w-[36ch] text-[13.5px] leading-relaxed text-muted">
        链接可能过期了，或者游戏已经被开发者下架。去探索页看看新上架的作品。
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
