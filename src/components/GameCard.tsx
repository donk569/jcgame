import { Link } from 'react-router-dom';
import { Play, ArrowUpRight } from '@phosphor-icons/react';
import type { Game } from '@/api/types';
import { formatCount } from '@/lib/format';

/** 图片打底的展示卡：文字压在图上，悬停浮起并露出运行方式 */
export function GamePost({
  game,
  ratio = 'portrait',
  className = '',
  sizes,
}: {
  game: Game;
  ratio?: 'portrait' | 'wide' | 'square' | 'tall';
  className?: string;
  sizes?: string;
}) {
  const ratioClass =
    ratio === 'wide'
      ? 'aspect-[16/10]'
      : ratio === 'square'
        ? 'aspect-square'
        : ratio === 'tall'
          ? 'aspect-[3/4]'
          : 'aspect-[4/5]';

  return (
    <Link
      to={`/game/${game.slug}`}
      className={`post group block ${ratioClass} ${className}`}
      aria-label={`${game.titleCn} — ${game.runMode === 'web' ? '网页试玩' : '客户端下载'}`}
    >
      <img src={game.cover} alt={`${game.titleCn} 封面`} loading="lazy" sizes={sizes} />
      <div className="post-shade" />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex h-[22px] shrink-0 items-center whitespace-nowrap rounded-[2px] px-1.5 text-[10.5px] font-medium ${
              game.runMode === 'web'
                ? 'bg-teal/18 text-teal'
                : 'bg-warm/18 text-warm'
            }`}
          >
            {game.runMode === 'web' ? '网页试玩' : '下载'}
          </span>
          <span className="mono min-w-0 truncate text-bone-dim">{game.engine}</span>
        </div>
        <h3 className="mt-2 truncate text-[15.5px] font-semibold leading-tight text-bone">
          {game.titleCn}
        </h3>
        <div className="post-more mt-2 flex items-center justify-between gap-2">
          <span className="mono truncate text-muted">
            {formatCount(game.plays)} 试玩 / {game.categories[0]}
          </span>
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/12 text-bone">
            {game.runMode === 'web' ? <Play size={12} weight="fill" /> : <ArrowUpRight size={12} weight="bold" />}
          </span>
        </div>
      </div>
    </Link>
  );
}

/** 密集网格用：封面 + 图下两行信息 */
export function GameTile({ game }: { game: Game }) {
  return (
    <Link to={`/game/${game.slug}`} className="group block">
      <div className="cover transition-shadow duration-500 group-hover:shadow-[0_20px_40px_-24px_#000]">
        <img src={game.cover} alt={`${game.titleCn} 封面`} loading="lazy" />
        <span className="absolute right-2 top-2 rounded-[2px] bg-ink-950/72 px-1.5 py-0.5 text-[10.5px] text-bone opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {game.runMode === 'web' ? '网页可玩' : '下载'}
        </span>
      </div>
      <div className="mt-3">
        <h3 className="truncate text-[14.5px] font-semibold leading-snug transition-colors group-hover:text-brand">
          {game.titleCn}
        </h3>
        <div className="mono mt-1 flex items-center gap-1.5 truncate text-muted-dim">
          <span className="truncate">{game.engine}</span>
          <span className="text-line-bright">/</span>
          <span className="shrink-0">{game.categories[0]}</span>
        </div>
      </div>
    </Link>
  );
}

/** 横向列表行：搜索结果、排行榜、相似游戏用 */
export function GameRow({ game, index }: { game: Game; index?: number }) {
  return (
    <Link
      to={`/game/${game.slug}`}
      className="group flex items-center gap-4 rounded-none p-2 transition-colors hover:bg-ink-700/60"
    >
      {index !== undefined && (
        <span className="mono w-5 shrink-0 text-center text-muted-dim">{index + 1}</span>
      )}
      <img
        src={game.cover}
        alt=""
        className="h-[62px] w-[46px] shrink-0 rounded-[2px] object-cover"
        loading="lazy"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-medium transition-colors group-hover:text-brand">
          {game.titleCn}
        </span>
        <span className="mono mt-1 block truncate text-muted-dim">
          {game.engine} / {game.studio.name}
        </span>
      </span>
      <span className="mono hidden shrink-0 text-muted-dim sm:block">
        {formatCount(game.plays)}
      </span>
    </Link>
  );
}
