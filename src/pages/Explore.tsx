import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FunnelSimple, MagnifyingGlass, X } from '@phosphor-icons/react';
import { GamePost } from '@/components/GameCard';
import { getAllTags } from '@/api';
import { useGames, useCategories, useEngines } from '@/hooks/useData';

const sorts = [
  { value: 'recommended', label: '推荐' },
  { value: 'new', label: '最新发布' },
  { value: 'hot', label: '最热门' },
  { value: 'name', label: '名称' },
] as const;

const allTags = getAllTags();

export default function Explore() {
  const games = useGames();
  const categories = useCategories();
  const engines = useEngines();
  const [params, setParams] = useSearchParams();
  const [visible, setVisible] = useState(9);
  const [sheet, setSheet] = useState(false);

  const q = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const engine = params.get('engine') ?? '';
  const mode = params.get('mode') ?? '';
  const tag = params.get('tag') ?? '';
  const sort = params.get('sort') ?? 'recommended';

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
    setVisible(9);
  };

  const clearAll = () => {
    setParams(new URLSearchParams(), { replace: true });
    setVisible(9);
  };

  const filtered = useMemo(() => {
    const key = q.trim().toLowerCase();
    const list = games.filter((g) => {
      if (category && !g.categories.includes(category)) return false;
      if (engine && g.engine !== engine) return false;
      if (mode && g.runMode !== mode) return false;
      if (tag && !g.tags.includes(tag)) return false;
      if (key) {
        const hay = [g.title, g.titleCn, g.engine, g.studio.name, ...g.tags, ...g.categories]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(key)) return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      switch (sort) {
        case 'new':
          return b.releasedAt.localeCompare(a.releasedAt);
        case 'hot':
          return b.plays - a.plays;
        case 'name':
          return a.titleCn.localeCompare(b.titleCn, 'zh-CN');
        default:
          return b.likes / Math.max(b.plays, 1) - a.likes / Math.max(a.plays, 1);
      }
    });
  }, [q, category, engine, mode, tag, sort]);

  const activeFilters = [
    ['engine', engine],
    ['mode', mode === 'web' ? '网页试玩' : mode === 'download' ? '客户端下载' : ''],
    ['tag', tag],
  ].filter(([, v]) => v);
  const activeCount = activeFilters.length + (category ? 1 : 0);

  const FilterButton = ({
    label,
    current,
    value,
    onClick,
    count,
  }: {
    label: string;
    current: string;
    value: string;
    onClick: () => void;
    count?: number;
  }) => (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-[2px] px-3 py-2 text-left text-[13px] transition-colors ${
        current === value
          ? 'bg-ink-700 text-brand'
          : 'text-bone-dim hover:bg-ink-700/60 hover:text-bone'
      }`}
    >
      <span>{label}</span>
      {count !== undefined && <span className="mono text-muted-dim">{count}</span>}
    </button>
  );

  return (
    <div className="wrap pb-16 pt-4">
      {/* 工具栏：只有一条下划线，不套容器 */}
      <div className="sticky top-[64px] z-30 -mx-1 mb-3 border-b border-line bg-ink-900/92 px-1 pb-2 pt-3 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
          <h1 className="shrink-0 text-[15px] font-semibold">
            探索
            <span className="mono ml-2 align-middle text-[11px] text-muted-dim">
              {filtered.length} 款
            </span>
          </h1>

          <label className="input-line min-w-[160px] flex-1">
            <MagnifyingGlass size={13} weight="bold" className="shrink-0 text-muted" />
            <input
              value={q}
              onChange={(e) => setParam('q', e.target.value)}
              placeholder="搜游戏、引擎、标签"
              aria-label="搜索游戏"
            />
            {q && (
              <button
                onClick={() => setParam('q', '')}
                aria-label="清空搜索"
                className="shrink-0 text-muted hover:text-bone"
              >
                <X size={11} weight="bold" />
              </button>
            )}
          </label>

          <div className="flex shrink-0 items-center gap-1">
            <span className="text-[11px] text-muted-dim">排序</span>
            <select
              value={sort}
              onChange={(e) => setParam('sort', e.target.value)}
              className="select-flat"
              aria-label="排序方式"
            >
              {sorts.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setSheet(true)}
            className="shrink-0 text-[12.5px] text-muted transition-colors hover:text-bone"
          >
            <FunnelSimple size={12} weight="bold" className="mr-1 inline align-[-1px]" />
            筛选
            {activeCount > 0 && <span className="ml-1 text-brand">{activeCount}</span>}
          </button>
        </div>
      </div>

      {/* 分类：横向 chips */}
      <div className="mb-4 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button className="chip shrink-0" data-active={!category} onClick={() => setParam('category', '')}>
          全部
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            className="chip shrink-0"
            data-active={category === c.name}
            onClick={() => setParam('category', category === c.name ? '' : c.name)}
          >
            {c.name}
            <span className="mono text-muted-dim">{c.count}</span>
          </button>
        ))}
      </div>

      {activeFilters.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {activeFilters.map(([key, value]) => (
            <button key={key} className="chip chip-brand" onClick={() => setParam(key, '')}>
              {value}
              <X size={10} weight="bold" />
            </button>
          ))}
          <button onClick={clearAll} className="text-[12.5px] text-muted underline-offset-4 hover:text-bone hover:underline">
            清空
          </button>
        </div>
      )}

      {/* 内容：第一排就在首屏，尺寸不完全相同 */}
      {filtered.length === 0 ? (
        <div className="rounded-none border border-dashed border-line px-6 py-20 text-center">
          <p className="text-[15px] font-medium">这个组合下还没有游戏</p>
          <p className="mx-auto mt-2 max-w-[36ch] text-[13px] leading-relaxed text-muted">
            去掉一两个筛选条件试试，或者换个关键词。平台每小时都有新作品上架。
          </p>
          <button className="btn btn-ghost btn-sm mt-5" onClick={clearAll}>
            清空筛选
          </button>
        </div>
      ) : (
        <>
          <motion.div layout className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {filtered.slice(0, visible).map((g, i) => (
              <motion.div
                layout
                key={g.slug}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i, 8) * 0.03 }}
                className={i < 2 ? 'col-span-2' : 'col-span-1'}
              >
                <GamePost game={g} ratio={i < 2 ? 'wide' : 'portrait'} />
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-10 flex flex-col items-center gap-3">
            <span className="mono text-muted-dim">
              已显示 {Math.min(visible, filtered.length)} / {filtered.length}
            </span>
            {visible < filtered.length ? (
              <button className="btn btn-ghost btn-sm" onClick={() => setVisible((v) => v + 8)}>
                加载更多
              </button>
            ) : (
              <span className="text-[12.5px] text-muted">到底了，换个筛选条件继续找</span>
            )}
          </div>
        </>
      )}

      {/* 筛选面板 */}
      <AnimatePresence>
        {sheet && (
          <motion.div className="fixed inset-0 z-[85]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button
              className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
              onClick={() => setSheet(false)}
              aria-label="关闭筛选"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="absolute right-0 top-0 h-full w-[88%] max-w-[360px] overflow-y-auto border-l border-line bg-ink-850 p-5"
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="text-[15px] font-semibold">筛选</span>
                <button
                  onClick={() => setSheet(false)}
                  className="grid h-8 w-8 place-items-center rounded-[2px] border border-line"
                  aria-label="关闭"
                >
                  <X size={14} weight="bold" />
                </button>
              </div>

              <div className="mono mb-2 text-muted-dim">引擎</div>
              <div className="mb-5">
                <FilterButton label="全部引擎" current={engine} value="" onClick={() => setParam('engine', '')} />
                {engines.map((e) => (
                  <FilterButton
                    key={e.name}
                    label={e.name}
                    count={e.count}
                    current={engine}
                    value={e.name}
                    onClick={() => setParam('engine', e.name)}
                  />
                ))}
              </div>

              <div className="mono mb-2 text-muted-dim">运行方式</div>
              <div className="mb-5">
                <FilterButton label="不限" current={mode} value="" onClick={() => setParam('mode', '')} />
                <FilterButton label="网页试玩" current={mode} value="web" onClick={() => setParam('mode', 'web')} />
                <FilterButton label="客户端下载" current={mode} value="download" onClick={() => setParam('mode', 'download')} />
              </div>

              <div className="mono mb-2 text-muted-dim">标签</div>
              <div className="flex flex-wrap gap-1.5 pb-2">
                {allTags.slice(0, 18).map((t) => (
                  <button
                    key={t}
                    className="chip"
                    data-active={tag === t}
                    onClick={() => setParam('tag', tag === t ? '' : t)}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <button className="btn btn-primary btn-block mt-6" onClick={() => setSheet(false)}>
                查看 {filtered.length} 个结果
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
