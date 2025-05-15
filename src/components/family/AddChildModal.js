import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert
} from '@mui/material';
import { familyService } from '../../services/familyService';

export default function AddChildModal({ open, onClose, familyId, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    birthYear: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await familyService.addChildProfile(familyId, {
        name: formData.name,
        birthYear: formData.birthYear || null,
        type: 'child'
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError('Failed to add child profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !loading && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>Add Child Profile</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          fullWidth
          label="Name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          margin="normal"
          required
          disabled={loading}
        />
        <TextField
          fullWidth
          label="Birth Year"
          type="number"
          value={formData.birthYear}
          onChange={(e) => setFormData(prev => ({ ...prev, birthYear: e.target.value }))}
          margin="normal"
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading || !formData.name}
        >
          {loading ? 'Adding...' : 'Add Child'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 