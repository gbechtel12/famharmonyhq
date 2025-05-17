import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Alert, 
  Divider, 
  IconButton,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Card,
  CardContent,
  Grid,
  Tooltip
} from '@mui/material';
import { 
  Event as EventIcon,
  Assignment as ChoreIcon,
  Restaurant as MealIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Today as TodayIcon,
  CheckCircle as CompletedIcon,
  AccessTime as TimeIcon,
  ShoppingBag as ShoppingBagIcon,
  Backpack as BackpackIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import Loader from '../components/common/Loader';
import { agendaService } from '../services/agendaService';
import { format, addDays, parseISO, isToday } from 'date-fns';

// School days (typically Monday-Friday)
const SCHOOL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

function DailyAgendaPage() {
  const { user } = useAuth();
  const [agendaItems, setAgendaItems] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAgenda = async () => {
      if (!user?.familyId) {
        setError('Please join or create a family to view the daily agenda.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const items = await agendaService.getDailyAgenda(user.familyId, selectedDate);
        setAgendaItems(items || []); // Ensure we always have an array
        setLoading(false);
      } catch (err) {
        console.error('Error loading daily agenda:', err);
        setError('Failed to load daily agenda: ' + (err.message || 'Unknown error'));
        setAgendaItems([]); // Reset to empty array on error
        setLoading(false);
      }
    };

    loadAgenda();
  }, [user?.familyId, selectedDate]);

  // Handle date navigation
  const handlePrevDay = () => {
    setSelectedDate(prev => addDays(prev, -1));
  };

  const handleNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  // Format the date for display
  const formattedDate = format(selectedDate, 'EEEE, MMMM d, yyyy');
  const isSelectedDateToday = isToday(selectedDate);

  // Group agenda items by type
  const events = agendaItems.filter(item => item.type === 'event');
  const chores = agendaItems.filter(item => item.type === 'chore');
  const meals = agendaItems.filter(item => item.type === 'meal');
  
  // Check if a meal is a school lunch
  const isSchoolLunch = (meal) => {
    if (meal.mealType !== 'lunch') return false;
    const dayOfWeek = format(selectedDate, 'EEEE').toLowerCase();
    return SCHOOL_DAYS.includes(dayOfWeek);
  };
  
  // Get school lunch icon/badge
  const getSchoolLunchBadge = (meal) => {
    if (!isSchoolLunch(meal)) return null;
    
    if (meal.schoolLunchType === 'buy') {
      return (
        <Tooltip title="Buy School Lunch">
          <Chip 
            icon={<ShoppingBagIcon fontSize="small" />} 
            label="Buy" 
            size="small" 
            color="warning" 
            variant="outlined"
            sx={{ ml: 1 }}
          />
        </Tooltip>
      );
    } else {
      return (
        <Tooltip title="Pack Lunch">
          <Chip 
            icon={<BackpackIcon fontSize="small" />} 
            label="Pack" 
            size="small" 
            color="success" 
            variant="outlined"
            sx={{ ml: 1 }}
          />
        </Tooltip>
      );
    }
  };

  if (loading) {
    return <Loader message="Loading daily agenda..." />;
  }

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Daily Agenda
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={handlePrevDay}>
            <PrevIcon />
          </IconButton>
          
          <Button 
            variant={isSelectedDateToday ? "contained" : "outlined"}
            onClick={handleToday}
            startIcon={<TodayIcon />}
          >
            Today
          </Button>
          
          <IconButton onClick={handleNextDay}>
            <NextIcon />
          </IconButton>
        </Box>
      </Box>

      <Typography variant="h5" color="primary" align="center" gutterBottom>
        {formattedDate}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {agendaItems.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No agenda items scheduled for this day.
        </Alert>
      ) : (
        <Box>
          {/* Timeline view of all items */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
            <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
              Daily Timeline
            </Typography>
            
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent sx={{ p: 0 }}>
                <List sx={{ width: '100%', py: 0 }}>
                  {agendaItems.map((item, index) => (
                    <React.Fragment key={`${item.type}-${item.id || index}`}>
                      {index > 0 && <Divider component="li" />}
                      <ListItem
                        sx={{
                          pl: 2,
                          py: 2,
                          backgroundColor: isBackgroundColorByType(item.type)
                        }}
                      >
                        <ListItemIcon>
                          {getIconByType(item.type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1">
                                {getItemTitle(item)}
                              </Typography>
                              {item.completed && <CompletedIcon color="success" fontSize="small" />}
                              {item.type === 'meal' && isSchoolLunch(item) && getSchoolLunchBadge(item)}
                            </Box>
                          }
                          secondary={
                            <Box>
                              {getItemDescription(item)}
                              {getItemTime(item)}
                            </Box>
                          }
                        />
                        {renderItemChip(item)}
                      </ListItem>
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Box>

          {/* Separate sections by category */}
          <Grid container spacing={3}>
            {/* Calendar Events */}
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <EventIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      Events
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  {events.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No events scheduled
                    </Typography>
                  ) : (
                    <List dense>
                      {events.map((event, index) => (
                        <ListItem key={event.id || index} sx={{ px: 0 }}>
                          <ListItemIcon>
                            <TimeIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={event.title}
                            secondary={
                              <React.Fragment>
                                {formatEventTime(event)}
                                {event.location && (
                                  <Typography variant="caption" display="block">
                                    Location: {event.location}
                                  </Typography>
                                )}
                              </React.Fragment>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Meals */}
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <MealIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      Meals
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  {meals.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No meals planned
                    </Typography>
                  ) : (
                    <List dense>
                      {meals.map((meal, index) => (
                        <ListItem key={`meal-${index}`} sx={{ px: 0 }}>
                          <ListItemIcon>
                            <Avatar 
                              sx={{ 
                                width: 24, 
                                height: 24, 
                                bgcolor: getMealColor(meal.mealType),
                                fontSize: '0.75rem'
                              }}
                            >
                              {meal.mealType.charAt(0).toUpperCase()}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="subtitle2">{getMealTypeLabel(meal.mealType)}</Typography>
                                {isSchoolLunch(meal) && (
                                  <Box component="span" sx={{ ml: 1 }}>
                                    {getSchoolLunchBadge(meal)}
                                  </Box>
                                )}
                              </Box>
                            }
                            secondary={meal.name}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Chores */}
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ChoreIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">
                      Chores
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  
                  {chores.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No chores due today
                    </Typography>
                  ) : (
                    <List dense>
                      {chores.map((chore, index) => (
                        <ListItem key={chore.id || index} sx={{ px: 0 }}>
                          <ListItemIcon>
                            {chore.completed ? (
                              <CompletedIcon color="success" fontSize="small" />
                            ) : (
                              <ChoreIcon fontSize="small" />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={chore.title || chore.name}
                            secondary={
                              <React.Fragment>
                                <Typography variant="caption" display="block">
                                  Points: {chore.points || 0}
                                </Typography>
                                {chore.assignedTo && (
                                  <Typography variant="caption" display="block">
                                    Assigned to: {chore.assignedTo}
                                  </Typography>
                                )}
                              </React.Fragment>
                            }
                          />
                          {chore.completed && (
                            <Chip
                              label="Completed"
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          )}
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Paper>
  );
}

// Helper function to get background color based on item type
function isBackgroundColorByType(type) {
  switch (type) {
    case 'event':
      return 'rgba(232, 245, 253, 0.4)'; // Light blue
    case 'chore':
      return 'rgba(237, 231, 246, 0.4)'; // Light purple
    case 'meal':
      return 'rgba(230, 249, 231, 0.4)'; // Light green
    default:
      return 'transparent';
  }
}

// Helper function to get icon based on item type
function getIconByType(type) {
  switch (type) {
    case 'event':
      return <EventIcon color="primary" />;
    case 'chore':
      return <ChoreIcon color="secondary" />;
    case 'meal':
      return <MealIcon sx={{ color: 'success.main' }} />;
    default:
      return <TimeIcon />;
  }
}

// Helper function to get item title
function getItemTitle(item) {
  switch (item.type) {
    case 'event':
      return item.title || 'Untitled Event';
    case 'chore':
      return item.title || item.name || 'Untitled Chore';
    case 'meal':
      return `${getMealTypeLabel(item.mealType)}: ${item.name || 'Unspecified meal'}`;
    default:
      return 'Agenda Item';
  }
}

// Helper function to get meal type label
function getMealTypeLabel(mealType) {
  switch (mealType) {
    case 'breakfast':
      return 'Breakfast';
    case 'lunch':
      return 'Lunch';
    case 'dinner':
      return 'Dinner';
    case 'snack':
      return 'Snack';
    default:
      return 'Meal';
  }
}

// Helper function to get meal color
function getMealColor(mealType) {
  switch (mealType) {
    case 'breakfast':
      return '#fb923c'; // Orange
    case 'lunch':
      return '#38bdf8'; // Blue
    case 'dinner':
      return '#f43f5e'; // Red
    case 'snack':
      return '#a855f7'; // Purple
    default:
      return '#94a3b8'; // Gray
  }
}

// Helper function to get item description
function getItemDescription(item) {
  if (!item.description) return null;
  
  return (
    <Typography variant="body2" color="text.secondary">
      {item.description}
    </Typography>
  );
}

// Helper function to get item time
function getItemTime(item) {
  let timeText = '';
  
  if (item.type === 'event') {
    if (item.startTime) {
      timeText = formatEventTime(item);
    }
  } else if (item.type === 'meal') {
    timeText = item.time || getMealTimeByType(item.mealType);
  } else if (item.type === 'chore') {
    timeText = item.dueTime || 'All day';
  }
  
  if (!timeText) return null;
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
      <TimeIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', fontSize: '0.875rem' }} />
      <Typography variant="caption" color="text.secondary">
        {timeText}
      </Typography>
    </Box>
  );
}

// Helper function to get meal time by type
function getMealTimeByType(mealType) {
  switch (mealType) {
    case 'breakfast':
      return '7:30 AM';
    case 'lunch':
      return '12:30 PM';
    case 'dinner':
      return '6:30 PM';
    case 'snack':
      return '3:30 PM';
    default:
      return '';
  }
}

// Helper function to render item chip (status, priority, etc.)
function renderItemChip(item) {
  if (item.type === 'chore') {
    return (
      <Chip 
        label={item.completed ? "Completed" : "Pending"} 
        size="small"
        color={item.completed ? "success" : "default"}
        variant={item.completed ? "filled" : "outlined"}
      />
    );
  } else if (item.type === 'event' && item.isAllDay) {
    return (
      <Chip 
        label="All Day" 
        size="small"
        color="primary"
        variant="outlined"
      />
    );
  }
  
  return null;
}

// Format event time for display
function formatEventTime(event) {
  if (!event) return '';
  
  if (event.isAllDay) {
    return 'All day';
  }
  
  try {
    const startTime = event.startTime?.toDate ? event.startTime.toDate() : 
                     (event.startTime instanceof Date ? event.startTime : new Date());
    
    const endTime = event.endTime?.toDate ? event.endTime.toDate() : 
                   (event.endTime instanceof Date ? event.endTime : null);
    
    if (endTime) {
      return `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`;
    }
    
    return format(startTime, 'h:mm a');
  } catch (error) {
    console.error('Error formatting event time:', error);
    return 'Time not available';
  }
}

export default DailyAgendaPage; 