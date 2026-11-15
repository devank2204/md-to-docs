/** CSS-only loading affordance; source/editor and errors remain real interactive UI. */
export function LoadingSkeleton({ label = 'Loading preview', compact = false }: { label?: string; compact?: boolean }) {
  const Container = compact ? 'span' : 'div';
  return <Container className={`loading-skeleton ${compact ? 'loading-skeleton-compact' : ''}`} role="status" aria-label={label}>
    <span className="sr-only">{label}</span>
    <span aria-hidden="true" className="skeleton-line skeleton-title" />
    {!compact && <><span aria-hidden="true" className="skeleton-line" /><span aria-hidden="true" className="skeleton-line" /><span aria-hidden="true" className="skeleton-line skeleton-short" /></>}
  </Container>;
}
