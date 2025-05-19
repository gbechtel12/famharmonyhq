import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  Typography, 
  Box, 
  Skeleton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Paper,
  useTheme
} from '@mui/material';
import BackpackIcon from '@mui/icons-material/Backpack';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import FaceIcon from '@mui/icons-material/Face';
import { mealService } from '../../services/mealService';
import { useFamily } from '../../contexts/FamilyContext';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';

function SchoolLunchCard({ fullScreen = false }) {
  const theme = useTheme();
  const { family, members } = useFamily();
  const [childrenLunches, setChildrenLunches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLunchData = async () => {
      if (!family?.id) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Get current date info
        const today = new Date();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayId = dayNames[today.getDay()];
        
        // Check if it's a school day
        const isSchoolDay = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(dayId);
        
        if (!isSchoolDay) {
          setChildrenLunches([]);
          setLoading(false);
          return;
        }
        
        // Get current week's meal plan to extract lunch data
        const weekPlan = await mealService.getCurrentWeekPlan(family.id);
        const todayLunch = weekPlan?.[dayId]?.lunch || {};
        
        // Get children from family members (with type 'child')
        const childMembers = members.filter(member => member.type === 'child');
        
        if (childMembers.length === 0) {
          setChildrenLunches([]);
          setLoading(false);
          return;
        }
        
        // Map child members to their lunch preferences
        const childrenWithLunches = childMembers.map(child => {
          // Check if there's lunch preference saved for this child
          const childLunchPref = todayLunch[child.id] || {};
          
          return {
            id: child.id,
            name: child.name,
            avatar: child.avatar || null,
            color: child.color || (theme.palette.mode === 'dark' ? '#6366f1' : '#4f46e5'),
            lunchPlan: childLunchPref.lunchType || 'pack' // Default to 'pack' if not specified
          };
        });
        
        setChildrenLunches(childrenWithLunches);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching lunch data:', err);
        setError('Unable to load lunch data');
        setLoading(false);
      }
    };

    fetchLunchData();
  }, [family, members, theme.palette.mode]);

  const getLunchIcon = (lunchPlan) => {
    if (lunchPlan === 'buy') {
      return <ShoppingBagIcon fontSize="small" />;
    } else {
      return <BackpackIcon fontSize="small" />;
    }
  };

  const getLunchLabel = (lunchPlan) => {
    return lunchPlan === 'buy' ? 'Buy School Lunch' : 'Pack Lunch';
  };

  const getLunchColor = (lunchPlan) => {
    return lunchPlan === 'buy' ? 'warning' : 'success';
  };

  // Define theme-aware styles
  const cardBackground = theme.palette.mode === 'dark' 
    ? 'linear-gradient(to bottom right, #064e3b, #065f46)' 
    : 'linear-gradient(to bottom right, #f0fdf4, #dcfce7)';

  const cardBorder = theme.palette.mode === 'dark' 
    ? '1px solid #10b981' 
    : '1px solid #6ee7b7';
    
  const iconColor = theme.palette.mode === 'dark' 
    ? '#34d399' 
    : '#059669';
    
  const headerBackground = theme.palette.mode === 'dark'
    ? 'rgba(0, 0, 0, 0.2)'
    : 'rgba(255, 255, 255, 0.7)';
  
  const paperBorder = theme.palette.mode === 'dark'
    ? `1px solid rgba(255, 255, 255, 0.1)`
    : `1px solid rgba(0, 0, 0, 0.08)`;

  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardHeader
          title={<Skeleton width="50%" />}
        />
        <CardContent>
          <List>
            {[1, 2].map((i) => (
              <ListItem key={i} sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Skeleton variant="circular" width={40} height={40} />
                </ListItemAvatar>
                <ListItemText
                  primary={<Skeleton width="40%" />}
                />
                <Skeleton width={80} height={32} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ height: '100%', background: cardBackground, border: cardBorder }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ChildCareIcon sx={{ fontSize: 18, mr: 0.5, color: iconColor }} />
              <Typography variant="subtitle1" fontWeight="medium">
                School Lunch
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
            title="Couldn't load lunch data" 
            message={error}
            onRetry={() => window.location.reload()}
          />
        </CardContent>
      </Card>
    );
  }
  
  // If no children or not a school day
  if (childrenLunches.length === 0) {
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
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ChildCareIcon sx={{ fontSize: 18, mr: 0.5, color: iconColor }} />
              <Typography variant="subtitle1" fontWeight="medium">
                School Lunch
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
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: fullScreen ? 'calc(100vh - 160px)' : '240px' }}>
          <EmptyState 
            title="No school today" 
            message="Or no children added to your family yet."
            icon={<ChildCareIcon />}
            actionText="Add Family Member"
            onAction={() => window.location.href = '/family/manage'}
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
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ChildCareIcon sx={{ fontSize: 18, mr: 0.5, color: iconColor }} />
            <Typography variant="subtitle1" fontWeight="medium">
              School Lunch
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
        <List>
          {childrenLunches.map((child) => (
            <Paper 
              key={child.id} 
              elevation={0}
              sx={{ 
                p: 1.5, 
                mb: 1.5, 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(6, 78, 59, 0.4)' 
                  : 'rgba(240, 253, 244, 0.9)',
                border: paperBorder,
                borderRadius: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  sx={{ 
                    bgcolor: child.color,
                    width: 32, 
                    height: 32,
                    fontSize: '0.875rem',
                    mr: 1.5
                  }}
                >
                  {child.avatar || child.name[0].toUpperCase()}
                </Avatar>
                <Typography variant="body2" fontWeight="medium">
                  {child.name}
                </Typography>
              </Box>
              <Chip
                icon={getLunchIcon(child.lunchPlan)}
                label={getLunchLabel(child.lunchPlan)}
                color={getLunchColor(child.lunchPlan)}
                size="small"
                variant={theme.palette.mode === 'dark' ? 'outlined' : 'filled'}
              />
            </Paper>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

export default SchoolLunchCard; 