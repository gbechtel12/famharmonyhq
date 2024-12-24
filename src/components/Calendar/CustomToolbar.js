import React from 'react';
import { Box, Button, IconButton, Typography, useTheme, useMediaQuery } from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

export default function CustomToolbar(props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const navigate = (action) => {
    props.onNavigate(action);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 1,
        mb: 2,
        p: 1
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton onClick={() => navigate('PREV')}>
          <ChevronLeftIcon />
        </IconButton>
        <IconButton onClick={() => navigate('NEXT')}>
          <ChevronRightIcon />
        </IconButton>
        <IconButton onClick={() => navigate('TODAY')}>
          <TodayIcon />
        </IconButton>
      </Box>

      <Typography 
        variant={isMobile ? "h6" : "h5"} 
        component="h2" 
        sx={{ fontWeight: 500 }}
      >
        {format(props.date, 'MMMM yyyy')}
      </Typography>

      <Box sx={{ display: 'flex', gap: 1 }}>
        {!isMobile && props.views.map(view => (
          <Button
            key={view}
            onClick={() => props.onView(view)}
            variant={props.view === view ? 'contained' : 'outlined'}
            size="small"
          >
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </Button>
        ))}
      </Box>
    </Box>
  );
} 