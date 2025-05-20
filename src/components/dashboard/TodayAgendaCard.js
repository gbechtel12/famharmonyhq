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
  Chip,
  useTheme
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
import { useFamily } from '../../contexts/FamilyContext';
import { format } from 'date-fns';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';

// School days (typically Monday-Friday)
const SCHOOL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

function TodayAgendaCard({ fullScreen = false }) {
  const theme = useTheme();
  const { family } = useFamily();
  const [isLoading, setIsLoading] = useState(true);
  const [todayItems, setTodayItems] = useState([]);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadData = async () => {
      if (!family?.id) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Get today's agenda items using family ID from context
        const agendaItems = await agendaService.getDailyAgenda(family.id);
        
        // Process items to match component's expected format
        const processedItems = (agendaItems || []).map(item => {
          // Ensure item is not null
          if (!item) return null;
          
          // Format for UI based on item type
          if (item.type === 'event') {
            return {
              id: item.id || `event-${Date.now()}-${Math.random()}`,
              title: item.title || 'Untitled Event',
              time: item.startTime ? format(item.startTime.toDate(), 'HH:mm') : 
                    item.start ? format(item.start.toDate(), 'HH:mm') : '',
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
  }, [family]);

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
    const iconColor = {
      buy: theme.palette.mode === 'dark' ? '#fbbf24' : '#f59e0b',
      pack: theme.palette.mode === 'dark' ? '#34d399' : '#10b981'
    };
    
    if (!item.schoolLunchType) return null;
    
    if (item.schoolLunchType === 'buy') {
      return (
        <Tooltip title="Buy School Lunch">
          <ShoppingBagIcon fontSize="small" sx={{ color: iconColor.buy, ml: 1 }} />
        </Tooltip>
      );
    } else {
      return (
        <Tooltip title="Pack Lunch">
          <BackpackIcon fontSize="small" sx={{ color: iconColor.pack, ml: 1 }} />
        </Tooltip>
      );
    }
  };

  // Define theme-aware card styles
  const cardBackground = theme.palette.mode === 'dark' 
    ? 'linear-gradient(to bottom right, #0c4a6e, #0369a1)' 
    : 'linear-gradient(to bottom right, #e0f2fe, #dbeafe)';

  const cardBorder = theme.palette.mode === 'dark' 
    ? '1px solid #0284c7' 
    : '1px solid #93c5fd';
    
  const headerBackground = theme.palette.mode === 'dark'
    ? 'rgba(0, 0, 0, 0.2)'
    : 'rgba(255, 255, 255, 0.7)';
    
  const iconColor = theme.palette.mode === 'dark'
    ? '#60a5fa'
    : '#2563eb';
    
  const timelineColor = theme.palette.mode === 'dark'
    ? 'rgba(148, 163, 184, 0.4)'
    : 'rgba(209, 213, 219, 0.8)';

  if (isLoading) {
    return (
      <Card sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }} data-testid="agenda-card-loading">
        <CircularProgress size={28} />
      </Card>
    );
  }
  
  if (error || todayItems.length === 0) {
    return (
      <Card 
        sx={{ 
          height: '100%', 
          background: cardBackground,
          border: cardBorder,
          overflow: 'hidden'
        }}
        data-testid="agenda-card-empty"
      >
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CalendarTodayIcon sx={{ fontSize: 18, mr: 0.5, color: iconColor }} />
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
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor: headerBackground,
            py: 1.5,
            px: 2
          }}
        />
        <CardContent 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: fullScreen ? 'calc(100vh - 160px)' : 'calc(100% - 65px)',
            p: 3 
          }}
        >
          {error ? (
            <ErrorState 
              title="Unable to load agenda" 
              message="There was a problem loading your agenda items. Please try again later."
              onRetry={() => window.location.reload()}
            />
          ) : (
            <EmptyState 
              title="Your day is clear" 
              message="Nothing scheduled for today - enjoy your free time!"
              icon={<CalendarTodayIcon />}
              actionText="Schedule Event"
              onAction={() => window.location.href = '/calendar'}
            />
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      sx={{ 
        height: '100%', 
        background: cardBackground,
        border: cardBorder,
        overflow: 'hidden'
      }}
      data-testid="agenda-card"
    >
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CalendarTodayIcon sx={{ fontSize: 18, mr: 0.5, color: iconColor }} />
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
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: headerBackground,
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
        data-testid="agenda-items-container"
      >
        {/* Timeline line */}
        <Box 
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 15,
            width: 2,
            bgcolor: timelineColor
          }}
        />
        
        {/* Timeline items */}
        <Box sx={{ '& > *:not(:last-child)': { mb: 1.5 } }}>
          {sortedItems.map((item) => (
            <AgendaItem 
              key={item.id} 
              item={item} 
              isSchoolLunch={isSchoolLunch(item)} 
              getSchoolLunchIcon={getSchoolLunchIcon} 
              theme={theme}
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

// AgendaItem component for each agenda item
const AgendaItem = ({ item, isSchoolLunch, getSchoolLunchIcon, theme }) => {
  // Theme-aware icon colors
  const iconColors = {
    event: theme.palette.mode === 'dark' ? '#60a5fa' : '#2563eb',
    chore: theme.palette.mode === 'dark' ? '#a78bfa' : '#9333ea',
    meal: theme.palette.mode === 'dark' ? '#34d399' : '#059669'
  };
  
  const getItemIcon = () => {
    switch (item.type) {
      case 'event':
        return <CalendarTodayIcon sx={{ fontSize: 18, color: iconColors.event }} />;
      case 'chore':
        return <AssignmentIcon sx={{ fontSize: 18, color: iconColors.chore }} />;
      case 'meal':
        return <RestaurantIcon sx={{ fontSize: 18, color: iconColors.meal }} />;
      default:
        return <CalendarTodayIcon sx={{ fontSize: 18 }} />;
    }
  };
  
  const getItemColor = () => {
    switch (item.type) {
      case 'event':
        return {
          bg: theme.palette.mode === 'dark' 
            ? 'rgba(30, 58, 138, 0.4)' 
            : 'rgba(219, 234, 254, 0.6)',
          border: theme.palette.mode === 'dark'
            ? '#1d4ed8'
            : '#93c5fd'
        };
      case 'chore':
        return {
          bg: theme.palette.mode === 'dark' 
            ? 'rgba(76, 29, 149, 0.4)' 
            : 'rgba(237, 233, 254, 0.6)',
          border: theme.palette.mode === 'dark'
            ? '#7e22ce'
            : '#c4b5fd'
        };
      case 'meal':
        return {
          bg: theme.palette.mode === 'dark' 
            ? 'rgba(6, 78, 59, 0.4)' 
            : 'rgba(209, 250, 229, 0.6)',
          border: theme.palette.mode === 'dark'
            ? '#047857'
            : '#6ee7b7'
        };
      default:
        return {
          bg: theme.palette.mode === 'dark' 
            ? 'rgba(30, 41, 59, 0.4)' 
            : 'rgba(243, 244, 246, 0.6)',
          border: theme.palette.mode === 'dark'
            ? '#475569'
            : '#d1d5db'
        };
    }
  };
  
  const colors = getItemColor();
  const timeColor = theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b';
  
  return (
    <Box sx={{ display: 'flex', position: 'relative' }} data-testid={`agenda-item-${item.id}`}>
      {/* Timeline dot */}
      <Box 
        sx={{
          position: 'absolute',
          top: 0,
          left: 15,
          width: 12,
          height: 12,
          borderRadius: '50%',
          bgcolor: colors.border,
          transform: 'translate(-50%, 0)',
          zIndex: 1,
          mt: 1
        }}
      />
      
      {/* Time */}
      <Box 
        sx={{ 
          width: 46, 
          pr: 2, 
          textAlign: 'right',
          mt: 0.5
        }}
        data-testid={`agenda-item-time-${item.id}`}
      >
        <Typography 
          variant="caption" 
          sx={{ 
            fontWeight: 'medium',
            color: timeColor
          }}
        >
          {item.time || item.dueTime || '–:–'}
        </Typography>
      </Box>
      
      {/* Content */}
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          ml: 2,
          p: 1.5,
          borderRadius: 2,
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.bg
        }}
        data-testid={`agenda-item-content-${item.id}`}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {getItemIcon()}
            <Typography 
              variant="body2" 
              sx={{ 
                ml: 1, 
                fontWeight: 'medium',
                color: item.completed ? 'text.secondary' : 'text.primary',
                textDecoration: item.completed ? 'line-through' : 'none'
              }}
            >
              {item.title}
            </Typography>
          </Box>
          
          {item.completed && (
            <Tooltip title="Completed">
              <CheckCircleIcon 
                fontSize="small" 
                sx={{ 
                  color: theme.palette.mode === 'dark' ? '#34d399' : '#10b981',
                  ml: 1, 
                  fontSize: 16 
                }} 
                data-testid={`agenda-item-completed-${item.id}`}
              />
            </Tooltip>
          )}
        </Box>
        
        {item.assignedTo && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
            <PersonIcon sx={{ fontSize: 14, mr: 0.5, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {item.assignedTo}
            </Typography>
          </Box>
        )}
        
        {item.type === 'meal' && item.mealType === 'lunch' && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
            {isSchoolLunch(item) && getSchoolLunchIcon(item)}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default TodayAgendaCard; 