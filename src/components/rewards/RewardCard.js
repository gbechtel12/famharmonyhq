import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Stars as StarsIcon
} from '@mui/icons-material';

function RewardCard({ 
  reward, 
  onEdit, 
  onDelete, 
  onRedeem, 
  childPoints,
  isParent
}) {
  const isAffordable = childPoints >= reward.pointsCost;
  
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        boxShadow: 2,
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: 4
        },
        border: !isAffordable && !isParent ? '1px solid #e0e0e0' : undefined,
        opacity: !isAffordable && !isParent ? 0.7 : 1
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" component="div" gutterBottom>
            {reward.name}
          </Typography>
          <Chip
            icon={<StarsIcon fontSize="small" />}
            label={`${reward.pointsCost} points`}
            color={isAffordable || isParent ? "primary" : "default"}
            size="small"
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {reward.description}
        </Typography>
        
        {reward.category && (
          <Chip 
            label={reward.category} 
            size="small" 
            sx={{ mb: 1 }} 
            variant="outlined"
          />
        )}
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'space-between', p: 2, pt: 0 }}>
        {isParent ? (
          <Box>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => onEdit(reward)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => onDelete(reward.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => onRedeem(reward)}
            disabled={!isAffordable}
            fullWidth
          >
            {isAffordable ? "Redeem Reward" : "Not Enough Points"}
          </Button>
        )}
      </CardActions>
    </Card>
  );
}

export default RewardCard; 