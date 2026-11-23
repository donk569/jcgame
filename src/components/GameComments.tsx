import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { fetchCommentPage, HAS_BACKEND, insertComment } from '@/api/backend';
import type { Comment } from '@/api/types';
import { useAppStore } from '@/store/AppStore';

const PAGE_SIZE = 8;
const COMMENT_LIMIT = 1000;

export function GameComments({ gameSlug }: { gameSlug: string }) {
  const store = useAppStore();
  const location = useLocation();
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [remote, setRemote] = useState<{ comments: Comment[]; hasMore: boolean } | null>(null);
  const [readError, setReadError] = useState(false);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [notice, setNotice] = useState('');
  const canPost = HAS_BACKEND ? Boolean(store.backendUserId) : Boolean(store.user);

  useEffect(() => {
    if (!HAS_BACKEND) return;
    let active = true;
    setRemote(null);
    setReadError(false);
    fetchCommentPage(gameSlug, page * PAGE_SIZE, PAGE_SIZE)
      .then((result) => { if (active) setRemote(result); })
      .catch(() => { if (active) setReadError(true); });
    return () => { active = false; };
  }, [gameSlug, page, revision]);

  const local = HAS_BACKEND ? [] : store.comments.filter((comment) => comment.target === gameSlug);
  const comments = HAS_BACKEND ? remote?.comments ?? [] : local.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const hasMore = HAS_BACKEND ? remote?.hasMore ?? false : local.length > (page + 1) * PAGE_SIZE;
  const loading = HAS_BACKEND && !remote && !readError;

  async function post(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = body.trim();
    if (!canPost || sending || !text || text.length > COMMENT_LIMIT) return;
    setSending(true);
    setNotice('');
    setSendError('');
    try {
      if (HAS_BACKEND) {
        await insertComment(gameSlug, text);
      } else if (store.user) {
        store.addComment({
          id: crypto.randomUUID(),
          name: store.user.name,
          text,
          time: new Date().toISOString().slice(0, 10),
          target: gameSlug,
          unread: true,
        });
      }
      setBody('');
      setPage(0);
      setRevision((value) => value + 1);
      setNotice('留言已发布。');
    } catch {
      setSendError('无法发布留言，请稍后重试。');
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="game-section border-t border-line pt-7" aria-labelledby="game-comments-heading">
      <h2 id="game-comments-heading">玩家留言</h2>

      {canPost ? (
        <form className="mt-4" onSubmit={post}>
          <label className="sr-only" htmlFor="game-comment">写下你的留言</label>
          <textarea
            id="game-comment"
            className="input min-h-24 resize-y"
            value={body}
            maxLength={COMMENT_LIMIT}
            onChange={(event) => setBody(event.target.value)}
            placeholder="分享你的游玩感受"
            required
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-[12px] text-muted">{body.length} / {COMMENT_LIMIT}</span>
            <button type="submit" className="btn btn-primary btn-sm" disabled={sending || !body.trim()}>
              {sending ? '正在发布…' : '发布留言'}
            </button>
          </div>
          {sendError && <p role="alert" className="mt-2 text-sm text-danger">{sendError}</p>}
          <p role="status" className="mt-2 text-sm text-muted">{notice}</p>
        </form>
      ) : store.authReady && (
        <p className="mt-3 text-sm text-bone-dim">
          <Link className="link-underline text-brand-hi" to={`/login?from=${encodeURIComponent(location.pathname + location.search)}`}>登录</Link>
          后可以留言。
        </p>
      )}

      <div className="mt-5" aria-busy={loading}>
        {loading && <p role="status" className="text-sm text-muted">正在加载留言…</p>}
        {readError && (
          <div className="flex flex-wrap items-center gap-3">
            <p role="alert" className="text-sm text-muted">留言加载失败。</p>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRevision((value) => value + 1)}>
              重试
            </button>
          </div>
        )}
        {!loading && !readError && comments.length === 0 && (
          <p className="text-sm text-muted">{page > 0 ? '这一页暂无留言。' : '还没有留言。'}</p>
        )}

        <ul className="divide-y divide-line">
          {comments.map((comment) => (
            <li key={comment.id} className="min-w-0 py-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                <span className="font-semibold [overflow-wrap:anywhere]">{comment.name}</span>
                <span className="text-[12px] text-muted">{comment.time}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-bone-dim [overflow-wrap:anywhere]">{comment.text}</p>
              {comment.reply && (
                <div className="mt-3 border-l border-line-bright pl-3 text-sm">
                  <span className="font-medium">开发者回复</span>
                  <p className="mt-1 whitespace-pre-wrap text-bone-dim [overflow-wrap:anywhere]">{comment.reply}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {(page > 0 || hasMore) && (
        <nav aria-label="留言分页" className="mt-3 flex flex-wrap items-center gap-3 border-t border-line pt-3">
          <button type="button" className="btn btn-ghost btn-sm" disabled={page === 0 || loading} onClick={() => setPage(page - 1)}>
            上一页
          </button>
          <span className="text-sm text-muted">第 {page + 1} 页</span>
          <button type="button" className="btn btn-ghost btn-sm" disabled={!hasMore || loading} onClick={() => setPage(page + 1)}>
            下一页
          </button>
        </nav>
      )}
    </section>
  );
}
