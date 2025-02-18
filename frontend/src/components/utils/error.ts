// src/utils/error.ts

interface ValidationError {
    loc: (string | number)[];
    msg: string;
    type: string;
    input?: any;
  }
  
  interface ErrorDetail {
    detail: ValidationError[] | string;
  }
  
  export const formatValidationError = (error: unknown): string => {
    if (!error) return '';
  
    // Handle ValidationError array
    if (Array.isArray(error)) {
      return error.map((err: ValidationError) => err.msg).join(', ');
    }
  
    // Handle error object with detail property
    if (typeof error === 'object' && error !== null) {
      const errorObj = error as ErrorDetail;
      if ('detail' in errorObj) {
        if (Array.isArray(errorObj.detail)) {
          return errorObj.detail.map((err: ValidationError) => err.msg).join(', ');
        }
        return String(errorObj.detail);
      }
      
      // Handle Error instance
      if (error instanceof Error) {
        return error.message;
      }
    }
  
    // Handle string error
    if (typeof error === 'string') {
      return error;
    }
  
    // Fallback
    return 'An unexpected error occurred';
  };