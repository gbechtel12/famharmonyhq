import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  FormHelperText,
  Box
} from '@mui/material';
import { familyService } from '../../services/familyService';
import { withErrorHandling } from '../../utils/errorHandler';
import { useFeedback } from '../../contexts/FeedbackContext';

export default function AddChildModal({ open, onClose, familyId, onSuccess }) {
  const { showSuccess, handleError } = useFeedback();
  const [formData, setFormData] = useState({
    name: '',
    birthYear: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        birthYear: ''
      });
      setErrors({});
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.birthYear) {
      newErrors.birthYear = 'Birth year is required';
    } else {
      const year = parseInt(formData.birthYear);
      const currentYear = new Date().getFullYear();
      
      if (isNaN(year) || year < 1900 || year > currentYear) {
        newErrors.birthYear = `Birth year must be between 1900 and ${currentYear}`;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      if (!familyId) {
        throw new Error('No family ID available');
      }

      // Create child in the members collection with role='child'
      await withErrorHandling(
        () => familyService.addChildToFamily(familyId, {
          name: formData.name,
          birthYear: formData.birthYear || null,
          role: 'child',
          type: 'child'
        }),
        {
          context: 'add-child-modal',
          onError: (error) => {
            handleError(error, 'add-child-modal');
          }
        }
      );
      
      showSuccess(`Added ${formData.name} as a child family member`);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error adding child:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Child Profile</DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ mt: 1 }} onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Child's Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
            disabled={loading}
            autoFocus
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            label="Birth Year"
            name="birthYear"
            type="number"
            value={formData.birthYear}
            onChange={handleChange}
            error={!!errors.birthYear}
            helperText={errors.birthYear}
            disabled={loading}
            inputProps={{ 
              min: 1900,
              max: new Date().getFullYear()
            }}
          />
          
          <FormHelperText>
            Child profiles don't require email addresses and can be managed by parents.
          </FormHelperText>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add Child'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 