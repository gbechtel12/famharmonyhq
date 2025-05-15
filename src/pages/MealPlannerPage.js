import React, { useState, useEffect } from 'react';
import { Paper, Typography, Box, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import Loader from '../components/common/Loader';
import WeeklyMealPlanner from '../components/meals/WeeklyMealPlanner';
import { mealService } from '../services/mealService';

function MealPlannerPage() {
  const { user } = useAuth();
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMealPlan = async () => {
      if (!user?.familyId) {
        setError('Please join or create a family to use the meal planner.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const currentWeekPlan = await mealService.getCurrentWeekPlan(user.familyId);
        setMealPlan(currentWeekPlan);
        setLoading(false);
      } catch (err) {
        console.error('Error loading meal plan:', err);
        setError('Failed to load meal plan');
        setLoading(false);
      }
    };

    loadMealPlan();
  }, [user?.familyId]);

  const handleMealUpdate = async (dayId, mealType, meal) => {
    try {
      await mealService.updateMeal(user.familyId, dayId, mealType, meal);
      
      // Update local state
      setMealPlan(prevPlan => {
        const updatedPlan = { ...prevPlan };
        if (!updatedPlan[dayId]) {
          updatedPlan[dayId] = {};
        }
        updatedPlan[dayId][mealType] = meal;
        return updatedPlan;
      });
    } catch (err) {
      console.error('Error updating meal:', err);
      setError('Failed to update meal');
    }
  };

  if (loading) {
    return <Loader message="Loading meal planner..." />;
  }

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Family Meal Planner
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <WeeklyMealPlanner 
        mealPlan={mealPlan || {}} 
        onMealUpdate={handleMealUpdate} 
      />
    </Paper>
  );
}

export default MealPlannerPage; 