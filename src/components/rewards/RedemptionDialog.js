import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Avatar,
  CircularProgress
} from '@mui/material';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import Confetti from 'react-confetti';

function RedemptionDialog({ open, onClose, onConfirm, reward, userPoints }) {
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });
  const dialogRef = useRef(null);

  // Get dimensions for confetti
  useEffect(() => {
    if (open && dialogRef.current) {
      const { offsetWidth, offsetHeight } = dialogRef.current;
      setWindowDimensions({
        width: offsetWidth,
        height: offsetHeight
      });
    }
  }, [open, isSuccess]);

  const hasEnoughPoints = userPoints >= (reward?.pointCost || 0);

  const handleRedeem = async () => {
    if (!hasEnoughPoints || isRedeeming) return;
    
    setIsRedeeming(true);
    setError(null);
    
    try {
      await onConfirm(reward);
      setIsSuccess(true);
      
      // Reset after 5 seconds for the next redemption
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setIsRedeeming(false);
      }, 5000);
    } catch (err) {
      console.error('Error redeeming reward:', err);
      setError(err.message || 'Failed to redeem reward');
      setIsRedeeming(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={isRedeeming ? null : onClose} 
      maxWidth="xs" 
      fullWidth
      PaperProps={{ ref: dialogRef }}
    >
      {isSuccess && <Confetti width={windowDimensions.width} height={windowDimensions.height} recycle={false} numberOfPieces={200} />}
      
      <DialogTitle sx={{ pb: 1 }}>
        {isSuccess ? 'Congratulations!' : 'Redeem Reward'}
      </DialogTitle>
      
      <DialogContent>
        {isSuccess ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
            <Avatar
              sx={{
                bgcolor: 'success.main',
                width: 70,
                height: 70,
                mb: 2
              }}
            >
              <CheckCircleIcon fontSize="large" />
            </Avatar>
            
            <Typography variant="h6" align="center" gutterBottom>
              You've redeemed: {reward?.name}
            </Typography>
            
            <Typography variant="body1" align="center" color="text.secondary">
              Your new balance: {userPoints - (reward?.pointCost || 0)} points
            </Typography>
            
            <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 2 }}>
              This window will close automatically...
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
            <Avatar
              sx={{
                bgcolor: 'error.main',
                width: 70,
                height: 70,
                mb: 2
              }}
            >
              <ErrorIcon fontSize="large" />
            </Avatar>
            
            <Typography variant="h6" align="center" gutterBottom>
              Something went wrong
            </Typography>
            
            <Typography variant="body2" align="center" color="error">
              {error}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 1 }}>
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                width: 60,
                height: 60,
                mb: 2
              }}
            >
              {reward?.icon ? (
                <Typography variant="h4" component="span">
                  {reward.icon}
                </Typography>
              ) : (
                <CardGiftcardIcon fontSize="large" />
              )}
            </Avatar>
            
            <Typography variant="h6" align="center" gutterBottom>
              {reward?.name}
            </Typography>
            
            {reward?.description && (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
                {reward.description}
              </Typography>
            )}
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              py: 1,
              px: 2,
              bgcolor: hasEnoughPoints ? 'success.light' : 'error.light',
              borderRadius: 2,
              mb: 2
            }}>
              <EmojiEventsIcon 
                fontSize="small" 
                sx={{ 
                  mr: 1, 
                  color: hasEnoughPoints ? 'success.dark' : 'error.dark' 
                }} 
              />
              <Typography 
                variant="body1" 
                color={hasEnoughPoints ? 'success.dark' : 'error.dark'}
                fontWeight="medium"
              >
                {hasEnoughPoints 
                  ? `You have ${userPoints} points (Cost: ${reward?.pointCost} points)` 
                  : `Not enough points! You have ${userPoints} points (Need: ${reward?.pointCost} points)`}
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" align="center">
              {hasEnoughPoints 
                ? "Are you sure you want to redeem this reward?" 
                : "You need more points to redeem this reward."}
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 3 }}>
        {isSuccess ? (
          <Button 
            onClick={onClose} 
            variant="outlined"
            fullWidth
          >
            Close
          </Button>
        ) : (
          <>
            <Button 
              onClick={onClose} 
              variant="outlined"
              sx={{ mr: 1 }}
              disabled={isRedeeming}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRedeem} 
              variant="contained" 
              color="primary"
              disabled={!hasEnoughPoints || isRedeeming || error}
              startIcon={isRedeeming && <CircularProgress size={20} color="inherit" />}
            >
              {isRedeeming ? 'Redeeming...' : 'Redeem Now'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

export default RedemptionDialog; 