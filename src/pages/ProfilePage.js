import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Typography,
  Button,
  TextField,
  Box,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Chip
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { familyService } from '../services/familyService';
import { userService } from '../services/userService';
import Loader from '../components/common/Loader';
import AddChildModal from '../components/family/AddChildModal';
import { CirclePicker } from 'react-color';

const PRESET_COLORS = [
  '#FF6900', '#FCB900', '#7BDCB5', '#00D084', '#8ED1FC', '#0693E3',
  '#ABB8C3', '#EB144C', '#F78DA7', '#9900EF'
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [familyName, setFamilyName] = useState('');
  const [family, setFamily] = useState(null);
  const [members, setMembers] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [subUsers, setSubUsers] = useState([]);
  const [addChildModalOpen, setAddChildModalOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(user?.color || PRESET_COLORS[0]);

  const loadFamilyData = useCallback(async () => {
    if (user?.familyId) {
      try {
        const [familyData, familyMembers, familySubUsers] = await Promise.all([
          familyService.getFamilyById(user.familyId),
          familyService.getFamilyMembers(user.familyId),
          familyService.getSubUsers(user.familyId)
        ]);
        setFamily(familyData);
        setMembers(familyMembers);
        setSubUsers(familySubUsers);
      } catch (err) {
        setError('Failed to load family information');
      }
    }
    setLoading(false);
  }, [user?.familyId]);

  useEffect(() => {
    loadFamilyData();
  }, [loadFamilyData]);

  const handleCreateFamily = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const familyId = await familyService.createFamily(user.uid, familyName);
      await userService.updateFamilyId(user.uid, familyId);
      setFamily({ id: familyId, name: familyName });
      setSuccess('Family created successfully!');
    } catch (err) {
      setError('Failed to create family');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await familyService.inviteMember(family.id, inviteEmail);
      setSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteDialogOpen(false);
    } catch (err) {
      setError('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await familyService.removeMemberFromFamily(family.id, memberId);
      await userService.updateFamilyId(memberId, null);
      setSuccess('Member removed successfully');
      loadFamilyData();
    } catch (err) {
      setError('Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = async (color) => {
    try {
      await userService.updateUserProfile(user.uid, {
        color: color.hex
      });
      setSelectedColor(color.hex);
    } catch (error) {
      console.error('Error updating user color:', error);
    }
  };

  if (loading) return <Loader message="Loading profile..." />;

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {!family ? (
        <Box component="form" onSubmit={handleCreateFamily}>
          <TextField
            fullWidth
            label="Family Name"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            margin="normal"
            required
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
          >
            Create Family
          </Button>
        </Box>
      ) : (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Family: {family.name}
            </Typography>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => setInviteDialogOpen(true)}
            >
              Invite Member
            </Button>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            Members
          </Typography>
          <List>
            {members.map((member) => (
              <ListItem key={member.id}>
                <ListItemText
                  primary={member.displayName || member.email}
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      {member.id === family.createdBy && (
                        <Chip
                          size="small"
                          label="Admin"
                          color="primary"
                          sx={{ mr: 1 }}
                        />
                      )}
                      <Chip
                        size="small"
                        label={member.email}
                        variant="outlined"
                        icon={<EmailIcon />}
                      />
                    </Box>
                  }
                />
                {user.uid === family.createdBy && member.id !== user.uid && (
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            ))}
          </List>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
            <Typography variant="h6">
              Children
            </Typography>
            <Button
              variant="outlined"
              startIcon={<PersonAddIcon />}
              onClick={() => setAddChildModalOpen(true)}
            >
              Add Child
            </Button>
          </Box>

          <List>
            {subUsers.map((child) => (
              <ListItem key={child.id}>
                <ListItemText
                  primary={child.name}
                  secondary={child.birthYear ? `Birth Year: ${child.birthYear}` : null}
                />
                <Chip
                  size="small"
                  label="Child"
                  color="secondary"
                  variant="outlined"
                />
              </ListItem>
            ))}
          </List>

          <AddChildModal
            open={addChildModalOpen}
            onClose={() => setAddChildModalOpen(false)}
            familyId={family.id}
            onSuccess={loadFamilyData}
          />
        </Box>
      )}

      <Dialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Invite Family Member</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            margin="normal"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleInviteMember}
            variant="contained"
            color="primary"
          >
            Send Invite
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Choose Your Color
        </Typography>
        <CirclePicker
          color={selectedColor}
          colors={PRESET_COLORS}
          onChange={handleColorChange}
        />
      </Box>
    </Paper>
  );
} 