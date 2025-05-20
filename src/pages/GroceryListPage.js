import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Alert, 
  Button, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Checkbox,
  IconButton,
  Divider,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tooltip,
  Fab
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  ShoppingCart as ShoppingCartIcon,
  RestaurantMenu as RestaurantMenuIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useFeedback } from '../contexts/FeedbackContext';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import { groceryService } from '../services/groceryService';
import { mealService } from '../services/mealService';
import { withErrorHandling } from '../utils/errorHandler';

// Category options for items
const CATEGORIES = [
  { id: 'produce', label: 'Produce' },
  { id: 'dairy', label: 'Dairy' },
  { id: 'meat', label: 'Meat & Seafood' },
  { id: 'bakery', label: 'Bakery' },
  { id: 'pantry', label: 'Pantry' },
  { id: 'frozen', label: 'Frozen' },
  { id: 'beverages', label: 'Beverages' },
  { id: 'household', label: 'Household' },
  { id: 'other', label: 'Other' },
  { id: 'mealIngredients', label: 'Meal Ingredients' }
];

function GroceryListPage() {
  const { user } = useAuth();
  const { showSuccess, showError, handleError } = useFeedback();
  const [groceryList, setGroceryList] = useState({ items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('other');
  const [addMealDialogOpen, setAddMealDialogOpen] = useState(false);
  const [groupByCategory, setGroupByCategory] = useState(true);

  const loadGroceryList = async () => {
    if (!user?.familyId) {
      setError('Please join or create a family to use the grocery list.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const list = await withErrorHandling(
        () => groceryService.getGroceryList(user.familyId),
        {
          context: 'grocery-list',
          dataType: 'groceryList'
        }
      );
      setGroceryList(list);
      setError(null);
    } catch (err) {
      handleError(err, 'grocery-list');
      setError('Failed to load grocery list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroceryList();
  }, [user?.familyId]);

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;

    try {
      console.log('Adding item to grocery list:', newItemName, newItemCategory);
      console.log('Family ID:', user.familyId);
      
      const newItem = {
        name: newItemName.trim(),
        category: newItemCategory
      };

      // Add the item to the grocery list
      await groceryService.addGroceryItem(user.familyId, newItem);
      
      // Reload the list to get the updated data
      const updatedList = await groceryService.getGroceryList(user.familyId);
      setGroceryList(updatedList);
      
      // Clear the form
      setNewItemName('');
      setNewItemCategory('other');
      
      showSuccess(`Added "${newItemName}" to grocery list`);
    } catch (err) {
      console.error('Error adding item to grocery list:', err);
      showError(`Failed to add "${newItemName}": ${err.message}`);
    }
  };

  const handleToggleCompleted = async (itemId, currentCompleted) => {
    try {
      await withErrorHandling(
        () => groceryService.updateGroceryItem(user.familyId, itemId, {
          completed: !currentCompleted
        }),
        {
          context: 'grocery-list-toggle-item'
        }
      );
      
      // Update local state for immediate feedback
      setGroceryList(prevList => {
        const updatedItems = prevList.items.map(item => {
          if (item.id === itemId) {
            return { ...item, completed: !currentCompleted };
          }
          return item;
        });
        
        return { ...prevList, items: updatedItems };
      });
    } catch (err) {
      handleError(err, 'grocery-list-toggle-item');
    }
  };

  const handleRemoveItem = async (itemId, itemName) => {
    try {
      await withErrorHandling(
        () => groceryService.removeGroceryItem(user.familyId, itemId),
        {
          context: 'grocery-list-remove-item'
        }
      );
      
      // Update local state
      setGroceryList(prevList => {
        const updatedItems = prevList.items.filter(item => item.id !== itemId);
        return { ...prevList, items: updatedItems };
      });
      
      showSuccess(`Removed "${itemName}" from grocery list`);
    } catch (err) {
      handleError(err, 'grocery-list-remove-item');
      showError(`Failed to remove "${itemName}"`);
    }
  };

  const handleClearCompleted = async () => {
    try {
      await withErrorHandling(
        () => groceryService.clearCompletedItems(user.familyId),
        {
          context: 'grocery-list-clear-completed'
        }
      );
      
      // Update local state
      setGroceryList(prevList => {
        const updatedItems = prevList.items.filter(item => !item.completed);
        return { ...prevList, items: updatedItems };
      });
      
      showSuccess('Cleared completed items');
    } catch (err) {
      handleError(err, 'grocery-list-clear-completed');
      showError('Failed to clear completed items');
    }
  };

  const handleAddIngredientsFromMealPlan = async () => {
    try {
      setLoading(true);
      await groceryService.addIngredientsFromMealPlan(user.familyId);
      
      // Reload the list
      const updatedList = await groceryService.getGroceryList(user.familyId);
      setGroceryList(updatedList);
      setLoading(false);
      setAddMealDialogOpen(false);
    } catch (err) {
      console.error('Error adding ingredients from meal plan:', err);
      setError('Failed to add ingredients from meal plan');
      setLoading(false);
    }
  };

  // Group items by category if groupByCategory is true
  const getGroupedItems = () => {
    if (!groupByCategory) {
      return {
        "All Items": groceryList.items || []
      };
    }

    return (groceryList.items || []).reduce((groups, item) => {
      // Normalize category to lowercase for consistent grouping
      let category = (item.category || 'other').toLowerCase();
      
      // Check if it's a valid category, otherwise use 'other'
      const isValidCategory = CATEGORIES.some(c => c.id === category);
      if (!isValidCategory) {
        category = 'other';
      }
      
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
      return groups;
    }, {});
  };

  const groupedItems = getGroupedItems();
  const categories = Object.keys(groupedItems).sort();
  const completedCount = (groceryList.items || []).filter(item => item.completed).length;
  const totalCount = (groceryList.items || []).length;

  if (loading) {
    return <Loader message="Loading grocery list..." />;
  }

  const getCategoryLabel = (categoryId) => {
    const category = CATEGORIES.find(c => c.id === categoryId);
    return category ? category.label : (categoryId === 'All Items' ? categoryId : 'Other');
  };

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" gutterBottom>
          Grocery List
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<RestaurantMenuIcon />}
            onClick={() => setAddMealDialogOpen(true)}
          >
            Add from Meal Plan
          </Button>
          
          <Button 
            variant="outlined" 
            onClick={() => setGroupByCategory(!groupByCategory)}
          >
            {groupByCategory ? 'View as List' : 'Group by Category'}
          </Button>
          
          {completedCount > 0 && (
            <Button 
              variant="outlined" 
              color="error"
              onClick={handleClearCompleted}
            >
              Clear Completed ({completedCount})
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Add new item form */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          label="Add Item"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
          fullWidth
        />
        
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={newItemCategory}
            onChange={(e) => setNewItemCategory(e.target.value)}
            label="Category"
          >
            {CATEGORIES.filter(c => c.id !== 'mealIngredients').map(category => (
              <MenuItem key={category.id} value={category.id}>
                {category.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Button 
          variant="contained" 
          onClick={handleAddItem}
          startIcon={<AddIcon />}
        >
          Add
        </Button>
      </Box>

      {/* Progress indicator */}
      {totalCount > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {completedCount} of {totalCount} items checked ({Math.round(completedCount / totalCount * 100)}% complete)
        </Alert>
      )}

      {/* Grocery list */}
      {totalCount === 0 ? (
        <Alert severity="info">
          Your grocery list is empty. Add items above or import from your meal plan.
        </Alert>
      ) : (
        <Box>
          {categories.map(category => (
            <Box key={category} sx={{ mb: 4 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 1, 
                  pb: 1, 
                  borderBottom: '1px solid', 
                  borderColor: 'divider' 
                }}
              >
                {getCategoryLabel(category)}
              </Typography>
              
              <List>
                {groupedItems[category].map(item => (
                  <ListItem
                    key={item.id}
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        onClick={() => handleRemoveItem(item.id, item.name)}
                        aria-label="delete"
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                    sx={{
                      bgcolor: item.completed ? 'action.hover' : 'transparent',
                      textDecoration: item.completed ? 'line-through' : 'none',
                      color: item.completed ? 'text.secondary' : 'text.primary',
                      borderRadius: 1,
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <ListItemIcon>
                      <Checkbox
                        edge="start"
                        checked={item.completed}
                        onChange={() => handleToggleCompleted(item.id, item.completed)}
                        disableRipple
                      />
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.name} 
                      secondary={
                        item.quantity > 1 ? `Quantity: ${item.quantity}` : null
                      }
                    />
                    {item.mealId && (
                      <Chip 
                        label="From Meal Plan" 
                        size="small" 
                        color="primary"
                        variant="outlined"
                        sx={{ mr: 2 }}
                      />
                    )}
                  </ListItem>
                ))}
              </List>
            </Box>
          ))}
        </Box>
      )}

      {/* Add from meal plan dialog */}
      <Dialog
        open={addMealDialogOpen}
        onClose={() => setAddMealDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Ingredients from Meal Plan</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            This will add all ingredients from your current meal plan to your grocery list.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Note: Duplicate ingredients will be combined and quantities updated.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddMealDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddIngredientsFromMealPlan} 
            variant="contained"
            startIcon={<ShoppingCartIcon />}
          >
            Add Ingredients
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add floating action button for small screens */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' }
        }}
        onClick={() => setAddMealDialogOpen(true)}
      >
        <RestaurantMenuIcon />
      </Fab>
    </Paper>
  );
}

export default GroceryListPage; 