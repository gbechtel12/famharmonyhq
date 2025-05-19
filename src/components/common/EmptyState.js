import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius,
  border: `1px dashed ${theme.palette.divider}`
}));

/**
 * A reusable component to display when there's no data available
 * 
 * @param {Object} props
 * @param {string} props.title - The title text to display
 * @param {string} props.message - The descriptive message
 * @param {React.ReactNode} props.icon - Optional icon to display
 * @param {string} props.actionText - Optional text for action button
 * @param {Function} props.onAction - Optional callback for action button
 */
export default function EmptyState({ 
  title = 'No data available', 
  message = 'There are no items to display at this time.',
  icon,
  actionText,
  onAction
}) {
  return (
    <StyledPaper elevation={0}>
      {icon && (
        <Box sx={{ mb: 2, color: 'text.secondary', fontSize: 60 }}>
          {icon}
        </Box>
      )}
      
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      
      <Typography 
        variant="body2" 
        color="textSecondary" 
        sx={{ mb: actionText ? 3 : 0 }}
      >
        {message}
      </Typography>
      
      {actionText && onAction && (
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={onAction}
        >
          {actionText}
        </Button>
      )}
    </StyledPaper>
  );
} 