import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Error as ErrorIcon } from '@mui/icons-material';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  backgroundColor: theme.palette.error.light,
  color: theme.palette.error.contrastText,
  borderRadius: theme.shape.borderRadius
}));

/**
 * A reusable component to display when there's an error fetching data
 * 
 * @param {Object} props
 * @param {string} props.title - The error title
 * @param {string} props.message - The error message
 * @param {Function} props.onRetry - Callback for retry button
 */
export default function ErrorState({ 
  title = 'Error fetching data', 
  message = 'There was a problem loading your data. Please try again.',
  onRetry
}) {
  return (
    <StyledPaper elevation={1}>
      <Box sx={{ mb: 2, color: 'inherit' }}>
        <ErrorIcon fontSize="large" />
      </Box>
      
      <Typography variant="h6" gutterBottom color="inherit">
        {title}
      </Typography>
      
      <Typography 
        variant="body2" 
        color="inherit" 
        sx={{ mb: onRetry ? 3 : 0, opacity: 0.9 }}
      >
        {message}
      </Typography>
      
      {onRetry && (
        <Button 
          variant="contained" 
          color="error" 
          onClick={onRetry}
          sx={{ color: 'white' }}
        >
          Try Again
        </Button>
      )}
    </StyledPaper>
  );
} 