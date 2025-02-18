// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private getErrorMessage(error: Error | null): string {
    if (!error) return 'An unexpected error occurred';

    // Handle validation error object
    if (error.message && typeof error.message === 'object') {
      try {
        const errorObj = error.message;
        if ('detail' in errorObj) {
          return Array.isArray(errorObj.detail) 
            ? errorObj.detail.map((err: any) => err.msg).join(', ')
            : String(errorObj.detail);
        }
        return JSON.stringify(errorObj);
      } catch {
        return 'An unexpected error occurred';
      }
    }

    return error.message;
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {this.getErrorMessage(this.state.error)}
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;