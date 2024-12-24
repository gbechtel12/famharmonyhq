import React from 'react';
import { Paper, Typography } from '@mui/material';
import CalendarView from '../components/Calendar/CalendarView';
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
      <CalendarView familyId={user?.uid} />
    </Paper>
  );
} 