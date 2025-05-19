import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Box,
  Avatar,
  Divider,
  Alert,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import { CirclePicker } from 'react-color';

const StyledAvatar = styled(Avatar)(({ theme, bgcolor }) => ({
  width: 100,
  height: 100,
  backgroundColor: bgcolor || theme.palette.primary.main,
  marginBottom: theme.spacing(2),
  fontSize: '2.5rem',
  fontWeight: 'bold'
}));

const PRESET_COLORS = [
  '#FF6900', '#FCB900', '#7BDCB5', '#00D084', '#8ED1FC', '#0693E3',
  '#ABB8C3', '#EB144C', '#F78DA7', '#9900EF'
];

export default function UserProfile({ user }) {
  const { updateUserProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [selectedColor, setSelectedColor] = useState(user?.color || PRESET_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes to enable/disable save button
  useEffect(() => {
    const hasNameChanged = displayName !== (user?.displayName || '');
    const hasColorChanged = selectedColor !== (user?.color || PRESET_COLORS[0]);
    setHasChanges(hasNameChanged || hasColorChanged);
  }, [displayName, selectedColor, user?.displayName, user?.color]);

  // Load initial data
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setSelectedColor(user.color || PRESET_COLORS[0]);
      setIsLoading(false);
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate display name
    if (!displayName.trim()) {
      setError('Display name cannot be empty');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await updateUserProfile({
        displayName: displayName.trim(),
        color: selectedColor
      });
      setSuccess('Profile updated successfully');
      setHasChanges(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleColorChange = (color) => {
    setSelectedColor(color.hex);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <StyledAvatar bgcolor={selectedColor}>
            {getInitials(user?.displayName)}
          </StyledAvatar>
          <Typography variant="h5" gutterBottom>
            {user?.displayName || user?.email}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {user?.email}
          </Typography>
        </Box>

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Display Name"
            margin="normal"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={isSubmitting}
            error={error && !displayName.trim()}
            helperText={error && !displayName.trim() ? 'Display name is required' : ''}
            required
          />

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Profile Color
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Choose a color for your profile
            </Typography>
            <CirclePicker
              color={selectedColor}
              colors={PRESET_COLORS}
              onChange={handleColorChange}
              circleSize={28}
              circleSpacing={10}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isSubmitting || !hasChanges}
            fullWidth
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Save Changes'
            )}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
} 