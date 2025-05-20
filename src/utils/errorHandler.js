import { FirebaseError } from 'firebase/app';

// Error severities
export const ERROR_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error'
};

// Error categories
export const ERROR_CATEGORY = {
  AUTHENTICATION: 'authentication',
  PERMISSION: 'permission',
  NOT_FOUND: 'not_found',
  VALIDATION: 'validation',
  NETWORK: 'network',
  UNKNOWN: 'unknown'
};

/**
 * Get user-friendly error message based on Firebase error code
 * @param {Error|FirebaseError} error - The error object
 * @returns {String} User-friendly error message
 */
export const getUserFriendlyMessage = (error) => {
  // Handle Firebase specific errors
  if (error instanceof FirebaseError) {
    const code = error.code;
    
    // Authentication errors
    if (code.includes('auth/')) {
      switch (code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          return 'Invalid email or password';
        case 'auth/email-already-in-use':
          return 'This email is already registered';
        case 'auth/weak-password':
          return 'Password is too weak. Please use a stronger password';
        case 'auth/invalid-email':
          return 'Invalid email address';
        case 'auth/account-exists-with-different-credential':
          return 'An account already exists with the same email address';
        case 'auth/invalid-credential':
          return 'Invalid login credentials';
        case 'auth/operation-not-allowed':
          return 'This operation is not allowed';
        case 'auth/user-disabled':
          return 'This account has been disabled';
        case 'auth/requires-recent-login':
          return 'Please log in again to perform this action';
        default:
          return 'Authentication error: ' + (error.message || code);
      }
    }
    
    // Firestore errors
    if (code.includes('firestore/')) {
      switch (code) {
        case 'firestore/permission-denied':
          return 'You don\'t have permission to access this data';
        case 'firestore/not-found':
          return 'The requested document was not found';
        case 'firestore/already-exists':
          return 'This document already exists';
        case 'firestore/aborted':
          return 'The operation was aborted';
        case 'firestore/data-loss':
          return 'Data was lost or corrupted';
        case 'firestore/deadline-exceeded':
          return 'The operation timed out';
        case 'firestore/failed-precondition':
          return 'Operation was rejected. Please ensure prerequisites are met';
        case 'firestore/cancelled':
          return 'The operation was cancelled';
        case 'firestore/resource-exhausted':
          return 'System resources are exhausted';
        case 'firestore/unavailable':
          return 'Service is currently unavailable. Please try again later';
        default:
          return 'Database error: ' + (error.message || code);
      }
    }
    
    // Generic Firebase errors
    return error.message || 'Unknown Firebase error';
  }
  
  // Network errors
  if (error.name === 'NetworkError' || error.message?.includes('network')) {
    return 'Network error. Please check your internet connection';
  }
  
  // Timeout errors
  if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
    return 'Operation timed out. Please try again';
  }
  
  // Generic errors with message
  if (error.message) {
    // Common permission terms
    if (error.message.toLowerCase().includes('permission') || 
        error.message.toLowerCase().includes('access denied')) {
      return 'You don\'t have permission to perform this action';
    }
    
    // Not found terms
    if (error.message.toLowerCase().includes('not found') || 
        error.message.toLowerCase().includes('404')) {
      return 'The requested resource was not found';
    }
    
    return error.message;
  }
  
  // Default fallback
  return 'An unexpected error occurred';
};

/**
 * Categorize error by type
 * @param {Error|FirebaseError} error - The error object
 * @returns {String} Error category from ERROR_CATEGORY
 */
export const categorizeError = (error) => {
  if (error instanceof FirebaseError) {
    const code = error.code;
    
    if (code.includes('auth/')) {
      return ERROR_CATEGORY.AUTHENTICATION;
    }
    
    if (code.includes('permission-denied') || code.includes('unauthorized')) {
      return ERROR_CATEGORY.PERMISSION;
    }
    
    if (code.includes('not-found')) {
      return ERROR_CATEGORY.NOT_FOUND;
    }
    
    if (code.includes('invalid-argument') || code.includes('failed-precondition')) {
      return ERROR_CATEGORY.VALIDATION;
    }
    
    if (code.includes('unavailable') || code.includes('network-request-failed')) {
      return ERROR_CATEGORY.NETWORK;
    }
  }
  
  if (error.name === 'NetworkError' || error.message?.includes('network')) {
    return ERROR_CATEGORY.NETWORK;
  }
  
  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('permission') || message.includes('access denied')) {
    return ERROR_CATEGORY.PERMISSION;
  }
  
  if (message.includes('not found')) {
    return ERROR_CATEGORY.NOT_FOUND;
  }
  
  if (message.includes('invalid') || message.includes('required')) {
    return ERROR_CATEGORY.VALIDATION;
  }
  
  return ERROR_CATEGORY.UNKNOWN;
};

/**
 * Get severity level for an error
 * @param {Error|FirebaseError} error - The error object
 * @returns {String} Error severity from ERROR_SEVERITY
 */
export const getSeverity = (error) => {
  const category = categorizeError(error);
  
  switch (category) {
    case ERROR_CATEGORY.NETWORK:
      return ERROR_SEVERITY.WARNING;
    case ERROR_CATEGORY.NOT_FOUND:
      return ERROR_SEVERITY.INFO;
    case ERROR_CATEGORY.AUTHENTICATION:
    case ERROR_CATEGORY.PERMISSION:
    case ERROR_CATEGORY.VALIDATION:
    case ERROR_CATEGORY.UNKNOWN:
    default:
      return ERROR_SEVERITY.ERROR;
  }
};

/**
 * Process an error with logging and return user-friendly information
 * @param {Error|FirebaseError} error - The error object
 * @param {String} context - Context where the error occurred (e.g., 'authentication', 'grocery-list')
 * @returns {Object} Processed error information
 */
export const processError = (error, context = '') => {
  const category = categorizeError(error);
  const message = getUserFriendlyMessage(error);
  const severity = getSeverity(error);
  
  // Log error for debugging (error details get included in console)
  console.error(`[${context}] ${category} error:`, error);
  
  return {
    message,
    category,
    severity,
    originalError: error,
    context
  };
};

/**
 * Determine if retry is likely to succeed based on error type
 * @param {Error|FirebaseError} error - The error object
 * @returns {Boolean} Whether retry might succeed
 */
export const isRetryable = (error) => {
  const category = categorizeError(error);
  
  // Network issues and service unavailability are generally retryable
  return category === ERROR_CATEGORY.NETWORK ||
         (error instanceof FirebaseError &&
          (error.code === 'firestore/unavailable' ||
           error.code === 'firestore/deadline-exceeded'));
};

/**
 * Get fallback data based on error type and context
 * @param {Error|FirebaseError} error - The error object
 * @param {String} dataType - Type of data that was being fetched
 * @returns {any} Appropriate fallback data
 */
export const getFallbackData = (error, dataType) => {
  switch (dataType) {
    case 'groceryList':
      return { items: [] };
    case 'events':
    case 'chores':
    case 'meals':
    case 'members':
    case 'rewards':
      return [];
    case 'profile':
      return null;
    default:
      return null;
  }
};

/**
 * Default error handler function for async operations
 * @param {Function} operation - Async function to execute
 * @param {Object} options - Configuration options
 * @returns {Promise<any>} Result of the operation or fallback data
 */
export const withErrorHandling = async (operation, options = {}) => {
  const {
    context = '',
    dataType = '',
    onError = null,
    fallbackData = undefined,
    retryCount = 0,
    maxRetries = 1
  } = options;
  
  try {
    return await operation();
  } catch (error) {
    const processedError = processError(error, context);
    
    // Call the provided error handler if available
    if (onError && typeof onError === 'function') {
      onError(processedError);
    }
    
    // Try to retry if appropriate
    if (isRetryable(error) && retryCount < maxRetries) {
      // Exponential backoff before retry
      const delay = Math.min(1000 * (2 ** retryCount), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return withErrorHandling(operation, {
        ...options,
        retryCount: retryCount + 1
      });
    }
    
    // Return provided fallback data or generate appropriate fallback
    return fallbackData !== undefined 
      ? fallbackData 
      : getFallbackData(error, dataType);
  }
}; 