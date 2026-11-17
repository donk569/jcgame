import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
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

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
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
        <Route path="/upload" element={<Upload />} />
        <Route path="/creator/:handle" element={<Creator />} />
        <Route path="/me" element={<Dashboard />} />
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
