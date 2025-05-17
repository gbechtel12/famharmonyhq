import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CircularProgress, 
  Typography, 
  Box, 
  Paper, 
  Divider,
  Tooltip,
  Chip
} from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SyncIcon from '@mui/icons-material/Sync';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import BackpackIcon from '@mui/icons-material/Backpack';
import { agendaService } from '../../services/agendaService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { format } from 'date-fns';

// School days (typically Monday-Friday)
const SCHOOL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

function TodayAgendaCard({ fullScreen = false }) {
  const [isLoading, setIsLoading] = useState(true);
  const [todayItems, setTodayItems] = useState([]);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // In a real app with authentication, you'd get familyId from context/user session
        // Let's try to get the default family ID from Firestore
        const defaultFamilyRef = doc(db, 'defaultFamily', 'current');
        const defaultFamilyDoc = await getDoc(defaultFamilyRef);
        
        let familyId;
        if (defaultFamilyDoc.exists() && defaultFamilyDoc.data().familyId) {
          familyId = defaultFamilyDoc.data().familyId;
        } else {
          // Fallback to a sample family ID
          familyId = 'defaultFamily123';
        }
        
        // Get today's agenda items
        const agendaItems = await agendaService.getDailyAgenda(familyId);
        
        // Process items to match component's expected format
        const processedItems = (agendaItems || []).map(item => {
          // Ensure item is not null
          if (!item) return null;
          
          // Format for UI based on item type
          if (item.type === 'event') {
            return {
              id: item.id || `event-${Date.now()}-${Math.random()}`,
              title: item.title || 'Untitled Event',
              time: item.startTime ? format(item.startTime.toDate(), 'HH:mm') : '',
              type: 'event'
            };
          } else if (item.type === 'chore') {
            return {
              id: item.id || `chore-${Date.now()}-${Math.random()}`,
              title: item.name || item.title || 'Untitled Chore',
              assignedTo: item.assignedTo || '',
              dueTime: item.dueTime || '19:00', // Default time if not specified
              completed: item.completed || false,
              type: 'chore'
            };
          } else if (item.type === 'meal') {
            return {
              id: item.id || `meal-${item.mealType || 'unknown'}-${Date.now()}`,
              title: `${(item.mealType || 'Meal').charAt(0).toUpperCase() + (item.mealType || 'meal').slice(1)}: ${item.title || item.name || 'Untitled Meal'}`,
              time: item.mealType ? agendaService.getMealTimeSlot(item.mealType) : '',
              type: 'meal'
            };
          }
          
          // Default fallback
          return {
            id: item.id || `item-${Date.now()}-${Math.random()}`,
            title: item.title || 'Untitled Item',
            time: '',
            type: item.type || 'event'
          };
        }).filter(Boolean); // Remove any null items
        
        setTodayItems(processedItems);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading agenda data:', err);
        setError('Unable to load today\'s agenda: ' + (err.message || 'Unknown error'));
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Sort items by time
  const sortedItems = [...todayItems].sort((a, b) => {
    const timeA = a.time || a.dueTime || '23:59';
    const timeB = b.time || b.dueTime || '23:59';
    return timeA.localeCompare(timeB);
  });

  // Check if an item is a school lunch
  const isSchoolLunch = (item) => {
    if (item.type !== 'meal' || item.mealType !== 'lunch') return false;
    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    return SCHOOL_DAYS.includes(dayOfWeek);
  };
  
  // Get school lunch icon
  const getSchoolLunchIcon = (item) => {
    if (!item.schoolLunchType) return null;
    
    if (item.schoolLunchType === 'buy') {
      return (
        <Tooltip title="Buy School Lunch">
          <ShoppingBagIcon fontSize="small" sx={{ color: '#f59e0b', ml: 1 }} />
        </Tooltip>
      );
    } else {
      return (
        <Tooltip title="Pack Lunch">
          <BackpackIcon fontSize="small" sx={{ color: '#10b981', ml: 1 }} />
        </Tooltip>
      );
    }
  };

  if (isLoading) {
    return (
      <Card sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={28} />
      </Card>
    );
  }
  
  if (error || todayItems.length === 0) {
    return (
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 2 }}>
        <CalendarTodayIcon sx={{ mb: 1, color: '#9ca3af' }} />
        <Typography variant="body2" color="text.secondary">
          {error || "No agenda items for today"}
        </Typography>
      </Card>
    );
  }

  return (
    <Card 
      sx={{ 
        height: '100%', 
        background: 'linear-gradient(to bottom right, #e0f2fe, #dbeafe)',
        border: '1px solid #93c5fd',
        overflow: 'hidden'
      }}
    >
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CalendarTodayIcon sx={{ fontSize: 18, mr: 0.5, color: '#2563eb' }} />
            <Typography variant="subtitle1" fontWeight="medium">
              Today's Agenda
            </Typography>
          </Box>
        }
        action={
          <Typography variant="caption" color="text.secondary">
            {format(new Date(), 'EEE, MMM d')}
          </Typography>
        }
        sx={{ 
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          py: 1.5,
          px: 2
        }}
      />

      <CardContent 
        sx={{ 
          p: 2, 
          overflow: 'auto', 
          maxHeight: fullScreen ? 'calc(100vh - 160px)' : '400px',
          position: 'relative'
        }}
      >
        {/* Timeline line */}
        <Box 
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 15,
            width: 2,
            bgcolor: 'rgba(209, 213, 219, 0.8)'
          }}
        />
        
        {/* Timeline items */}
        <Box sx={{ '& > *:not(:last-child)': { mb: 1.5 } }}>
          {sortedItems.map((item) => (
            <AgendaItem key={item.id} item={item} isSchoolLunch={isSchoolLunch(item)} getSchoolLunchIcon={getSchoolLunchIcon} />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

// AgendaItem component for each agenda item
const AgendaItem = ({ item, isSchoolLunch, getSchoolLunchIcon }) => {
  const getItemIcon = () => {
    switch (item.type) {
      case 'event':
        return <CalendarTodayIcon sx={{ fontSize: 18, color: '#2563eb' }} />;
      case 'chore':
        return <AssignmentIcon sx={{ fontSize: 18, color: '#9333ea' }} />;
      case 'meal':
        return <RestaurantIcon sx={{ fontSize: 18, color: '#059669' }} />;
      default:
        return <CalendarTodayIcon sx={{ fontSize: 18 }} />;
    }
  };
  
  const getItemColor = () => {
    switch (item.type) {
      case 'event':
        return {
          bg: 'rgba(219, 234, 254, 0.6)',
          border: '#93c5fd'
        };
      case 'chore':
        return {
          bg: 'rgba(237, 233, 254, 0.6)',
          border: '#c4b5fd'
        };
      case 'meal':
        return {
          bg: 'rgba(209, 250, 229, 0.6)',
          border: '#6ee7b7'
        };
      default:
        return {
          bg: 'rgba(243, 244, 246, 0.6)',
          border: '#d1d5db'
        };
    }
  };
  
  const colors = getItemColor();
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        border: `1px solid ${colors.border}`,
        backgroundColor: colors.bg,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ mr: 1.5 }}>
            {getItemIcon()}
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                {item.title || item.name}
              </Typography>
              {item.completed && (
                <CheckCircleIcon sx={{ ml: 0.5, fontSize: 16, color: '#10b981' }} />
              )}
              {isSchoolLunch && getSchoolLunchIcon(item)}
            </Box>
            
            {item.type === 'meal' && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                {item.mealType.charAt(0).toUpperCase() + item.mealType.slice(1)}
              </Typography>
            )}
            
            {item.type === 'chore' && item.assignedTo && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <PersonIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {item.assignedTo}
                </Typography>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              <AccessTimeIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {item.time || item.dueTime || 'All day'}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        {item.type === 'chore' && typeof item.points === 'number' && (
          <Chip 
            label={`${item.points} pts`} 
            size="small"
            sx={{ 
              bgcolor: 'rgba(255, 255, 255, 0.8)',
              fontWeight: 'medium',
              fontSize: '0.675rem',
              height: 22
            }}
          />
        )}
      </Box>
      
      {item.description && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, ml: 4 }}>
          {item.description}
        </Typography>
      )}
    </Paper>
  );
};

// Mock data for testing
function getMockAgendaItems() {
  return [
    {
      type: 'event',
      title: 'School Pickup',
      time: '15:30',
      description: 'Pick up kids from school'
    },
    {
      type: 'meal',
      mealType: 'breakfast',
      name: 'Oatmeal with Fruit',
      time: '07:30',
      schoolLunchType: 'pack'
    },
    {
      type: 'meal',
      mealType: 'lunch',
      name: 'Turkey Sandwich',
      time: '12:30',
      schoolLunchType: 'pack'
    },
    {
      type: 'chore',
      title: 'Take out trash',
      assignedTo: 'Alex',
      dueTime: '18:00',
      points: 5,
      completed: false
    },
    {
      type: 'meal',
      mealType: 'dinner',
      name: 'Spaghetti Bolognese',
      time: '18:30'
    }
  ];
}

export default TodayAgendaCard; 