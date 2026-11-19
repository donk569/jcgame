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
import type { Game, Draft, DraftForm, Comment, Profile } from '@/api/types';
import * as backend from '@/api/backend';
import * as auth from '@/api/auth';
import * as captcha from '@/api/captcha';

const KEY = 'jcgame:state:v2';

const SEED_COMMENTS: Comment[] = [
  { id: 'seed-1', name: '林深见鹿', time: '2 小时前', target: '半光 / 第 7 关', text: '灯灭之后靠记忆走的那段太狠了，但走过去真的很爽。希望加个「只看影子」的辅助模式。', unread: true },
  { id: 'seed-2', name: 'kk_1993', time: '昨天', target: '半光 / 整体', text: '26 关打完了，最后一关的存档点位置有点劝退，其他都好。', unread: true },
  { id: 'seed-3', name: 'NINE', time: '11-14', target: '半光 / 音效', text: '雨声那层做得太好了，戴耳机玩完全是另一种体验。', unread: false },
];

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
  signIn: (email: string, password: string) => Promise<{ handle: string; name: string }>;
  signUp: (email: string, password: string, captchaToken: string, handle?: string, name?: string) => Promise<{ needsConfirmation: boolean; email: string }>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  resendCode: (email: string) => Promise<void>;
  signInGithub: (from: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** 后端会话（Supabase Auth 用户），本地演示登录时为 null */
  backendUserId: string | null;
  /** 从后端拉取该用户的收藏/点赞/关注/草稿 */
  syncFromBackend: () => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(load);
  const [backendUserId, setBackendUserId] = useState<string | null>(null);

  // Supabase 会话：登录后把 user_id 记下来，写操作同步落库
  useEffect(() => {
    let alive = true;
    void auth.getSession().then((u) => {
      if (!alive) return;
      if (u) {
        setBackendUserId(u.id);
        // OAuth 回调后必须同步 user，否则 RequireAuth 不认登录态
        setState((prev) => ({ ...prev, user: { handle: u.handle, name: u.name } }));
        void hydrate(u.id);
      }
    });
    const off = auth.onAuthChange((u) => {
      if (!alive) return;
      setBackendUserId(u?.id ?? null);
      // 登录/退出都同步 user 状态；回调页 exchange 成功后会走这里
      setState((prev) => ({
        ...prev,
        user: u ? { handle: u.handle, name: u.name } : null,
      }));
      if (u) void hydrate(u.id);
    });
    return () => {
      alive = false;
      off();
    };
  }, []);

  // 从后端拉该用户的数据，覆盖本地同名状态
  const hydrate = useCallback(async (userId: string) => {
    try {
      const [ug, following, drafts] = await Promise.all([
        backend.fetchUserGames(userId),
        backend.fetchFollowing(userId),
        backend.fetchDrafts(),
      ]);
      setState((prev) => {
        const next: PersistedState = {
          ...prev,
          saved: ug.saved,
          liked: ug.liked,
          following,
          drafts: drafts.length ? drafts : prev.drafts,
        };
        persist(next);
        return next;
      });
    } catch {
      /* 后端不可用时保留本地状态 */
    }
  }, []);

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

  /** 有后端会话时，把写操作同步到 Supabase（失败不影响本地） */
  const sync = useCallback(
    (fn: () => Promise<void>) => {
      if (!backendUserId) return;
      void fn().catch(() => {});
    },
    [backendUserId],
  );

  const makeToggle = useCallback(
    (field: 'saved' | 'liked' | 'following') =>
      (key: string): boolean => {
        const next = !state[field].includes(key);
        commit((prev) => ({
          ...prev,
          [field]: next ? [...prev[field], key] : prev[field].filter((x) => x !== key),
        }));
        if (backendUserId) {
          sync(() =>
            field === 'following'
              ? backend.setFollowing(backendUserId, key, next)
              : backend.setUserGame(backendUserId, key, field, next),
          );
        }
        return next;
      },
    [state, commit, backendUserId, sync],
  );

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      backendUserId,
      syncFromBackend: () => (backendUserId ? hydrate(backendUserId) : Promise.resolve()),
      toggleSaved: makeToggle('saved'),
      toggleLiked: makeToggle('liked'),
      toggleFollowing: makeToggle('following'),
      isSaved: (slug) => state.saved.includes(slug),
      isLiked: (slug) => state.liked.includes(slug),
      isFollowing: (handle) => state.following.includes(handle),
      saveDraft: (form, progress) => {
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
        });
        if (backendUserId) sync(() => backend.insertDraft(form, progress));
      },
      removeDraft: (id) => {
        commit((prev) => ({ ...prev, drafts: prev.drafts.filter((d) => d.id !== id) }));
        if (backendUserId) sync(() => backend.deleteDraft(id));
      },
      addPublished: (game) => {
        commit((prev) => ({
          ...prev,
          published: [game, ...prev.published.filter((g) => g.slug !== game.slug)],
        }));
        if (backendUserId) sync(() => backend.insertGame(game, backendUserId));
      },
      saveProfile: (profile) => {
        commit((prev) => ({ ...prev, profile }));
        if (backendUserId) {
          const handle = state.user?.handle ?? 'player';
          sync(() => backend.saveProfile(backendUserId, handle, profile));
        }
      },
      addComment: (comment) =>
        commit((prev) => ({ ...prev, comments: [comment, ...prev.comments] })),
      replyComment: (id, reply) => {
        commit((prev) => ({
          ...prev,
          comments: prev.comments.map((c) =>
            c.id === id ? { ...c, reply, unread: false } : c,
          ),
        }));
        if (backendUserId) sync(() => backend.replyComment(id, reply));
      },
      login: (handle, name) => commit((prev) => ({ ...prev, user: { handle, name } })),
      // 真后端登录（邮箱密码 / GitHub OAuth）
      signIn: async (email: string, password: string) => {
        const u = await auth.signInWithEmail(email, password);
        commit((prev) => ({ ...prev, user: { handle: u.handle, name: u.name } }));
        await hydrate(u.id);
        return u;
      },
      signUp: async (email: string, password: string, captchaToken: string, handle?: string, name?: string) => {
        // 服务端原子消费滑块凭证：无效/已用/过期/邮箱不符 → 直接拒绝，用户根本不会被创建
        const captchaOk = await captcha.consumeCaptchaToken(captchaToken, email);
        if (!captchaOk) throw new Error('人机验证凭证无效或已过期，请重新验证后再注册');
        const result = await auth.signUpWithEmail(email, password, handle, name);
        if (!result.needsConfirmation) {
          commit((prev) => ({ ...prev, user: { handle: result.user.handle, name: result.user.name } }));
        }
        return { needsConfirmation: result.needsConfirmation, email };
      },
      verifyEmail: async (email: string, code: string) => {
        const u = await auth.verifyEmailCode(email, code);
        commit((prev) => ({ ...prev, user: { handle: u.handle, name: u.name } }));
        await hydrate(u.id);
      },
      resendCode: async (email: string) => {
        await auth.resendConfirmation(email);
      },
      signInGithub: async (from: string) => {
        await auth.signInWithGithub(from);
      },
      signOut: async () => {
        await auth.signOut();
        commit((prev) => ({ ...prev, user: null }));
      },
      logout: () => commit((prev) => ({ ...prev, user: null })),
    }),
    [state, makeToggle, commit, backendUserId, hydrate],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useAppStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useAppStore 必须在 AppStoreProvider 内使用');
  return ctx;
}
