import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { SiteHeader } from './components/SiteHeader';
import { SiteFooter } from './components/SiteFooter';
import { ToastProvider } from './components/Toast';
import Home from './pages/Home';
import Explore from './pages/Explore';
import GameDetail from './pages/GameDetail';
import Upload from './pages/Upload';
import Creator from './pages/Creator';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthCallback from './pages/AuthCallback';
import { useAppStore } from './store/AppStore';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, authReady } = useAppStore();
  const location = useLocation();
  // 会话还没确认完：先别判定未登录，否则刷新受保护页会被瞬间踢去登录
  if (!authReady) {
    return (
      <div className="wrap flex min-h-[60vh] items-center justify-center py-20">
        <span className="text-[13px] text-muted">正在确认登录状态…</span>
      </div>
    );
  }
  if (!user) {
    return <Navigate to={`/login?from=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  return <>{children}</>;
}

function PageFrame() {
  const location = useLocation();
  const reduce = useReducedMotion();

  return (
    <motion.main
      key={location.pathname}
      id="main"
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: [0.22, 0.68, 0, 1] }}
    >
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/game/:slug" element={<GameDetail />} />
        <Route path="/upload" element={<RequireAuth><Upload /></RequireAuth>} />
        <Route path="/creator/:handle" element={<Creator />} />
        <Route path="/me" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </motion.main>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:rounded-[2px] focus:bg-brand focus:px-3 focus:py-2 focus:text-[13px] focus:font-semibold focus:text-brand-ink"
      >
        跳到主要内容
      </a>
      <ScrollToTop />
      <SiteHeader />
      <PageFrame />
      <SiteFooter />
    </ToastProvider>
  );
}
