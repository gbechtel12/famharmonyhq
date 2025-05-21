import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Alert,
  Snackbar,
  IconButton,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  ContentCopy as ContentCopyIcon,
  Check as CheckIcon,
  ChildCare as ChildCareIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import Loader from '../common/Loader';
import AddChildModal from './AddChildModal';
import { db } from '../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default function FamilyManagement() {
  const { user } = useAuth();
  const { family, members, loading, error, createFamilyInvite, reloadMembers, updateMemberRole, deleteFamilyMember, syncFamilyMembers, manuallyAddMember } = useFamily();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [copied, setCopied] = useState(false);
  const [addChildModalOpen, setAddChildModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(false);

  // Fetch pending invites
  const fetchPendingInvites = async () => {
    if (!family?.id) return;
    
    try {
      setLoadingInvites(true);
      const invitesRef = collection(db, 'invites');
      const invitesQuery = query(invitesRef, where('familyId', '==', family.id), where('status', '==', 'pending'));
      const snapshot = await getDocs(invitesQuery);
      
      if (snapshot.empty) {
        setPendingInvites([]);
        return;
      }
      
      const invites = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setPendingInvites(invites);
    } catch (err) {
      console.error('Error fetching pending invites:', err);
      setLocalError('Failed to fetch pending invites');
    } finally {
      setLoadingInvites(false);
    }
  };
  
  // Load pending invites on component mount
  useEffect(() => {
    if (family?.id) {
      fetchPendingInvites();
    }
  }, [family?.id]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setLocalError('');
    setIsSubmitting(true);

    try {
      if (!inviteEmail.trim()) {
        throw new Error('Please enter an email address');
      }
      
      const invite = await createFamilyInvite(inviteEmail);
      
      setInviteCode(invite.code);
      setSuccessMessage(`Invite created for ${inviteEmail}`);
      setInviteEmail('');
      
      // Refresh pending invites
      fetchPendingInvites();
    } catch (err) {
      console.error('Error creating invite:', err);
      setLocalError(err.message || 'Failed to create invite. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyInviteCode = () => {
    if (!inviteCode) return;
    
    navigator.clipboard.writeText(inviteCode)
      .then(() => {
        setCopied(true);
        setShowSnackbar(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy text:', err);
        setLocalError('Failed to copy invite code');
      });
  };

  const handleCloseSnackbar = () => {
    setShowSnackbar(false);
  };

  const handleAddChildSuccess = async () => {
    try {
      // Reload the members list to show the new child
      await reloadMembers();
      setSuccessMessage('Child profile added successfully');
    } catch (err) {
      setLocalError('Child was added but failed to refresh members list');
    }
  };
  
  const startEditingMember = (member) => {
    setEditingMemberId(member.id);
    setEditRole(member.role || 'member');
  };
  
  const cancelEditingMember = () => {
    setEditingMemberId(null);
    setEditRole('');
  };
  
  const saveRoleChange = async (memberId) => {
    if (!editRole) {
      cancelEditingMember();
      return;
    }
    
    setIsSubmitting(true);
    try {
      await updateMemberRole(memberId, editRole);
      setSuccessMessage(`Member role updated to ${editRole}`);
      cancelEditingMember();
    } catch (err) {
      console.error('Error updating role:', err);
      setLocalError(err.message || 'Failed to update member role');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (member) => {
    setMemberToDelete(member);
    setConfirmDeleteOpen(true);
    // Log the member being selected for deletion
    console.log('Selected member for deletion:', member);
  };

  const handleCancelDelete = () => {
    setMemberToDelete(null);
    setConfirmDeleteOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    
    setConfirmDeleteOpen(false);
    setIsSubmitting(true);
    
    try {
      console.log('Attempting to delete family member:', memberToDelete);
      
      // Check if the member is from subUsers collection (old format)
      if (memberToDelete.type === 'child' && !memberToDelete.uid) {
        const result = await deleteFamilyMember(memberToDelete.id);
        console.log('Delete result:', result);
        
        if (result) {
          setSuccessMessage(`Successfully deleted ${memberToDelete.name || 'family member'}`);
          // Force a refresh of the members list
          await reloadMembers();
        } else {
          throw new Error('Failed to delete family member - operation returned false');
        }
      } else {
        // Standard deletion flow
        const result = await deleteFamilyMember(memberToDelete.id);
        console.log('Delete result:', result);
        
        if (result) {
          setSuccessMessage(`Successfully deleted ${memberToDelete.name || 'family member'}`);
          // Force a refresh of the members list after deletion
          await reloadMembers();
        } else {
          throw new Error('Failed to delete family member - operation returned false');
        }
      }
      
      setMemberToDelete(null);
    } catch (err) {
      console.error('Error deleting family member:', err);
      setLocalError(err.message || 'Failed to delete family member');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleRefreshMembers = async () => {
    setIsSubmitting(true);
    setLocalError('');
    setSuccessMessage('');
    
    try {
      await reloadMembers();
      setSuccessMessage('Family members refreshed');
    } catch (err) {
      console.error('Error refreshing members:', err);
      setLocalError(err.message || 'Failed to refresh members');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle resending an invite email 
  const handleResendInvite = async (email, code) => {
    setIsSubmitting(true);
    setLocalError('');
    
    try {
      // Resend invitation email using same code
      // This is a fake implementation - you'll need to add actual email sending functionality
      console.log(`Would resend invite with code ${code} to ${email}`);
      
      // For now, just copy the code to clipboard for manual sharing
      await navigator.clipboard.writeText(code);
      
      setSuccessMessage(`Invite code ${code} copied to clipboard for ${email}. Please share this code with them directly.`);
      setShowSnackbar(true);
    } catch (err) {
      console.error('Error resending invite:', err);
      setLocalError('Failed to resend invite');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSyncMembers = async () => {
    setIsSubmitting(true);
    setLocalError('');
    setSuccessMessage('');
    
    try {
      console.log('Synchronizing family members...');
      await syncFamilyMembers();
      setSuccessMessage('Successfully synchronized all family members. Any missing members should now appear.');
    } catch (err) {
      console.error('Error synchronizing members:', err);
      setLocalError(err.message || 'Failed to synchronize family members');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle manual user sync by email
  const handleManualSync = async () => {
    // Your wife's email and known user ID
    const spouseEmail = "bechtelk3@gmail.com";
    const spouseName = "Kim Bechtel";
    
    setIsSubmitting(true);
    setLocalError('');
    setSuccessMessage('');
    
    try {
      console.log(`Manually syncing user with email: ${spouseEmail}`);
      
      // Get the family document to get the familyId
      const familyId = user.familyId;
      if (!familyId) {
        throw new Error('You are not part of a family');
      }
      
      // Create a user data object for Kim
      const userData = {
        id: "I3w22hVETFeJrAscD5nRoF70PtJ2", // Actual UID from Firebase Auth
        email: spouseEmail,
        displayName: spouseName,
        role: "member",
        type: "adult",
        color: "#0693e3",
        joinedAt: new Date().toISOString()
      };
      
      // Manually add the member document
      await manuallyAddMember(userData);
      
      // Set success message
      setSuccessMessage(`Successfully added ${spouseName} to your family!`);
      
      // Try the normal sync as well in case it works now
      try {
        await syncFamilyMembers();
      } catch (syncErr) {
        console.error('Error during family sync:', syncErr);
        // Keep the original success message
      }
    } catch (err) {
      console.error('Error in manual sync:', err);
      setLocalError(err.message || 'Failed to manually sync users');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <Loader message="Loading family information..." />;
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Family Management
        </Typography>
        
        {(error || localError) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {localError || error}
          </Alert>
        )}
        
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" component="h3" gutterBottom>
            Your Family
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body1">
              <strong>Name:</strong> {family?.name || 'Your Family'}
            </Typography>
            <Typography variant="body1">
              <strong>Members:</strong> {members?.length || 0}
            </Typography>
            
            <Box sx={{ mt: 1, display: 'flex', gap: 2 }}>
              <Tooltip title="Refresh members list">
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<RefreshIcon />}
                  onClick={handleRefreshMembers}
                  disabled={isSubmitting}
                >
                  Refresh Members
                </Button>
              </Tooltip>

              <Tooltip title="Find and add missing family members">
                <Button 
                  variant="contained" 
                  color="primary"
                  size="small" 
                  onClick={handleSyncMembers}
                  disabled={isSubmitting}
                >
                  Sync All Members
                </Button>
              </Tooltip>
              
              <Tooltip title="Manually sync Kim's account (emergency fix)">
                <Button 
                  variant="contained" 
                  color="secondary"
                  size="small" 
                  onClick={handleManualSync}
                  disabled={isSubmitting}
                >
                  Fix Missing Spouse
                </Button>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" component="h3" gutterBottom>
            Invite Family Members
          </Typography>
          
          <Box component="form" onSubmit={handleInvite} sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              label="Email Address"
              variant="outlined"
              fullWidth
              size="small"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              disabled={isSubmitting}
            />
            <Button
              type="submit"
              variant="contained"
              startIcon={<PersonAddIcon />}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Inviting...' : 'Invite'}
            </Button>
          </Box>

          {inviteCode && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
              <Typography variant="body2">
                Share this invite code with your family member:
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  variant="outlined"
                  size="small"
                  value={inviteCode}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
                <IconButton 
                  onClick={copyInviteCode} 
                  color={copied ? 'success' : 'default'}
                >
                  {copied ? <CheckIcon /> : <ContentCopyIcon />}
                </IconButton>
              </Box>
            </Box>
          )}
          
          {/* Pending invites section */}
          {pendingInvites.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Pending Invites:
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                For your spouse to join, have them create an account and use one of the invite codes below.
              </Alert>
              <List dense>
                {pendingInvites.map(invite => (
                  <ListItem key={invite.id} divider>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.light' }}>
                        <EmailIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={invite.email}
                      secondary={
                        <>
                          <strong>Code:</strong> {invite.code} 
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            Created: {new Date(invite.createdAt).toLocaleDateString()}
                          </Typography>
                        </>
                      }
                    />
                    <Box sx={{ display: 'flex' }}>
                      <Tooltip title="Copy invite code">
                        <IconButton
                          size="small"
                          onClick={() => {
                            navigator.clipboard.writeText(invite.code);
                            setShowSnackbar(true);
                          }}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Share invite with this person">
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          sx={{ ml: 1 }}
                          onClick={() => handleResendInvite(invite.email, invite.code)}
                          disabled={isSubmitting}
                        >
                          Share
                        </Button>
                      </Tooltip>
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="h3">
              Family Members
            </Typography>
            
            <Button
              variant="outlined"
              startIcon={<ChildCareIcon />}
              size="small"
              onClick={() => setAddChildModalOpen(true)}
            >
              Add Child
            </Button>
          </Box>
          
          {members && members.length > 0 ? (
            <List>
              {/* Group and display members by type */}
              {members.some(m => m.type === 'adult') && (
                <>
                  <ListItem sx={{ py: 0 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Adults
                    </Typography>
                  </ListItem>
                  {members
                    .filter(member => member.type === 'adult')
                    .map((member) => (
                      <ListItem key={member.id}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: member.color || 'primary.main' }}>
                            {member.name?.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={member.name} 
                          secondary={member.email}
                          primaryTypographyProps={{ fontWeight: 500 }}
                        />
                        
                        {editingMemberId === member.id ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                              <Select
                                value={editRole}
                                onChange={(e) => setEditRole(e.target.value)}
                                disabled={isSubmitting}
                              >
                                <MenuItem value="member">Member</MenuItem>
                                <MenuItem value="child">Child</MenuItem>
                              </Select>
                            </FormControl>
                            <Button 
                              variant="contained" 
                              size="small" 
                              onClick={() => saveRoleChange(member.id)}
                              disabled={isSubmitting}
                            >
                              Save
                            </Button>
                            <Button 
                              variant="outlined" 
                              size="small" 
                              onClick={cancelEditingMember}
                              disabled={isSubmitting}
                            >
                              Cancel
                            </Button>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Chip 
                              label={member.role === 'child' ? 'Child' : 'Adult'}
                              color="primary"
                              size="small"
                              variant="outlined"
                            />
                            <IconButton
                              size="small"
                              onClick={() => startEditingMember(member)}
                              sx={{ ml: 1 }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            {/* Only add delete for non-current user */}
                            {member.uid !== user.uid && (
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteClick(member)}
                                sx={{ ml: 1 }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        )}
                      </ListItem>
                    ))}
                </>
              )}
              
              {members.some(m => m.type === 'child') && (
                <>
                  <ListItem sx={{ py: 0, mt: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Children
                    </Typography>
                  </ListItem>
                  {members
                    .filter(member => member.type === 'child')
                    .map((member) => (
                      <ListItem key={member.id}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: member.color || 'secondary.main' }}>
                            {member.name?.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={member.name} 
                          secondary={member.birthYear ? `Birth Year: ${member.birthYear}` : null}
                          primaryTypographyProps={{ fontWeight: 500 }}
                        />
                        
                        {editingMemberId === member.id ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FormControl size="small" sx={{ minWidth: 120 }}>
                              <Select
                                value={editRole}
                                onChange={(e) => setEditRole(e.target.value)}
                                disabled={isSubmitting}
                              >
                                <MenuItem value="member">Member</MenuItem>
                                <MenuItem value="child">Child</MenuItem>
                              </Select>
                            </FormControl>
                            <Button 
                              variant="contained" 
                              size="small" 
                              onClick={() => saveRoleChange(member.id)}
                              disabled={isSubmitting}
                            >
                              Save
                            </Button>
                            <Button 
                              variant="outlined" 
                              size="small" 
                              onClick={cancelEditingMember}
                              disabled={isSubmitting}
                            >
                              Cancel
                            </Button>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Chip 
                              label="Child"
                              color="secondary"
                              size="small"
                              variant="outlined"
                            />
                            {member.source && (
                              <Tooltip title={`Data source: ${member.source}`}>
                                <Chip
                                  label={member.source === 'members_collection' ? 'Main' : 'Legacy'}
                                  size="small"
                                  variant="outlined"
                                  sx={{ ml: 1, fontSize: '0.6rem' }}
                                />
                              </Tooltip>
                            )}
                            <IconButton
                              size="small"
                              onClick={() => startEditingMember(member)}
                              sx={{ ml: 1 }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <Tooltip title="Delete this child">
                              <IconButton
                                size="small"
                                color="error" 
                                onClick={() => handleDeleteClick(member)}
                                sx={{ ml: 1 }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </ListItem>
                    ))}
                </>
              )}
            </List>
          ) : (
            <Typography variant="body2" color="textSecondary">
              No family members found.
            </Typography>
          )}
        </Box>
      </CardContent>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        message="Invite code copied to clipboard"
      />
      
      <AddChildModal
        open={addChildModalOpen}
        onClose={() => setAddChildModalOpen(false)}
        familyId={family?.id}
        onSuccess={handleAddChildSuccess}
      />

      {/* Delete confirmation dialog */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={handleCancelDelete}
      >
        <DialogTitle>
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {memberToDelete?.name || 'this family member'}?
            {memberToDelete?.type === 'child' ? 
              ' This will remove their profile and any associated records.' : 
              ' This will remove them from your family.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error"
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
} 