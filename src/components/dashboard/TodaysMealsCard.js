import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CircularProgress, 
  Typography, 
  Box, 
  Divider,
  Skeleton,
  Paper,
  useTheme
} from '@mui/material';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import WbTwilightIcon from '@mui/icons-material/WbTwilight';
import LunchDiningIcon from '@mui/icons-material/LunchDining';
import DinnerDiningIcon from '@mui/icons-material/DinnerDining';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TimerIcon from '@mui/icons-material/Timer';
import { mealService } from '../../services/mealService';
import { useFamily } from '../../contexts/FamilyContext';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';

function TodaysMealsCard({ fullScreen = false }) {
  const theme = useTheme();
  const { family } = useFamily();
  const [meals, setMeals] = useState({
    breakfast: null,
    lunch: null,
    dinner: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTodaysMeals = async () => {
      if (!family?.id) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Get current date in the format 'YYYY-MM-DD'
        const today = new Date();
        const dayId = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        
        // Get current week's meal plan directly from mealService
        const weekPlan = await mealService.getCurrentWeekPlan(family.id);
        
        const todaysMeals = {
          breakfast: null,
          lunch: null,
          dinner: null
        };
        
        if (weekPlan && weekPlan[dayId]) {
          // Extract breakfast, lunch, and dinner
          if (weekPlan[dayId].breakfast) {
            todaysMeals.breakfast = {
              name: weekPlan[dayId].breakfast.name || 'Breakfast',
              description: weekPlan[dayId].breakfast.description || '',
              time: '07:30',
              prepTime: weekPlan[dayId].breakfast.prepTime || '10 min',
              cookTime: weekPlan[dayId].breakfast.cookTime || '15 min'
            };
          }
          
          if (weekPlan[dayId].lunch) {
            todaysMeals.lunch = {
              name: weekPlan[dayId].lunch.name || 'Lunch',
              description: weekPlan[dayId].lunch.description || '',
              time: '12:30',
              prepTime: weekPlan[dayId].lunch.prepTime || '15 min',
              cookTime: weekPlan[dayId].lunch.cookTime || '5 min',
              schoolLunchType: weekPlan[dayId].lunch.schoolLunchType || 'pack'
            };
          }
          
          if (weekPlan[dayId].dinner) {
            todaysMeals.dinner = {
              name: weekPlan[dayId].dinner.name || 'Dinner',
              description: weekPlan[dayId].dinner.description || '',
              time: '18:30',
              prepTime: weekPlan[dayId].dinner.prepTime || '20 min',
              cookTime: weekPlan[dayId].dinner.cookTime || '30 min'
            };
          }
        }
        
        setMeals(todaysMeals);
        setLoading(false);
      } catch (err) {
        console.error('Error loading meal data:', err);
        setError('Unable to load today\'s meals: ' + (err.message || 'Unknown error'));
        setLoading(false);
      }
    };
    
    fetchTodaysMeals();
  }, [family]);

  const getMealIcon = (mealType) => {
    // Use theme-aware colors for meal icons
    const iconColors = {
      breakfast: theme.palette.mode === 'dark' ? '#facc15' : '#eab308',
      lunch: theme.palette.mode === 'dark' ? '#60a5fa' : '#3b82f6',
      dinner: theme.palette.mode === 'dark' ? '#f87171' : '#ef4444'
    };
    
    switch(mealType) {
      case 'breakfast':
        return <WbTwilightIcon fontSize="small" sx={{ color: iconColors.breakfast }} />;
      case 'lunch':
        return <LunchDiningIcon fontSize="small" sx={{ color: iconColors.lunch }} />;
      case 'dinner':
        return <DinnerDiningIcon fontSize="small" sx={{ color: iconColors.dinner }} />;
      default:
        return <RestaurantIcon fontSize="small" />;
    }
  };

  const getMealColor = (mealType) => {
    // Define background and border colors that work in both light and dark modes
    switch(mealType) {
      case 'breakfast':
        return {
          bg: theme.palette.mode === 'dark' 
            ? 'rgba(161, 98, 7, 0.4)' 
            : 'rgba(254, 249, 195, 0.6)',
          border: theme.palette.mode === 'dark' 
            ? '#ca8a04' 
            : '#fde047'
        };
      case 'lunch':
        return {
          bg: theme.palette.mode === 'dark' 
            ? 'rgba(30, 58, 138, 0.4)' 
            : 'rgba(219, 234, 254, 0.6)',
          border: theme.palette.mode === 'dark' 
            ? '#1d4ed8' 
            : '#93c5fd'
        };
      case 'dinner':
        return {
          bg: theme.palette.mode === 'dark' 
            ? 'rgba(127, 29, 29, 0.4)' 
            : 'rgba(254, 226, 226, 0.6)',
          border: theme.palette.mode === 'dark' 
            ? '#b91c1c' 
            : '#fca5a5'
        };
      default:
        return {
          bg: theme.palette.mode === 'dark' 
            ? 'rgba(30, 41, 59, 0.4)' 
            : 'rgba(243, 244, 246, 0.6)',
          border: theme.palette.mode === 'dark' 
            ? '#475569' 
            : '#d1d5db'
        };
    }
  };

  const renderMealCard = (mealType, meal) => {
    if (!meal) return null;
    
    const colors = getMealColor(mealType);
    
    return (
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2,
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.bg,
          mb: 2
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {getMealIcon(mealType)}
            <Typography 
              variant="subtitle2" 
              component="span" 
              sx={{ ml: 1, fontWeight: 'medium', textTransform: 'capitalize' }}
            >
              {mealType}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', fontSize: '1rem' }} />
            <Typography variant="caption" color="text.secondary">
              {meal.time}
            </Typography>
          </Box>
        </Box>
        
        <Typography variant="body1" fontWeight="medium" sx={{ mb: 0.5 }}>
          {meal.name}
        </Typography>
        
        {meal.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {meal.description}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TimerIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', fontSize: '1rem' }} />
            <Typography variant="caption" color="text.secondary">
              Prep: {meal.prepTime}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <RestaurantIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', fontSize: '1rem' }} />
            <Typography variant="caption" color="text.secondary">
              Cook: {meal.cookTime}
            </Typography>
          </Box>
        </Box>
      </Paper>
    );
  };

  // Define theme-aware card styles
  const cardBackground = theme.palette.mode === 'dark' 
    ? 'linear-gradient(to bottom right, #065f46, #047857)' 
    : 'linear-gradient(to bottom right, #ecfdf5, #d1fae5)';

  const cardBorder = theme.palette.mode === 'dark' 
    ? '1px solid #10b981' 
    : '1px solid #6ee7b7';
    
  const headerBackground = theme.palette.mode === 'dark'
    ? 'rgba(0, 0, 0, 0.2)'
    : 'rgba(255, 255, 255, 0.7)';
    
  const iconColor = theme.palette.mode === 'dark'
    ? '#10b981'
    : '#059669';

  // Check if we have any meals for today
  const hasMeals = meals.breakfast || meals.lunch || meals.dinner;

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardHeader
          title={<Skeleton width="40%" />}
        />
        <CardContent>
          {[1, 2, 3].map((i) => (
            <Box key={i} sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Skeleton width={100} />
                <Skeleton width={60} />
              </Box>
              <Skeleton width="80%" height={28} />
              <Skeleton width="60%" />
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Skeleton width={80} />
                <Skeleton width={80} />
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ height: '100%', background: cardBackground, border: cardBorder }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <RestaurantIcon sx={{ fontSize: 18, mr: 0.5, color: iconColor }} />
              <Typography variant="subtitle1" fontWeight="medium">
                Today's Meals
              </Typography>
            </Box>
          }
          sx={{ 
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: headerBackground,
            py: 1.5,
            px: 2
          }}
        />
        <CardContent>
          <ErrorState 
            title="Couldn't load meals" 
            message={error}
            onRetry={() => window.location.reload()}
          />
        </CardContent>
      </Card>
    );
  }

  if (!hasMeals) {
    return (
      <Card sx={{ height: '100%', background: cardBackground, border: cardBorder }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <RestaurantIcon sx={{ fontSize: 18, mr: 0.5, color: iconColor }} />
              <Typography variant="subtitle1" fontWeight="medium">
                Today's Meals
              </Typography>
            </Box>
          }
          sx={{ 
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: headerBackground,
            py: 1.5,
            px: 2
          }}
        />
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: fullScreen ? 'calc(100vh - 160px)' : '240px' }}>
          <EmptyState 
            title="No meals planned" 
            message="You haven't planned any meals for today."
            icon={<RestaurantIcon />}
            actionText="Plan Meals"
            onAction={() => window.location.href = '/meal-planner'}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      sx={{ 
        height: '100%',
        background: cardBackground,
        border: cardBorder
      }}
    >
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <RestaurantIcon sx={{ fontSize: 18, mr: 0.5, color: iconColor }} />
            <Typography variant="subtitle1" fontWeight="medium">
              Today's Meals
            </Typography>
          </Box>
        }
        sx={{ 
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: headerBackground,
          py: 1.5,
          px: 2
        }}
      />
      <CardContent>
        {meals.breakfast && renderMealCard('breakfast', meals.breakfast)}
        {meals.lunch && renderMealCard('lunch', meals.lunch)}
        {meals.dinner && renderMealCard('dinner', meals.dinner)}
      </CardContent>
    </Card>
  );
}

export default TodaysMealsCard; 