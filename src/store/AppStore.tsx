/**
 * 全局状态容器：登录态 / 收藏 / 点赞 / 关注。
 *
 * 现在是 localStorage 持久化（刷新不丢）。
 * 接真后端时：把 load/persist 换成 API 调用，组件代码不用动。
 * 不引入额外依赖——一个 Context + 三个字符串数组够这个阶段用。
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

const KEY = 'jcgame:state:v1';

interface PersistedState {
  saved: string[]; // game slug
  liked: string[]; // game slug
  following: string[]; // creator handle
}

const EMPTY: PersistedState = { saved: [], liked: [], following: [] };

function load(): PersistedState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      saved: Array.isArray(parsed.saved) ? parsed.saved : [],
      liked: Array.isArray(parsed.liked) ? parsed.liked : [],
      following: Array.isArray(parsed.following) ? parsed.following : [],
    };
  } catch {
    return EMPTY;
  }
}

interface StoreValue extends PersistedState {
  toggleSaved: (slug: string) => boolean;
  toggleLiked: (slug: string) => boolean;
  toggleFollowing: (handle: string) => boolean;
  isSaved: (slug: string) => boolean;
  isLiked: (slug: string) => boolean;
  isFollowing: (handle: string) => boolean;
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

  const makeToggle = useCallback(
    (field: keyof PersistedState) =>
      (key: string): boolean => {
        // 先看当前值，算出切换后的状态，返回给调用方做 toast 文案
        const current = state[field].includes(key);
        const next = !current;
        setState((prev) => ({
          ...prev,
          [field]: next
            ? [...prev[field], key]
            : prev[field].filter((x) => x !== key),
        }));
        return next;
      },
    [state],
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
    }),
    [state, makeToggle],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useAppStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useAppStore 必须在 AppStoreProvider 内使用');
  return ctx;
}
