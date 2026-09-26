/**
 * @fileoverview Error Boundary component for graceful error handling.
 * @description Catches JavaScript errors in child components and displays a fallback UI.
 */

import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component that catches JavaScript errors anywhere in the
 * child component tree and displays a fallback UI.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Only log to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // In production, send to an error tracking service (Sentry, LogRocket, etc.)
    // Example: Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } });
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-paper flex items-center justify-center p-6">
          <div className="text-center max-w-lg">
            {/* Error Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-lg bg-red-50 border border-red-200 mb-8">
              <AlertTriangle className="w-10 h-10 text-red-700" aria-hidden="true" />
            </div>

            {/* Message */}
            <h1 className="font-display text-4xl text-ink mb-4">Something went wrong</h1>
            <p className="text-stone-700 mb-8 leading-relaxed">
              An unexpected error occurred. Please try refreshing the page or return to the home
              page.
            </p>

            {/* Error Details (development only) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-8 p-4 bg-white border border-stone-200 rounded-lg text-left overflow-auto max-h-32">
                <code className="text-sm text-red-700 break-all">{this.state.error.message}</code>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-ink hover:bg-stone-800 text-paper rounded-full font-semibold transition-colors focus-ring"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                Refresh page
              </button>
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-stone-400 hover:border-ink text-ink rounded-full font-semibold transition-colors focus-ring"
              >
                <Home className="w-4 h-4" aria-hidden="true" />
                Go home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
