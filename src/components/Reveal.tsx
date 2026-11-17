import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

/** 区块级入场：只在进入视口时播一次，不做逐卡片淡入 */
export function Reveal({
  children,
  delay = 0,
  y = 20,
  className = '',
  as = 'div',
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'header';
}) {
  const reduce = useReducedMotion();
  const M = motion[as] as typeof motion.div;
  return (
    <M
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-70px 0px -70px 0px' }}
      transition={{ duration: 0.62, delay, ease: [0.22, 0.68, 0, 1] }}
    >
      {children}
    </M>
  );
}
