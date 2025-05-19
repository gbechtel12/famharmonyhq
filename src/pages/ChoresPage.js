import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  ListSubheader,
  FormControlLabel,
  Checkbox,
  FormGroup,
  RadioGroup,
  Radio,
  InputAdornment,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon
} from '@mui/icons-material';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import Loader from '../components/common/Loader';
import { familyService } from '../services/familyService';
import KanbanBoard from '../components/chores/KanbanBoard';

function ChoresPage() {
  const { user } = useAuth();
  const [chores, setChores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedChore, setSelectedChore] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points: 0,
    assignedTo: '',
    dueDate: '',
    frequency: 'once',
    totalInstances: 1,
    completedInstances: 0,
    isRecurring: false
  });

  const FREQUENCY_OPTIONS = [
    { value: 'once', label: 'One time task' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (!user?.familyId) {
        throw new Error('No family ID found. Please join or create a family first.');
      }

      const assignedMember = familyMembers.find(m => m.id === formData.assignedTo);
      
      const choreData = {
        ...formData,
        familyId: user.familyId,
        createdBy: user.uid,
        assignedTo: assignedMember ? {
          id: assignedMember.id,
          name: assignedMember.name,
          type: assignedMember.type,
          color: assignedMember.color
        } : null,
        status: selectedChore?.status || 'todo',
        completed: false,
        earnedPoints: selectedChore?.earnedPoints || 0,
        createdAt: selectedChore?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
        isRecurring: formData.frequency !== 'once',
        totalInstances: formData.frequency !== 'once' ? formData.totalInstances : 1,
        completedInstances: selectedChore?.completedInstances || 0
      };

      if (selectedChore) {
        // Update existing chore in families collection
        const choreRef = doc(db, 'families', user.familyId, 'chores', selectedChore.id);
        await updateDoc(choreRef, choreData);
        setSuccessMessage('Chore updated successfully');
      } else {
        // Add new chore to families collection
        await addDoc(collection(db, 'families', user.familyId, 'chores'), choreData);
        setSuccessMessage('Chore created successfully');
      }

      setDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        points: 0,
        assignedTo: '',
        dueDate: '',
        frequency: 'once',
        totalInstances: 1,
        completedInstances: 0,
        isRecurring: false
      });
    } catch (err) {
      console.error('Error saving chore:', err);
      setError('Failed to save chore: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }, [familyMembers, formData, selectedChore, user?.familyId, user?.uid]);

  const handleToggleComplete = useCallback(async (choreId, currentStatus) => {
    try {
      if (!user?.familyId) {
        throw new Error('No family ID found');
      }

      const choreRef = doc(db, 'families', user.familyId, 'chores', choreId);
      await updateDoc(choreRef, {
        completed: !currentStatus,
        updatedAt: serverTimestamp()
      });
      setSuccessMessage(currentStatus ? 'Chore marked incomplete' : 'Chore marked complete');
    } catch (err) {
      console.error('Error updating chore:', err);
      setError('Failed to update chore: ' + err.message);
    }
  }, [user?.familyId]);

  const handleDelete = useCallback(async (choreId) => {
    if (!window.confirm('Are you sure you want to delete this chore?')) return;
    
    try {
      if (!user?.familyId) {
        throw new Error('No family ID found');
      }

      await deleteDoc(doc(db, 'families', user.familyId, 'chores', choreId));
      setSuccessMessage('Chore deleted successfully');
    } catch (err) {
      console.error('Error deleting chore:', err);
      setError('Failed to delete chore: ' + err.message);
    }
  }, [user?.familyId]);

  const handleStatusChange = async (choreId, newStatus) => {
    try {
      if (!user?.familyId) {
        throw new Error('No family ID found');
      }

      const choreRef = doc(db, 'families', user.familyId, 'chores', choreId);
      const updates = {
        status: newStatus,
        completed: newStatus === 'done',
        updatedAt: serverTimestamp()
      };

      // If status is changing to done and it's a recurring task, increment completedInstances
      const chore = chores.find(c => c.id === choreId);
      if (newStatus === 'done' && chore && !chore.completed) {
        if (chore.isRecurring && chore.completedInstances < chore.totalInstances) {
          updates.completedInstances = (chore.completedInstances || 0) + 1;
        }
        
        // Track the earned points
        if (chore?.assignedTo?.type === 'child') {
          const pointsEarned = chore.points || 0;
          updates.earnedPoints = (chore.earnedPoints || 0) + pointsEarned;
          
          // Update the family member's points in the subUsers collection
          if (chore.assignedTo.id) {
            const subUserRef = doc(db, 'families', user.familyId, 'subUsers', chore.assignedTo.id);
            await updateDoc(subUserRef, {
              totalPoints: increment(pointsEarned),
              lastCompletedChoreId: choreId,
              lastCompletedAt: serverTimestamp()
            });
          }
        }
      }

      await updateDoc(choreRef, updates);
      setSuccessMessage('Chore status updated successfully');
    } catch (err) {
      console.error('Error updating chore status:', err);
      setError('Failed to update chore status: ' + err.message);
    }
  };

  const handleEditChore = (chore) => {
    setSelectedChore(chore);
    setFormData({
      title: chore.title || '',
      description: chore.description || '',
      points: chore.points || 0,
      assignedTo: chore.assignedTo?.id || '',
      dueDate: chore.dueDate || '',
      frequency: chore.frequency || 'once',
      totalInstances: chore.totalInstances || 1,
      completedInstances: chore.completedInstances || 0,
      isRecurring: chore.isRecurring || false
    });
    setDialogOpen(true);
  };

  const handleAddChore = () => {
    setSelectedChore(null);
    setFormData({
      title: '',
      description: '',
      points: 0,
      assignedTo: '',
      dueDate: '',
      frequency: 'once',
      totalInstances: 1,
      completedInstances: 0,
      isRecurring: false
    });
    setDialogOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage('');
    setError(null);
  };

  useEffect(() => {
    let unsubscribe = () => {};

    const fetchChores = async () => {
      if (!user?.familyId) {
        setError('Please join or create a family to manage chores');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Listen to chores in the families/{familyId}/chores collection
        const choresRef = collection(db, 'families', user.familyId, 'chores');
        
        unsubscribe = onSnapshot(choresRef, (snapshot) => {
          const choresList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
          }));
          setChores(choresList);
          setLoading(false);
        }, (err) => {
          console.error('Error loading chores:', err);
          setError('Failed to load chores: ' + err.message);
          setLoading(false);
        });
      } catch (err) {
        console.error('Error setting up chores listener:', err);
        setError('Failed to initialize chores: ' + err.message);
        setLoading(false);
      }
    };

    fetchChores();
    return () => unsubscribe();
  }, [user?.familyId]);

  useEffect(() => {
    const loadFamilyMembers = async () => {
      if (!user?.familyId) {
        console.warn('No family ID available for loading family members');
        return;
      }

      try {
        setLoading(true);
        console.log('Loading family members with familyId:', user.familyId);
        const members = await familyService.getAllFamilyMembers(user.familyId);
        console.log('Family members loaded successfully:', members?.length);
        setFamilyMembers(members || []);
      } catch (err) {
        console.error('Error loading family members:', err);
        setError('Failed to load family members: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadFamilyMembers();
  }, [user?.familyId]);

  if (loading) {
    return <Loader message="Loading chores..." />;
  }

  const noFamilyMessage = !user?.familyId ? (
    <Alert severity="info" sx={{ mb: 2 }}>
      You need to join or create a family to manage chores.
    </Alert>
  ) : null;

  const emptyChoresMessage = user?.familyId && chores.length === 0 ? (
    <Alert severity="info" sx={{ mb: 2 }}>
      No chores found. Add your first chore to get started!
    </Alert>
  ) : null;

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Family Chores
        </Typography>
        {user?.familyId && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddChore}
          >
            Add Chore
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {noFamilyMessage}
      {emptyChoresMessage}

      {user?.familyId && chores.length > 0 && (
        <KanbanBoard
          chores={chores}
          onStatusChange={handleStatusChange}
          onEdit={handleEditChore}
          onDelete={handleDelete}
          onToggleComplete={handleToggleComplete}
        />
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {selectedChore ? 'Edit Chore' : 'Add New Chore'}
        </DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <TextField
              autoFocus
              margin="dense"
              name="title"
              label="Chore Title"
              fullWidth
              variant="outlined"
              value={formData.title}
              onChange={handleChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              name="description"
              label="Description"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={formData.description}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
              <InputLabel id="assign-to-label">Assign To</InputLabel>
              <Select
                labelId="assign-to-label"
                name="assignedTo"
                value={formData.assignedTo}
                label="Assign To"
                onChange={handleChange}
              >
                <MenuItem value="">
                  <em>Unassigned</em>
                </MenuItem>
                
                {familyMembers.length > 0 ? (
                  <>
                    <ListSubheader>Adults</ListSubheader>
                    {familyMembers
                      .filter(member => member.type === 'adult')
                      .map(member => (
                        <MenuItem key={member.id} value={member.id}>
                          {member.name}
                        </MenuItem>
                      ))}
                    
                    <ListSubheader>Children</ListSubheader>
                    {familyMembers
                      .filter(member => member.type === 'child')
                      .map(member => (
                        <MenuItem key={member.id} value={member.id}>
                          {member.name}
                        </MenuItem>
                      ))}
                  </>
                ) : (
                  <MenuItem disabled>No family members found</MenuItem>
                )}
              </Select>
            </FormControl>
            
            <TextField
              margin="dense"
              name="points"
              label="Points"
              type="number"
              fullWidth
              variant="outlined"
              value={formData.points}
              onChange={handleChange}
              InputProps={{
                inputProps: { min: 0 },
                startAdornment: <InputAdornment position="start">🏆</InputAdornment>,
              }}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="dense"
              name="dueDate"
              label="Due Date"
              type="date"
              fullWidth
              variant="outlined"
              value={formData.dueDate}
              onChange={handleChange}
              InputLabelProps={{
                shrink: true,
              }}
              sx={{ mb: 2 }}
            />
            
            <FormControl component="fieldset" sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Frequency
              </Typography>
              <RadioGroup
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
              >
                {FREQUENCY_OPTIONS.map(option => (
                  <FormControlLabel
                    key={option.value}
                    value={option.value}
                    control={<Radio />}
                    label={option.label}
                  />
                ))}
              </RadioGroup>
            </FormControl>
            
            {formData.frequency !== 'once' && (
              <TextField
                margin="dense"
                name="totalInstances"
                label="Total Instances"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.totalInstances}
                onChange={handleChange}
                InputProps={{
                  inputProps: { min: 1 },
                }}
                helperText="How many times this chore should be completed"
                sx={{ mb: 2 }}
              />
            )}
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitting}
            variant="contained"
          >
            {submitting ? 'Saving...' : (selectedChore ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!successMessage || !!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={successMessage || error}
      />
    </Paper>
  );
}

export default ChoresPage; 