import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Check } from '@phosphor-icons/react';
import { CatalogTile } from '@/components/GameCard';
import { useToast } from '@/components/Toast';
import { useAppStore } from '@/store/AppStore';
import { formatCount } from '@/lib/format';
import { useCreator, useGamesByCreator } from '@/hooks/useData';
import NotFound from './NotFound';

export default function Creator() {
  const { handle } = useParams();
  const creator = useCreator(handle);
  const toast = useToast();
  const store = useAppStore();
  const following = handle ? store.isFollowing(handle) : false;
  const [tab, setTab] = useState<'works' | 'about'>('works');

  const works = useGamesByCreator(creator?.handle);
  if (!creator) return <NotFound />;

  // 当前用户在资料页改过的内容，公开主页跟着变
  const isSelf = creator.handle === store.user?.handle;
  const shown = isSelf && store.profile
    ? { ...creator, name: store.profile.name, bio: store.profile.bio }
    : creator;
  const totalPlays = works.reduce((s, g) => s + g.plays, 0);

  return (
    <div className="wrap inner-page creator-page">
      <header className={`creator-masthead ${works[0] ? 'has-art' : ''}`}>
        <div className="creator-masthead-copy">
          <div className="flex flex-wrap items-center gap-4">
            <span className="avatar-sq h-12 w-12 shrink-0 text-[20px]" aria-hidden="true">
              {shown.name.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="creator-name">
                {shown.name}
              </h1>
              <div className="mt-2 flex flex-wrap gap-x-4 text-[13px] text-muted">
                <span>@{creator.handle}</span><span>{creator.location}</span>
              </div>
            </div>
            <div className="creator-actions">
              <motion.button
                whileTap={{ scale: 0.96 }}
                className={`btn btn-sm ${following ? 'btn-ghost' : 'btn-primary'}`}
                onClick={() => {
                  const on = handle ? store.toggleFollowing(handle) : false;
                  toast.push(on ? `已关注 ${shown.name}` : '已取消关注', 'ok');
                }}
                aria-pressed={following}
              >
                {following ? (
                  <>
                    <Check size={13} weight="bold" /> 已关注
                  </>
                ) : (
                  '关注'
                )}
              </motion.button>
              {creator.links.map((l) => (
                <button
                  key={l.label}
                  onClick={() => toast.push(`演示环境：${l.label} 链接未接入`)}
                  className="btn btn-ghost btn-sm"
                >
                  {l.label}
                  <ArrowUpRight size={12} weight="bold" />
                </button>
              ))}
            </div>
          </div>

          <p className="mt-5 max-w-[54ch] text-[14px] leading-relaxed text-bone-dim">{shown.bio}</p>

          <dl className="mt-6 flex flex-wrap gap-x-12 gap-y-4">
            {[
              [String(works.length), '款作品'],
              [formatCount(creator.followers), '关注者'],
              [formatCount(totalPlays), '总试玩'],
            ].map(([n, label]) => (
              <div key={label}>
                <dt className="mono text-[18px] leading-none">{n}</dt>
                <dd className="mt-1.5 text-[12px] text-muted">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
        {works[0] && (
          <Link className="creator-feature" to={`/game/${works[0].slug}`}>
            <img src={works[0].keyart ?? works[0].cover} alt="" />
            <span>{works[0].titleCn}</span>
          </Link>
        )}
      </header>

      {/* 标签页 */}
      <div className="mt-8">
        <div className="catalog-categories mb-7">
          {(
            [
              ['works', `作品 ${works.length}`],
              ['about', '关于'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              aria-pressed={tab === key}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'works' ? (
          works.length ? (
            <div className="catalog-grid">
              {works.map((game) => <CatalogTile key={game.slug} game={game} />)}
            </div>
          ) : (
            <p className="text-[13.5px] text-muted">还没发布作品。</p>
          )
        ) : (
          <div className="max-w-[54ch] space-y-4 text-[15px] leading-[1.8] text-bone-dim">
            <p>{shown.bio}</p>
            <p className="text-muted">
              {creator.since && `加入于 ${creator.since}。 `}已发布 {works.length} 款作品。
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {Array.from(new Set(works.flatMap((w) => w.tags)))
                .slice(0, 10)
                .map((t) => (
                  <Link key={t} to={`/explore?tag=${encodeURIComponent(t)}`} className="chip">
                    {t}
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
