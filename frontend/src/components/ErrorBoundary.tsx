// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo } from 'react';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
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
        const errorObj = JSON.parse(JSON.stringify(error.message));
        
        // Handle detail array
        if (errorObj.detail && Array.isArray(errorObj.detail)) {
          return errorObj.detail
            .map((err: any) => err.msg || String(err))
            .filter(Boolean)
            .join(', ');
        }
        
        // Handle detail string
        if (errorObj.detail) {
          return String(errorObj.detail);
        }
        
        // Handle message field
        if (errorObj.message) {
          return String(errorObj.message);
        }

        // Fallback to stringifying the object
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