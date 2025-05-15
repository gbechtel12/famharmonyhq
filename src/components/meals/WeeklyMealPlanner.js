import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  IconButton,
  Tooltip 
} from '@mui/material';
import { 
  DragDropContext, 
  Droppable, 
  Draggable 
} from 'react-beautiful-dnd';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon
} from '@mui/icons-material';
import MealDialog from './MealDialog';
import { styled } from '@mui/material/styles';

// Styled components for drag and drop
const DayColumn = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.default,
  transition: 'background-color 0.2s ease'
}));

const MealSlot = styled(Card)(({ theme, isDraggingOver }) => ({
  marginBottom: theme.spacing(2),
  backgroundColor: isDraggingOver ? theme.palette.action.hover : theme.palette.background.paper,
  transition: 'background-color 0.2s ease',
  cursor: 'pointer',
  '&:hover': {
    boxShadow: theme.shadows[3]
  }
}));

const EmptyMealSlot = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.action.hover,
  border: `1px dashed ${theme.palette.divider}`,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: 80,
  marginBottom: theme.spacing(2),
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.action.selected
  }
}));

// Days of the week
const DAYS = [
  { id: 'sunday', label: 'Sunday' },
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' }
];

// Meal types
const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', color: '#4CAF50' },
  { id: 'lunch', label: 'Lunch', color: '#2196F3' },
  { id: 'dinner', label: 'Dinner', color: '#FF5722' },
  { id: 'snack', label: 'Snack', color: '#9C27B0' }
];

function WeeklyMealPlanner({ mealPlan, onMealUpdate }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedMealType, setSelectedMealType] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);

  const getMealTypeColor = (mealTypeId) => {
    const mealType = MEAL_TYPES.find(mt => mt.id === mealTypeId);
    return mealType ? mealType.color : '#9e9e9e';
  };

  const getMealForDayAndType = (dayId, mealTypeId) => {
    return mealPlan[dayId]?.[mealTypeId] || null;
  };

  const handleOpenDialog = (dayId, mealTypeId, meal = null) => {
    setSelectedDay(dayId);
    setSelectedMealType(mealTypeId);
    setSelectedMeal(meal);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedDay(null);
    setSelectedMealType(null);
    setSelectedMeal(null);
  };

  const handleSaveMeal = (meal) => {
    onMealUpdate(selectedDay, selectedMealType, meal);
    handleCloseDialog();
  };

  const handleDeleteMeal = () => {
    onMealUpdate(selectedDay, selectedMealType, null);
    handleCloseDialog();
  };

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    // If dropped outside a droppable area
    if (!destination) {
      return;
    }

    // If dropped in the same place
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Parse the IDs
    const [sourceDay, sourceMealType] = source.droppableId.split('-');
    const [destDay, destMealType] = destination.droppableId.split('-');

    // Get the meal being moved
    const mealToMove = getMealForDayAndType(sourceDay, sourceMealType);

    if (mealToMove) {
      // Remove from source
      onMealUpdate(sourceDay, sourceMealType, null);
      
      // Add to destination
      onMealUpdate(destDay, destMealType, mealToMove);
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Grid container spacing={2}>
          {DAYS.map(day => (
            <Grid item xs={12} sm={6} md={3} lg={12/7} key={day.id}>
              <DayColumn elevation={1}>
                <Typography variant="h6" align="center" gutterBottom>
                  {day.label}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                {MEAL_TYPES.map(mealType => {
                  const meal = getMealForDayAndType(day.id, mealType.id);
                  const droppableId = `${day.id}-${mealType.id}`;
                  
                  return (
                    <Box key={mealType.id} sx={{ mb: 2 }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          mb: 1, 
                          color: getMealTypeColor(mealType.id),
                          fontWeight: 'bold' 
                        }}
                      >
                        {mealType.label}
                      </Typography>
                      
                      <Droppable droppableId={droppableId}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                          >
                            {meal ? (
                              <Draggable 
                                draggableId={`meal-${day.id}-${mealType.id}`} 
                                index={0}
                              >
                                {(provided, snapshot) => (
                                  <MealSlot
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={provided.draggableProps.style}
                                    elevation={snapshot.isDragging ? 3 : 1}
                                  >
                                    <CardContent>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                          {meal.name}
                                        </Typography>
                                        <Box>
                                          <Tooltip title="Edit">
                                            <IconButton 
                                              size="small"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenDialog(day.id, mealType.id, meal);
                                              }}
                                            >
                                              <EditIcon fontSize="small" />
                                            </IconButton>
                                          </Tooltip>
                                          <Tooltip title="Delete">
                                            <IconButton 
                                              size="small"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteMeal();
                                              }}
                                            >
                                              <DeleteIcon fontSize="small" />
                                            </IconButton>
                                          </Tooltip>
                                        </Box>
                                      </Box>
                                      {meal.description && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                          {meal.description}
                                        </Typography>
                                      )}
                                      {meal.ingredients && meal.ingredients.length > 0 && (
                                        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                          {meal.ingredients.map((ingredient, index) => (
                                            <Chip 
                                              key={index} 
                                              label={ingredient} 
                                              size="small" 
                                              variant="outlined"
                                            />
                                          ))}
                                        </Box>
                                      )}
                                    </CardContent>
                                  </MealSlot>
                                )}
                              </Draggable>
                            ) : (
                              <EmptyMealSlot
                                onClick={() => handleOpenDialog(day.id, mealType.id)}
                              >
                                <Tooltip title="Add meal">
                                  <AddIcon color="action" />
                                </Tooltip>
                              </EmptyMealSlot>
                            )}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </Box>
                  );
                })}
              </DayColumn>
            </Grid>
          ))}
        </Grid>
      </DragDropContext>

      <MealDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSaveMeal}
        onDelete={handleDeleteMeal}
        meal={selectedMeal}
        mealType={selectedMealType}
        day={selectedDay}
      />
    </Box>
  );
}

export default WeeklyMealPlanner; 