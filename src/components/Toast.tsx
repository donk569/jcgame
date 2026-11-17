import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type Toast = { id: number; text: string; tone?: 'default' | 'ok' };

const ToastContext = createContext<{ push: (text: string, tone?: Toast['tone']) => void }>({
  push: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const push = useCallback((text: string, tone: Toast['tone'] = 'default') => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev.slice(-2), { id, text, tone }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-6 left-1/2 z-[90] flex w-[calc(100%-36px)] max-w-[420px] -translate-x-1/2 flex-col items-center gap-2"
        role="status"
        aria-live="polite"
      >
        <AnimatePresence initial={false}>
          {items.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="pointer-events-auto flex items-center gap-2.5 rounded-none border border-line-bright bg-ink-700/95 px-4 py-3 text-[13.5px] text-bone shadow-[0_20px_40px_-20px_#000] backdrop-blur-xl"
            >
              <span
                className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                  t.tone === 'ok' ? 'bg-teal' : 'bg-brand'
                }`}
                aria-hidden="true"
              />
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
