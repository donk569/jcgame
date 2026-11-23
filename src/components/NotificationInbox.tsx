import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/api/supabase';

const labels = {
  comment: '收到新留言',
  reply: '开发者回复了你的留言',
  approved: '作品审核通过',
  rejected: '作品审核未通过',
  hidden: '作品已下架',
} as const;

interface Notification {
  id: string;
  kind: keyof typeof labels;
  game_slug: string;
  game_title: string;
  detail: string | null;
  created_at: string;
  read_at: string | null;
}

const pageSize = 15;
const date = new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' });

export function NotificationInbox({ userId }: { userId: string }) {
  const [rows, setRows] = useState<Notification[]>([]);
  const [page, setPage] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    void (async () => {
      try {
        const { data, error } = await client.from('notifications')
          .select('id,kind,game_slug,game_title,detail,created_at,read_at')
          .eq('recipient', userId).order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize)
          .abortSignal(controller.signal);
        if (error) throw error;
        if (controller.signal.aborted) return;
        setRows((data ?? []).slice(0, pageSize));
        setHasNext((data?.length ?? 0) > pageSize);
      } catch {
        if (!controller.signal.aborted) {
          setRows([]);
          setHasNext(false);
          setError('暂时无法加载通知，请重试。');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [userId, page, refresh]);

  async function markRead(ids: string[]) {
    if (!supabase || saving || ids.length === 0) return;
    setSaving(true);
    setError('');
    const readAt = new Date().toISOString();
    try {
      const { error } = await supabase.from('notifications').update({ read_at: readAt })
        .eq('recipient', userId).in('id', ids).is('read_at', null);
      if (error) throw error;
      setRows((current) => current.map((row) => ids.includes(row.id) ? { ...row, read_at: readAt } : row));
    } catch {
      setError('无法标为已读，请重试。');
    } finally {
      setSaving(false);
    }
  }

  const unread = rows.filter((row) => !row.read_at).map((row) => row.id);
  return (
    <section className="max-w-[720px]" aria-labelledby="notification-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="notification-heading" className="text-xl">站内通知</h2>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm" type="button" disabled={loading || saving}
            onClick={() => { setPage(0); setRefresh((value) => value + 1); }}>刷新</button>
          <button className="btn btn-ghost btn-sm" type="button" disabled={loading || saving || !unread.length}
            onClick={() => void markRead(unread)}>本页标为已读</button>
        </div>
      </div>
      {error && <p className="mt-4 text-sm text-danger" role="alert">{error}</p>}
      {loading ? <p className="mt-4 text-sm text-muted" role="status">正在加载通知…</p> : (
        <>
          {!rows.length && !error && <p className="mt-4 text-sm text-muted">暂无站内通知。</p>}
          <ul className="mt-4 divide-y divide-line-soft border-y border-line">
            {rows.map((row) => (
              <li key={row.id} className="py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <p className="text-sm font-semibold">
                    {labels[row.kind]}
                    {!row.read_at && <span className="ml-2 text-xs font-normal text-brand">未读</span>}
                  </p>
                  <time className="text-xs text-muted" dateTime={row.created_at}>{date.format(new Date(row.created_at))}</time>
                </div>
                <p className="mt-1 text-sm text-bone-dim [overflow-wrap:anywhere]">
                  《{row.game_title}》{row.detail && <> · {row.detail}</>}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                  {(row.kind === 'comment' || row.kind === 'reply' || row.kind === 'approved') && (
                    <Link className="link-underline text-muted hover:text-bone"
                      to={`/game/${encodeURIComponent(row.game_slug)}`}>查看作品</Link>
                  )}
                  {!row.read_at && (
                    <button className="link-underline text-muted hover:text-bone" type="button" disabled={saving}
                      onClick={() => void markRead([row.id])}>标为已读</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {(page > 0 || hasNext) && (
            <div className="mt-4 flex items-center gap-3">
              <button className="btn btn-ghost btn-sm" type="button" disabled={page === 0 || saving}
                onClick={() => setPage(page - 1)}>上一页</button>
              <span className="text-xs text-muted">第 {page + 1} 页</span>
              <button className="btn btn-ghost btn-sm" type="button" disabled={!hasNext || saving}
                onClick={() => setPage(page + 1)}>下一页</button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
