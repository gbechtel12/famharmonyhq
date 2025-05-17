import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CircularProgress, 
  Typography, 
  Box, 
  Grid, 
  Paper, 
  LinearProgress,
  Chip,
  Avatar,
  Divider
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import { familyService } from '../../services/familyService';
import { rewardsService } from '../../services/rewardsService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

// Avatar emoji mapping based on user type
const getAvatarEmoji = (type, gender) => {
  if (!type) return '👤';
  
  const typeStr = String(type).toLowerCase();
  const genderStr = gender ? String(gender).toLowerCase() : '';
  
  if (typeStr === 'child') {
    return genderStr === 'female' ? '👧' : '👦';
  } else if (typeStr === 'parent') {
    return genderStr === 'female' ? '👩' : '👨';
  }
  return '👤';
};

// Get a consistent color for each family member
const getMemberColor = (name) => {
  const colors = [
    '#e91e63', // pink
    '#2196f3', // blue
    '#9c27b0', // purple
    '#ff9800', // orange
    '#4caf50', // green
    '#795548', // brown
    '#607d8b'  // blue-gray
  ];
  
  if (!name) return colors[0];
  
  // Generate a simple hash of the name to pick a consistent color
  const nameStr = String(name);
  const hash = nameStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

function FamilyStatsCard({ fullScreen = false }) {
  const [isLoading, setIsLoading] = useState(true);
  const [familyData, setFamilyData] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // In a real app with authentication, you'd get familyId from context/user session
        // Try to get the default family ID from Firestore
        const defaultFamilyRef = doc(db, 'defaultFamily', 'current');
        const defaultFamilyDoc = await getDoc(defaultFamilyRef);
        
        let familyId;
        if (defaultFamilyDoc.exists() && defaultFamilyDoc.data().familyId) {
          familyId = defaultFamilyDoc.data().familyId;
        } else {
          // Fallback to a sample family ID
          familyId = 'defaultFamily123';
        }
        
        // Get family members
        const familyMembers = await familyService.getFamilyMembers(familyId);
        
        // Get rewards
        const familyRewards = await rewardsService.getRewards(familyId);
        
        // Process family members data for display
        const processedFamilyData = (familyMembers || []).map(member => {
          // Skip null members
          if (!member) return null;
          
          const displayName = member.name || member.displayName || 'Family Member';
          const memberType = member.type || 'child';
          const points = parseInt(member.points) || 0;
          
          return {
            id: member.id || `member-${Date.now()}-${Math.random()}`,
            name: displayName,
            avatar: getAvatarEmoji(memberType, member.gender),
            type: memberType,
            color: getMemberColor(displayName),
            completedChores: parseInt(member.completedChores) || 0,
            totalChores: parseInt(member.totalChores) || 0,
            points: points,
            streak: parseInt(member.streak) || 0,
            // Add rewards for children
            rewards: memberType === 'child' ? 
              (familyRewards || [])
                .filter(reward => reward && (!reward.assignedTo || reward.assignedTo === member.id))
                .map(reward => ({
                  id: reward.id || `reward-${Date.now()}-${Math.random()}`,
                  name: reward.name || 'Unnamed Reward',
                  cost: parseInt(reward.pointCost) || 100,
                  earned: points >= (parseInt(reward.pointCost) || 100)
                }))
              : []
          };
        }).filter(Boolean); // Remove null items
        
        setFamilyData(processedFamilyData);
        setRewards(familyRewards || []);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading family data:', err);
        setError('Unable to load family data: ' + (err.message || 'Unknown error'));
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Sort family members by points (descending)
  const sortedFamilyMembers = [...familyData].sort((a, b) => b.points - a.points);
  
  // Extract kids with rewards
  const kidsWithRewards = sortedFamilyMembers.filter(member => 
    member.type === 'child' && member.rewards && member.rewards.length > 0
  );

  // Total family stats
  const totalStats = familyData.reduce((acc, member) => {
    acc.totalChores += member.totalChores || 0;
    acc.completedChores += member.completedChores || 0;
    acc.totalPoints += member.points || 0;
    return acc;
  }, { totalChores: 0, completedChores: 0, totalPoints: 0 });

  if (isLoading) {
    return (
      <Card sx={{ height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={28} />
      </Card>
    );
  }
  
  if (error || familyData.length === 0) {
    return (
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 2 }}>
        <PeopleIcon sx={{ mb: 1, color: '#9ca3af' }} />
        <Typography variant="body2" color="text.secondary">
          {error || "No family data available"}
        </Typography>
      </Card>
    );
  }

  return (
    <Card sx={{ 
      height: '100%', 
      background: 'linear-gradient(to bottom right, #f3e8ff, #fce7f3)',
      border: '1px solid #e9d5ff', 
      overflow: 'hidden' 
    }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PeopleIcon sx={{ fontSize: 18, mr: 0.5, color: '#9333ea' }} /> 
            <Typography variant="subtitle1" fontWeight="medium">
              Family Leaderboard
            </Typography>
          </Box>
        }
        action={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <StarIcon sx={{ fontSize: 16, mr: 0.5, color: '#f59e0b' }} />
            <Typography variant="caption">
              Total Points: <Box component="span" fontWeight="bold">{totalStats.totalPoints}</Box>
            </Typography>
          </Box>
        }
        sx={{ 
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          py: 1.5,
          px: 2
        }}
      />

      <CardContent sx={{ p: 2 }}>
        <Grid container spacing={2}>
          {/* Leaderboard */}
          <Grid item xs={12} md={fullScreen ? 9 : 8}>
            <Grid container spacing={1.5}>
              {sortedFamilyMembers.map((member, index) => (
                <Grid item xs={12} sm={6} key={member.id}>
                  <MemberCard member={member} rank={index + 1} />
                </Grid>
              ))}
            </Grid>
          </Grid>
          
          {/* Rewards Status */}
          <Grid item xs={12} md={fullScreen ? 3 : 4}>
            <Paper sx={{ 
              p: 1.5, 
              height: '100%', 
              bgcolor: 'rgba(255, 255, 255, 0.6)',
              borderRadius: 1,
              border: '1px solid #e5e7eb'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <CardGiftcardIcon sx={{ fontSize: 16, mr: 0.5, color: '#9333ea' }} />
                <Typography variant="subtitle2">
                  Rewards Status
                </Typography>
              </Box>
              
              {kidsWithRewards.length > 0 ? (
                <Box sx={{ '& > *:not(:last-child)': { mb: 1.5 } }}>
                  {kidsWithRewards.map((child) => (
                    <Box key={child.id}>
                      <Typography variant="caption" fontWeight="medium" sx={{ color: child.color }}>
                        {child.name}'s Rewards
                      </Typography>
                      <Box sx={{ mt: 0.5, '& > *:not(:last-child)': { mb: 1 } }}>
                        {child.rewards.map((reward) => (
                          <Paper 
                            key={reward.id} 
                            sx={{ 
                              p: 1, 
                              borderRadius: 1,
                              bgcolor: reward.earned ? 'rgba(209, 250, 229, 0.6)' : 'rgba(249, 250, 251, 0.6)',
                              border: `1px solid ${reward.earned ? '#a7f3d0' : '#e5e7eb'}`
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" fontWeight="medium">{reward.name}</Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <StarIcon sx={{ fontSize: 12, mr: 0.3, color: '#f59e0b' }} />
                                <Typography variant="caption" fontWeight="bold">{reward.cost}</Typography>
                              </Box>
                            </Box>
                            {reward.earned ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5, color: '#059669' }}>
                                <CheckCircleIcon sx={{ fontSize: 12, mr: 0.3 }} />
                                <Typography variant="caption" fontWeight="medium">
                                  Earned!
                                </Typography>
                              </Box>
                            ) : (
                              <Box sx={{ mt: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                  {reward.cost - child.points} more points needed
                                </Typography>
                                <Box 
                                  sx={{ 
                                    mt: 0.5, 
                                    bgcolor: 'white', 
                                    borderRadius: 0.5, 
                                    p: 0.5, 
                                    border: '1px solid #e5e7eb',
                                    textAlign: 'center'
                                  }}
                                >
                                  <Typography variant="caption" color="text.secondary">
                                    {Math.round((child.points / reward.cost) * 100)}% progress
                                  </Typography>
                                </Box>
                              </Box>
                            )}
                          </Paper>
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 120 }}>
                  <CardGiftcardIcon sx={{ mb: 0.5, color: '#d1d5db' }} />
                  <Typography variant="caption" color="text.secondary">
                    No rewards available
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

function MemberCard({ member, rank }) {
  // Skip rendering if member is null
  if (!member) return null;
  
  // Get styling based on rank
  const getRankStyles = () => {
    if (rank === 1) {
      return {
        bgColor: 'rgba(254, 243, 199, 0.6)',
        borderColor: '#fcd34d',
        iconColor: '#f59e0b'
      };
    } else if (rank === 2) {
      return {
        bgColor: 'rgba(243, 244, 246, 0.6)',
        borderColor: '#d1d5db',
        iconColor: '#9ca3af'
      };
    } else if (rank === 3) {
      return {
        bgColor: 'rgba(255, 237, 213, 0.6)',
        borderColor: '#fdba74',
        iconColor: '#f97316'
      };
    } else {
      return {
        bgColor: 'rgba(255, 255, 255, 0.6)',
        borderColor: '#e5e7eb',
        iconColor: '#d1d5db'
      };
    }
  };
  
  const rankStyles = getRankStyles();
  const choreProgress = member.totalChores ? (member.completedChores / member.totalChores) * 100 : 0;
  
  return (
    <Paper 
      sx={{ 
        p: 1.5, 
        bgcolor: rankStyles.bgColor,
        border: `1px solid ${rankStyles.borderColor}`,
        borderRadius: 1
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        {/* Avatar */}
        <Avatar 
          sx={{ 
            width: 28, 
            height: 28, 
            mr: 1, 
            bgcolor: member.color,
            fontSize: '0.875rem'
          }}
        >
          {member.avatar}
        </Avatar>
        
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" fontWeight="medium" sx={{ color: member.color }}>
              {member.name}
            </Typography>
            {rank <= 3 && (
              <Box 
                sx={{ 
                  width: 20, 
                  height: 20, 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: rankStyles.iconColor
                }}
              >
                <EmojiEventsIcon sx={{ fontSize: 14 }} />
              </Box>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary">
            {member.type === 'child' ? 'Child' : 'Parent'}
          </Typography>
        </Box>
      </Box>
      
      {/* Points and streak */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <StarIcon sx={{ fontSize: 14, mr: 0.5, color: '#f59e0b' }} />
          <Typography variant="caption" fontWeight="medium">
            {member.points} points
          </Typography>
        </Box>
        {member.streak > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', color: '#ef4444' }}>
            <WhatshotIcon sx={{ fontSize: 14, mr: 0.5 }} />
            <Typography variant="caption">
              {member.streak} day streak
            </Typography>
          </Box>
        )}
      </Box>
      
      {/* Chore progress */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            Chores progress
          </Typography>
          <Typography variant="caption" fontWeight="medium">
            {member.completedChores}/{member.totalChores}
          </Typography>
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={choreProgress} 
          sx={{ 
            height: 4, 
            borderRadius: 2,
            bgcolor: 'rgba(209, 213, 219, 0.3)',
            '& .MuiLinearProgress-bar': {
              bgcolor: '#10b981'
            }
          }} 
        />
      </Box>
    </Paper>
  );
}

export default FamilyStatsCard; 