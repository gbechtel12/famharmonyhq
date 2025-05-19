import React, { useState, useEffect } from 'react';
import { CircularProgress, Grid, Container, Paper, Typography, Box, IconButton, useTheme, useMediaQuery } from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import WeatherCard from '../components/dashboard/WeatherCard';
import TodayAgendaCard from '../components/dashboard/TodayAgendaCard';
import TodaysMealsCard from '../components/dashboard/TodaysMealsCard';
import FamilyStatsCard from '../components/dashboard/FamilyStatsCard';
import ChoresCard from '../components/dashboard/ChoresCard';
import SchoolLunchCard from '../components/dashboard/SchoolLunchCard';
import DateCard from '../components/dashboard/DateCard';
import GroceryListCard from '../components/dashboard/GroceryListCard';

const ROTATION_INTERVAL = 20000; // 20 seconds

function DashboardPage() {
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  // Toggle kiosk mode (auto-rotation)
  const toggleKioskMode = () => {
    setIsKioskMode(!isKioskMode);
    // Reset to first card when toggling
    setActiveCardIndex(0);
  };

  // Handle rotation in kiosk mode
  useEffect(() => {
    if (!isKioskMode) return;
    
    const rotationTimer = setInterval(() => {
      setActiveCardIndex((prevIndex) => (prevIndex + 1) % 6);
    }, ROTATION_INTERVAL);

    return () => clearInterval(rotationTimer);
  }, [isKioskMode]);

  // Determine grid columns based on screen size
  const getGridColumns = () => {
    if (isMobile) return 1;
    if (isTablet) return 2;
    if (isDesktop) return 3;
    return 4;
  };

  return (
    <Box sx={{ bgcolor: theme.palette.background.default, minHeight: '100vh', py: 2 }}>
      <Container maxWidth="xl">
        {/* Dashboard Header */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 2 
          }}
        >
          <Typography variant="h5" fontWeight="bold" color="text.primary">
            Family Dashboard
          </Typography>
          <IconButton
            onClick={toggleKioskMode}
            color={isKioskMode ? "primary" : "default"}
            size="small"
          >
            {isKioskMode ? <StopCircleIcon /> : <PlayCircleOutlineIcon />}
          </IconButton>
        </Box>

        {/* Standard Dashboard View */}
        {!isKioskMode && (
          <Grid container spacing={3}>
            {/* Row 1: Date & Weather */}
            <Grid item xs={12} md={4}>
              <DateCard />
            </Grid>
            <Grid item xs={12} md={8}>
              <WeatherCard />
            </Grid>
            
            {/* Row 2: Main Content */}
            <Grid item xs={12} md={6} lg={4}>
              <TodayAgendaCard />
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <TodaysMealsCard />
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <SchoolLunchCard />
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <ChoresCard />
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <GroceryListCard />
            </Grid>
          </Grid>
        )}

        {/* Kiosk Mode Content */}
        {isKioskMode && (
          <Box sx={{ height: 'calc(100vh - 100px)' }}>
            <Box sx={{ display: activeCardIndex === 0 ? 'block' : 'none', height: '100%' }}>
              <WeatherCard fullScreen />
            </Box>
            <Box sx={{ display: activeCardIndex === 1 ? 'block' : 'none', height: '100%' }}>
              <TodayAgendaCard fullScreen />
            </Box>
            <Box sx={{ display: activeCardIndex === 2 ? 'block' : 'none', height: '100%' }}>
              <TodaysMealsCard fullScreen />
            </Box>
            <Box sx={{ display: activeCardIndex === 3 ? 'block' : 'none', height: '100%' }}>
              <SchoolLunchCard fullScreen />
            </Box>
            <Box sx={{ display: activeCardIndex === 4 ? 'block' : 'none', height: '100%' }}>
              <ChoresCard fullScreen />
            </Box>
            <Box sx={{ display: activeCardIndex === 5 ? 'block' : 'none', height: '100%' }}>
              <GroceryListCard fullScreen />
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
}

export default DashboardPage; 