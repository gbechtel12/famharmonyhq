import React, { useState, useEffect } from 'react';
import { Snackbar, Alert, Button } from '@mui/material';
import { ERROR_SEVERITY } from '../../utils/errorHandler';

/**
 * Reusable feedback component for displaying messages
 * @param {Object} props
 * @param {string} [props.message] - Message to display
 * @param {string} [props.severity] - Severity level (info, success, warning, error)
 * @param {boolean} [props.open] - Whether the message is visible
 * @param {function} [props.onClose] - Function to call when closing the message
 * @param {function} [props.onRetry] - Function to call for retry action
 * @param {number} [props.autoHideDuration] - Auto hide duration in milliseconds
 * @param {string} [props.position] - Snackbar position
 */
const Feedback = ({
  message = '',
  severity = ERROR_SEVERITY.INFO,
  open = false,
  onClose = () => {},
  onRetry = null,
  autoHideDuration = 6000,
  position = {
    vertical: 'bottom',
    horizontal: 'center'
  }
}) => {
  const [isVisible, setIsVisible] = useState(open);
  
  useEffect(() => {
    setIsVisible(open && !!message);
  }, [open, message]);
  
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setIsVisible(false);
    onClose();
  };
  
  const { vertical, horizontal } = position;
  
  return (
    <Snackbar
      open={isVisible}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{ vertical, horizontal }}
    >
      <Alert
        onClose={handleClose}
        severity={severity}
        variant="filled"
        elevation={6}
        sx={{ width: '100%' }}
        action={onRetry && (
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        )}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default Feedback; 