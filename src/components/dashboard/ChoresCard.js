import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  Typography, 
  Box, 
  Skeleton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import { useFamily } from '../../contexts/FamilyContext';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';
import { useNavigate } from 'react-router-dom';

function ChoresCard({ fullScreen = false, isLoading = false }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { family } = useFamily();
  const [chores, setChores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define fetchChores outside useEffect so it can be called elsewhere
  const fetchChores = useCallback(async () => {
    if (!family?.id) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('Fetching chores for dashboard...');
      
      // Fetch chores from Firestore
      const choresRef = collection(db, 'families', family.id, 'chores');
      const snapshot = await getDocs(choresRef);
      
      // Get today's date in the format YYYY-MM-DD
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      
      // Convert snapshot to array of chores with their IDs
      const allChores = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log(`Found ${allChores.length} total chores`);
      
      // Filter chores that are due today
      const todaysChores = allChores.filter(chore => {
        // If the chore is already completed today, include it
        if (chore.completedDates && chore.completedDates.includes(dateStr)) {
          return true;
        }
        
        // Otherwise, filter based on frequency
        if (chore.frequency === 'daily') {
          return true;
        }
        
        if (chore.frequency === 'weekly') {
          const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'lowercase' });
          return chore.dayOfWeek === dayOfWeek;
        }
        
        // For monthly or other frequencies, check the dueDate
        if (chore.dueDate) {
          // Handle both Timestamp and string date formats
          if (chore.dueDate.seconds) {
            const dueDate = new Date(chore.dueDate.seconds * 1000);
            return dueDate.toISOString().split('T')[0] === dateStr;
          } else if (typeof chore.dueDate === 'string') {
            return chore.dueDate === dateStr;
          }
        }
        
        // If no specific criteria, include the chore by default
        return true;
      });
      
      console.log(`Found ${todaysChores.length} chores for today`);
      // Log details about assigned chores
      todaysChores.forEach(chore => {
        if (chore.assignedTo) {
          console.log(`Chore "${chore.title || chore.name}" assigned to:`, chore.assignedTo);
        } else {
          console.log(`Chore "${chore.title || chore.name}" is unassigned`);
        }
      });
      
      setChores(todaysChores);
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching chores:', err);
      setError('Unable to load chores');
      setLoading(false);
      throw err; // Re-throw so the effect can catch it
    }
  }, [family]);

  // Load chores when the component mounts or family changes
  useEffect(() => {
    if (!family?.id) return;
    
    console.log(`Loading chores for family ${family.id} (isLoading: ${isLoading})`);
    fetchChores().catch(err => {
      console.error('Error in fetchChores:', err);
      setError('Failed to load chores. Please try again.');
    });
  }, [fetchChores, isLoading, family?.id]);

  const handleToggleChore = async (choreId) => {
    if (!family?.id) return;
    
    try {
      // Get the chore to update
      const chore = chores.find(c => c.id === choreId);
      if (!chore) return;
      
      // Update local state immediately for a responsive UI
      setChores(prevChores => 
        prevChores.map(c => 
          c.id === choreId 
            ? { ...c, completed: !c.completed }
            : c
        )
      );
      
      // Update in Firestore
      const choreRef = doc(db, 'families', family.id, 'chores', choreId);
      
      // Get today's date in the format YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0];
      
      // Update the document with the new completion status
      const completed = !chore.completed;
      let completedDates = chore.completedDates || [];
      
      if (completed) {
        // Add today's date if not already there
        if (!completedDates.includes(today)) {
          completedDates.push(today);
        }
      } else {
        // Remove today's date
        completedDates = completedDates.filter(date => date !== today);
      }
      
      await updateDoc(choreRef, {
        completed,
        completedDates,
        lastUpdated: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error updating chore:', err);
      // Revert the local state if there was an error
      fetchChores();
    }
  };

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardHeader
          title={<Skeleton width="40%" />}
        />
        <CardContent>
          <List>
            {[1, 2, 3, 4].map((i) => (
              <ListItem key={i} sx={{ px: 0 }}>
                <ListItemIcon>
                  <Skeleton variant="circular" width={24} height={24} />
                </ListItemIcon>
                <ListItemText
                  primary={<Skeleton width="60%" />}
                  secondary={<Skeleton width="40%" />}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    );
  }

  // Define theme-aware colors
  const cardBackground = theme.palette.mode === 'dark' 
    ? 'linear-gradient(to bottom right, #4c1d95, #5b21b6)' 
    : 'linear-gradient(to bottom right, #ede9fe, #ddd6fe)';

  const cardBorder = theme.palette.mode === 'dark' 
    ? '1px solid #7c3aed' 
    : '1px solid #a78bfa';
    
  const iconColor = theme.palette.mode === 'dark' 
    ? '#a78bfa' 
    : '#7c3aed';
    
  const headerBackground = theme.palette.mode === 'dark'
    ? 'rgba(0, 0, 0, 0.2)'
    : 'rgba(255, 255, 255, 0.7)';
    
  const hoverBackground = theme.palette.mode === 'dark'
    ? 'rgba(0, 0, 0, 0.2)'
    : 'rgba(255, 255, 255, 0.5)';
    
  const checkboxColors = {
    unchecked: theme.palette.mode === 'dark' ? '#a78bfa' : '#a78bfa',
    checked: theme.palette.mode === 'dark' ? '#a78bfa' : '#7c3aed'
  };

  if (error) {
    return (
      <Card sx={{ height: '100%', background: cardBackground, border: cardBorder }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AssignmentIcon sx={{ fontSize: 18, mr: 0.5, color: iconColor }} />
              <Typography variant="subtitle1" fontWeight="medium">
                Today's Chores
              </Typography>
            </Box>
          }
          sx={{ 
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: headerBackground,
            py: 1.5,
            px: 2
          }}
        />
        <CardContent>
          <ErrorState 
            title="Couldn't load chores" 
            message={error}
            onRetry={() => window.location.reload()}
          />
        </CardContent>
      </Card>
    );
  }

  const completedCount = chores.filter(chore => chore.completed).length;
  const totalPoints = chores.reduce((sum, chore) => sum + (chore.completed ? (chore.points || 0) : 0), 0);

  // Empty state handling
  const allChoresCompleted = chores.length > 0 && chores.every(chore => chore.completed);
  const noChores = chores.length === 0;

  if (noChores) {
    return (
      <Card sx={{ height: '100%', background: cardBackground, border: cardBorder }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AssignmentIcon sx={{ fontSize: 18, mr: 0.5, color: iconColor }} />
                <Typography variant="subtitle1" fontWeight="medium">
                  Today's Chores
                </Typography>
              </Box>
              <Tooltip title="Add new chore">
                <IconButton size="small" onClick={() => navigate('/chores/add')}>
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          }
          sx={{ 
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: headerBackground,
            py: 1.5,
            px: 2
          }}
        />
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: fullScreen ? 'calc(100vh - 160px)' : '240px' }}>
          <EmptyState 
            title="No chores for today" 
            message="Add chores to help manage household tasks."
            icon={<AssignmentIcon />}
            actionText="Add Chores"
            onAction={() => navigate('/chores/add')}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      sx={{ 
        height: '100%',
        background: cardBackground,
        border: cardBorder
      }}
    >
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AssignmentIcon sx={{ fontSize: 18, mr: 0.5, color: iconColor }} />
              <Typography variant="subtitle1" fontWeight="medium">
                Today's Chores
              </Typography>
            </Box>
            <Tooltip title="Add new chore">
              <IconButton size="small" onClick={() => navigate('/chores/add')}>
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        }
        subheader={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {completedCount}/{chores.length} completed
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {totalPoints} points earned
            </Typography>
          </Box>
        }
        sx={{ 
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: headerBackground,
          py: 1.5,
          px: 2
        }}
      />
      <CardContent sx={{ p: 0 }}>
        {allChoresCompleted ? (
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              py: 4,
              px: 2
            }}
          >
            <CheckCircleIcon 
              sx={{ 
                color: theme.palette.success.main, 
                fontSize: 40, 
                mb: 1 
              }} 
            />
            <Typography 
              variant="body1" 
              color="text.secondary" 
              align="center"
              fontWeight="medium"
            >
              You're all caught up!
            </Typography>
          </Box>
        ) : (
          <List>
            {chores.map((chore) => (
              <ListItem
                key={chore.id}
                sx={{
                  px: 2,
                  py: 1,
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    backgroundColor: hoverBackground,
                  }
                }}
              >
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={chore.completed}
                    onChange={() => handleToggleChore(chore.id)}
                    sx={{ 
                      color: checkboxColors.unchecked,
                      '&.Mui-checked': {
                        color: checkboxColors.checked
                      } 
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        textDecoration: chore.completed ? 'line-through' : 'none',
                        color: chore.completed ? 'text.secondary' : 'text.primary',
                      }}
                    >
                      {chore.name || chore.title}
                    </Typography>
                  }
                  secondary={
                    chore.assignedTo ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <PersonIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {typeof chore.assignedTo === 'object' 
                            ? (chore.assignedTo.name || chore.assignedTo.displayName || 'Family Member')
                            : chore.assignedTo}
                        </Typography>
                        {chore.points > 0 && (
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            • {chore.points} pts
                          </Typography>
                        )}
                      </Box>
                    ) : null
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}

export default ChoresCard; 