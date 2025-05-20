import React, { useState, useEffect, useCallback } from 'react';
import { CircularProgress, Grid, Container, Paper, Typography, Box, IconButton, useTheme, useMediaQuery, Snackbar, Alert } from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import WeatherCard from '../components/dashboard/WeatherCard';
import TodayAgendaCard from '../components/dashboard/TodayAgendaCard';
import TodaysMealsCard from '../components/dashboard/TodaysMealsCard';
import FamilyStatsCard from '../components/dashboard/FamilyStatsCard';
import ChoresCard from '../components/dashboard/ChoresCard';
import SchoolLunchCard from '../components/dashboard/SchoolLunchCard';
import DateCard from '../components/dashboard/DateCard';
import GroceryListCard from '../components/dashboard/GroceryListCard';
import { useFamily } from '../contexts/FamilyContext';
import { useFeedback } from '../contexts/FeedbackContext';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { db } from '../firebase';

const ROTATION_INTERVAL = 20000; // 20 seconds
const REFRESH_INTERVAL = 300000; // 5 minutes

function DashboardPage() {
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [refreshTimestamp, setRefreshTimestamp] = useState(Date.now());
  const [dataLoaded, setDataLoaded] = useState({
    events: false,
    meals: false,
    chores: false,
    groceries: false,
    schoolLunch: false
  });
  const [listeners, setListeners] = useState([]);

  const theme = useTheme();
  const { family } = useFamily();
  const { showError } = useFeedback();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  // Setup real-time listeners for Firestore collections
  useEffect(() => {
    if (!family?.id) return;

    // Create an array to hold all listeners for cleanup
    const activeListeners = [];

    // Listen for events changes
    const eventsQuery = collection(db, 'families', family.id, 'events');
    const eventsUnsubscribe = onSnapshot(
      eventsQuery,
      (snapshot) => {
        // Trigger refresh for TodayAgendaCard
        setRefreshTimestamp(Date.now());
        setDataLoaded(prev => ({ ...prev, events: true }));
      },
      (error) => {
        console.error('Error listening to events:', error);
        showError('Error syncing calendar events');
      }
    );
    activeListeners.push(eventsUnsubscribe);

    // Listen for chores changes
    const choresQuery = collection(db, 'families', family.id, 'chores');
    const choresUnsubscribe = onSnapshot(
      choresQuery,
      (snapshot) => {
        // Trigger refresh for ChoresCard and TodayAgendaCard
        setRefreshTimestamp(Date.now());
        setDataLoaded(prev => ({ ...prev, chores: true }));
      },
      (error) => {
        console.error('Error listening to chores:', error);
        showError('Error syncing chores');
      }
    );
    activeListeners.push(choresUnsubscribe);

    // Listen for meal plan changes
    const mealPlansRef = doc(db, 'families', family.id, 'mealPlans', 'current');
    const mealsUnsubscribe = onSnapshot(
      mealPlansRef,
      (doc) => {
        // Trigger refresh for TodaysMealsCard and SchoolLunchCard
        setRefreshTimestamp(Date.now());
        setDataLoaded(prev => ({ ...prev, meals: true, schoolLunch: true }));
      },
      (error) => {
        console.error('Error listening to meal plans:', error);
        showError('Error syncing meal plans');
      }
    );
    activeListeners.push(mealsUnsubscribe);

    // Listen for grocery list changes
    const groceryListRef = doc(db, 'families', family.id, 'groceryLists', 'current');
    const groceryUnsubscribe = onSnapshot(
      groceryListRef,
      (doc) => {
        // Trigger refresh for GroceryListCard
        setRefreshTimestamp(Date.now());
        setDataLoaded(prev => ({ ...prev, groceries: true }));
      },
      (error) => {
        console.error('Error listening to grocery list:', error);
        showError('Error syncing grocery list');
      }
    );
    activeListeners.push(groceryUnsubscribe);

    // Save all unsubscribe functions
    setListeners(activeListeners);

    // Cleanup function to unsubscribe from all listeners
    return () => {
      activeListeners.forEach(unsubscribe => unsubscribe());
    };
  }, [family?.id, showError]);

  // Add periodic refresh interval
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Refresh data every 5 minutes
      setRefreshTimestamp(Date.now());
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, []);

  // Toggle kiosk mode (auto-rotation)
  const toggleKioskMode = () => {
    setIsKioskMode(!isKioskMode);
    // Reset to first card when toggling
    setActiveCardIndex(0);
  };

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    setRefreshTimestamp(Date.now());
  }, []);

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

  // All data is considered loaded when family data is available
  const isDataLoading = !family?.id;

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
          <Box>
            <IconButton
              onClick={handleRefresh}
              color="primary"
              size="small"
              sx={{ mr: 1 }}
              title="Refresh dashboard"
            >
              <RefreshIcon />
            </IconButton>
            <IconButton
              onClick={toggleKioskMode}
              color={isKioskMode ? "primary" : "default"}
              size="small"
              title={isKioskMode ? "Exit kiosk mode" : "Enter kiosk mode"}
            >
              {isKioskMode ? <StopCircleIcon /> : <PlayCircleOutlineIcon />}
            </IconButton>
          </Box>
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
              <TodayAgendaCard 
                key={`agenda-${refreshTimestamp}`} 
                isLoading={isDataLoading} 
              />
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <TodaysMealsCard 
                key={`meals-${refreshTimestamp}`} 
                isLoading={isDataLoading} 
              />
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <SchoolLunchCard 
                key={`lunch-${refreshTimestamp}`} 
                isLoading={isDataLoading} 
              />
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <ChoresCard 
                key={`chores-${refreshTimestamp}`} 
                isLoading={isDataLoading} 
              />
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <GroceryListCard 
                key={`grocery-${refreshTimestamp}`} 
                isLoading={isDataLoading} 
              />
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
              <TodayAgendaCard 
                key={`agenda-kiosk-${refreshTimestamp}`} 
                fullScreen 
                isLoading={isDataLoading} 
              />
            </Box>
            <Box sx={{ display: activeCardIndex === 2 ? 'block' : 'none', height: '100%' }}>
              <TodaysMealsCard 
                key={`meals-kiosk-${refreshTimestamp}`} 
                fullScreen 
                isLoading={isDataLoading} 
              />
            </Box>
            <Box sx={{ display: activeCardIndex === 3 ? 'block' : 'none', height: '100%' }}>
              <SchoolLunchCard 
                key={`lunch-kiosk-${refreshTimestamp}`} 
                fullScreen 
                isLoading={isDataLoading} 
              />
            </Box>
            <Box sx={{ display: activeCardIndex === 4 ? 'block' : 'none', height: '100%' }}>
              <ChoresCard 
                key={`chores-kiosk-${refreshTimestamp}`} 
                fullScreen 
                isLoading={isDataLoading} 
              />
            </Box>
            <Box sx={{ display: activeCardIndex === 5 ? 'block' : 'none', height: '100%' }}>
              <GroceryListCard 
                key={`grocery-kiosk-${refreshTimestamp}`} 
                fullScreen 
                isLoading={isDataLoading} 
              />
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
}

export default DashboardPage; 