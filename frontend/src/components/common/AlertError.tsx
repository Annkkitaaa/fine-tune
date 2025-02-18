// src/components/common/AlertError.tsx
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { AlertCircle } from 'lucide-react';
import { ValidationError } from '@/types/auth.types';

interface AlertErrorProps {
  error: unknown;
}

export const AlertError: React.FC<AlertErrorProps> = ({ error }) => {
  const getErrorMessage = (error: unknown): string => {
    if (!error) return '';

    // Handle validation error array
    if (Array.isArray(error)) {
      return error.map((err: ValidationError) => err.msg).join(', ');
    }

    // Handle validation error object
    if (typeof error === 'object' && error !== null) {
      if ('detail' in error) {
        return Array.isArray(error.detail)
          ? error.detail.map((err: ValidationError) => err.msg).join(', ')
          : String(error.detail);
      }
      if ('message' in error) {
        return String((error as Error).message);
      }
    }

    return String(error);
  };

  if (!error) return null;

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        {getErrorMessage(error)}
      </AlertDescription>
    </Alert>
  );
};