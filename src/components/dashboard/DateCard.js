import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box,
  useTheme
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { format } from 'date-fns';

function DateCard() {
  const theme = useTheme();
  const today = new Date();
  const formattedDate = format(today, 'EEEE, MMMM d, yyyy');
  
  // Define background based on theme mode
  const cardBackground = theme.palette.mode === 'dark' 
    ? 'linear-gradient(to bottom right, #1f2937, #374151)' 
    : 'linear-gradient(to bottom right, #f3f4f6, #e5e7eb)';

  const cardBorder = theme.palette.mode === 'dark' 
    ? '1px solid #4b5563' 
    : '1px solid #d1d5db';
    
  const iconColor = theme.palette.mode === 'dark' 
    ? '#9ca3af' 
    : '#4b5563';
  
  return (
    <Card 
      sx={{ 
        height: '100%',
        background: cardBackground,
        border: cardBorder
      }}
    >
      <CardContent sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%',
        p: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CalendarTodayIcon sx={{ mr: 1, color: iconColor }} />
          <Typography variant="h6" fontWeight="medium" color="text.secondary">
            {formattedDate}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

export default DateCard; 