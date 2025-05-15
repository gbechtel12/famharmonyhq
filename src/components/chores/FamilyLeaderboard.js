import React from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Box
} from '@mui/material';

export default function FamilyLeaderboard({ members }) {
  const sortedMembers = [...members]
    .filter(m => m.type === 'child')
    .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        🏆 Family Leaderboard
      </Typography>
      <List>
        {sortedMembers.map((member, index) => (
          <ListItem key={member.id}>
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: index === 0 ? 'warning.main' : 'inherit' }}>
                {index === 0 ? '👑' : (index + 1)}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={member.name}
              secondary={`${member.totalPoints || 0} points`}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
} 