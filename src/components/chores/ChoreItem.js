import React, { useState } from 'react';
import {
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  Box,
  Chip,
  Menu,
  MenuItem,
  Typography,
  Stack
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

// Update STATUS_CONFIG to include 'open' status and make 'todo' the default
const STATUS_CONFIG = {
  open: {
    label: '📋 Open',
    color: 'default'
  },
  todo: {
    label: '📝 To Do',
    color: 'info'
  },
  in_progress: {
    label: '🏃 In Progress',
    color: 'warning'
  },
  done: {
    label: '✨ Done',
    color: 'success'
  }
};

function ChoreItem({ chore, onStatusChange, onEdit, onDelete, onToggleComplete }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();

  const handleStatusClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleStatusClose = () => {
    setAnchorEl(null);
  };

  const handleStatusChange = (newStatus) => {
    handleStatusClose();
    if (newStatus === 'done' && chore.status !== 'done') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    onStatusChange(chore.id, newStatus);
  };

  // Add better status handling with fallback
  const currentStatus = STATUS_CONFIG[chore.status] || STATUS_CONFIG.open;

  return (
    <>
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
        />
      )}
      <ListItem
        sx={{
          mb: 1,
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: chore.completed ? 'action.hover' : 'background.paper',
          borderLeft: chore.assignedTo?.color ? 
            `4px solid ${chore.assignedTo.color}` : 
            undefined,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateX(5px)',
            boxShadow: 1
          }
        }}
      >
        <ListItemIcon>
          <Checkbox
            checked={chore.completed}
            onChange={() => {
              if (!chore.completed) {
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 3000);
              }
              onToggleComplete(chore.id, chore.completed);
            }}
          />
        </ListItemIcon>
        <ListItemText
          primary={
            <Typography variant="subtitle1" component="span" sx={{ fontWeight: 600 }}>
              {chore.title} {chore.points > 0 && `🌟 ${chore.points} points`}
            </Typography>
          }
          secondary={
            <>
              <Typography variant="body2" component="span" sx={{ display: 'block', mt: 1 }}>
                {chore.description}
              </Typography>
              <Stack 
                direction="row" 
                spacing={1} 
                sx={{ mt: 1 }}
                flexWrap="wrap"
                useFlexGap
              >
                <Chip
                  size="small"
                  label={currentStatus.label}
                  color={currentStatus.color}
                  onClick={handleStatusClick}
                />
                {chore.assignedTo && (
                  <Chip
                    size="small"
                    label={`👤 ${chore.assignedTo.name}`}
                    variant="outlined"
                    color={chore.assignedTo.type === 'child' ? 'secondary' : 'default'}
                  />
                )}
                {chore.dueDate && (
                  <Chip
                    size="small"
                    label={`📅 Due: ${new Date(chore.dueDate).toLocaleDateString()}`}
                    color="secondary"
                  />
                )}
              </Stack>
            </>
          }
        />
        <ListItemSecondaryAction>
          <IconButton edge="end" onClick={() => onEdit(chore)}>
            <EditIcon />
          </IconButton>
          <IconButton edge="end" onClick={() => onDelete(chore.id)}>
            <DeleteIcon />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleStatusClose}
      >
        {Object.entries(STATUS_CONFIG)
          .filter(([status]) => status !== 'open')
          .map(([status, config]) => (
            <MenuItem 
              key={status}
              onClick={() => handleStatusChange(status)}
              selected={status === chore.status}
            >
              {config.label}
            </MenuItem>
          ))}
      </Menu>
    </>
  );
}

export default ChoreItem; 