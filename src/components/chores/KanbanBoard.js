import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import ChoreItem from './ChoreItem';

const COLUMNS = {
  todo: {
    title: '📝 To Do',
    statuses: ['todo', 'open']
  },
  in_progress: {
    title: '🏃 In Progress',
    statuses: ['in_progress']
  },
  done: {
    title: '✨ Done',
    statuses: ['done']
  }
};

export default function KanbanBoard({ chores, onStatusChange, onEdit, onDelete, onToggleComplete }) {
  const getChoresByStatus = (statusArray) => {
    return chores.filter(chore => statusArray.includes(chore.status || 'todo'));
  };

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 2,
        width: '100%',
        overflowX: 'auto',
        minHeight: '70vh'
      }}
    >
      {Object.entries(COLUMNS).map(([columnId, column]) => (
        <Paper
          key={columnId}
          sx={{
            p: 2,
            backgroundColor: 'background.default',
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 1
          }}
        >
          <Typography variant="h6" gutterBottom>
            {column.title} ({getChoresByStatus(column.statuses).length})
          </Typography>
          <Box sx={{ flexGrow: 1 }}>
            {getChoresByStatus(column.statuses).map(chore => (
              <ChoreItem
                key={chore.id}
                chore={chore}
                onStatusChange={onStatusChange}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleComplete={onToggleComplete}
              />
            ))}
          </Box>
        </Paper>
      ))}
    </Box>
  );
} 