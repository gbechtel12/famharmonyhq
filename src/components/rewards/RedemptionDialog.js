import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider
} from '@mui/material';
import { 
  Stars as StarsIcon, 
  CheckCircleOutline as CheckIcon,
  ErrorOutline as ErrorIcon 
} from '@mui/icons-material';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

function RedemptionDialog({ 
  open, 
  onClose, 
  reward, 
  onConfirm, 
  childPoints,
  isRedeeming,
  isSuccess,
  error
}) {
  const { width, height } = useWindowSize();
  const isAffordable = childPoints >= (reward?.pointsCost || 0);
  
  const renderContent = () => {
    if (isSuccess) {
      return (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <CheckIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Reward Redeemed!
          </Typography>
          <Typography variant="body1">
            You've successfully redeemed "{reward?.name}".
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Your new points balance: {childPoints - reward?.pointsCost} points
          </Typography>
        </Box>
      );
    }
    
    if (error) {
      return (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Redemption Failed
          </Typography>
          <Typography variant="body1" color="error">
            {error}
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Confirm Reward Redemption
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body1" fontWeight="bold">
            {reward?.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {reward?.description}
          </Typography>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body1">
            Cost:
          </Typography>
          <Chip
            icon={<StarsIcon />}
            label={`${reward?.pointsCost} points`}
            color="primary"
          />
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography variant="body1">
            Your current points:
          </Typography>
          <Chip
            icon={<StarsIcon />}
            label={`${childPoints} points`}
            color="default"
            variant="outlined"
          />
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          <Typography variant="body1">
            Remaining after redemption:
          </Typography>
          <Chip
            icon={<StarsIcon />}
            label={`${childPoints - reward?.pointsCost} points`}
            color={isAffordable ? "success" : "error"}
            variant="outlined"
          />
        </Box>
        
        {!isAffordable && (
          <Typography color="error" sx={{ mt: 2 }}>
            You don't have enough points to redeem this reward.
          </Typography>
        )}
      </Box>
    );
  };
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      {isSuccess && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} />}
      
      <DialogTitle>
        Redeem Reward
      </DialogTitle>
      
      <DialogContent>
        {renderContent()}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          {isSuccess ? 'Close' : 'Cancel'}
        </Button>
        {!isSuccess && !error && (
          <Button
            onClick={onConfirm}
            variant="contained"
            color="primary"
            disabled={isRedeeming || !isAffordable}
          >
            {isRedeeming ? 'Redeeming...' : 'Confirm Redemption'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default RedemptionDialog; 