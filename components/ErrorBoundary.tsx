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
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // In production, you could send this to an error tracking service
    // e.g., Sentry, LogRocket, etc.
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
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
          <div className="text-center max-w-lg">
            {/* Error Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/30 mb-8">
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>

            {/* Message */}
            <h1 className="text-3xl font-bold text-white mb-4">Something Went Wrong</h1>
            <p className="text-slate-400 mb-8 leading-relaxed">
              An unexpected error occurred. Please try refreshing the page or return to the home
              page.
            </p>

            {/* Error Details (development only) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-8 p-4 bg-slate-900/50 border border-slate-800 rounded-xl text-left overflow-auto max-h-32">
                <code className="text-sm text-red-400 break-all">{this.state.error.message}</code>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 
                           bg-primary-600 hover:bg-primary-700 text-white rounded-xl 
                           font-semibold transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 
                           bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 
                           hover:text-white rounded-xl font-semibold transition-colors 
                           border border-slate-700 hover:border-slate-600"
              >
                <Home className="w-4 h-4" />
                Go Home
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
