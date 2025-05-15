import React from 'react';
import { Paper, Typography, Grid, Box } from '@mui/material';
import CalendarView from '../components/Calendar/CalendarView';
import WeatherWidget from '../components/weather/WeatherWidget';
import { useAuth } from '../contexts/AuthContext';
import Loader from '../components/common/Loader';

export default function CalendarPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader message="Loading user data..." />;
  }

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Typography variant="h4" gutterBottom>
        Family Calendar
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={9}>
          <CalendarView familyId={user?.uid} />
        </Grid>
        <Grid item xs={12} md={3}>
          <Box sx={{ mb: 2 }}>
            <WeatherWidget />
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
} 