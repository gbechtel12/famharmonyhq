import React, { useState } from 'react';
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
  Avatar,
  Alert,
  Snackbar,
  IconButton,
  Chip
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  ContentCopy as ContentCopyIcon,
  Check as CheckIcon,
  ChildCare as ChildCareIcon
} from '@mui/icons-material';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import Loader from '../common/Loader';
import AddChildModal from './AddChildModal';

export default function FamilyManagement() {
  const { user } = useAuth();
  const { family, members, loading, error, createFamilyInvite, reloadMembers } = useFamily();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [copied, setCopied] = useState(false);
  const [addChildModalOpen, setAddChildModalOpen] = useState(false);

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
                          <Avatar>{member.name?.charAt(0).toUpperCase()}</Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={member.name} 
                          secondary={member.email}
                          primaryTypographyProps={{ fontWeight: 500 }}
                        />
                        <Chip 
                          label="Adult"
                          color="primary"
                          size="small"
                          variant="outlined"
                        />
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
                          <Avatar sx={{ bgcolor: 'secondary.main' }}>
                            {member.name?.charAt(0).toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={member.name} 
                          secondary={member.birthYear ? `Birth Year: ${member.birthYear}` : null}
                          primaryTypographyProps={{ fontWeight: 500 }}
                        />
                        <Chip 
                          label="Child"
                          color="secondary"
                          size="small"
                          variant="outlined"
                        />
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
    </Card>
  );
} 