import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bookmark,
  CaretLeft,
  CaretRight,
  DownloadSimple,
  Heart,
  Play,
  ShareNetwork,
  ShieldCheck,
  X,
} from '@phosphor-icons/react';
import { GamePost } from '@/components/GameCard';
import { PlayModal } from '@/components/PlayModal';
import { useToast } from '@/components/Toast';
import { useAppStore } from '@/store/AppStore';
import { formatBytes, formatCount } from '@/lib/format';
import { useGame, useCreator, useGames } from '@/hooks/useData';
import NotFound from './NotFound';

export default function GameDetail() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const game = useGame(slug);
  const games = useGames();
  const creator = useCreator(game?.studio.handle);
  const toast = useToast();
  const store = useAppStore();
  const saved = slug ? store.isSaved(slug) : false;
  const liked = slug ? store.isLiked(slug) : false;

  const [playOpen, setPlayOpen] = useState(false);
  const [shot, setShot] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    if (params.get('play') === '1' && game?.runMode === 'web') {
      setPlayOpen(true);
      params.delete('play');
      setParams(params, { replace: true });
    }
  }, [params, setParams, game]);

  const related = useMemo(() => {
    if (!game) return [];
    return games
      .filter((g) => g.slug !== game.slug)
      .sort((a, b) => {
        const score = (x: typeof a) =>
          (x.engine === game.engine ? 2 : 0) +
          x.categories.filter((c) => game.categories.includes(c)).length;
        return score(b) - score(a);
      })
      .slice(0, 4);
  }, [game]);

  if (!game) return <NotFound />;

  const shots = game.shots?.length ? game.shots : [game.cover];
  const isWeb = game.runMode === 'web';

  const share = async () => {
    const url = `${window.location.origin}/game/${game.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.push('链接已复制', 'ok');
    } catch {
      toast.push(`复制失败，手动复制：${url}`);
    }
  };

  const actions = (
    <>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => {
          const on = slug ? store.toggleSaved(slug) : false;
          toast.push(on ? '已收藏，去工作台看' : '已取消收藏', 'ok');
        }}
        className={`btn ${saved ? 'btn-primary' : 'btn-ghost'} btn-icon`}
        aria-pressed={saved}
        aria-label={saved ? '取消收藏' : '收藏'}
      >
        <motion.span animate={saved ? { scale: [1, 1.25, 1] } : {}} transition={{ duration: 0.3 }}>
          <Bookmark size={17} weight={saved ? 'fill' : 'regular'} />
        </motion.span>
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => {
          if (slug) store.toggleLiked(slug);
        }}
        className="btn btn-ghost h-[46px] gap-2 px-4"
        aria-pressed={liked}
        aria-label="点赞"
      >
        <motion.span
          animate={liked ? { scale: [1, 1.35, 0.95, 1] } : { scale: 1 }}
          transition={{ duration: 0.42, ease: [0.22, 0.68, 0, 1] }}
          className={liked ? 'text-warm' : ''}
        >
          <Heart size={17} weight={liked ? 'fill' : 'regular'} />
        </motion.span>
        <span className="mono">{formatCount(game.likes + (liked ? 1 : 0))}</span>
      </motion.button>
      <button onClick={share} className="btn btn-ghost btn-icon" aria-label="分享">
        <ShareNetwork size={17} />
      </button>
    </>
  );

  const meta = (
    <>
      <div className="flex flex-wrap items-center gap-2.5">
        {game.categories.map((c) => (
          <Link
            key={c}
            to={`/explore?category=${encodeURIComponent(c)}`}
            className="text-[12px] text-bone-dim transition-colors hover:text-brand"
          >
            {c}
          </Link>
        ))}
        <span className="h-3 w-px bg-line" aria-hidden="true" />
        <span className={`text-[12px] ${isWeb ? 'text-teal' : 'text-warm'}`}>
          {isWeb ? '网页试玩' : '客户端下载'}
        </span>
      </div>
      <h1 className="mt-3 text-[clamp(2.1rem,4.4vw,3.6rem)] font-extrabold leading-none tracking-[-0.04em] text-bone">
        {game.titleCn}
      </h1>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] text-bone-dim">
        <Link
          to={`/creator/${game.studio.handle}`}
          className="link-underline font-medium hover:text-brand"
        >
          {game.studio.name}
        </Link>
        <span className="text-bone-dim/40">/</span>
        <span className="mono text-muted">{game.title}</span>
        <span className="text-bone-dim/40">/</span>
        <span className="mono text-muted">v{game.version}</span>
      </div>
      <p className="mt-3 max-w-[46ch] text-[14px] leading-relaxed text-bone-dim">
        {game.tagline}
      </p>
    </>
  );

  return (
    <div className="pb-10">
      {/* ---------- 主视觉：有横版主视觉就铺满，只有竖封面就左右并排 ---------- */}
      <div className="wrap pt-2">
        {game.keyart ? (
          <div className="relative overflow-hidden">
            <img
              src={game.keyart}
              alt=""
              className="h-[340px] w-full object-cover md:h-[440px] lg:h-[500px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/55 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-5 p-5 md:p-8">
              <div className="min-w-0">{meta}</div>
              <div className="flex items-center gap-2">{actions}</div>
            </div>
          </div>
        ) : (
          <div className="grid gap-7 pt-3 md:grid-cols-[238px_1fr] md:gap-10">
            <img
              src={game.cover}
              alt={`${game.titleCn} 封面`}
              className="w-full max-w-[238px] object-cover"
            />
            <div className="flex min-w-0 flex-col justify-center">
              {meta}
              <div className="mt-7 flex items-center gap-2">{actions}</div>
            </div>
          </div>
        )}
      </div>

      <div className="wrap mt-5 grid-12">
        {/* ---------- 主列 ---------- */}
        <div className="col-span-12 lg:col-span-8">
          {/* 试玩 / 下载：画面本身就是容器，不套彩色框 */}
          <section>
            {isWeb ? (
              <button
                onClick={() => setPlayOpen(true)}
                className="group relative block w-full overflow-hidden text-left"
                aria-label={`试玩 ${game.titleCn}`}
              >
                <img
                  src={shots[0] ?? game.cover}
                  alt=""
                  className="aspect-[16/9] w-full object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.22,0.68,0,1)] group-hover:scale-[1.02]"
                />
                {/* 只在中心压一层轻暗，保证按钮可读，不遮画面 */}
                <div className="absolute inset-0 bg-ink-950/25 transition-colors group-hover:bg-ink-950/15" />
                <div className="absolute inset-0 grid place-items-center">
                  <span className="grid h-16 w-16 place-items-center rounded-full border border-bone/40 bg-ink-950/50 backdrop-blur-sm transition-all duration-300 group-hover:scale-105 group-hover:border-bone group-hover:bg-ink-950/70">
                    <Play size={22} weight="fill" className="ml-[2px] text-bone" />
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4">
                  <div className="flex items-center gap-2 text-[13px] text-bone">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal" aria-hidden="true" />
                    点开即玩，无需下载
                  </div>
                  <span className="mono text-[11px] text-bone-dim">
                    {formatBytes(game.webBuild?.bytes ?? 0)}
                  </span>
                </div>
              </button>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4 border-y border-line py-5">
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold">
                    {game.download?.platform} 客户端
                  </div>
                  <p className="mono mt-1.5 text-[11.5px] text-muted">
                    {game.download && formatBytes(game.download.bytes)} · v{game.version} ·{' '}
                    {game.download?.arch}
                  </p>
                </div>
                <button
                  className="btn btn-primary shrink-0"
                  onClick={() => {
                    const url = game.download?.file;
                    if (url && /^https?:/.test(url)) {
                      window.open(url, '_blank', 'noopener');
                    } else {
                      toast.push('这个版本还没挂下载地址');
                    }
                  }}
                >
                  <DownloadSimple size={15} weight="bold" /> 下载
                </button>
              </div>
            )}
          </section>

          {/* 画面：主图 + 缩略图切换 */}
          <section className="mt-6">
            <div className="mb-3 flex items-end justify-between">
              <h2 className="text-[15px] font-semibold">画面</h2>
              <button
                onClick={() => setLightbox(true)}
                className="text-[12.5px] text-muted transition-colors hover:text-brand"
              >
                放大看
              </button>
            </div>
            {(game.shots?.length ?? 0) > 0 && (
            <div className="relative overflow-hidden bg-ink-900">
              <AnimatePresence mode="wait">
                <motion.img
                  key={shots[shot]}
                  src={shots[shot]}
                  alt={`${game.titleCn} 画面 ${shot + 1}`}
                  className="aspect-[16/9] w-full object-cover"
                  initial={{ opacity: 0, scale: 1.01 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.22, 0.68, 0, 1] }}
                />
              </AnimatePresence>
            </div>
            )}
            {shots.length > 1 && (
              <div className="mt-2 flex gap-2">
                {shots.map((src, i) => (
                  <button
                    key={src + i}
                    onClick={() => setShot(i)}
                    className={`relative overflow-hidden rounded-[2px] border-2 transition-all ${
                      i === shot ? 'border-brand' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                    aria-label={`第 ${i + 1} 张画面`}
                    aria-pressed={i === shot}
                  >
                    <img src={src} alt="" className="h-14 w-24 object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
            {(!game.shots || game.shots.length === 0) && (
              <p className="mt-2 text-[12px] text-muted-dim">
                开发者只上传了封面，暂无游戏内截图。
              </p>
            )}
          </section>

          {/* 关于 */}
          <section className="mt-8">
            <h2 className="text-[15px] font-semibold">关于这款游戏</h2>
            <div className="mt-3 max-w-[66ch] space-y-4 text-[15px] leading-[1.75] text-bone-dim">
              {game.description.map((p) => (
                <p key={p.slice(0, 12)}>{p}</p>
              ))}
            </div>
          </section>

          {/* 系统要求 / 运行环境 */}
          <section className="mt-8">
            <h2 className="text-[15px] font-semibold">{isWeb ? '运行环境' : '系统要求'}</h2>
            <dl className="mt-3 overflow-hidden rounded-none border border-line-soft">
              {(isWeb
                ? [
                    ['运行方式', '浏览器内运行（WebGL / WASM）'],
                    ['入口文件', game.webBuild?.entry ?? 'index.html'],
                    ['构建体积', formatBytes(game.webBuild?.bytes ?? 0)],
                    ['引擎版本', game.webBuild?.engineVersion ?? game.engineVersion],
                    ['隔离域', game.webBuild?.host ?? '—'],
                  ]
                : (game.download?.requirements ?? []).map((r) => [r.label, r.value])
              ).map(([k, v], i) => (
                <div
                  key={k}
                  className={`flex items-baseline justify-between gap-6 px-4 py-3 ${
                    i % 2 === 0 ? 'bg-ink-800/50' : ''
                  }`}
                >
                  <dt className="shrink-0 text-[13px] text-muted">{k}</dt>
                  <dd className="text-right text-[13px] text-bone-dim">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* 更新日志 */}
          {game.changelog && (
            <section className="mt-8">
              <h2 className="text-[15px] font-semibold">更新日志</h2>
              <ol className="mt-4 space-y-6">
                {game.changelog.map((c) => (
                  <li key={c.version} className="relative pl-5">
                    <span className="absolute left-0 top-[7px] h-[7px] w-[7px] rounded-full bg-brand/70" />
                    <span className="absolute bottom-0 left-[3px] top-5 w-px bg-line" aria-hidden="true" />
                    <div className="flex items-center gap-2.5">
                      <span className="mono text-bone">v{c.version}</span>
                      <span className="mono text-muted-dim">{c.date}</span>
                    </div>
                    <ul className="mt-2 space-y-1.5">
                      {c.notes.map((n) => (
                        <li key={n} className="text-[13.5px] leading-relaxed text-muted">
                          {n}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        {/* ---------- 右栏 ---------- */}
        <aside className="col-span-12 mt-6 lg:col-span-4 lg:mt-0">
          <div className="sticky top-[92px] space-y-3">
            <div className="rounded-none border border-line-soft bg-ink-800 p-5">
              <div className="flex items-center gap-3">
                <span
                  className="avatar-sq h-10 w-10 border border-line text-[14px]"
                  aria-hidden="true"
                >
                  {game.studio.name.slice(0, 1)}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[13.5px] font-semibold">{game.studio.name}</div>
                  <div className="mono mt-0.5 text-muted-dim">
                    {creator ? `${formatCount(creator.followers)} 关注` : '新加入'}
                  </div>
                </div>
                <Link
                  to={`/creator/${game.studio.handle}`}
                  className="ml-auto shrink-0 rounded-[2px] border border-line px-2.5 py-1 text-[12px] text-bone-dim transition-colors hover:border-brand hover:text-brand"
                >
                  主页
                </Link>
              </div>

              <dl className="mt-5 space-y-2.5 border-t border-line-soft pt-4">
                {[
                  ['引擎', game.engine],
                  ['引擎版本', game.engineVersion],
                  ['支持平台', game.platforms.join(' / ')],
                  ['运行方式', isWeb ? '网页试玩' : '客户端下载'],
                  ['版本', `v${game.version}`],
                  ['最后更新', game.updatedAt],
                  ['价格', game.price === 'free' ? '免费' : '付费'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-3">
                    <dt className="text-[12.5px] text-muted">{k}</dt>
                    <dd className="mono text-right text-[12px] text-bone-dim">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="border-t border-line-soft pt-5">
              <div className="mono mb-3 text-muted-dim">标签</div>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {game.tags.map((t) => (
                  <Link
                    key={t}
                    to={`/explore?tag=${encodeURIComponent(t)}`}
                    className="text-[12.5px] text-bone-dim transition-colors hover:text-brand"
                  >
                    {t}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 px-1 text-[11.5px] leading-relaxed text-muted-dim">
              <ShieldCheck size={13} className="mt-0.5 shrink-0" />
              网页版在独立域与沙箱 iframe 中运行，不共享 JCGame 的登录态与本地存储。
            </div>
          </div>
        </aside>
      </div>

      {/* ---------- 相似 ---------- */}
      <section className="wrap mt-14">
        <div className="section-head">
          <h2 className="display-h2">相似的游戏</h2>
          <Link to="/explore" className="text-[13.5px] text-bone-dim hover:text-brand">
            更多
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {related.map((g) => (
            <GamePost key={g.slug} game={g} ratio="portrait" />
          ))}
        </div>
      </section>

      {isWeb && <PlayModal game={game} open={playOpen} onClose={() => setPlayOpen(false)} />}

      {/* ---------- 灯箱 ---------- */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="fixed inset-0 z-[105] flex items-center justify-center bg-ink-950/94 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-[2px] border border-line text-bone"
              onClick={() => setLightbox(false)}
              aria-label="关闭"
            >
              <X size={18} weight="bold" />
            </button>
            <button
              className="absolute left-3 grid h-10 w-10 place-items-center rounded-[2px] border border-line text-bone md:left-8"
              onClick={() => setShot((i) => (i - 1 + shots.length) % shots.length)}
              aria-label="上一张"
            >
              <CaretLeft size={18} weight="bold" />
            </button>
            <img
              src={shots[shot]}
              alt={`${game.titleCn} 画面`}
              className="max-h-[84vh] w-auto max-w-full rounded-none border border-line"
            />
            <button
              className="absolute right-3 grid h-10 w-10 place-items-center rounded-[2px] border border-line text-bone md:right-8"
              onClick={() => setShot((i) => (i + 1) % shots.length)}
              aria-label="下一张"
            >
              <CaretRight size={18} weight="bold" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
