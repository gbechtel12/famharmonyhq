import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Box
} from '@mui/material';

const REWARD_CATEGORIES = [
  'Entertainment',
  'Activities',
  'Screen Time',
  'Outing',
  'Special Treat',
  'Toys',
  'Other'
];

function RewardDialog({ open, onClose, onSave, reward = null }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pointsCost: 10,
    category: ''
  });
  
  const [errors, setErrors] = useState({});
  
  useEffect(() => {
    if (reward) {
      setFormData({
        name: reward.name || '',
        description: reward.description || '',
        pointsCost: reward.pointsCost || 10,
        category: reward.category || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        pointsCost: 10,
        category: ''
      });
    }
    setErrors({});
  }, [reward, open]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'pointsCost' ? Number(value) : value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (formData.pointsCost <= 0) {
      newErrors.pointsCost = 'Points must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = () => {
    if (validate()) {
      onSave(formData);
      onClose();
    }
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {reward ? 'Edit Reward' : 'Add New Reward'}
      </DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Reward Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            margin="normal"
            error={!!errors.name}
            helperText={errors.name}
            required
          />
          
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={3}
          />
          
          <TextField
            fullWidth
            label="Points Cost"
            name="pointsCost"
            type="number"
            value={formData.pointsCost}
            onChange={handleChange}
            margin="normal"
            error={!!errors.pointsCost}
            helperText={errors.pointsCost}
            InputProps={{
              startAdornment: <InputAdornment position="start">🌟</InputAdornment>,
            }}
            required
          />
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Category</InputLabel>
            <Select
              name="category"
              value={formData.category}
              onChange={handleChange}
              label="Category"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {REWARD_CATEGORIES.map(category => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
        >
          {reward ? 'Update' : 'Add'} Reward
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default RewardDialog; 