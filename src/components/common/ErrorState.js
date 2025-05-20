import React from 'react';
import { Box, Typography, Button, Paper, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  LockPerson as LockPersonIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { ERROR_SEVERITY, ERROR_CATEGORY } from '../../utils/errorHandler';

const StyledPaper = styled(Paper)(({ theme, severity }) => {
  const colors = {
    [ERROR_SEVERITY.ERROR]: {
      bg: theme.palette.error.light,
      text: theme.palette.error.contrastText,
    },
    [ERROR_SEVERITY.WARNING]: {
      bg: theme.palette.warning.light,
      text: theme.palette.warning.contrastText,
    },
    [ERROR_SEVERITY.INFO]: {
      bg: theme.palette.info.light,
      text: theme.palette.info.contrastText,
    },
    success: {
      bg: theme.palette.success.light,
      text: theme.palette.success.contrastText,
    }
  };

  const color = colors[severity] || colors[ERROR_SEVERITY.ERROR];

  return {
    padding: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    backgroundColor: color.bg,
    color: color.text,
    borderRadius: theme.shape.borderRadius
  };
});

/**
 * A reusable component to display when there's an error fetching data
 * 
 * @param {Object} props
 * @param {string} props.title - The error title
 * @param {string} props.message - The error message
 * @param {Function} props.onRetry - Callback for retry button
 * @param {string} props.severity - Error severity (error, warning, info)
 * @param {string} props.category - Error category (network, permission, etc.)
 * @param {boolean} props.showIcon - Whether to show the icon
 * @param {React.ReactNode} props.icon - Custom icon to display
 */
export default function ErrorState({ 
  title = 'Error fetching data', 
  message = 'There was a problem loading your data. Please try again.',
  onRetry,
  severity = ERROR_SEVERITY.ERROR,
  category,
  showIcon = true,
  icon = null
}) {
  // Determine which icon to show based on severity and category
  const getIcon = () => {
    if (icon) return icon;
    
    if (category === ERROR_CATEGORY.NETWORK) {
      return <WifiOffIcon fontSize="large" />;
    }
    
    if (category === ERROR_CATEGORY.PERMISSION) {
      return <LockPersonIcon fontSize="large" />;
    }
    
    switch (severity) {
      case ERROR_SEVERITY.WARNING:
        return <WarningIcon fontSize="large" />;
      case ERROR_SEVERITY.INFO:
        return <InfoIcon fontSize="large" />;
      case ERROR_SEVERITY.ERROR:
      default:
        return <ErrorIcon fontSize="large" />;
    }
  };
  
  // Get button color based on severity
  const getButtonVariant = () => {
    switch (severity) {
      case ERROR_SEVERITY.INFO:
        return 'info';
      case ERROR_SEVERITY.WARNING:
        return 'warning';
      case ERROR_SEVERITY.ERROR:
      default:
        return 'error';
    }
  };
  
  // Get specific text for retry button based on category
  const getRetryText = () => {
    if (category === ERROR_CATEGORY.NETWORK) {
      return 'Try Again When Online';
    }
    if (category === ERROR_CATEGORY.PERMISSION) {
      return 'Sign In Again';
    }
    return 'Try Again';
  };

  return (
    <StyledPaper elevation={1} severity={severity}>
      {showIcon && (
        <Box sx={{ mb: 2, color: 'inherit' }}>
          {getIcon()}
        </Box>
      )}
      
      <Typography variant="h6" gutterBottom color="inherit">
        {title}
      </Typography>
      
      <Typography 
        variant="body2" 
        color="inherit" 
        sx={{ mb: 2, opacity: 0.9 }}
      >
        {message}
      </Typography>
      
      {category && (
        <Chip 
          label={category} 
          size="small" 
          sx={{ mb: 3 }}
          icon={category === ERROR_CATEGORY.NETWORK ? <WifiIcon /> : undefined}
        />
      )}
      
      {onRetry && (
        <Button 
          variant="contained" 
          color={getButtonVariant()} 
          onClick={onRetry}
          startIcon={<RefreshIcon />}
          sx={{ 
            color: 'white',
            mt: category ? 0 : 2 
          }}
        >
          {getRetryText()}
        </Button>
      )}
    </StyledPaper>
  );
} 