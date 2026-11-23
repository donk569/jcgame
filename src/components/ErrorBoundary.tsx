import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

const homeHref = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || '/';

/**
 * 兜住子树里的渲染异常：任何一个页面组件抛错时，
 * 只替换出错区域，不再整页白屏。
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[JCGame] 页面渲染出错', error, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="wrap inner-page flex min-h-[60vh] flex-col items-start justify-center gap-5 py-16" role="alert">
        <p className="mono text-[12px] uppercase tracking-[0.18em] text-brand">Something went wrong</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">页面出了点问题</h1>
        <p className="max-w-[560px] text-[14px] leading-relaxed text-muted">
          刚才这一下没加载出来，不是你的操作有问题。可以重新试一次；如果一直这样，回到首页再进。
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-primary" type="button" onClick={this.reset}>
            重试
          </button>
          <a className="btn btn-ghost" href={homeHref}>
            回到首页
          </a>
        </div>
        <details className="mt-2 max-w-[720px] text-[12px] text-muted-dim">
          <summary className="cursor-pointer">查看错误信息</summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all rounded-[2px] border border-line bg-ink-900 p-3">
            {error.message}
          </pre>
        </details>
      </div>
    );
  }
}
