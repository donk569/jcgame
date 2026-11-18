import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Check } from '@phosphor-icons/react';
import { GamePost } from '@/components/GameCard';
import { useToast } from '@/components/Toast';
import { useAppStore } from '@/store/AppStore';
import { formatCount } from '@/lib/format';
import { getCurrentUser } from '@/api';
import { useCreator, useGamesByCreator } from '@/hooks/useData';
import NotFound from './NotFound';

export default function Creator() {
  const { handle } = useParams();
  const creator = useCreator(handle);
  const toast = useToast();
  const store = useAppStore();
  const following = handle ? store.isFollowing(handle) : false;
  const [tab, setTab] = useState<'works' | 'about'>('works');

  if (!creator) return <NotFound />;

  // 当前用户在资料页改过的内容，公开主页跟着变
  const isSelf = creator.handle === getCurrentUser().handle;
  const shown = isSelf && store.profile
    ? { ...creator, name: store.profile.name, bio: store.profile.bio }
    : creator;
  const works = useGamesByCreator(creator.handle);
  const totalPlays = works.reduce((s, g) => s + g.plays, 0);

  return (
    <div className="wrap pb-10 pt-2">
      {/* 横幅 */}
      <div className="relative overflow-hidden rounded-none border border-line-soft">
        <div className="relative h-[200px] md:h-[260px]">
          {works[0] && (
            <img
              src={works[0].keyart ?? works[0].cover}
              alt=""
              className="h-full w-full object-cover opacity-55"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/55 to-transparent" />
          <div
            className="absolute inset-0 mix-blend-screen"
            style={{ background: `linear-gradient(120deg, ${creator.accent}44, transparent 58%)` }}
          />
          <div className="noise absolute inset-0" />
        </div>

        <div className="relative -mt-14 px-5 pb-6 md:px-8">
          <div className="flex flex-wrap items-end gap-5">
            <span
              className="grid h-[92px] w-[92px] shrink-0 place-items-center rounded-none text-[32px] font-bold shadow-[0_20px_40px_-20px_#000]"
              style={{
                background: 'var(--color-ink-900)',
                color: creator.accent,
                border: `2px solid ${creator.accent}80`,
                boxShadow: '0 18px 40px -20px #000',
              }}
              aria-hidden="true"
            >
              {shown.name.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-[clamp(1.8rem,3vw,2.5rem)] font-extrabold tracking-[-0.035em]">
                {shown.name}
              </h1>
              <div className="mono mt-1.5 text-muted">
                @{creator.handle} · {creator.location} · 加入于 {creator.since}
              </div>
            </div>
            <div className="flex items-center gap-2">
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
      </div>

      {/* 标签页 */}
      <div className="mt-8">
        <div className="relative mb-6 inline-flex gap-1 rounded-none border border-line-soft bg-ink-800 p-1">
          {(
            [
              ['works', `作品 ${works.length}`],
              ['about', '关于'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`relative rounded-[2px] px-3.5 py-2 text-[13px] transition-colors ${
                tab === key ? 'text-bone' : 'text-muted hover:text-bone'
              }`}
            >
              {tab === key && (
                <motion.span
                  layoutId="creator-tab"
                  className="absolute inset-0 rounded-[2px] bg-ink-600"
                  transition={{ type: 'spring', stiffness: 340, damping: 30 }}
                />
              )}
              <span className="relative z-[1]">{label}</span>
            </button>
          ))}
        </div>

        {tab === 'works' ? (
          works.length ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {works.map((g) => (
                <GamePost key={g.slug} game={g} ratio="portrait" />
              ))}
              <Link
                to="/explore"
                className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-none border border-dashed border-line text-muted transition-colors hover:border-brand hover:text-brand"
              >
                <span className="text-[13px]">去探索更多作品</span>
                <ArrowUpRight size={16} weight="bold" />
              </Link>
            </div>
          ) : (
            <p className="text-[13.5px] text-muted">还没发布作品。</p>
          )
        ) : (
          <div className="max-w-[62ch] space-y-4 rounded-none border border-line-soft bg-ink-800 p-6 text-[14px] leading-[1.75] text-bone-dim">
            <p>{shown.bio}</p>
            <p className="text-muted">
              {shown.name} 在 {creator.since} 加入 JCGame，目前发布 {works.length} 款作品。
              所有作品都可以在浏览器直接试玩或下载客户端。
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
