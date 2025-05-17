import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  CircularProgress,
  Avatar,
  LinearProgress,
  Divider,
  Card,
  CardContent,
  Grid,
  Chip
} from '@mui/material';
import { 
  EmojiEvents as TrophyIcon,
  Star as StarIcon, 
  CardGiftcard as RewardIcon,
  Accessible as ActivityIcon,
  EscalatorWarning as KidIcon,
  Person as AdultIcon
} from '@mui/icons-material';

// Mock family data - replace with real data in a production app
const mockFamilyData = [
  { 
    id: 1, 
    name: 'Emma', 
    avatar: '👧', 
    type: 'child',
    color: '#e91e63',
    completedChores: 15,
    totalChores: 20, 
    points: 85,
    streak: 5,
    rewards: [
      { id: 1, name: 'Ice Cream Trip', cost: 50, earned: true },
      { id: 2, name: 'Movie Night', cost: 100, earned: false },
    ]
  },
  { 
    id: 2, 
    name: 'Alex', 
    avatar: '👦', 
    type: 'child',
    color: '#2196f3',
    completedChores: 12,
    totalChores: 18, 
    points: 72,
    streak: 3,
    rewards: [
      { id: 3, name: 'Video Game Time', cost: 60, earned: true },
      { id: 4, name: 'Sleepover', cost: 120, earned: false },
    ]
  },
  { 
    id: 3, 
    name: 'Mom', 
    avatar: '👩', 
    type: 'parent',
    color: '#9c27b0',
    completedChores: 22,
    totalChores: 25, 
    points: 110,
    streak: 7
  },
  { 
    id: 4, 
    name: 'Dad', 
    avatar: '👨', 
    type: 'parent',
    color: '#ff9800',
    completedChores: 18,
    totalChores: 22, 
    points: 90,
    streak: 4
  }
];

function ChoreLeaderboardView() {
  const [isLoading, setIsLoading] = useState(true);
  const [familyData, setFamilyData] = useState([]);
  
  useEffect(() => {
    // Simulate data loading
    const loadData = async () => {
      // In a real app, fetch data from your services or API
      setTimeout(() => {
        setFamilyData(mockFamilyData);
        setIsLoading(false);
      }, 1000);
    };
    
    loadData();
  }, []);
  
  // Sort family members by points (descending)
  const sortedFamilyMembers = [...familyData].sort((a, b) => b.points - a.points);
  
  // Extract kids with rewards
  const kidsWithRewards = sortedFamilyMembers.filter(member => 
    member.type === 'child' && member.rewards && member.rewards.length > 0
  );

  return (
    <div className="w-full h-full p-6 bg-gradient-to-br from-secondary-50 to-secondary-100 overflow-auto">
      <Paper className="w-full h-full rounded-xl shadow-xl overflow-hidden bg-white bg-opacity-90 backdrop-blur">
        {isLoading ? (
          <div className="w-full h-full flex justify-center items-center">
            <CircularProgress size={60} />
          </div>
        ) : (
          <div className="p-6 flex flex-col h-full">
            <div className="text-center mb-8">
              <Typography variant="h3" className="font-bold text-secondary-800">
                <TrophyIcon sx={{ fontSize: 36, verticalAlign: 'middle', marginRight: 1 }} />
                Family Leaderboard
              </Typography>
            </div>
            
            <Box className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Leaderboard */}
              <div className="lg:col-span-2 bg-secondary-50 rounded-xl p-4 shadow-md border border-secondary-200">
                <Typography variant="h5" className="font-semibold text-secondary-800 mb-4 flex items-center">
                  <ActivityIcon className="mr-2" />
                  Chore Champions
                </Typography>
                <Divider className="mb-4" />
                
                <div className="space-y-4">
                  {sortedFamilyMembers.map((member, index) => {
                    const completionPercent = (member.completedChores / member.totalChores) * 100;
                    
                    return (
                      <div 
                        key={member.id}
                        className={`relative p-4 rounded-lg ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200' : 
                          index === 1 ? 'bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200' : 
                          index === 2 ? 'bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200' : 
                          'bg-white border border-gray-100'
                        }`}
                      >
                        {/* Position badge */}
                        {index < 3 && (
                          <div 
                            className={`absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center shadow-md ${
                              index === 0 ? 'bg-yellow-400 text-yellow-900' : 
                              index === 1 ? 'bg-gray-300 text-gray-800' : 
                              'bg-amber-600 text-amber-50'
                            }`}
                          >
                            <strong>{index + 1}</strong>
                          </div>
                        )}
                        
                        <div className="flex items-center">
                          <div className="mr-3 flex-shrink-0">
                            <Avatar 
                              sx={{ 
                                bgcolor: member.color, 
                                width: 56, 
                                height: 56,
                                fontSize: '1.75rem'
                              }}
                            >
                              {member.avatar}
                            </Avatar>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <Typography variant="h6" className="font-semibold flex items-center">
                                {member.name}
                                <Chip
                                  size="small"
                                  icon={member.type === 'child' ? <KidIcon /> : <AdultIcon />}
                                  label={member.type === 'child' ? 'Child' : 'Parent'}
                                  sx={{ 
                                    ml: 1, 
                                    bgcolor: member.type === 'child' ? 'secondary.100' : 'primary.100',
                                    color: member.type === 'child' ? 'secondary.800' : 'primary.800',
                                  }}
                                />
                              </Typography>
                              <div className="flex items-center">
                                <StarIcon sx={{ color: '#ffc107', marginRight: 0.5 }} />
                                <Typography variant="h6" className="font-bold">
                                  {member.points} pts
                                </Typography>
                              </div>
                            </div>
                            
                            <div className="mb-1">
                              <Typography variant="body2" className="flex justify-between mb-1">
                                <span>Chores completed: {member.completedChores}/{member.totalChores}</span>
                                <span>{completionPercent.toFixed(0)}%</span>
                              </Typography>
                              <LinearProgress 
                                variant="determinate" 
                                value={completionPercent} 
                                sx={{ 
                                  height: 8, 
                                  borderRadius: 4,
                                  bgcolor: 'rgba(0,0,0,0.1)',
                                  '& .MuiLinearProgress-bar': {
                                    bgcolor: member.color
                                  }
                                }} 
                              />
                            </div>
                            
                            <Typography variant="body2" className="mt-2">
                              <span className="inline-flex items-center bg-secondary-100 text-secondary-800 px-2 py-1 rounded">
                                <Box component="span" sx={{ mr: 0.5, fontWeight: 'bold' }}>{member.streak}</Box> 
                                day streak
                              </span>
                            </Typography>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Rewards Status */}
              <div className="bg-accent-50 rounded-xl p-4 shadow-md border border-accent-200">
                <Typography variant="h5" className="font-semibold text-accent-800 mb-4 flex items-center">
                  <RewardIcon className="mr-2" />
                  Rewards Status
                </Typography>
                <Divider className="mb-4" />
                
                <div className="space-y-4">
                  {kidsWithRewards.map((child) => (
                    <div key={child.id} className="mb-4">
                      <Typography variant="h6" className="font-semibold mb-2" style={{ color: child.color }}>
                        {child.name}'s Rewards
                      </Typography>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {child.rewards.map((reward) => (
                          <Card 
                            key={reward.id} 
                            className={`${
                              reward.earned 
                                ? 'bg-gradient-to-r from-accent-50 to-accent-100 border-accent-300' 
                                : 'bg-gray-50'
                            } border rounded-lg`}
                            sx={{ boxShadow: reward.earned ? 2 : 0 }}
                          >
                            <CardContent className="p-3">
                              <div className="flex justify-between items-center">
                                <Typography variant="subtitle1" className="font-medium">
                                  {reward.name}
                                </Typography>
                                <Chip
                                  size="small"
                                  icon={<StarIcon fontSize="small" />}
                                  label={`${reward.cost}`}
                                  sx={{ 
                                    bgcolor: reward.earned ? 'accent.100' : 'gray.100',
                                    color: reward.earned ? 'accent.800' : 'gray.800',
                                    '& .MuiChip-icon': {
                                      color: reward.earned ? 'accent.600' : 'gray.600'
                                    }
                                  }}
                                />
                              </div>
                              <Typography 
                                variant="body2" 
                                className={`mt-1 ${reward.earned ? 'text-accent-800' : 'text-gray-600'}`}
                              >
                                {reward.earned ? '✓ Reward earned!' : `Need ${reward.cost - child.points} more points`}
                              </Typography>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Box>
          </div>
        )}
      </Paper>
    </div>
  );
}

export default ChoreLeaderboardView; 