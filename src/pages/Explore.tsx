import { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FunnelSimple, MagnifyingGlass, X } from '@phosphor-icons/react';
import { CatalogTile } from '@/components/GameCard';
import { useGames, useCategories, useEngines } from '@/hooks/useData';

const sorts = [
  { value: 'recommended', label: '推荐' },
  { value: 'new', label: '最新发布' },
  { value: 'hot', label: '最热门' },
  { value: 'name', label: '名称' },
] as const;

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
    aria-pressed={current === value}
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

export default function Explore() {
  const games = useGames();
  const allTags = useMemo(() => [...new Set(games.flatMap((game) => game.tags))].sort(), [games]);
  const categories = useCategories();
  const engines = useEngines();
  const [params, setParams] = useSearchParams();
  const [visible, setVisible] = useState(9);
  const [sheet, setSheet] = useState(false);
  const sheetRef = useRef<HTMLDialogElement>(null);
  const openFilters = () => {
    sheetRef.current?.showModal();
    setSheet(true);
  };
  const closeFilters = () => sheetRef.current?.close();

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
          // 推荐 = 新作品优先，同等新旧再按互动率。0 数据的新游戏不该沉底。
          return (
            b.releasedAt.localeCompare(a.releasedAt) ||
            b.likes / Math.max(b.plays, 1) - a.likes / Math.max(a.plays, 1)
          );
      }
    });
  }, [games, q, category, engine, mode, tag, sort]);

  const activeFilters = [
    ['engine', engine],
    ['mode', mode === 'web' ? '网页试玩' : mode === 'download' ? '客户端下载' : ''],
    ['tag', tag],
  ].filter(([, v]) => v);
  const activeCount = activeFilters.length + (category ? 1 : 0);

  return (
    <div className="wrap inner-page catalog-page">
      <header className="inner-heading catalog-heading">
        <h1>探索游戏</h1>
        <span className="catalog-count" aria-live="polite">{filtered.length} 款作品</span>
      </header>

      <div className="catalog-controls">
        <div className="catalog-search">
          <MagnifyingGlass size={18} className="shrink-0" aria-hidden="true" />
          <input value={q} onChange={(e) => setParam('q', e.target.value)}
            placeholder="搜索游戏、作者或标签" aria-label="搜索游戏" />
          {q && (
            <button type="button" onClick={() => setParam('q', '')} aria-label="清空搜索">
              <X size={16} />
            </button>
          )}
        </div>
        <div className="catalog-options">
          <select value={sort} onChange={(e) => setParam('sort', e.target.value)} aria-label="排序方式">
            {sorts.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <button type="button" aria-expanded={sheet} onClick={openFilters}>
            <FunnelSimple size={17} aria-hidden="true" />
            筛选{activeFilters.length > 0 && <span className="text-brand">{activeFilters.length}</span>}
          </button>
        </div>
      </div>

      <div className="catalog-categories" aria-label="游戏分类" role="group">
        {[{ name: '全部', value: '' }, ...categories.map((c) => ({ name: c.name, value: c.name }))]
          .map(({ name, value }) => (
            <button key={value} aria-pressed={category === value} onClick={() => setParam('category', category === value ? '' : value)}>
              {name}
            </button>
          ))}
      </div>

      {activeCount > 0 && (
        <div className="catalog-applied">
          {activeFilters.map(([key, value]) => (
            <button className="chip" key={key} onClick={() => setParam(key, '')} aria-label={`移除筛选 ${value}`}>
              {value}<X size={12} aria-hidden="true" />
            </button>
          ))}
          <button className="link-underline" onClick={clearAll}>清空筛选</button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="inner-empty">
          <h2>暂无匹配的游戏</h2>
          <p>换个关键词，或减少筛选条件。</p>
          <button className="btn btn-ghost btn-sm" onClick={clearAll}>清空筛选</button>
        </div>
      ) : (
        <>
          <div className="catalog-grid">
            {filtered.slice(0, visible).map((game) => <CatalogTile key={game.slug} game={game} />)}
          </div>
          {visible < filtered.length && (
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
              <span className="text-[13px] text-muted">已显示 {visible} / {filtered.length}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setVisible((v) => v + 8)}>加载更多</button>
            </div>
          )}
        </>
      )}

      <dialog
        ref={sheetRef}
        className="catalog-filter"
        aria-labelledby="filter-title"
        onClose={() => setSheet(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget && event.clientX < event.currentTarget.getBoundingClientRect().left) {
            closeFilters();
          }
        }}
      >
        <div className="p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 id="filter-title" className="text-[18px] font-semibold">筛选</h2>
            <button
              onClick={closeFilters}
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

          <button className="btn btn-primary btn-block mt-6" onClick={closeFilters}>
            查看 {filtered.length} 个结果
          </button>
        </div>
      </dialog>
    </div>
  );
}
