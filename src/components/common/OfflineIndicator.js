import React, { useState, useEffect } from 'react';
import { Alert, Snackbar, Button, Box, useTheme } from '@mui/material';
import { WifiOff as WifiOffIcon } from '@mui/icons-material';

/**
 * A component that detects and shows when the application is offline
 * 
 * @param {Object} props
 * @param {Function} props.onRetry - Callback for retry button
 * @param {boolean} props.showFixed - Whether to show a fixed banner at the bottom
 */
export default function OfflineIndicator({ onRetry, showFixed = true }) {
  const theme = useTheme();
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showSnackbar, setShowSnackbar] = useState(false);
  
  // Handle online/offline status changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Show brief "back online" message
      setShowSnackbar(true);
      setTimeout(() => setShowSnackbar(false), 3000);
    };
    
    const handleOffline = () => {
      setIsOffline(true);
    };
    
    // Set initial state
    setIsOffline(!navigator.onLine);
    
    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Handle retry click
  const handleRetry = () => {
    // Try to fetch a small resource to check connection
    fetch('/favicon.ico', { method: 'HEAD', cache: 'no-store' })
      .then(() => {
        setIsOffline(false);
        onRetry && onRetry();
      })
      .catch(() => {
        // Still offline
        setIsOffline(true);
      });
  };
  
  // If online, just show the temporary snackbar
  if (!isOffline && !showFixed) {
    return (
      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          variant="filled"
        >
          You're back online!
        </Alert>
      </Snackbar>
    );
  }
  
  // If offline and showFixed is true, show a fixed banner
  if (isOffline && showFixed) {
    return (
      <>
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: theme.zIndex.appBar + 1,
            padding: 1,
            backgroundColor: theme.palette.warning.main,
            color: theme.palette.warning.contrastText,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2
          }}
        >
          <WifiOffIcon />
          <span>You're currently offline. Some features may be unavailable.</span>
          <Button 
            variant="outlined" 
            color="inherit" 
            size="small"
            onClick={handleRetry}
            sx={{ ml: 1 }}
          >
            Retry
          </Button>
        </Box>
        
        {/* Extra space at the bottom to prevent content from being hidden behind the banner */}
        <Box sx={{ height: '48px' }} />
      </>
    );
  }
  
  // If offline and showFixed is false, just show a snackbar
  if (isOffline && !showFixed) {
    return (
      <Snackbar
        open={true}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity="warning" 
          variant="filled"
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              Retry
            </Button>
          }
        >
          You're offline. Some features may be unavailable.
        </Alert>
      </Snackbar>
    );
  }
  
  return null;
} 