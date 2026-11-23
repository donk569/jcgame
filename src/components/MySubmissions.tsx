import { useEffect, useState } from 'react';
import { fetchMySubmissions, type Submission } from '@/api/moderation';
import { useAppStore } from '@/store/AppStore';

const statuses = { pending: '待审核', approved: '已通过', rejected: '未通过', hidden: '已下架' };

export function MySubmissions() {
  const { backendUserId } = useAppStore();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    if (!backendUserId) return;
    let active = true;
    setSubmissions([]);
    setUnavailable(false);
    void fetchMySubmissions().then(
      (rows) => { if (active) setSubmissions(rows); },
      () => { if (active) setUnavailable(true); },
    );
    return () => { active = false; };
  }, [backendUserId]);

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
          </li>
        ))}
      </ul>
    </section>
  );
}
