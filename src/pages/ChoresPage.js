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
  ListSubheader
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
  increment 
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedChore, setSelectedChore] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points: 0,
    assignedTo: '',
    dueDate: ''
  });

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
      const assignedMember = familyMembers.find(m => m.id === formData.assignedTo);
      
      const choreData = {
        ...formData,
        familyId: user.familyId,
        createdBy: user.uid,
        assignedTo: assignedMember ? {
          id: assignedMember.id,
          name: assignedMember.name,
          type: assignedMember.type
        } : null,
        status: selectedChore?.status || 'todo',
        completed: false,
        createdAt: new Date().toISOString()
      };

      if (selectedChore) {
        const choreRef = doc(db, 'chores', selectedChore.id);
        await updateDoc(choreRef, choreData);
      } else {
        await addDoc(collection(db, 'chores'), choreData);
      }

      setDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        points: 0,
        assignedTo: '',
        dueDate: ''
      });
    } catch (err) {
      console.error('Error saving chore:', err);
      setError('Failed to save chore');
    } finally {
      setSubmitting(false);
    }
  }, [familyMembers, formData, selectedChore, user?.familyId, user?.uid]);

  const handleToggleComplete = useCallback(async (choreId, currentStatus) => {
    try {
      const choreRef = doc(db, 'chores', choreId);
      await updateDoc(choreRef, {
        completed: !currentStatus
      });
    } catch (err) {
      console.error('Error updating chore:', err);
      setError('Failed to update chore');
    }
  }, []);

  const handleDelete = useCallback(async (choreId) => {
    if (window.confirm('Are you sure you want to delete this chore?')) {
      try {
        await deleteDoc(doc(db, 'chores', choreId));
      } catch (err) {
        console.error('Error deleting chore:', err);
        setError('Failed to delete chore');
      }
    }
  }, []);

  const handleStatusChange = async (choreId, newStatus) => {
    try {
      const choreRef = doc(db, 'chores', choreId);
      const updates = {
        status: newStatus,
        completed: newStatus === 'done',
        updatedAt: new Date().toISOString()
      };

      await updateDoc(choreRef, updates);

      const chore = chores.find(c => c.id === choreId);
      if (newStatus === 'done' && chore?.assignedTo?.type === 'child') {
        const familyRef = doc(db, 'families', user.familyId);
        const subUserRef = doc(familyRef, 'subUsers', chore.assignedTo.id);
        await updateDoc(subUserRef, {
          totalPoints: increment(chore.points || 0),
          lastCompletedChoreId: choreId
        });
      }
    } catch (err) {
      console.error('Error updating chore status:', err);
      setError('Failed to update chore status');
    }
  };

  useEffect(() => {
    let unsubscribe;

    if (user?.familyId) {
      try {
        const choresRef = collection(db, 'chores');
        const q = query(
          choresRef, 
          where('familyId', '==', user.familyId)
        );
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const choresList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setChores(choresList);
          setLoading(false);
        }, (err) => {
          console.error('Error loading chores:', err);
          setError('Failed to load chores');
          setLoading(false);
        });
      } catch (err) {
        console.error('Error setting up chores listener:', err);
        setError('Failed to initialize chores');
        setLoading(false);
      }
    } else {
      setError('Please join or create a family to manage chores');
      setLoading(false);
    }

    return () => unsubscribe?.();
  }, [user?.familyId]);

  useEffect(() => {
    const loadFamilyMembers = async () => {
      if (user?.familyId) {
        try {
          const members = await familyService.getAllFamilyMembers(user.familyId);
          setFamilyMembers(members);
        } catch (err) {
          console.error('Error loading family members:', err);
          setError('Failed to load family members');
        }
      }
    };

    loadFamilyMembers();
  }, [user?.familyId]);

  if (loading) {
    return <Loader message="Loading chores..." />;
  }

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Family Chores
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedChore(null);
            setFormData({
              title: '',
              description: '',
              points: 0,
              assignedTo: '',
              dueDate: ''
            });
            setDialogOpen(true);
          }}
        >
          Add Chore
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <KanbanBoard
        chores={chores}
        onStatusChange={handleStatusChange}
        onEdit={(chore) => {
          setSelectedChore(chore);
          setFormData({
            title: chore.title,
            description: chore.description || '',
            points: chore.points || 0,
            assignedTo: chore.assignedTo ? chore.assignedTo.id : '',
            dueDate: chore.dueDate || ''
          });
          setDialogOpen(true);
        }}
        onDelete={handleDelete}
        onToggleComplete={handleToggleComplete}
      />

      <Dialog
        open={dialogOpen}
        onClose={() => !submitting && setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedChore ? 'Edit Chore' : 'New Chore'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              margin="normal"
              required
              disabled={submitting}
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              multiline
              rows={3}
              value={formData.description}
              onChange={handleChange}
              margin="normal"
              disabled={submitting}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Assigned To</InputLabel>
              <Select
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                disabled={submitting}
              >
                <MenuItem value="">Unassigned</MenuItem>
                <ListSubheader>Adults</ListSubheader>
                {familyMembers
                  .filter(m => m.type === 'adult')
                  .map(member => (
                    <MenuItem key={member.id} value={member.id}>
                      {member.name}
                    </MenuItem>
                  ))
                }
                <ListSubheader>Children</ListSubheader>
                {familyMembers
                  .filter(m => m.type === 'child')
                  .map(member => (
                    <MenuItem key={member.id} value={member.id}>
                      {member.name}
                    </MenuItem>
                  ))
                }
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Points"
              name="points"
              type="number"
              value={formData.points}
              onChange={handleChange}
              margin="normal"
              disabled={submitting}
            />
            <TextField
              fullWidth
              label="Due Date"
              name="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={handleChange}
              margin="normal"
              disabled={submitting}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDialogOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : (selectedChore ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default ChoresPage; 