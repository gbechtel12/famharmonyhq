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
  Stack,
  LinearProgress,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  Refresh as RefreshIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { formatDistanceToNow } from 'date-fns';
import { STATUS_CONFIG } from './choreConstants';

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
  
  // Calculate the progress for recurring tasks
  const isRecurring = chore.frequency && chore.frequency !== 'once';
  const progress = isRecurring && chore.completedInstances 
    ? Math.min(100, (chore.completedInstances / chore.totalInstances) * 100)
    : 0;
  
  // Format the last updated timestamp if available
  const lastUpdated = chore.updatedAt 
    ? (() => {
        try {
          const updatedDate = new Date(chore.updatedAt);
          // Check if date is valid before formatting
          if (!isNaN(updatedDate.getTime())) {
            return formatDistanceToNow(updatedDate, { addSuffix: true });
          }
          return '';
        } catch (err) {
          console.warn('Invalid date format in chore:', chore.id, chore.updatedAt);
          return '';
        }
      })()
    : '';
  
  // Calculate the total stars earned from this chore
  const earnedStars = chore.earnedPoints || 0;

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
          },
          position: 'relative',
          overflow: 'visible'
        }}
      >
        {/* Star counter badge */}
        {earnedStars > 0 && (
          <Badge
            badgeContent={earnedStars}
            max={99}
            color="warning"
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              '& .MuiBadge-badge': {
                bgcolor: '#ffc107',
                color: '#000'
              }
            }}
          >
            <StarIcon color="warning" />
          </Badge>
        )}
        
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
              {chore.title} {chore.points > 0 && (
                <Tooltip title={`Worth ${chore.points} points`}>
                  <Chip
                    icon={<StarIcon fontSize="small" />}
                    label={chore.points}
                    size="small"
                    sx={{
                      ml: 1,
                      bgcolor: 'warning.light',
                      color: 'warning.contrastText',
                      fontWeight: 'bold',
                      '& .MuiChip-icon': {
                        color: 'inherit'
                      }
                    }}
                  />
                </Tooltip>
              )}
              {isRecurring && (
                <Tooltip title="Recurring task">
                  <RefreshIcon fontSize="small" sx={{ ml: 1, color: 'info.main' }} />
                </Tooltip>
              )}
            </Typography>
          }
          secondary={
            <>
              <Typography variant="body2" component="span" sx={{ display: 'block', mt: 1 }}>
                {chore.description}
              </Typography>
              
              {/* Progress bar for recurring tasks */}
              {isRecurring && (
                <Box sx={{ mt: 1, mb: 1 }}>
                  <Typography variant="caption" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Progress</span>
                    <span>{chore.completedInstances || 0} of {chore.totalInstances || 1}</span>
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={progress} 
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: currentStatus.color
                      }
                    }} 
                  />
                </Box>
              )}
              
              <Stack 
                direction="row" 
                spacing={1} 
                sx={{ mt: 1 }}
                flexWrap="wrap"
                useFlexGap
              >
                {/* Status badge */}
                <Chip
                  size="small"
                  label={currentStatus.label}
                  onClick={handleStatusClick}
                  sx={{
                    bgcolor: currentStatus.bgcolor,
                    color: currentStatus.textColor,
                    borderColor: currentStatus.color,
                    fontWeight: 500,
                    '&:hover': {
                      bgcolor: currentStatus.bgcolor,
                      filter: 'brightness(0.95)'
                    }
                  }}
                />
                
                {chore.assignedTo && (
                  <Chip
                    size="small"
                    label={`${chore.assignedTo.name}`}
                    variant="outlined"
                    color={chore.assignedTo.type === 'child' ? 'secondary' : 'default'}
                    sx={{
                      borderColor: chore.assignedTo.color || 'divider'
                    }}
                  />
                )}
                {chore.dueDate && (
                  <Tooltip title={`Due date: ${new Date(chore.dueDate).toLocaleDateString()}`}>
                    <Chip
                      size="small"
                      label={new Date(chore.dueDate).toLocaleDateString()}
                      color="secondary"
                      variant="outlined"
                    />
                  </Tooltip>
                )}
                
                {/* Last updated chip */}
                {lastUpdated && (
                  <Tooltip title={`Last updated: ${new Date(chore.updatedAt).toLocaleString()}`}>
                    <Chip
                      size="small"
                      icon={<TimeIcon fontSize="small" />}
                      label={lastUpdated}
                      variant="outlined"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  </Tooltip>
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
              sx={{
                '&.Mui-selected': {
                  backgroundColor: config.bgcolor,
                  color: config.textColor,
                  '&:hover': {
                    backgroundColor: config.bgcolor,
                    filter: 'brightness(0.95)'
                  }
                }
              }}
            >
              {config.label}
            </MenuItem>
          ))}
      </Menu>
    </>
  );
}

export default ChoreItem; 