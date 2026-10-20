import React, { useState } from 'react';

export interface HeadlineGroupProps {
  title: string;
  icon?: string;
  badge?: string | number;
  badgeTone?: 'default' | 'primary' | 'warning' | 'error' | 'success';
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function HeadlineGroup({
  title,
  icon,
  badge,
  badgeTone = 'default',
  defaultOpen = true,
  className = '',
  children,
}: HeadlineGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const getBadgeClass = () => {
    switch (badgeTone) {
      case 'primary':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'warning':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'error':
        return 'bg-error/10 text-error border-error/20';
      case 'success':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-surface-container text-secondary border-outline-variant/40';
    }
  };

  return (
    <section className={`flex flex-col ${className}`}>
      {/* Clickable Headline Row */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full px-2 py-1.5 text-[11px] font-semibold text-secondary flex items-center justify-between cursor-pointer hover:bg-surface-container/70 rounded transition-colors select-none text-left group focus-visible:outline-2 focus-visible:outline-primary/50"
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="material-symbols-outlined text-[16px] text-outline group-hover:text-primary transition-transform duration-150 shrink-0"
            style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
          >
            expand_more
          </span>
          {icon && (
            <span className="material-symbols-outlined text-[15px] text-primary shrink-0">
              {icon}
            </span>
          )}
          <span className="tracking-wider uppercase font-code-sm truncate">
            {title}
          </span>
        </div>

        {badge !== undefined && (
          <span className={`text-[10px] font-code-sm font-medium px-1.5 py-0.2 rounded border shrink-0 ${getBadgeClass()}`}>
            {badge}
          </span>
        )}
      </button>

      {/* Collapsible Group Content */}
      {isOpen && (
        <div className="pt-2 flex flex-col gap-space-xs animate-in fade-in duration-150">
          {children}
        </div>
      )}
    </section>
  );
}
