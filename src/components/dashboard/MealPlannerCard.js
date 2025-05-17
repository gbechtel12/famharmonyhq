import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CircularProgress, 
  Typography, 
  Box, 
  Grid, 
  Paper, 
  Divider,
  Tooltip
} from '@mui/material';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import WbTwilightIcon from '@mui/icons-material/WbTwilight';
import CakeIcon from '@mui/icons-material/Cake';
import ScienceIcon from '@mui/icons-material/Science';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import BackpackIcon from '@mui/icons-material/Backpack';
import { mealService } from '../../services/mealService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { format } from 'date-fns';

// Configuration for meal type display
const mealTypeConfig = {
  breakfast: {
    label: 'Breakfast',
    icon: <WbTwilightIcon fontSize="small" sx={{ color: '#eab308' }} />,
    color: '#ca8a04',
    lightBg: 'rgba(254, 249, 195, 0.6)',
    border: '#fde047'
  },
  lunch: {
    label: 'Lunch',
    icon: <RestaurantIcon fontSize="small" sx={{ color: '#3b82f6' }} />,
    color: '#2563eb',
    lightBg: 'rgba(219, 234, 254, 0.6)',
    border: '#93c5fd'
  },
  dinner: {
    label: 'Dinner',
    icon: <LocalFireDepartmentIcon fontSize="small" sx={{ color: '#ef4444' }} />,
    color: '#dc2626',
    lightBg: 'rgba(254, 226, 226, 0.6)',
    border: '#fca5a5'
  },
  snack: {
    label: 'Snack',
    icon: <CakeIcon fontSize="small" sx={{ color: '#a855f7' }} />,
    color: '#9333ea',
    lightBg: 'rgba(243, 232, 255, 0.6)',
    border: '#d8b4fe'
  }
};

// School days (typically Monday-Friday)
const SCHOOL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

const MealCard = ({ meal }) => {
  const config = mealTypeConfig[meal.type] || mealTypeConfig.snack;
  
  // Check if this is a school lunch
  const today = new Date();
  const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const isSchoolDay = SCHOOL_DAYS.includes(dayOfWeek);
  const isSchoolLunch = isSchoolDay && meal.type === 'lunch';
  
  // Get school lunch icon
  const getSchoolLunchIcon = () => {
    if (!meal.schoolLunchType) return null;
    
    return meal.schoolLunchType === 'buy' ? (
      <Tooltip title="Buy School Lunch">
        <ShoppingBagIcon fontSize="small" sx={{ color: '#f59e0b' }} />
      </Tooltip>
    ) : (
      <Tooltip title="Pack Lunch">
        <BackpackIcon fontSize="small" sx={{ color: '#10b981' }} />
      </Tooltip>
    );
  };
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px solid ${config.border}`,
        backgroundColor: config.lightBg,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {config.icon}
          <Typography 
            variant="subtitle2" 
            component="span" 
            sx={{ 
              ml: 1, 
              color: config.color,
              fontWeight: 'medium'
            }}
          >
            {config.label}
          </Typography>
          
          {isSchoolLunch && (
            <Box sx={{ ml: 1 }}>
              {getSchoolLunchIcon()}
            </Box>
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', fontSize: '1rem' }} />
          <Typography variant="caption" color="text.secondary">
            {meal.time}
          </Typography>
        </Box>
      </Box>
      
      <Typography variant="body1" fontWeight="medium" sx={{ mb: 0.5 }}>
        {meal.title}
      </Typography>
      
      {meal.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {meal.description}
        </Typography>
      )}
      
      {(meal.prepTime || meal.cookTime) && (
        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
          {meal.prepTime && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ScienceIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', fontSize: '1rem' }} />
              <Typography variant="caption" color="text.secondary">
                Prep: {meal.prepTime}
              </Typography>
            </Box>
          )}
          
          {meal.cookTime && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LocalFireDepartmentIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', fontSize: '1rem' }} />
              <Typography variant="caption" color="text.secondary">
                Cook: {meal.cookTime}
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};

function MealPlannerCard({ fullScreen = false }) {
  const [isLoading, setIsLoading] = useState(true);
  const [meals, setMeals] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get current date in the format 'YYYY-MM-DD'
        const today = new Date();
        const dayId = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        
        // Get current week's meal plan directly from mealService
        const weekPlan = await mealService.getCurrentWeekPlan('sample-family-id');
        
        const todaysMeals = [];
        
        if (weekPlan && weekPlan[dayId]) {
          // Process each meal type for today
          Object.entries(weekPlan[dayId]).forEach(([mealType, mealData]) => {
            // Skip non-meal properties or null data
            if (!mealData || typeof mealData !== 'object' || mealData === null || mealData.seconds) {
              return;
            }
            
            todaysMeals.push({
              id: `${dayId}-${mealType}`,
              type: mealType || 'snack',
              title: mealData.title || mealData.name || `${mealType || 'Meal'} meal`,
              time: getMealTime(mealType),
              prepTime: mealData.prepTime || '10 min',
              cookTime: mealData.cookTime || '15 min',
              description: mealData.description || '',
              notes: mealData.notes || '',
              schoolLunchType: mealData.schoolLunchType || 'pack', // Add school lunch type
            });
          });
        }
        
        setMeals(todaysMeals);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading meal data:', err);
        setError('Unable to load today\'s meals: ' + (err.message || 'Unknown error'));
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Helper to get meal times based on meal type
  const getMealTime = (mealType) => {
    switch(mealType) {
      case 'breakfast': return '07:30';
      case 'lunch': return '12:30';
      case 'dinner': return '18:30';
      case 'snack': return '15:30';
      default: return '';
    }
  };

  // Sort meals by time
  const sortedMeals = [...meals].sort((a, b) => {
    return a.time.localeCompare(b.time);
  });

  if (isLoading) {
    return (
      <Card sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={28} />
      </Card>
    );
  }
  
  if (error || meals.length === 0) {
    return (
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 2 }}>
        <LocalFireDepartmentIcon sx={{ mb: 1, color: '#9ca3af' }} />
        <Typography variant="body2" color="text.secondary">
          {error || "No meals planned for today"}
        </Typography>
      </Card>
    );
  }

  return (
    <Card 
      sx={{ 
        height: '100%', 
        background: 'linear-gradient(to bottom right, #ecfdf5, #d1fae5)',
        border: '1px solid #6ee7b7',
        overflow: 'hidden'
      }}
    >
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LocalFireDepartmentIcon sx={{ fontSize: 18, mr: 0.5, color: '#059669' }} />
            <Typography variant="subtitle1" fontWeight="medium">
              Today's Meals
            </Typography>
          </Box>
        }
        sx={{ 
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          py: 1.5,
          px: 2
        }}
      />

      <CardContent 
        sx={{ 
          p: 2, 
          overflow: 'auto', 
          maxHeight: fullScreen ? 'calc(100vh - 160px)' : '400px',
          '& > *:not(:last-child)': { mb: 1.5 }
        }}
      >
        {sortedMeals.map((meal) => (
          <MealCard key={meal.id} meal={meal} />
        ))}
      </CardContent>
    </Card>
  );
}

export default MealPlannerCard; 