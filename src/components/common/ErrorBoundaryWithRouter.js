import React from 'react';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import { Error as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useRouteError, useNavigate } from 'react-router-dom';

/**
 * Error boundary component specifically for router errors
 * Used as the errorElement in router configuration
 */
function ErrorBoundaryWithRouter() {
  const error = useRouteError();
  const navigate = useNavigate();
  
  // Extract error information
  const status = error?.status || 404;
  const statusText = error?.statusText || 'Not Found';
  const message = error?.message || 'The page you are looking for does not exist.';
  
  // Handle refresh action
  const handleRefresh = () => {
    window.location.reload();
  };
  
  // Handle go home action
  const handleGoHome = () => {
    navigate('/');
  };
  
  // Handle go back action
  const handleGoBack = () => {
    navigate(-1);
  };
  
  return (
    <Container maxWidth="md" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          textAlign: 'center',
          bgcolor: '#6366f1', // Indigo color
          color: '#fff',
          width: '100%'
        }}
      >
        <ErrorIcon sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          {status} {statusText}
        </Typography>
        <Typography variant="h6" gutterBottom>
          Oops! Something went wrong.
        </Typography>
        <Typography variant="body1" paragraph>
          {message}
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
          <Button 
            variant="contained" 
            color="inherit"
            size="large"
            onClick={handleGoHome}
            sx={{ color: '#6366f1' }}
          >
            Go to Dashboard
          </Button>
          <Button 
            variant="outlined" 
            color="inherit"
            size="large"
            onClick={handleGoBack}
          >
            Go Back
          </Button>
          <Button 
            variant="outlined" 
            color="inherit"
            size="large"
            onClick={handleRefresh}
            startIcon={<RefreshIcon />}
          >
            Refresh
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default ErrorBoundaryWithRouter; 