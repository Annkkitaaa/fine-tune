// src/utils/error.ts
interface ValidationError {
    loc: (string | number)[];
    msg: string;
    type: string;
    input?: any;
  }
  
  export const formatError = (error: unknown): string => {
    if (!error) return '';
  
    // Handle array of validation errors
    if (Array.isArray(error)) {
      return error.map((err: ValidationError) => err.msg).join(', ');
    }
  
    // Handle error object
    if (typeof error === 'object' && error !== null) {
      if ('detail' in error) {
        const { detail } = error as { detail: ValidationError[] | string };
        if (Array.isArray(detail)) {
          return detail.map(err => err.msg).join(', ');
        }
        return String(detail);
      }
      
      if (error instanceof Error) {
        return error.message;
      }
    }
  
    return String(error);
  };