import React, { useState, useEffect } from 'react';
import { CircularProgress, Grid, Container, Paper, Typography, Box, IconButton } from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import WeatherCard from '../components/dashboard/WeatherCard';
import TodayAgendaCard from '../components/dashboard/TodayAgendaCard';
import MealPlannerCard from '../components/dashboard/MealPlannerCard';
import FamilyStatsCard from '../components/dashboard/FamilyStatsCard';
import { sampleDataService } from '../services/sampleDataService';

const ROTATION_INTERVAL = 20000; // 20 seconds

function DashboardPage() {
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState(null);

  // Initialize sample data for the dashboard
  useEffect(() => {
    const initializeData = async () => {
      try {
        await sampleDataService.initializeSampleData();
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing sample data:', error);
        setInitError(error.message);
        setIsInitialized(true); // Continue anyway to show empty UI
      }
    };
    
    initializeData();
  }, []);

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
      setActiveCardIndex((prevIndex) => (prevIndex + 1) % 4);
    }, ROTATION_INTERVAL);

    return () => clearInterval(rotationTimer);
  }, [isKioskMode]);

  // If initialization is still in progress, show a simple loading indicator
  if (!isInitialized) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          bgcolor: '#f5f5f5'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', py: 2 }}>
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
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <WeatherCard />
            </Grid>
            <Grid item xs={12} md={4}>
              <TodayAgendaCard />
            </Grid>
            <Grid item xs={12} md={4}>
              <MealPlannerCard />
            </Grid>
            <Grid item xs={12}>
              <FamilyStatsCard />
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
              <MealPlannerCard fullScreen />
            </Box>
            <Box sx={{ display: activeCardIndex === 3 ? 'block' : 'none', height: '100%' }}>
              <FamilyStatsCard fullScreen />
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
}

export default DashboardPage; 