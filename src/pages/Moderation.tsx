import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchReviewQueue, setGameReview, useCanModerate, type ReviewItem, type Submission } from '@/api/moderation';
import { getDesktopDownloadUrl } from '@/api/distribution';
import { getGameLaunchUrl } from '@/lib/gameLaunch';

export default function Moderation() {
  const canModerate = useCanModerate();
  const [queue, setQueue] = useState<ReviewItem[]>();
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setError('');
    try {
      setQueue(await fetchReviewQueue());
    } catch {
      setError('无法加载审核队列，请重试。');
    }
  }, []);

  useEffect(() => {
    if (canModerate) void refresh();
    else setQueue(undefined);
  }, [canModerate, refresh]);

  return (
    <div className="wrap inner-page">
      <header className="inner-heading"><h1>作品审核</h1></header>
      {!canModerate ? <p>此页面需要审核权限。 <Link to="/me" className="link-underline">返回工作台</Link></p> : (
        <>
          <button className="btn btn-ghost btn-sm" onClick={() => void refresh()}>刷新队列</button>
          {error && <p className="mt-3 text-danger" role="alert">{error}</p>}
          {!queue && !error && <p className="mt-4 text-muted">正在读取审核队列…</p>}
          {queue?.length === 0 && <p className="mt-4 text-muted">没有待处理的作品或举报。</p>}
          {queue?.map((entry) => <ReviewRow key={entry.slug} item={entry} onReviewed={refresh} />)}
        </>
      )}
    </div>
  );
}

function ReviewRow({ item, onReviewed }: { item: ReviewItem; onReviewed: () => Promise<void> }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const launch = getGameLaunchUrl(item.launch_url ?? undefined, window.location.origin);

  async function review(status: Submission['status']) {
    setBusy(true);
    setError('');
    try {
      await setGameReview(item.slug, status, note.trim());
      await onReviewed();
    } catch {
      setError('操作失败，可能有其他审核员先处理了作品。刷新后重试。');
    } finally {
      setBusy(false);
    }
  }

  async function downloadPackage() {
    if (!item.package_path) return;
    try {
      const url = await getDesktopDownloadUrl({
        storagePath: item.package_path, fileName: item.package_name ?? undefined,
        file: '', platform: 'Windows', arch: '', bytes: 0, requirements: [],
      });
      window.location.assign(url);
    } catch {
      setError('无法读取审核包。');
    }
  }

  return (
    <article className="mt-5 space-y-3 border-t border-line py-5">
      <h2 className="text-lg">{item.title}</h2>
      {item.description.map((paragraph, index) => <p key={index} className="text-sm text-bone-dim">{paragraph}</p>)}
      {[item.cover, ...item.shots].some(Boolean) && (
        <div className="flex flex-wrap gap-2" aria-label="待审预览图">
          {[item.cover, ...item.shots].filter(Boolean).map((image, index) => (
            <img key={index} src={image} alt={index === 0 ? '封面' : `截图 ${index}`}
              loading="lazy" referrerPolicy="no-referrer" className="h-28 max-w-full object-contain" />
          ))}
        </div>
      )}
      {item.status === 'approved' && <Link to={`/game/${item.slug}`} className="link-underline text-sm">查看公开详情</Link>}
      {launch && <a href={launch.href} target="_blank" rel="noreferrer" className="block w-fit link-underline text-sm">查看运行地址</a>}
      {item.package_path && <button className="link-underline text-sm" onClick={() => void downloadPackage()}>下载待审安装包</button>}
      {item.reasons.length > 0 && (
        <ul aria-label="举报原因" className="list-inside list-disc text-sm text-bone-dim">
          {item.reasons.map((reason, index) => <li key={index}>{reason}</li>)}
        </ul>
      )}
      <label className="field-label">
        审核备注
        <textarea className="input mt-1" rows={2} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      {error && <p className="text-sm text-danger" role="alert">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => void review('approved')}>
          {item.status === 'pending' ? '审核通过' : '保留作品并结案'}
        </button>
        <button className="btn btn-ghost btn-sm" disabled={busy || !note.trim()}
          onClick={() => void review(item.status === 'pending' ? 'rejected' : 'hidden')}>
          {item.status === 'pending' ? '驳回提交' : '下架并结案'}
        </button>
      </div>
    </article>
  );
}
