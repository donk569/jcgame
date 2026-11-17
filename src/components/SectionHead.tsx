import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from '@phosphor-icons/react';

export function SectionHead({
  title,
  note,
  action,
  light = false,
}: {
  title: string;
  note?: string;
  action?: ReactNode;
  light?: boolean;
}) {
  return (
    <div className="section-head">
      <div>
        <h2 className="display-h2">{title}</h2>
        {note && (
          <p className={`mt-1.5 text-[13.5px] ${light ? 'text-paper-muted' : 'text-muted'}`}>
            {note}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function TextLink({
  to,
  children,
  light = false,
}: {
  to: string;
  children: ReactNode;
  light?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`group inline-flex items-center gap-1.5 text-[13.5px] font-medium transition-colors ${
        light ? 'text-paper-ink/80 hover:text-paper-ink' : 'text-bone-dim hover:text-brand'
      }`}
    >
      {children}
      <ArrowRight
        size={13}
        weight="bold"
        className="transition-transform duration-200 group-hover:translate-x-1"
      />
    </Link>
  );
}
