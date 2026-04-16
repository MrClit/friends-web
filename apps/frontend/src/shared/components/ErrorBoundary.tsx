import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { i18n } from '@/i18n';
import { LogoIcon } from './Logo';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-emerald-950 px-6 transition-colors duration-300">
          <LogoIcon size={64} />

          <h1 className="mt-6 text-xl font-bold text-slate-900 dark:text-white">
            {i18n.t('title', { ns: 'errorBoundary' })}
          </h1>

          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 text-center max-w-md">
            {i18n.t('message', { ns: 'errorBoundary' })}
          </p>

          <button
            onClick={this.handleReload}
            className="mt-6 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            {i18n.t('reload', { ns: 'errorBoundary' })}
          </button>

          {isDev && this.state.error && (
            <details className="mt-8 w-full max-w-lg">
              <summary className="cursor-pointer text-xs text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                {i18n.t('details', { ns: 'errorBoundary' })}
              </summary>
              <pre className="mt-2 p-4 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-300 overflow-auto max-h-48">
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
