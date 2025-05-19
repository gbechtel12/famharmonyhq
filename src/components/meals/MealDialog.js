import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Chip,
  Box,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  RadioGroup,
  Radio,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import BackpackIcon from '@mui/icons-material/Backpack';
import FaceIcon from '@mui/icons-material/Face';

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snack' }
];

const DAYS = [
  { id: 'sunday', label: 'Sunday' },
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' }
];

// School days (typically Monday-Friday)
const SCHOOL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

// Mock family members
const FAMILY_MEMBERS = [
  { id: 'alex', name: 'Alex', avatar: '👦', color: '#4f46e5' },
  { id: 'emma', name: 'Emma', avatar: '👧', color: '#ec4899' }
];

function MealDialog({ open, onClose, onSave, onDelete, meal, mealType, day }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ingredients: [],
    mealType: '',
    day: '',
    schoolLunchType: 'pack', // Default for backward compatibility
    childLunchPlans: {
      alex: 'pack',
      emma: 'pack'
    }
  });
  const [newIngredient, setNewIngredient] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      if (meal) {
        // Initialize childLunchPlans if it doesn't exist or convert schoolLunchType to childLunchPlans
        let childPlans = meal.childLunchPlans || {};
        
        // If no childLunchPlans but there is a schoolLunchType, apply it to all children
        if (!meal.childLunchPlans && meal.schoolLunchType) {
          childPlans = FAMILY_MEMBERS.reduce((acc, child) => {
            acc[child.id] = meal.schoolLunchType;
            return acc;
          }, {});
        }
        
        // Make sure all children have a lunch plan
        FAMILY_MEMBERS.forEach(child => {
          if (!childPlans[child.id]) {
            childPlans[child.id] = 'pack'; // Default
          }
        });
        
        setFormData({
          ...meal,
          mealType: mealType || '',
          day: day || '',
          schoolLunchType: meal.schoolLunchType || 'pack',
          childLunchPlans: childPlans
        });
      } else {
        // Create default plans for all children
        const defaultChildPlans = FAMILY_MEMBERS.reduce((acc, child) => {
          acc[child.id] = 'pack';
          return acc;
        }, {});
        
        setFormData({
          name: '',
          description: '',
          ingredients: [],
          mealType: mealType || '',
          day: day || '',
          schoolLunchType: 'pack',
          childLunchPlans: defaultChildPlans
        });
      }
      setNewIngredient('');
      setErrors({});
    }
  }, [open, meal, mealType, day]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleChildLunchPlanChange = (childId, lunchPlan) => {
    setFormData(prev => ({
      ...prev,
      childLunchPlans: {
        ...prev.childLunchPlans,
        [childId]: lunchPlan
      }
    }));
  };

  const handleAddIngredient = () => {
    if (newIngredient.trim()) {
      setFormData(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, newIngredient.trim()]
      }));
      setNewIngredient('');
    }
  };

  const handleDeleteIngredient = (index) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Meal name is required';
    }
    
    if (!formData.mealType) {
      newErrors.mealType = 'Meal type is required';
    }
    
    if (!formData.day) {
      newErrors.day = 'Day is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // For backward compatibility, also set schoolLunchType to the most common choice
      // among children (majority wins, or first child if tied)
      const lunchTypes = Object.values(formData.childLunchPlans);
      const counts = lunchTypes.reduce((acc, type) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      
      const majorityType = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      
      onSave({
        name: formData.name,
        description: formData.description,
        ingredients: formData.ingredients,
        schoolLunchType: majorityType, // For backward compatibility
        childLunchPlans: formData.childLunchPlans,
        // We exclude day and mealType from the saved object as they are handled by the parent component
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddIngredient();
    }
  };

  // Check if this is a school lunch
  const isSchoolDay = SCHOOL_DAYS.includes(formData.day);
  const isLunch = formData.mealType === 'lunch';
  const isSchoolLunch = isSchoolDay && isLunch;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {meal ? 'Edit Meal' : 'Add New Meal'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            name="name"
            label="Meal Name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            required
            error={!!errors.name}
            helperText={errors.name}
          />
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth error={!!errors.day}>
              <InputLabel>Day</InputLabel>
              <Select
                name="day"
                value={formData.day}
                onChange={handleChange}
                label="Day"
              >
                {DAYS.map(day => (
                  <MenuItem key={day.id} value={day.id}>
                    {day.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth error={!!errors.mealType}>
              <InputLabel>Meal Type</InputLabel>
              <Select
                name="mealType"
                value={formData.mealType}
                onChange={handleChange}
                label="Meal Type"
              >
                {MEAL_TYPES.map(type => (
                  <MenuItem key={type.id} value={type.id}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          {isSchoolLunch && (
            <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2, bgcolor: '#f5f5f5' }}>
              <Typography variant="subtitle2" gutterBottom>
                School Lunch Options
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <List>
                {FAMILY_MEMBERS.map((child) => (
                  <ListItem key={child.id} sx={{ px: 0, py: 1 }}>
                    <ListItemAvatar>
                      <Avatar 
                        sx={{ 
                          bgcolor: child.color,
                          fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
                          fontSize: '1.2rem'
                        }}
                      >
                        {child.avatar || <FaceIcon />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={child.name} />
                    <RadioGroup
                      name={`child-lunch-${child.id}`}
                      value={formData.childLunchPlans[child.id] || 'pack'}
                      onChange={(e) => handleChildLunchPlanChange(child.id, e.target.value)}
                      row
                    >
                      <FormControlLabel 
                        value="pack" 
                        control={<Radio size="small" />} 
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <BackpackIcon sx={{ mr: 0.5, fontSize: '1.2rem' }} /> Pack
                          </Box>
                        } 
                      />
                      <FormControlLabel 
                        value="buy" 
                        control={<Radio size="small" />} 
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ShoppingBagIcon sx={{ mr: 0.5, fontSize: '1.2rem' }} /> Buy
                          </Box>
                        } 
                      />
                    </RadioGroup>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
          
          <TextField
            name="description"
            label="Description"
            value={formData.description}
            onChange={handleChange}
            fullWidth
            multiline
            rows={2}
          />
          
          <TextField
            label="Add Ingredient"
            value={newIngredient}
            onChange={(e) => setNewIngredient(e.target.value)}
            onKeyPress={handleKeyPress}
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleAddIngredient} edge="end">
                    <AddIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {formData.ingredients.map((ingredient, index) => (
              <Chip
                key={index}
                label={ingredient}
                onDelete={() => handleDeleteIngredient(index)}
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        {meal && (
          <Button 
            onClick={onDelete} 
            color="error"
            sx={{ mr: 'auto' }}
          >
            Delete
          </Button>
        )}
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default MealDialog; 