import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Browser,
  CaretRight,
  DownloadSimple,
  Play,
  Sparkle,
} from '@phosphor-icons/react';
import { GamePost, GameRow } from '@/components/GameCard';
import { Reveal } from '@/components/Reveal';
import { SectionHead, TextLink } from '@/components/SectionHead';
import { getCategories, getCreators, getEngines, getGames } from '@/api';
import { formatCount } from '@/lib/format';

const games = getGames();
const categories = getCategories();
const creators = getCreators();
const engines = getEngines();

const byNew = [...games].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
const featured = games[0];
const hot = [games[8], games[3], games[6], games[7], games[10], games[1]];

export default function Home() {
  const reduce = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const [activeCat, setActiveCat] = useState(-1);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '14%']);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.06, 1.14]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0.25]);

  // 鼠标视差：两张浮动封面往反方向走
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 20 });
  const sy = useSpring(my, { stiffness: 120, damping: 20 });
  const fx1 = useTransform(sx, (v) => v * 14);
  const fy1 = useTransform(sy, (v) => v * 10);

  const onHeroMove = (e: React.MouseEvent) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };

  const scrollRow = (dir: number) => {
    rowRef.current?.scrollBy({ left: dir * 380, behavior: 'smooth' });
  };

  return (
    <>
      {/* ================= HERO：满版图像压字 + 画中画 ================= */}
      <section
        ref={heroRef}
        onMouseMove={onHeroMove}
        className="relative -mt-[74px] overflow-hidden pb-10 pt-[74px]"
      >
        <motion.div
          className="absolute inset-0"
          style={reduce ? undefined : { y: bgY, scale: bgScale }}
        >
          <img
            src={featured.keyart ?? featured.cover}
            alt=""
            className="h-full w-full scale-105 object-cover object-center blur-[2px] brightness-[0.95]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/55 to-ink-950/75" />
          <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_78%_18%,#8e6bff24,transparent_65%)]" />
          <div className="noise absolute inset-0" />
        </motion.div>

        <motion.div
          className="wrap relative flex min-h-[calc(100vh-74px)] flex-col justify-center pb-16 pt-20"
          style={reduce ? undefined : { y: contentY, opacity: contentOpacity }}
        >
          <div className="grid-12 items-end gap-y-12">
            <div className="col-span-12 lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/6 px-3 py-1.5 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-teal" />
                <span className="text-[12px] text-bone-dim">
                  本周新增 34 款游戏，12 种引擎
                </span>
              </div>

              <h1 className="display-hero mt-6 text-bone">
                你的游戏，
                <br />
                值得一个更好的货架。
              </h1>

              <p className="mt-6 max-w-[560px] text-[16px] leading-[1.75] text-bone-dim [text-wrap:pretty] max-sm:[text-wrap:balance]">
                JCGame 是开放的游戏发布平台。Unity、Unreal、Godot、Cocos、H5，什么引擎都能发布。
                <br />
                <span className="hidden sm:inline">
                  <br />
                  网页直接试玩，桌面版放安装包。
                </span>
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/upload" className="btn btn-primary btn-lg w-full sm:w-auto">
                  发布我的游戏
                </Link>
                <Link to="/explore" className="btn btn-ghost btn-lg w-full sm:w-auto">
                  看看别人做了什么
                </Link>
              </div>

              <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
                {[
                  ['1,284', '款已上架'],
                  ['416', '位开发者'],
                  ['12', '种引擎与运行时'],
                ].map(([n, label]) => (
                  <div key={label}>
                    <dt className="mono text-[19px] leading-none text-bone">{n}</dt>
                    <dd className="mt-1.5 text-[12px] text-muted">{label}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* 画中画：主面板 + 两张浮出的封面 */}
            <div className="col-span-12 lg:col-span-5">
              <div className="relative mx-auto max-w-[400px] lg:ml-auto lg:mr-0">
                <motion.div
                  style={reduce ? undefined : { x: fx1, y: fy1 }}
                  className="absolute -left-[104px] -top-[74px] hidden w-[92px] rotate-[-8deg] lg:block"
                >
                  <Link to={`/game/${games[8].slug}`} className="block">
                    <img
                      src={games[8].cover}
                      alt={games[1].titleCn}
                      className="rounded-none border border-white/15 shadow-[0_20px_40px_-16px_#000]"
                    />
                    <span className="mt-1.5 block truncate text-center text-[11px] text-bone-dim">
                      {games[8].titleCn}
                    </span>
                  </Link>
                </motion.div>
                <div className="relative rounded-none border border-white/12 bg-ink-950/72 p-2.5 shadow-[0_30px_70px_-30px_#000] backdrop-blur-xl">
                  <div className="relative overflow-hidden rounded-none">
                    <img
                      src={featured.shots?.[0] ?? featured.keyart ?? featured.cover}
                      alt={featured.titleCn}
                      className="aspect-[16/10] w-full object-cover"
                    />
                    <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-ink-950/70 px-2 py-1 text-[11px] text-bone backdrop-blur">
                      <Sparkle size={11} weight="fill" className="text-brand" /> 本周精选
                    </span>
                  </div>
                  <div className="flex items-end justify-between gap-3 px-2 pb-1 pt-3">
                    <div className="min-w-0">
                      <div className="truncate text-[16px] font-semibold">{featured.titleCn}</div>
                      <div className="mono mt-1 truncate text-muted-dim">
                        Unity / WebGL / 62 MB
                      </div>
                    </div>
                    <Link
                      to={`/game/${featured.slug}`}
                      className="btn btn-primary btn-sm shrink-0"
                    >
                      <Play size={12} weight="fill" /> 立刻试玩
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ================= 引擎条 ================= */}
      <div className="wrap">
        <div className="flex items-center gap-4 overflow-x-auto rounded-none border border-line-soft bg-ink-800/60 px-4 py-3 no-scrollbar">
          <span className="mono shrink-0 text-muted-dim">支持的引擎</span>
          <div className="flex shrink-0 items-center gap-1.5">
            {engines.map((e) => (
              <Link
                key={e.name}
                to={`/explore?engine=${encodeURIComponent(e.name)}`}
                className="chip"
              >
                {e.name}
                <span className="mono text-muted-dim">{e.count}</span>
              </Link>
            ))}
          </div>
          <span className="mono ml-auto hidden shrink-0 text-muted-dim md:block">
            不限制构建格式
          </span>
        </div>
      </div>

      {/* ================= 正在热玩：横向 ================= */}
      <section className="mt-16 md:mt-24">
        <div className="wrap">
          <SectionHead
            title="正在热玩"
            note="按最近七天的试玩增长排的，不是总量"
            action={
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => scrollRow(-1)}
                  className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted transition-colors hover:border-line-bright hover:text-bone"
                  aria-label="向左滚动"
                >
                  <ArrowLeft size={14} weight="bold" />
                </button>
                <button
                  onClick={() => scrollRow(1)}
                  className="grid h-9 w-9 place-items-center rounded-full border border-line text-muted transition-colors hover:border-line-bright hover:text-bone"
                  aria-label="向右滚动"
                >
                  <ArrowRight size={14} weight="bold" />
                </button>
              </div>
            }
          />
        </div>
        <div
          ref={rowRef}
          className="flex gap-4 overflow-x-auto pb-3 pl-7 pr-7 pt-1 drag-scroll no-scrollbar md:pl-[calc(50vw-652px)]"
        >
          {hot.map((g) => (
            <div key={g.slug} className="w-[268px] shrink-0 sm:w-[310px]">
              <GamePost game={g} ratio="wide" />
            </div>
          ))}
        </div>
      </section>

      {/* ================= 精选：嵌套容器 ================= */}
      <section className="wrap mt-16 md:mt-24">
        <div className="shell shell-tint-brand noise">
          <div className="relative">
            <SectionHead
              title="编辑精选"
              note="这几款值得你先关掉别的标签页"
              action={<TextLink to="/explore">全部游戏</TextLink>}
            />
            <div className="grid-12 items-start">
              <div className="col-span-12 lg:col-span-8">
                <GamePost
                  game={games[2]}
                  ratio="wide"
                  className="h-[300px] w-full sm:h-[340px] lg:h-[380px] shadow-[0_30px_60px_-30px_#000]"
                />
              </div>
              <div className="col-span-12 lg:col-span-4">
                <GamePost game={games[4]} ratio="portrait" className="h-[300px] w-full sm:h-[340px] lg:h-[380px]" />
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[games[6], games[7], games[10]].map((g) => (
                <Link
                  key={g.slug}
                  to={`/game/${g.slug}`}
                  className="group flex items-center gap-3 rounded-none border border-line-soft bg-ink-900/50 p-2 transition-colors hover:border-line-bright"
                >
                  <img
                    src={g.cover}
                    alt=""
                    className="h-[46px] w-[35px] shrink-0 rounded-[2px] object-cover"
                    loading="lazy"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium transition-colors group-hover:text-brand">
                      {g.titleCn}
                    </span>
                    <span className="mono mt-0.5 block truncate text-muted-dim">
                      {g.engine}
                    </span>
                  </span>
                  <span className="mono shrink-0 text-muted-dim">{formatCount(g.plays)}</span>
                </Link>
              ))}
              <Link
                to="/explore?sort=recommended"
                className="flex items-center justify-between rounded-none border border-line-soft bg-ink-900/50 px-4 py-3 transition-colors hover:border-line-bright"
              >
                <span className="max-w-[24ch] text-[12.5px] leading-relaxed text-muted">
                  每周四更新，三位编辑各自提名，不看数据只看手感。
                </span>
                <ArrowRight size={14} weight="bold" className="shrink-0 text-bone-dim" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 分类：有色瓷砖 ================= */}
      <section className="wrap mt-16 md:mt-24">
        <Reveal>
          <div className="shell shell-tint-teal noise">
            <div className="relative">
              <SectionHead
                title="按分类找"
                note="九个入口，每个后面是一批同类的作品"
                action={<TextLink to="/explore">全部 1,284 款</TextLink>}
              />
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {categories.map((c, i) => (
                  <Link
                    key={c.slug}
                    to={`/explore?category=${encodeURIComponent(c.name)}`}
                    onMouseEnter={() => setActiveCat(i)}
                    onFocus={() => setActiveCat(i)}
                    className="group relative overflow-hidden rounded-[2px] border border-line p-4 transition-colors duration-300 hover:border-line-bright"
                  >
                    <img
                      src={c.preview}
                      alt=""
                      className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                        activeCat === i ? 'opacity-35' : 'opacity-[0.16]'
                      } group-hover:opacity-35`}
                      loading="lazy"
                    />
                    <div className="relative flex items-start justify-between">
                      <div>
                        <div className="text-[16px] font-semibold text-bone">{c.name}</div>
                        <div className="mt-0.5 text-[12.5px] text-bone-dim/85">{c.desc}</div>
                      </div>
                      <CaretRight
                        size={14}
                        weight="bold"
                        className="mt-1 text-bone-dim/50 transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </div>
                    <div className="relative mt-8">
                      <span className="mono text-[11px] text-bone-dim/60">{c.count} 款</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ================= 最新发布：紧凑列表 ================= */}
      <section className="wrap mt-16 md:mt-24">
        <SectionHead
          title="最新上架"
          note="过去 48 小时"
          action={<TextLink to="/explore?sort=new">看更多新品</TextLink>}
        />
        <div className="grid-12">
          <div className="col-span-12 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:col-span-8 lg:grid-cols-4">
            {byNew.slice(0, 4).map((g) => (
              <GamePost key={g.slug} game={g} ratio="portrait" />
            ))}
          </div>
          <div className="col-span-12 lg:col-span-4">
            <div className="rounded-none border border-line-soft bg-ink-800 p-2">
              <div className="mono px-3 py-2 text-muted-dim">最近更新</div>
              {byNew.slice(4, 9).map((g, i) => (
                <GameRow key={g.slug} game={g} index={i} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= 两种运行方式 ================= */}
      <section className="wrap mt-16 md:mt-24">
        <SectionHead
          title="两种发布方式，各走各的路"
          note="统一的是发布信息规范，不是构建产物格式"
        />
        <div className="grid gap-4 md:grid-cols-2">
          <RunPanel
            kind="web"
            icon={<Browser size={16} weight="duotone" />}
            title="网页试玩"
            desc="上传 WebGL / HTML5 / Web Export 构建，平台分配独立运行域名，玩家点开就跑。"
            points={['无需安装，首屏 3 秒内可交互', '独立域名 + 沙箱 iframe 运行', '首包建议控制在 80 MB 以内']}
            shot={games[0].shots?.[1]}
            sample="Unity WebGL · Godot Web · Cocos Web · 静态站点"
          />
          <RunPanel
            kind="download"
            icon={<DownloadSimple size={16} weight="duotone" />}
            title="客户端下载"
            desc="提供桌面构建压缩包，详情页展示文件大小、系统要求与版本更新记录。"
            points={['Windows / macOS / Linux 分平台发布', '版本号 + 更新日志随包记录', '下载前先看系统要求']}
            shot={games[0].keyart}
            sample="Unity Windows · Unreal Win64 · Godot Windows · 自建安装包"
          />
        </div>
      </section>

      {/* ================= 开发者：纸色反色带 ================= */}
      <section className="mt-16 md:mt-24">
        <div className="wrap">
          <div className="relative overflow-hidden rounded-none bg-paper px-6 py-14 text-paper-ink md:px-14 md:py-16">
            <div className="grid-12 items-start">
              <div className="col-span-12 lg:col-span-6">
                <h2 className="text-[clamp(2rem,3.4vw,3.1rem)] font-bold leading-[1.08] tracking-[-0.035em]">
                  把作品放上货架，
                  <br />
                  剩下的交给玩家。
                </h2>
                <p className="mt-5 max-w-[38ch] text-[14.5px] leading-[1.72] text-paper-muted">
                  不用为了上架把游戏改成统一格式，也不用排队等人工审核。填完发布信息就能拿到链接，
                  网页版当场可玩，桌面版直接放包。
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link to="/upload" className="btn btn-ink btn-lg">
                    开始发布
                  </Link>
                  <Link
                    to="/me"
                    className="text-[13.5px] font-medium text-paper-ink/70 underline-offset-4 hover:text-paper-ink hover:underline"
                  >
                    先看我的草稿
                  </Link>
                </div>
              </div>
              <ol className="col-span-12 mt-10 lg:col-span-6 lg:mt-0">
                {[
                  ['打包构建', 'Unity / Unreal / Godot / Cocos 按各自方式导出，网页版传产物目录，桌面版传压缩包。'],
                  ['填写发布信息', '封面、截图、分类、引擎、支持的平台和版本号 —— 只填一次，之后更新复用。'],
                  ['选择运行方式', '网页试玩或客户端下载，同一个游戏也可以两种都给。'],
                ].map(([title, desc], i) => (
                  <li
                    key={title}
                    className="flex gap-5 border-t border-paper-ink/12 py-5 first:border-t-0 first:pt-0"
                  >
                    <span className="mono shrink-0 pt-1 text-paper-muted">0{i + 1}</span>
                    <div>
                      <div className="text-[16px] font-semibold">{title}</div>
                      <p className="mt-1.5 max-w-[42ch] text-[13.5px] leading-relaxed text-paper-muted">
                        {desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 开发者：灰米色便签 ================= */}
      <section className="wrap mt-16 md:mt-24">
        <SectionHead title="平台上的开发者" note="大多是 1 到 3 个人" />
        <div className="grid gap-3 sm:grid-cols-3">
          {creators.slice(0, 3).map((c) => (
            <Link
              key={c.handle}
              to={`/creator/${c.handle}`}
              className="group bg-note px-5 py-5 text-note-ink transition-colors duration-200 hover:bg-note-hi"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="avatar-sq on-note h-10 w-10 text-[14px]" aria-hidden="true">
                  {c.name.slice(0, 1)}
                </span>
                <span className="mono text-[10px] text-note-ink/55">
                  {games.filter((g) => g.studio.handle === c.handle).length} 款
                </span>
              </div>
              <div className="serif mt-6 text-[15px] leading-none">{c.name}</div>
              <p className="mt-2 line-clamp-2 text-[11.5px] leading-relaxed text-note-ink/65">
                {c.bio}
              </p>
            </Link>
          ))}
        </div>
      </section>

    </>
  );
}

function RunPanel({
  kind,
  icon,
  title,
  desc,
  points,
  shot,
  sample,
}: {
  kind: 'web' | 'download';
  icon: React.ReactNode;
  title: string;
  desc: string;
  points: string[];
  shot?: string;
  sample: string;
}) {
  const accent = kind === 'web' ? 'var(--color-teal)' : 'var(--color-brand)';
  return (
    <div className="overflow-hidden rounded-none border border-line-soft bg-ink-800">
      {/* 迷你设备框：让说明变成"看得见的东西" */}
      <div className="p-3 pb-0">
        <div className="overflow-hidden rounded-none border border-line bg-ink-950">
          <div className="flex items-center gap-2 border-b border-line-soft px-3 py-2">
            {kind === 'web' ? (
              <>
                <span className="flex gap-1" aria-hidden="true">
                  <i className="h-2 w-2 rounded-full bg-line-bright" />
                  <i className="h-2 w-2 rounded-full bg-line-bright" />
                  <i className="h-2 w-2 rounded-full bg-line-bright" />
                </span>
                <span className="mono ml-1 truncate rounded-[5px] bg-ink-800 px-2 py-0.5 text-[10.5px] text-muted-dim">
                  neon-drift.jcgame.run
                </span>
              </>
            ) : (
              <>
                <DownloadSimple size={12} weight="bold" className="text-muted-dim" />
                <span className="mono truncate text-[10.5px] text-muted-dim">
                  NeonDrift-1.4.2-win64.zip · 62 MB
                </span>
              </>
            )}
          </div>
          <div className="relative">
            <img
              src={shot ?? ''}
              alt=""
              className="aspect-[16/9] w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/55 via-transparent to-transparent" />
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-2" style={{ color: accent }}>
          {icon}
          <span className="text-[13px] font-semibold" style={{ color: 'var(--color-bone)' }}>
            {title}
          </span>
        </div>
        <p className="mt-3 text-[13.5px] leading-relaxed text-bone-dim">{desc}</p>
        <ul className="mt-4 space-y-2">
          {points.map((p) => (
            <li key={p} className="flex gap-2.5 text-[13px] text-bone-dim/80">
              <span
                className="mt-[9px] h-[1px] w-2.5 shrink-0 bg-line-bright"
                aria-hidden="true"
              />
              {p}
            </li>
          ))}
        </ul>
        <div className="mono mt-5 border-t border-line-soft pt-3 text-muted-dim">{sample}</div>
      </div>
    </div>
  );
}
