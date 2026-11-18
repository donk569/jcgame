import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { animate, motion, useReducedMotion } from 'framer-motion';
import { DotsThree, Heart } from '@phosphor-icons/react';
import { GamePost } from '@/components/GameCard';
import { useToast } from '@/components/Toast';
import { getGames, getCurrentUser } from '@/api';
import { formatBytes, formatCount } from '@/lib/format';
import { useGamesByCreator } from '@/hooks/useData';
import { useAppStore } from '@/store/AppStore';

const games = getGames();
const currentUser = getCurrentUser();

/* ------------------------------------------------------------------ */
/* 演示数据（正式环境由接口返回）                                      */
/* ------------------------------------------------------------------ */

const tabs = [
  { key: 'works', label: '作品' },
  { key: 'drafts', label: '草稿' },
  { key: 'saved', label: '收藏' },
  { key: 'liked', label: '点赞' },
  { key: 'profile', label: '资料' },
  { key: 'settings', label: '设置' },
] as const;

type TabKey = (typeof tabs)[number]['key'];

const trend = [
  { day: '一', date: '11-11', v: 1.2 },
  { day: '二', date: '11-12', v: 1.8 },
  { day: '三', date: '11-13', v: 0.9 },
  { day: '四', date: '11-14', v: 2.4 },
  { day: '五', date: '11-15', v: 2.1 },
  { day: '六', date: '11-16', v: 3.2 },
  { day: '日', date: '11-17', v: 1.6 },
];

type Act = {
  kind: 'ship' | 'collect' | 'comment' | 'draft' | 'edit';
  text: string;
  target: string;
  time: string;
  cover?: string;
  fresh?: boolean;
};

const activity: Act[] = [
  { kind: 'ship', text: '上架', target: '半光', time: '刚刚', cover: games[11].cover, fresh: true },
  { kind: 'collect', text: '被 12 人收藏', target: '半光', time: '2 小时前', cover: games[11].cover },
  { kind: 'comment', text: '收到 3 条留言', target: '半光', time: '昨天', cover: games[11].cover },
  { kind: 'draft', text: '保存草稿', target: '雾中列车', time: '11-16' },
];



/* ------------------------------------------------------------------ */
/* 数字：衬线 + 滚动                                                    */
/* ------------------------------------------------------------------ */

function AnimatedNumber({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const [text, setText] = useState(reduce ? formatCount(value) : '0');

  useEffect(() => {
    if (reduce) {
      setText(formatCount(value));
      return;
    }
    const controls = animate(0, value, {
      duration: 1,
      ease: [0.22, 0.68, 0, 1],
      onUpdate: (v) => setText(formatCount(Math.round(v))),
    });
    return () => controls.stop();
  }, [value, reduce]);

  return <span className="tabular-nums">{text}</span>;
}

/* ------------------------------------------------------------------ */
/* 页面                                                                */
/* ------------------------------------------------------------------ */

export default function Dashboard() {
  const store = useAppStore();
  const [tab, setTab] = useState<TabKey>('works');
  const toast = useToast();
  const reduce = useReducedMotion();
  const [profile, setProfile] = useState(() =>
    store.profile ?? { name: currentUser.name, bio: currentUser.bio, site: 'https://example.com' },
  );
  const [notify, setNotify] = useState({ comment: true, update: true, weekly: false });
  const mine = useGamesByCreator(currentUser.handle);
  const featured = mine[0];
  const others = mine.slice(1);
  // 收藏 / 点赞列表跟随全局状态，空列表时走页面里已有的空状态
  const saved = games.filter((g) => store.saved.includes(g.slug));
  const liked = games.filter((g) => store.liked.includes(g.slug));
  const totalPlays = mine.reduce((s, g) => s + g.plays, 0);
  const totalLikes = mine.reduce((s, g) => s + g.likes, 0);

  const fade = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: [0.22, 0.68, 0, 1] as const },
  });

  return (
    <div className="pb-6">
      {/* ================= 身份：通栏，不做卡片 ================= */}
      <section className="relative border-b border-line">
        {featured && (
          <>
            <img
              src={featured.keyart ?? featured.cover}
              alt=""
              className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[46%] object-cover object-center opacity-25 [mask-image:linear-gradient(to_right,transparent,black_45%)] md:block"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-ink-900 via-ink-900/92 to-transparent" />
          </>
        )}

        <div className="wrap relative pb-7 pt-8">
          <div className="flex flex-wrap items-start gap-5">
            {/* 头像：细线圆环 + 衬线字，不用紫色方块 */}
            <motion.button
              {...fade(0)}
              onClick={() => setTab('profile')}
              className="avatar-sq h-[56px] w-[56px] shrink-0 text-[22px] transition-colors hover:border-bone"
              aria-label="编辑头像与资料"
            >
              {currentUser.name.slice(0, 1).toUpperCase()}
            </motion.button>

            <div className="min-w-0 flex-1">
              <motion.h1
                {...fade(0.04)}
                className="serif-title text-[clamp(1.7rem,3vw,2.3rem)] text-bone"
              >
                {currentUser.name}
              </motion.h1>
              <motion.div
                {...fade(0.08)}
                className="mono mt-2 flex flex-wrap items-center gap-x-2 text-muted"
              >
                <span>@{currentUser.handle}</span>
                <span className="text-line-bright">·</span>
                <span>独立开发者</span>
                <span className="text-line-bright">·</span>
                <span>{currentUser.joined} 加入</span>
                <button
                  onClick={() => setTab('profile')}
                  className="ml-1 text-bone-dim underline-offset-4 hover:text-brand hover:underline"
                >
                  编辑资料
                </button>
              </motion.div>
              <motion.p
                {...fade(0.12)}
                className="mt-3 max-w-[42ch] text-[13.5px] leading-relaxed text-bone-dim"
              >
                {currentUser.bio}
              </motion.p>
            </div>


          </div>

          {/* 数据：一行，靠细线分隔，不占视觉中心 */}
          {tab === 'works' && (
            <motion.dl {...fade(0.2)} className="mt-7 flex flex-wrap items-end gap-x-10 gap-y-4">
              {[
                [totalPlays, '累计试玩', 'var(--color-bone)'],
                [totalLikes, '累计收藏', 'var(--color-bone)'],
                [mine.length, '已发布', 'var(--color-teal)'],
                [store.drafts.length, '草稿', 'var(--color-amber)'],
              ].map(([n, label, color]) => (
                <div key={label as string} className="flex items-baseline gap-2">
                  <dd
                    className="serif text-[24px] leading-none"
                    style={{ color: color as string }}
                  >
                    <AnimatedNumber value={n as number} />
                  </dd>
                  <dt className="text-[11.5px] text-muted">{label as string}</dt>
                </div>
              ))}
            </motion.dl>
          )}
        </div>
      </section>

      {/* ================= 分区：下划线选中 ================= */}
      <div className="wrap">
        <div className="mt-2 flex gap-7 overflow-x-auto border-b border-line no-scrollbar">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              data-active={tab === t.key}
              className="tabline shrink-0"
              aria-current={tab === t.key ? 'page' : undefined}
            >
              <span className="flex items-baseline gap-1.5">
                {t.label}
                {t.key === 'drafts' && (
                  <em className="mono not-italic text-muted-dim">{store.drafts.length}</em>
                )}
              </span>
              {tab === t.key && (
                <motion.span
                  layoutId="studio-underline"
                  className="tabline-ink"
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="wrap mt-6">
        {tab === 'works' && (
          <div className="grid-12">
            <div className="col-span-12 lg:col-span-8">
              {featured ? (
                <FeaturedWork game={featured} />
              ) : (
                <Empty
                  title="还没有上架的作品"
                  desc="发布第一个游戏之后，它会以封面大图出现在这里。"
                  action={
                    <Link to="/upload" className="btn btn-brand btn-sm">
                      发布游戏
                    </Link>
                  }
                />
              )}

              {others.length > 0 && (
                <section className="mt-8">
                  <SectionRule title="其他作品" accent="var(--color-brand)" count={others.length} />
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {others.map((g) => (
                      <GamePost key={g.slug} game={g} ratio="wide" />
                    ))}
                  </div>
                </section>
              )}

              <section className="mt-8">
                <SectionRule title="草稿" accent="var(--color-amber)" count={store.drafts.length} note="只有你能看到" />
                <DraftsList />
              </section>

              <section className="mt-8 overflow-hidden rounded-none bg-paper px-5 pb-2 pt-4 text-paper-ink">
                <div className="flex items-baseline gap-3 border-b border-paper-ink/15 pb-2">
                  <span className="mb-[3px] h-3 w-[2px] shrink-0 rounded-full bg-paper-ink/60" aria-hidden="true" />
                  <h2 className="serif text-[15px]">玩家留言</h2>
                  <span className="mono text-[10.5px] text-paper-muted">{store.comments.length}</span>
                </div>
                <div>
                  {store.comments.map((c) => (
                    <div
                      key={c.id}
                      className="flex gap-3 border-b border-paper-ink/12 py-3.5 last:border-0"
                    >
                      <span
                        className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center bg-paper-ink text-[11px] leading-none text-paper"
                        aria-hidden="true"
                      >
                        {c.name.slice(0, 1)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[12.5px] font-semibold text-paper-ink">{c.name}</span>
                          <span className="mono text-[10.5px] text-paper-muted">{c.time}</span>
                          {c.unread && (
                            <span className="h-[5px] w-[5px] bg-paper-ink/70" aria-label="未回复" />
                          )}
                          <button
                            onClick={() => {
                              const text = window.prompt(`回复 ${c.name}：`, c.reply ?? '');
                              if (text !== null && text.trim()) {
                                store.replyComment(c.id, text.trim());
                                toast.push('已回复', 'ok');
                              }
                            }}
                            className="ml-auto text-[11.5px] text-paper-ink/45 hover:text-paper-ink"
                          >
                            {c.reply ? '编辑回复' : '回复'}
                          </button>
                        </div>
                        <p className="mt-1 text-[12.5px] leading-relaxed text-paper-muted">{c.text}</p>
                        {c.reply && (
                          <p className="mt-2 border-l-2 border-paper-ink/30 pl-2.5 text-[12px] leading-relaxed text-paper-ink/70">
                            <span className="mono mr-1.5 text-[10px] text-paper-muted">你</span>
                            {c.reply}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="col-span-12 mt-6 lg:col-span-4 lg:mt-0">
              <div className="space-y-8 lg:sticky lg:top-[92px]">
                <ActivityFeed />
                <TrafficChart />
              </div>
            </aside>
          </div>
        )}

        {tab === 'drafts' && (
          <div className="max-w-[860px]">
            <SectionRule title="草稿" accent="var(--color-amber)" count={store.drafts.length} note="不会出现在探索页" />
            <DraftsList />
          </div>
        )}

        {tab === 'saved' && (
          <section>
            <SectionRule title="收藏" accent="var(--color-brand)" count={saved.length} />
            {saved.length === 0 ? (
              <div className="mt-6 py-12 text-center">
                <p className="text-[13px] text-muted">还没有收藏任何游戏。</p>
                <Link to="/explore" className="link-underline mt-2 inline-block text-[12.5px] text-bone-dim hover:text-bone">
                  去探索页看看 →
                </Link>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {saved.map((g) => (
                  <GamePost key={g.slug} game={g} ratio="portrait" />
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'liked' && (
          <section className="max-w-[860px]">
            <SectionRule title="点赞" accent="var(--color-warm)" count={liked.length} />
            {liked.length === 0 && (
              <p className="mt-6 py-10 text-center text-[13px] text-muted">
                还没有点赞。喜欢的游戏点一下爱心就会出现在这里。
              </p>
            )}
            <div className="mt-1">
              {liked.map((g) => (
                <Link
                  key={g.slug}
                  to={`/game/${g.slug}`}
                  className="group flex items-center gap-3 border-b border-line-soft py-3 last:border-0"
                >
                  <img
                    src={g.cover}
                    alt=""
                    className="h-11 w-8 shrink-0 rounded-[3px] object-cover"
                  />
                  <span className="min-w-0 flex-1 truncate text-[13px] transition-colors group-hover:text-brand">
                    {g.titleCn}
                  </span>
                  <span className="mono hidden shrink-0 text-muted-dim sm:block">
                    {g.engine}
                  </span>
                  <Heart size={13} weight="fill" className="shrink-0 text-warm/70" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {tab === 'profile' && (
          <div className="grid-12">
            <div className="col-span-12 lg:col-span-6">
              <SectionRule title="资料" accent="var(--color-brand)" note="显示在公开主页与作品下方" />
              <div className="mt-5 space-y-5">
                <div>
                  <label className="field-label" htmlFor="p-name">
                    显示名称
                  </label>
                  <input
                    id="p-name"
                    className="input"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="p-handle">
                    主页地址
                  </label>
                  <div className="flex items-center gap-1 border-b border-line py-2">
                    <span className="mono shrink-0 text-muted-dim">jcgame.run/creator/</span>
                    <input
                      id="p-handle"
                      className="w-full bg-transparent text-[14px] outline-none"
                      defaultValue={currentUser.handle}
                    />
                  </div>
                </div>
                <div>
                  <label className="field-label" htmlFor="p-bio">
                    介绍
                  </label>
                  <textarea
                    id="p-bio"
                    className="textarea"
                    value={profile.bio}
                    maxLength={160}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  />
                  <p className="field-hint">{profile.bio.length}/160</p>
                </div>
                <div>
                  <label className="field-label" htmlFor="p-site">
                    个人网站
                  </label>
                  <input
                    id="p-site"
                    className="input"
                    value={profile.site}
                    onChange={(e) => setProfile({ ...profile, site: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-4 pt-1">
                  <button
                    className="btn btn-brand btn-sm"
                    onClick={() => {
                      store.saveProfile(profile);
                      toast.push('资料已保存，公开主页同步更新', 'ok');
                    }}
                  >
                    保存
                  </button>
                  <Link
                    to={`/creator/${currentUser.handle}`}
                    className="link-underline text-[12.5px] text-muted hover:text-bone"
                  >
                    看公开主页
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'settings' && (
          <div className="max-w-[560px]">
            <SectionRule title="账号" accent="var(--color-muted)" />
            <div className="mt-5 space-y-6">
              <div>
                <label className="field-label" htmlFor="s-email">
                  邮箱
                </label>
                <input id="s-email" className="input" defaultValue={currentUser.email} />
              </div>

              <div>
                <div className="field-label">通知</div>
                <div>
                  {(
                    [
                      ['comment', '有人评论我的游戏'],
                      ['update', '我关注的开发者发布新作'],
                      ['weekly', '每周精选邮件'],
                    ] as const
                  ).map(([key, label]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between border-b border-line-soft py-3"
                    >
                      <span className="text-[13px] text-bone-dim">{label}</span>
                      <button
                        role="switch"
                        aria-checked={notify[key]}
                        aria-label={label}
                        onClick={() => setNotify({ ...notify, [key]: !notify[key] })}
                        className={`relative h-[20px] w-[36px] rounded-full border transition-colors ${
                          notify[key] ? 'border-brand/60 bg-brand/20' : 'border-line bg-ink-700'
                        }`}
                      >
                        <motion.span
                          layout
                          transition={{ type: 'spring', stiffness: 400, damping: 26 }}
                          className={`absolute top-[2px] h-[14px] w-[14px] rounded-full ${
                            notify[key] ? 'left-[18px] bg-brand' : 'left-[2px] bg-muted'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="field-label">危险操作</div>
                <p className="mt-1 text-[12px] text-muted">注销会同时下架所有作品，链接永久失效。</p>
                <div className="mt-3 flex gap-2">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      void store.signOut();
                      store.logout();
                      toast.push('已退出登录', 'ok');
                    }}
                  >
                    退出登录
                  </button>
                  <button
                    className="btn btn-ghost btn-sm text-danger"
                    style={{ borderColor: 'color-mix(in srgb, var(--color-danger) 45%, transparent)' }}
                    onClick={() => toast.push('演示环境：注销账号需接后端后开放')}
                  >
                    注销账号
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 主推作品：细线框 + 海报 + 规格行（不重复统计）                       */
/* ------------------------------------------------------------------ */

function FeaturedWork({ game }: { game: (typeof games)[number] }) {
  const toast = useToast();
  const reduce = useReducedMotion();
  const [hover, setHover] = useState(false);

  return (
    <div>
      <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
        <Link
          to={`/game/${game.slug}`}
          className="block w-[132px] shrink-0 self-start sm:w-[158px]"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          <motion.img
            src={game.cover}
            alt={`${game.titleCn} 封面`}
            className="aspect-[3/4] w-full object-cover"
            animate={reduce ? undefined : { scale: hover ? 1.03 : 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          />
        </Link>

        <div className="min-w-0 flex-1">
          <h2 className="serif-title text-[clamp(1.4rem,2.2vw,1.85rem)]">{game.titleCn}</h2>
          <p className="mono mt-1.5 text-muted-dim">{game.title}</p>
          <p className="mt-3 max-w-[34ch] text-[13px] leading-relaxed text-bone-dim">
            {game.tagline}
          </p>

          <dl className="mt-5 space-y-0">
            {[
              ['引擎', `${game.engine} · v${game.version}`],
              ['分类', game.categories.join(' / ')],
              ['体积', formatBytes(game.download?.bytes ?? 0)],
              ['更新', game.updatedAt],
            ].map(([k, v], i) => (
              <div
                key={k}
                className={`flex items-baseline justify-between gap-6 border-t border-line-soft py-2 ${
                  i === 0 ? 'border-t-0' : ''
                }`}
              >
                <dt className="text-[11.5px] text-muted">{k}</dt>
                <dd className="mono text-right text-[11.5px] text-bone">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-5 flex items-center gap-3">
            <Link to={`/game/${game.slug}`} className="btn btn-brand btn-sm">
              查看游戏页
            </Link>
            <button
              onClick={() => toast.push('演示环境：编辑页还没接')}
              className="link-underline text-[12.5px] text-muted hover:text-bone"
            >
              编辑
            </button>
            <button
              onClick={() => toast.push('演示环境：作品设置未接入')}
              className="ml-auto text-muted hover:text-bone"
              aria-label="更多操作"
            >
              <DotsThree size={18} weight="bold" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 草稿：细线行 + 暖色刻度                                             */
/* ------------------------------------------------------------------ */

function DraftsList() {
  const store = useAppStore();
  if (store.drafts.length === 0) {
    return (
      <div className="mt-6 py-12 text-center">
        <p className="text-[13px] text-muted">还没有草稿。</p>
        <Link to="/upload" className="link-underline mt-2 inline-block text-[12.5px] text-bone-dim hover:text-bone">
          去发布页新建 →
        </Link>
      </div>
    );
  }
  return (
    <div className="mt-1">
      {store.drafts.map((d) => (
        <div
          key={d.id}
          className="group flex w-full items-center gap-3 border-b border-line-soft py-3 last:border-0"
        >
          <span className="h-6 w-[2px] shrink-0 rounded-full bg-amber/60" aria-hidden="true" />
          <Link to={`/upload?draft=${encodeURIComponent(d.id)}`} className="flex min-w-0 flex-1 items-center gap-3">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] text-bone-dim transition-colors group-hover:text-bone">
                {d.form.title || 'Untitled'}
              </span>
              <span className="mono mt-1 block text-[10.5px] text-muted-dim">
                {d.form.savedAt} 编辑
              </span>
            </span>
            <span className="hidden min-w-0 flex-1 truncate text-[11.5px] text-muted sm:block">
              {d.form.engine || '未选引擎'} · {d.form.cats.join(' / ') || '未选分类'}
            </span>
            <span className="hidden w-[86px] shrink-0 items-center gap-1.5 sm:flex">
              <span className="h-[2px] flex-1 overflow-hidden rounded-full bg-line">
                <span className="block h-full rounded-full bg-amber/70" style={{ width: `${d.progress}%` }} />
              </span>
              <span className="mono text-[10px] text-muted-dim">{d.progress}%</span>
            </span>
            <span className="shrink-0 text-[11.5px] text-muted opacity-0 transition-opacity group-hover:opacity-100">
              继续 →
            </span>
          </Link>
          <button
            onClick={() => store.removeDraft(d.id)}
            aria-label={`删除草稿 ${d.form.title || 'Untitled'}`}
            className="shrink-0 text-[11px] text-muted-dim transition-colors hover:text-warm"
          >
            删除
          </button>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 动态：细线时间轴                                                    */
/* ------------------------------------------------------------------ */

function ActivityFeed() {
  const reduce = useReducedMotion();
  return (
    <section className="bg-paper px-5 pb-4 pt-4 text-paper-ink">
      <div className="flex items-baseline justify-between border-b border-paper-ink/15 pb-2">
        <h2 className="serif text-[15px]">动态</h2>
        <span className="mono text-[10.5px] text-paper-muted">{activity.length} 条</span>
      </div>
      <ol className="relative mt-3">
        <span className="absolute bottom-2 left-[6px] top-2 w-px bg-paper-ink/15" aria-hidden="true" />
        {activity.map((a, i) => (
          <motion.li
            key={a.text + a.time}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 * i, duration: 0.35, ease: [0.22, 0.68, 0, 1] }}
            className="relative flex gap-3 pb-3.5 last:pb-0"
          >
            <span
              className={`relative z-[1] mt-[5px] h-[7px] w-[7px] shrink-0 ${
                a.fresh ? 'bg-paper-ink' : 'border border-paper-ink/45 bg-paper'
              }`}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] leading-relaxed">
                <span className="text-paper-ink">{a.target}</span>
                <span className="mx-1.5 text-paper-ink/30">·</span>
                <span className="text-paper-ink/75">{a.text}</span>
              </p>
              <span className="mono mt-1 block text-[10px] text-paper-muted">{a.time}</span>
            </div>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 7 天：细线图，柱子用品牌紫，今天用暖色                               */
/* ------------------------------------------------------------------ */

function TrafficChart() {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...trend.map((t) => t.v));

  return (
    <section>
      <SectionRule title="7 天试玩" accent="var(--color-brand)" note="峰值 3.2 万" />
      <div className="relative mt-4 flex h-[72px] items-end gap-[3px]">
        {trend.map((t, i) => {
          const active = hover === i;
          const isToday = i === trend.length - 1;
          return (
            <button
              key={t.day}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className="relative flex h-full flex-1 flex-col justify-end"
              aria-label={`${t.date} 试玩 ${t.v} 万`}
            >
              {active && (
                <motion.span
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -top-0.5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-[3px] border border-line-bright bg-ink-950 px-1.5 py-0.5 text-[10px] text-bone"
                >
                  {t.date} · {t.v} 万
                </motion.span>
              )}
              <motion.span
                initial={{ height: 0 }}
                animate={{ height: `${(t.v / max) * 100}%` }}
                transition={{ delay: 0.08 + i * 0.04, type: 'spring', stiffness: 200, damping: 26 }}
                className={`w-full rounded-[2px] transition-colors ${
                  active ? 'bg-brand' : isToday ? 'bg-warm/70' : 'bg-ink-500'
                }`}
              />
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex gap-[3px] border-t border-line-soft pt-2">
        {trend.map((t, i) => (
          <span
            key={t.day}
            className={`mono flex-1 text-center text-[10px] ${
              i === trend.length - 1 ? 'text-warm' : 'text-muted-dim'
            }`}
          >
            {t.day}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 小件                                                                */
/* ------------------------------------------------------------------ */

/** 章节抬头：一根 2px 的彩色刻度 + 衬线标题 + 计数，代替"卡片标题" */
function SectionRule({
  title,
  accent,
  count,
  note,
}: {
  title: string;
  accent: string;
  count?: number;
  note?: string;
}) {
  return (
    <div className="flex items-baseline gap-3 border-b border-line pb-2">
      <span
        className="mb-[3px] h-3 w-[2px] shrink-0 rounded-full"
        style={{ background: accent }}
        aria-hidden="true"
      />
      <h2 className="serif text-[15px] text-bone">{title}</h2>
      {count !== undefined && <span className="mono text-[10.5px] text-muted-dim">{count}</span>}
      {note && <span className="text-[11px] text-muted-dim">{note}</span>}
    </div>
  );
}

function Empty({
  title,
  desc,
  action,
}: {
  title: string;
  desc: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border border-dashed border-line px-6 py-16 text-center">
      <p className="serif text-[16px] text-bone">{title}</p>
      <p className="mx-auto mt-2 max-w-[36ch] text-[12.5px] leading-relaxed text-muted">{desc}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
