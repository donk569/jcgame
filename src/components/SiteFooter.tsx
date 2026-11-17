import { Link } from 'react-router-dom';
import { ArrowUpRight } from '@phosphor-icons/react';
import { Logo } from './Logo';

const cols = [
  {
    title: '平台',
    links: [
      { label: '探索游戏', to: '/explore' },
      { label: '网页可玩', to: '/explore?mode=web' },
      { label: '客户端下载', to: '/explore?mode=download' },
    ],
  },
  {
    title: '开发者',
    links: [
      { label: '发布游戏', to: '/upload' },
      { label: '上传规范', to: '/upload' },
      { label: '隔离运行说明', to: '/upload' },
    ],
  },
  {
    title: '关于',
    links: [
      { label: '平台理念', to: '/' },
      { label: '社区准则', to: '/' },
      { label: '联系', to: '/' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 pb-4">
      <div className="wrap">
        <div className="relative overflow-hidden rounded-none border border-line-soft bg-ink-800 px-6 py-12 md:px-12">
          <div className="noise absolute inset-0" aria-hidden="true" />
          <div className="relative grid gap-12 md:grid-cols-[1.4fr_2fr]">
            <div>
              <Logo />
              <p className="mt-5 max-w-[32ch] text-[13.5px] leading-relaxed text-muted">
                开放式独立游戏平台。任何引擎、任何平台都能发布，玩家点开就能玩。
              </p>
              <Link to="/upload" className="btn btn-primary btn-sm mt-6">
                发布我的游戏
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              {cols.map((col) => (
                <div key={col.title}>
                  <div className="mono mb-3 text-muted-dim">{col.title}</div>
                  <ul className="space-y-2.5">
                    {col.links.map((l) => (
                      <li key={l.label}>
                        <Link
                          to={l.to}
                          className="group inline-flex items-center gap-1 text-[13.5px] text-bone-dim transition-colors hover:text-brand"
                        >
                          {l.label}
                          <ArrowUpRight
                            size={11}
                            weight="bold"
                            className="opacity-0 transition-opacity group-hover:opacity-100"
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-12 flex flex-col gap-2 border-t border-line-soft pt-6 text-[12px] text-muted-dim sm:flex-row sm:items-center sm:justify-between">
            <span>© 2026 JCGame · 演示版本，数据与下载均为模拟</span>
            <span className="mono">游戏版权归各自开发者所有</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
