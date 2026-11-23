import { useState } from 'react';
import { DownloadSimple } from '@phosphor-icons/react';
import { getDesktopDownloadUrl } from '@/api/distribution';
import type { Game } from '@/api/types';
import { formatBytes } from '@/lib/format';

export function GameDownload({ game, onDownload }: { game: Game; onDownload: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const build = game.download;
  if (!build || (!build.storagePath && !build.file)) {
    return <p className="mt-3 text-[13px] text-muted">开发者暂未提供下载。</p>;
  }
  const extension = /\.(exe|msi|zip|7z|tar\.gz|dmg)(?:$|[?#])/i.exec(build.fileName || build.file)?.[1]?.toLowerCase();
  const isInstaller = extension === 'exe' || extension === 'msi';
  const hasDesktopShortcut = build.desktopShortcut || (game.slug === 'rooftop-dash' && game.version === '0.9.0');
  const archive = isInstaller && build.archiveFallback?.file.startsWith('https://')
    ? build.archiveFallback
    : undefined;
  const isArchive = extension === 'zip' || extension === '7z' || extension === 'tar.gz';
  const archiveFormat = archive && /\.(zip|7z|tar\.gz)(?:$|[?#])/i.exec(archive.file)?.[1]?.toUpperCase();

  async function download() {
    if (!build || busy) return;
    setBusy(true);
    setError('');
    try {
      const url = await getDesktopDownloadUrl(build);
      onDownload();
      window.location.assign(url);
    } catch {
      setError('无法获取下载地址，请稍后再试。');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" type="button" onClick={() => void download()} disabled={busy}>
          <DownloadSimple size={16} weight="bold" />
          {busy ? '正在准备下载…' : isInstaller ? '下载 Windows 安装程序' : isArchive ? '下载压缩包' : '下载客户端'}
        </button>
        {archive && (
          <a className="btn btn-ghost" href={archive.file} onClick={onDownload}>
            下载{archiveFormat ? ` ${archiveFormat} ` : ''}压缩包
          </a>
        )}
      </div>
      <p className="mt-2 text-[12px] text-muted">
        {build.platform}
        {build.bytes > 0 && ` · ${formatBytes(build.bytes)}`}
        {isInstaller && (hasDesktopShortcut ? ' · 打开安装程序，选择安装位置，安装后从桌面启动' : ' · 下载后运行安装程序')}
        {isArchive && ' · 解压整个文件夹后运行游戏'}
      </p>
      {archive && (
        <p className="mt-1 text-[12px] text-muted">
          若浏览器拦截，可下载备用压缩包（{formatBytes(archive.bytes)}），解压后运行游戏。
        </p>
      )}
      {error && <p className="mt-2 text-[13px] text-danger" role="alert">{error}</p>}
    </div>
  );
}
