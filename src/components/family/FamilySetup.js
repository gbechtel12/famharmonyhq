import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Box,
  Tabs,
  Tab,
  Alert,
  Divider,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Loader from '../common/Loader';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  maxWidth: '500px',
  width: '100%',
  boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
  borderRadius: '16px',
  margin: '0 auto'
}));

export default function FamilySetup() {
  const { user } = useAuth();
  const { createFamily, joinFamily, loading, error } = useFamily();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [userName, setUserName] = useState(user?.displayName || '');
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setLocalError('');
  };

  const handleCreateFamily = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setLocalError('');
    setIsSubmitting(true);

    try {
      if (!familyName.trim()) {
        throw new Error('Please enter a family name');
      }
      
      await createFamily(familyName);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error creating family:', err);
      setLocalError(err.message || 'Failed to create family. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinFamily = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setLocalError('');
    setIsSubmitting(true);

    try {
      if (!inviteCode.trim()) {
        throw new Error('Please enter an invite code');
      }
      
      await joinFamily(inviteCode.trim(), userName.trim() || null);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error joining family:', err);
      
      // Handle specific error cases
      if (err.message?.includes('not found') || err.message?.includes('Invalid code')) {
        setLocalError('Invalid invite code. Please check and try again.');
      } else if (err.message?.includes('expired')) {
        setLocalError('This invite code has expired. Please request a new one.');
      } else if (err.message?.includes('no longer valid')) {
        setLocalError('This invite code has already been used or is no longer valid.');
      } else {
        setLocalError(err.message || 'Failed to join family. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <Loader message="Processing your request..." />;
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <StyledPaper>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome to FamHarmonyHQ
        </Typography>
        
        <Typography variant="body1" color="textSecondary" textAlign="center" paragraph>
          Connect with your family by creating a new family group or joining an existing one.
        </Typography>

        <Divider sx={{ width: '100%', my: 2 }} />

        {(error || localError) && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {localError || error}
          </Alert>
        )}

        <Box sx={{ width: '100%', mb: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            centered
          >
            <Tab label="Create a Family" />
            <Tab label="Join a Family" />
          </Tabs>
        </Box>

        {tabValue === 0 ? (
          <Box component="form" onSubmit={handleCreateFamily} sx={{ width: '100%' }}>
            <Typography variant="body2" color="textSecondary" paragraph>
              Create a new family group that others can join.
            </Typography>
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="familyName"
              label="Family Name"
              name="familyName"
              autoFocus
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              disabled={isSubmitting}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={isSubmitting}
              sx={{ mt: 3 }}
            >
              {isSubmitting ? 'Creating...' : 'Create Family'}
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleJoinFamily} sx={{ width: '100%' }}>
            <Typography variant="body2" color="textSecondary" paragraph>
              Enter the invite code shared with you to join an existing family.
            </Typography>
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="inviteCode"
              label="Invite Code"
              name="inviteCode"
              autoFocus
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              disabled={isSubmitting}
              placeholder="Enter invite code"
            />
            
            <TextField
              margin="normal"
              fullWidth
              id="userName"
              label="Your Name"
              name="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              disabled={isSubmitting}
              placeholder="How would you like to be called?"
              helperText="This will be visible to your family members"
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={isSubmitting}
              sx={{ mt: 3 }}
            >
              {isSubmitting ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                  Joining...
                </Box>
              ) : 'Join Family'}
            </Button>
          </Box>
        )}
      </StyledPaper>
      
      <Box sx={{ textAlign: 'center', mt: 3 }}>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
          Don't have an account yet?
        </Typography>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/login')}
          sx={{ textTransform: 'none' }}
        >
          Create an account first
        </Button>
      </Box>
    </Container>
  );
} 