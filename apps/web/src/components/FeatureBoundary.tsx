import { Component, Suspense } from 'react';
import type { ReactNode } from 'react';
export class FeatureBoundary extends Component<{children: ReactNode; fallback?: ReactNode}, {failed: boolean}> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <div role="alert" className="p-4 text-sm text-secondary">Could not load this tool. Your text is still in this tab. <button type="button" className="underline" onClick={() => window.location.reload()}>Retry loading</button></div>;
    return <Suspense fallback={this.props.fallback === undefined ? <p role="status" className="p-4 text-sm text-secondary">Opening tool… Your text is safe.</p> : this.props.fallback}>{this.props.children}</Suspense>;
  }
}
