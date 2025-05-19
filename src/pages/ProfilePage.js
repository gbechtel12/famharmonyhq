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
  Chip,
  Container,
  Grid,
  Tabs,
  Tab,
  CircularProgress
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
import UserProfile from '../components/profile/UserProfile';
import FamilyManagement from '../components/family/FamilyManagement';
import { FamilyProvider } from '../contexts/FamilyContext';

const PRESET_COLORS = [
  '#FF6900', '#FCB900', '#7BDCB5', '#00D084', '#8ED1FC', '#0693E3',
  '#ABB8C3', '#EB144C', '#F78DA7', '#9900EF'
];

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loadingFamily, setLoadingFamily] = useState(true);
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
    setLoadingFamily(false);
  }, [user?.familyId]);

  useEffect(() => {
    loadFamilyData();
  }, [loadFamilyData]);

  const handleCreateFamily = async (e) => {
    e.preventDefault();
    setLoadingFamily(true);
    setError(null);
    try {
      const familyId = await familyService.createFamily(user.uid, familyName);
      await userService.updateFamilyId(user.uid, familyId);
      setFamily({ id: familyId, name: familyName });
      setSuccess('Family created successfully!');
    } catch (err) {
      setError('Failed to create family');
    } finally {
      setLoadingFamily(false);
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    setLoadingFamily(true);
    setError(null);
    try {
      await familyService.inviteMember(family.id, inviteEmail);
      setSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteDialogOpen(false);
    } catch (err) {
      setError('Failed to send invitation');
    } finally {
      setLoadingFamily(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) {
      return;
    }
    setLoadingFamily(true);
    setError(null);
    try {
      await familyService.removeMemberFromFamily(family.id, memberId);
      await userService.updateFamilyId(memberId, null);
      setSuccess('Member removed successfully');
      loadFamilyData();
    } catch (err) {
      setError('Failed to remove member');
    } finally {
      setLoadingFamily(false);
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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <FamilyProvider>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 0 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange} 
                  centered
                >
                  <Tab label="Profile" />
                  <Tab label="Family" />
                </Tabs>
              </Box>
              
              <TabPanel value={tabValue} index={0}>
                <UserProfile user={user} />
              </TabPanel>
              
              <TabPanel value={tabValue} index={1}>
                <FamilyManagement />
              </TabPanel>
            </Paper>
          </Grid>
        </Grid>
      </FamilyProvider>
    </Container>
  );
} 