import React, { createContext, useContext, useState, useCallback } from 'react';
import Feedback from '../components/common/Feedback';
import { ERROR_SEVERITY, processError, isRetryable } from '../utils/errorHandler';

const FeedbackContext = createContext();

export function useFeedback() {
  return useContext(FeedbackContext);
}

export function FeedbackProvider({ children }) {
  const [feedbackState, setFeedbackState] = useState({
    message: '',
    severity: ERROR_SEVERITY.INFO,
    open: false,
    retryFn: null,
    autoHideDuration: 6000
  });

  // Close feedback
  const closeFeedback = useCallback(() => {
    setFeedbackState(prev => ({
      ...prev,
      open: false
    }));
  }, []);

  // Show info message
  const showInfo = useCallback((message, duration = 3000) => {
    setFeedbackState({
      message,
      severity: ERROR_SEVERITY.INFO,
      open: true,
      retryFn: null,
      autoHideDuration: duration
    });
  }, []);

  // Show success message
  const showSuccess = useCallback((message, duration = 3000) => {
    setFeedbackState({
      message,
      severity: 'success',
      open: true,
      retryFn: null,
      autoHideDuration: duration
    });
  }, []);

  // Show warning message
  const showWarning = useCallback((message, duration = 6000) => {
    setFeedbackState({
      message,
      severity: ERROR_SEVERITY.WARNING,
      open: true,
      retryFn: null,
      autoHideDuration: duration
    });
  }, []);

  // Show error message
  const showError = useCallback((message, retryFn = null, duration = 8000) => {
    setFeedbackState({
      message,
      severity: ERROR_SEVERITY.ERROR,
      open: true,
      retryFn,
      autoHideDuration: duration
    });
  }, []);

  // Handle error object
  const handleError = useCallback((error, context = '', retryFn = null) => {
    const processedError = processError(error, context);
    const canRetry = isRetryable(processedError.originalError) && retryFn !== null;
    
    setFeedbackState({
      message: processedError.message,
      severity: processedError.severity,
      open: true,
      retryFn: canRetry ? retryFn : null,
      autoHideDuration: 8000
    });
    
    return processedError;
  }, []);

  // Value object that will be passed to consumers
  const value = {
    showInfo,
    showSuccess,
    showWarning,
    showError,
    handleError
  };

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <Feedback
        message={feedbackState.message}
        severity={feedbackState.severity}
        open={feedbackState.open}
        onClose={closeFeedback}
        onRetry={feedbackState.retryFn}
        autoHideDuration={feedbackState.autoHideDuration}
      />
    </FeedbackContext.Provider>
  );
} 