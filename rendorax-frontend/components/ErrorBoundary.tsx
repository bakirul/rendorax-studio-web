"use client";
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="flex flex-col items-center justify-center p-4 bg-red-900/20 border border-red-500/50 rounded-lg w-full h-full text-red-200">
          <h2 className="text-sm font-bold mb-2 uppercase tracking-widest">Component Failed</h2>
          <p className="text-xs text-red-300 opacity-80 text-center max-w-sm">
            {this.state.error?.message || "An unexpected error occurred in this module."}
          </p>
          <button
            className="mt-4 text-xs bg-red-500/20 hover:bg-red-500/40 px-3 py-1.5 rounded transition-colors"
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
