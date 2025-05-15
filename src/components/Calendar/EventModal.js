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
  Alert,
  Box,
  Switch,
  FormControlLabel,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';

const ColorPreview = styled('div')(({ color }) => ({
  width: 20,
  height: 20,
  borderRadius: '50%',
  backgroundColor: color,
  marginRight: 8,
  display: 'inline-block',
  verticalAlign: 'middle'
}));

const EVENT_CATEGORIES = [
  { id: 'personal', label: 'Personal', color: '#4CAF50' },
  { id: 'family', label: 'Family', color: '#2196F3' },
  { id: 'work', label: 'Work', color: '#FF5722' },
  { id: 'holiday', label: 'Holiday', color: '#9C27B0' }
];

const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'Does not repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' }
];

export default function EventModal({ 
  open, 
  onClose, 
  onSubmit, 
  onDelete, 
  event = null, 
  checkConflicts 
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [formData, setFormData] = useState({
    title: '',
    start: '',
    end: '',
    description: '',
    category: 'personal',
    recurrence: 'none',
    notifications: false
  });
  const [error, setError] = useState('');
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        start: formatDateForInput(event.start),
        end: formatDateForInput(event.end),
        description: event.description || '',
        category: event.category || 'personal',
        recurrence: event.recurrence || 'none',
        notifications: event.notifications || false
      });
    } else {
      setFormData({
        title: '',
        start: '',
        end: '',
        description: '',
        category: 'personal',
        recurrence: 'none',
        notifications: false
      });
    }
  }, [event]);

  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().slice(0, 16);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Check for conflicts when dates change
    if (name === 'start' || name === 'end') {
      const conflicts = checkConflicts?.(value, name === 'start');
      setConflicts(conflicts || []);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Basic validation
      if (!formData.title.trim()) {
        formData.title = 'Untitled Event';
      }
      if (!formData.start || !formData.end) {
        throw new Error('Start and end times are required');
      }
      if (new Date(formData.end) <= new Date(formData.start)) {
        throw new Error('End time must be after start time');
      }

      // Handle recurring events
      if (formData.recurrence !== 'none') {
        const recurringEvents = generateRecurringEvents(formData);
        await onSubmit(recurringEvents);
      } else {
        await onSubmit(formData);
      }
      
      onClose();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const generateRecurringEvents = (baseEvent) => {
    const events = [];
    const startDate = new Date(baseEvent.start);
    const endDate = new Date(baseEvent.end);

    // Generate events for the next 10 occurrences
    for (let i = 0; i < 10; i++) {
      const newStart = new Date(startDate);
      const newEnd = new Date(endDate);

      switch (baseEvent.recurrence) {
        case 'daily':
          newStart.setDate(startDate.getDate() + i);
          newEnd.setDate(endDate.getDate() + i);
          break;
        case 'weekly':
          newStart.setDate(startDate.getDate() + (i * 7));
          newEnd.setDate(endDate.getDate() + (i * 7));
          break;
        case 'monthly':
          newStart.setMonth(startDate.getMonth() + i);
          newEnd.setMonth(endDate.getMonth() + i);
          break;
        default:
          continue;
      }

      events.push({
        ...baseEvent,
        start: newStart.toISOString(),
        end: newEnd.toISOString(),
        recurringEventId: i === 0 ? null : `${baseEvent.id}-${i}`
      });
    }

    return events;
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      setLoading(true);
      try {
        await onDelete(event.id);
        onClose();
      } catch (err) {
        setError('Failed to delete event');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={() => !loading && onClose()} 
      maxWidth="sm" 
      fullWidth
      fullScreen={fullScreen}
    >
      <DialogTitle>
        {event ? 'Edit Event' : 'Create New Event'}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {conflicts.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Warning: This event overlaps with {conflicts.length} other event(s)
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            margin="normal"
            required
            disabled={loading}
          />
          <TextField
            fullWidth
            label="Start"
            name="start"
            type="datetime-local"
            value={formData.start}
            onChange={handleChange}
            margin="normal"
            required
            disabled={loading}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="End"
            name="end"
            type="datetime-local"
            value={formData.end}
            onChange={handleChange}
            margin="normal"
            required
            disabled={loading}
            InputLabelProps={{ shrink: true }}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Repeats</InputLabel>
            <Select
              name="recurrence"
              value={formData.recurrence}
              onChange={handleChange}
              disabled={loading}
            >
              {RECURRENCE_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={formData.notifications}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  notifications: e.target.checked
                }))}
                name="notifications"
                disabled={loading}
              />
            }
            label="Enable notifications"
            sx={{ mt: 1 }}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Category</InputLabel>
            <Select
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={loading}
            >
              {EVENT_CATEGORIES.map(category => (
                <MenuItem key={category.id} value={category.id}>
                  <ColorPreview color={category.color} />
                  {category.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Description"
            name="description"
            multiline
            rows={4}
            value={formData.description}
            onChange={handleChange}
            margin="normal"
            disabled={loading}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Box>
          {event && (
            <Button 
              onClick={handleDelete} 
              color="error" 
              disabled={loading}
            >
              Delete
            </Button>
          )}
        </Box>
        <Box>
          <Button 
            onClick={onClose} 
            disabled={loading}
            sx={{ mr: 1 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : (event ? 'Update' : 'Create')}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
} 