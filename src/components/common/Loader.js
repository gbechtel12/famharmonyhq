import React from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const LoaderContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '200px',
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[1]
}));

export default function Loader({ 
  message = 'Loading...', 
  size = 40,
  fullScreen = false 
}) {
  const containerProps = fullScreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    minHeight: '100vh'
  } : {};

  return (
    <LoaderContainer sx={containerProps}>
      <CircularProgress size={size} />
      <Typography variant="body2" sx={{ mt: 2 }}>
        {message}
      </Typography>
    </LoaderContainer>
  );
} 