import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMySubmissions, type Submission } from '@/api/moderation';
import { setMyGameState } from '@/api/manage';
import { useToast } from '@/components/Toast';
import { useAppStore } from '@/store/AppStore';

const statuses = { pending: '待审核', approved: '已通过', rejected: '未通过', hidden: '已下架' };

export function MySubmissions() {
  const { backendUserId } = useAppStore();
  const toast = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [unavailable, setUnavailable] = useState(false);
  const [busy, setBusy] = useState<string>();

  function load() {
    if (!backendUserId) return;
    setSubmissions([]);
    setUnavailable(false);
    void fetchMySubmissions().then(
      (rows) => setSubmissions(rows),
      () => setUnavailable(true),
    );
  }

  useEffect(() => {
    load();
  }, [backendUserId]);

  async function resubmit(slug: string) {
    if (busy) return;
    setBusy(slug);
    try {
      await setMyGameState(slug, 'pending');
      toast.push('已重新提交审核', 'ok');
      load();
    } catch {
      toast.push('提交失败，请重试');
    } finally {
      setBusy(undefined);
    }
  }

  if (!backendUserId || (!submissions.length && !unavailable)) return null;
  return (
    <section className="mt-7 border-y border-line py-5" aria-label="作品审核进度">
      <h2 className="text-lg">审核进度</h2>
      {unavailable && <p className="mt-2 text-sm text-muted">暂时无法加载审核状态。</p>}
      <ul className="mt-3 divide-y divide-line-soft">
        {submissions.map((entry) => (
          <li key={entry.slug} className="py-3">
            <p className="flex flex-wrap justify-between gap-3 text-sm">
              <strong>{entry.title}</strong><span className="text-warm">{statuses[entry.status]}</span>
            </p>
            {entry.note && <p className="mt-1 text-sm text-muted">{entry.note}</p>}
            {(entry.status === 'rejected' || entry.status === 'hidden') && (
              <p className="mt-2 flex flex-wrap gap-4 text-[12.5px]">
                <Link className="link-underline text-bone-dim hover:text-bone" to={`/upload?edit=${encodeURIComponent(entry.slug)}`}>
                  编辑后重交
                </Link>
                <button
                  className="link-underline text-bone-dim hover:text-bone disabled:opacity-50"
                  disabled={busy === entry.slug}
                  onClick={() => void resubmit(entry.slug)}
                >
                  {busy === entry.slug ? '提交中…' : '直接重新提交'}
                </button>
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
