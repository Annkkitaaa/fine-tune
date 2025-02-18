// src/utils/error.ts
interface ValidationError {
    loc: (string | number)[];
    msg: string;
    type: string;
    input?: any;
  }
  
  interface ErrorResponse {
    detail?: ValidationError[] | string;
    message?: string;
  }
  
  export const formatError = (error: unknown): string => {
    if (!error) return 'An unknown error occurred';
  
    // Handle validation error array
    if (Array.isArray(error)) {
      return error
        .map((err: ValidationError) => err.msg)
        .filter(Boolean)
        .join(', ');
    }
  
    // Handle error object
    if (typeof error === 'object' && error !== null) {
      const errorObj = error as ErrorResponse;
      
      // Handle FastAPI validation errors
      if (errorObj.detail) {
        if (Array.isArray(errorObj.detail)) {
          return errorObj.detail
            .map(err => err.msg)
            .join(', ');
        }
        return String(errorObj.detail);
      }
  
      // Handle standard Error object
      if (error instanceof Error) {
        return error.message;
      }
  
      // Handle error with message property
      if (errorObj.message) {
        return errorObj.message;
      }
    }
  
    // Handle string error
    if (typeof error === 'string') {
      return error;
    }
  
    return 'An unexpected error occurred';
  };