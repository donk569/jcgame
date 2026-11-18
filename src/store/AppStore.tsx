/**
 * 全局状态容器：身份 / 收藏 / 点赞 / 关注 / 资料 / 草稿 / 发布 / 评论。
 *
 * 现在是 localStorage 持久化（刷新不丢，跨设备不丢不了）。
 * 接真后端时：把 load/persist 换成 API 调用，组件代码不用动。
 * 不引入额外依赖——一个 Context + 几个数组够这个阶段用。
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Game } from '@/api/types';

const KEY = 'jcgame:state:v2';

const SEED_COMMENTS: Comment[] = [
  { id: 'seed-1', name: '林深见鹿', time: '2 小时前', target: '半光 / 第 7 关', text: '灯灭之后靠记忆走的那段太狠了，但走过去真的很爽。希望加个「只看影子」的辅助模式。', unread: true },
  { id: 'seed-2', name: 'kk_1993', time: '昨天', target: '半光 / 整体', text: '26 关打完了，最后一关的存档点位置有点劝退，其他都好。', unread: true },
  { id: 'seed-3', name: 'NINE', time: '11-14', target: '半光 / 音效', text: '雨声那层做得太好了，戴耳机玩完全是另一种体验。', unread: false },
];

/** 上传表单的持久化形态（封面等文件只存名字，原型阶段不存真实文件） */
export interface DraftForm {
  title: string;
  titleEn: string;
  tagline: string;
  developer: string;
  cats: string[];
  tags: string[];
  coverName: string;
  shotNames: string[];
  runMode: 'web' | 'download';
  engine: string;
  engineOther: string;
  version: string;
  changelog: string;
  savedAt: string;
}

export interface Draft {
  id: string;
  form: DraftForm;
  progress: number;
}

export interface Comment {
  id: string;
  name: string;
  text: string;
  time: string;
  target: string;
  unread: boolean;
  reply?: string;
}

export interface Profile {
  name: string;
  bio: string;
  site: string;
}

interface PersistedState {
  saved: string[]; // game slug
  liked: string[]; // game slug
  following: string[]; // creator handle
  profile: Profile | null;
  drafts: Draft[];
  published: Game[];
  comments: Comment[];
  user: { handle: string; name: string } | null;
}

const EMPTY: PersistedState = {
  saved: [],
  liked: [],
  following: [],
  profile: null,
  drafts: [],
  published: [],
  comments: [],
  user: null,
};

function load(): PersistedState {
  try {
    // 兼容 v1（只有三个数组）
    const v1 = localStorage.getItem('jcgame:state:v1');
    const raw = localStorage.getItem(KEY) ?? v1;
    if (!raw) return EMPTY;
    const p = JSON.parse(raw) as Partial<PersistedState>;
    const arr = (v: unknown): string[] => (Array.isArray(v) ? (v as string[]) : []);
    return {
      saved: arr(p.saved),
      liked: arr(p.liked),
      following: arr(p.following),
      profile: p.profile ?? null,
      drafts: Array.isArray(p.drafts) ? (p.drafts as Draft[]) : [],
      published: Array.isArray(p.published) ? (p.published as Game[]) : [],
      comments: Array.isArray(p.comments) && p.comments.length > 0
        ? (p.comments as Comment[])
        : SEED_COMMENTS,
      user: p.user ?? null,
    };
  } catch {
    return EMPTY;
  }
}

function persist(next: PersistedState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // 隐私模式 / 配额满：静默降级为内存态
  }
}

interface StoreValue extends PersistedState {
  toggleSaved: (slug: string) => boolean;
  toggleLiked: (slug: string) => boolean;
  toggleFollowing: (handle: string) => boolean;
  isSaved: (slug: string) => boolean;
  isLiked: (slug: string) => boolean;
  isFollowing: (handle: string) => boolean;
  saveDraft: (form: DraftForm, progress: number) => void;
  removeDraft: (id: string) => void;
  addPublished: (game: Game) => void;
  saveProfile: (profile: Profile) => void;
  addComment: (comment: Comment) => void;
  replyComment: (id: string, reply: string) => void;
  login: (handle: string, name: string) => void;
  logout: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // 隐私模式 / 配额满：静默降级为内存态
    }
  }, [state]);

  // 所有写操作统一走 commit：setState + 同步落盘，避免 effect 时序问题
  const commit = useCallback(
    (fn: (prev: PersistedState) => PersistedState) =>
      setState((prev) => {
        const next = fn(prev);
        persist(next);
        return next;
      }),
    [],
  );

  const makeToggle = useCallback(
    (field: 'saved' | 'liked' | 'following') =>
      (key: string): boolean => {
        const next = !state[field].includes(key);
        commit((prev) => ({
          ...prev,
          [field]: next ? [...prev[field], key] : prev[field].filter((x) => x !== key),
        }));
        return next;
      },
    [state, commit],
  );

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      toggleSaved: makeToggle('saved'),
      toggleLiked: makeToggle('liked'),
      toggleFollowing: makeToggle('following'),
      isSaved: (slug) => state.saved.includes(slug),
      isLiked: (slug) => state.liked.includes(slug),
      isFollowing: (handle) => state.following.includes(handle),
      saveDraft: (form, progress) =>
        commit((prev) => {
          // 同名草稿覆盖，不重复堆
          const rest = prev.drafts.filter((d) => d.form.title !== form.title || !form.title);
          return {
            ...prev,
            drafts: [
              { id: `d-${Date.now()}`, form, progress },
              ...rest,
            ].slice(0, 12),
          };
        }),
      removeDraft: (id) =>
        commit((prev) => ({ ...prev, drafts: prev.drafts.filter((d) => d.id !== id) })),
      addPublished: (game) =>
        commit((prev) => ({
          ...prev,
          published: [game, ...prev.published.filter((g) => g.slug !== game.slug)],
        })),
      saveProfile: (profile) => commit((prev) => ({ ...prev, profile })),
      addComment: (comment) =>
        commit((prev) => ({ ...prev, comments: [comment, ...prev.comments] })),
      replyComment: (id, reply) =>
        commit((prev) => ({
          ...prev,
          comments: prev.comments.map((c) =>
            c.id === id ? { ...c, reply, unread: false } : c,
          ),
        })),
      login: (handle, name) => commit((prev) => ({ ...prev, user: { handle, name } })),
      logout: () => commit((prev) => ({ ...prev, user: null })),
    }),
    [state, makeToggle, commit],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useAppStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useAppStore 必须在 AppStoreProvider 内使用');
  return ctx;
}
