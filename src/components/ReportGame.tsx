import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { reportGame } from '@/api/moderation';
import { HAS_BACKEND } from '@/api/supabase';
import { useAppStore } from '@/store/AppStore';

export function ReportGame({ slug }: { slug: string }) {
  const { backendUserId } = useAppStore();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<'success' | 'error'>();
  if (!HAS_BACKEND) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || reason.trim().length < 3) return;
    setBusy(true);
    try {
      await reportGame(slug, reason.trim());
      setStatus('success');
      setOpen(false);
    } catch {
      setStatus('error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="border-t border-line pt-4">
      {status === 'success' ? (
        <p role="status" className="text-sm text-bone-dim">举报已提交。</p>
      ) : !backendUserId ? (
        <Link to={`/login?from=${encodeURIComponent(location.pathname)}`} className="link-underline text-sm text-muted">
          登录后举报作品
        </Link>
      ) : (
        <>
          <button className="link-underline text-sm text-muted" onClick={() => setOpen(!open)} aria-expanded={open}>
            举报作品
          </button>
          {open && (
            <form className="mt-3 space-y-2" onSubmit={submit}>
              <label className="field-label" htmlFor="report-reason">举报原因</label>
              <textarea id="report-reason" className="input" rows={3} maxLength={500} required
                value={reason} onChange={(event) => setReason(event.target.value)} />
              {status === 'error' && <p className="text-sm text-danger" role="alert">提交失败，请稍后重试。</p>}
              <button className="btn btn-ghost btn-sm" disabled={busy || reason.trim().length < 3}>提交举报</button>
            </form>
          )}
        </>
      )}
    </section>
  );
}
