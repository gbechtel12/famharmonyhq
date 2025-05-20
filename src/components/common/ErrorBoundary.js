import React, { Component } from 'react';
import { Box, Typography, Button, Paper, Container } from '@mui/material';
import { processError, ERROR_SEVERITY, ERROR_CATEGORY } from '../../utils/errorHandler';
import { Error as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null,
      errorDetails: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Process the error with our utility
    const errorDetails = processError(error, 'app');
    
    // Log error to console for debugging
    console.error('Error caught by boundary:', error);
    console.error('Error details:', errorInfo);
    
    this.setState({
      errorInfo,
      errorDetails
    });
    
    // You could also log to an error reporting service here
  }

  handleRefresh = () => {
    // Reset the error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorDetails: null
    });
    
    // Refresh the page
    window.location.reload();
  }

  handleGoHome = () => {
    // Reset the error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorDetails: null
    });
    
    // Redirect to home page
    window.location.href = '/';
  }

  render() {
    if (this.state.hasError) {
      const { errorDetails } = this.state;
      
      // If we have processed details, use them - otherwise use defaults
      const message = errorDetails?.message || 'Something went wrong. Please try refreshing the page.';
      const severity = errorDetails?.severity || ERROR_SEVERITY.ERROR;
      const category = errorDetails?.category || ERROR_CATEGORY.UNKNOWN;
      
      // Determine background color based on severity
      let bgColor = '#f44336'; // error default
      let textColor = '#fff';
      
      if (severity === ERROR_SEVERITY.WARNING) {
        bgColor = '#ff9800';
        textColor = '#fff';
      } else if (severity === ERROR_SEVERITY.INFO) {
        bgColor = '#2196f3';
        textColor = '#fff';
      }
      
      return (
        <Container maxWidth="md" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              bgcolor: bgColor,
              color: textColor,
              width: '100%'
            }}
          >
            <ErrorIcon sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h4" gutterBottom>
              Oops! Something Went Wrong
            </Typography>
            <Typography variant="body1" paragraph>
              {message}
            </Typography>
            
            {this.state.error && (
              <Box 
                sx={{ 
                  mt: 2, 
                  mb: 3, 
                  p: 2, 
                  bgcolor: 'rgba(0,0,0,0.1)',
                  borderRadius: 1,
                  textAlign: 'left',
                  maxHeight: '150px',
                  overflow: 'auto'
                }}
              >
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}>
                  {this.state.error.toString()}
                </Typography>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
              <Button 
                variant="contained" 
                color="inherit"
                size="large"
                onClick={this.handleRefresh}
                startIcon={<RefreshIcon />}
                sx={{ color: bgColor }}
              >
                Refresh App
              </Button>
              <Button 
                variant="outlined" 
                color="inherit"
                size="large"
                onClick={this.handleGoHome}
              >
                Go to Home
              </Button>
            </Box>
          </Paper>
        </Container>
      );
    }

    // Otherwise, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary; 