import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Typography,
  Button,
  Box,
  Grid,
  Alert,
  Tabs,
  Tab,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Stars as StarsIcon,
  RedeemOutlined as RedeemIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import Loader from '../components/common/Loader';
import { rewardsService } from '../services/rewardsService';
import { familyService } from '../services/familyService';
import RewardCard from '../components/rewards/RewardCard';
import RewardDialog from '../components/rewards/RewardDialog';
import RedemptionDialog from '../components/rewards/RedemptionDialog';

function RewardsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [rewardDialogOpen, setRewardDialogOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [redemptionDialogOpen, setRedemptionDialogOpen] = useState(false);
  const [redeemingReward, setRedeemingReward] = useState(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redemptionSuccess, setRedemptionSuccess] = useState(false);
  const [redemptionError, setRedemptionError] = useState(null);
  
  // Filter and sort functions
  const [filterCategory, setFilterCategory] = useState('');
  
  const filteredRewards = rewards
    .filter(reward => !filterCategory || reward.category === filterCategory)
    .sort((a, b) => a.pointsCost - b.pointsCost);
  
  // Load rewards and family data
  useEffect(() => {
    const loadData = async () => {
      if (!user?.familyId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Get rewards and children in parallel
        const [rewardsData, familyMembers] = await Promise.all([
          rewardsService.getRewards(user.familyId),
          familyService.getAllFamilyMembers(user.familyId)
        ]);
        
        setRewards(rewardsData);
        
        // Filter to just get children
        const childrenData = familyMembers.filter(member => member.type === 'child');
        setChildren(childrenData);
        
        // Set the first child as selected by default if available
        if (childrenData.length > 0 && !selectedChild) {
          setSelectedChild(childrenData[0]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading rewards data:', err);
        setError('Failed to load rewards data');
        setLoading(false);
      }
    };
    
    loadData();
  }, [user?.familyId, selectedChild]);
  
  // Handle tab change between parent and child views
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Child selection handler
  const handleChildChange = (e) => {
    const childId = e.target.value;
    const child = children.find(c => c.id === childId);
    setSelectedChild(child);
  };
  
  // Category filter handler
  const handleCategoryChange = (e) => {
    setFilterCategory(e.target.value);
  };
  
  // Get all unique categories
  const categories = ['', ...new Set(rewards.map(r => r.category).filter(Boolean))];
  
  // Handle adding/editing rewards
  const handleAddReward = () => {
    setSelectedReward(null);
    setRewardDialogOpen(true);
  };
  
  const handleEditReward = (reward) => {
    setSelectedReward(reward);
    setRewardDialogOpen(true);
  };
  
  const handleSaveReward = async (formData) => {
    try {
      if (selectedReward) {
        // Update existing reward
        await rewardsService.updateReward(selectedReward.id, {
          ...formData,
          familyId: user.familyId
        });
        setRewards(rewards.map(r => r.id === selectedReward.id ? { ...r, ...formData } : r));
      } else {
        // Create new reward
        const newReward = await rewardsService.createReward({
          ...formData,
          familyId: user.familyId,
          createdBy: user.uid
        });
        setRewards([...rewards, newReward]);
      }
    } catch (err) {
      console.error('Error saving reward:', err);
      setError('Failed to save reward');
    }
  };
  
  // Handle deleting rewards
  const handleDeleteReward = async (rewardId) => {
    if (window.confirm('Are you sure you want to delete this reward?')) {
      try {
        await rewardsService.deleteReward(rewardId);
        setRewards(rewards.filter(r => r.id !== rewardId));
      } catch (err) {
        console.error('Error deleting reward:', err);
        setError('Failed to delete reward');
      }
    }
  };
  
  // Handle redeeming rewards
  const handleRedeemReward = (reward) => {
    setRedeemingReward(reward);
    setRedemptionDialogOpen(true);
    setRedemptionSuccess(false);
    setRedemptionError(null);
  };
  
  const handleConfirmRedemption = async () => {
    if (!selectedChild || !redeemingReward) return;
    
    setIsRedeeming(true);
    setRedemptionError(null);
    
    try {
      await rewardsService.redeemReward(
        user.familyId,
        selectedChild.id,
        redeemingReward.id,
        redeemingReward.pointsCost
      );
      
      // Update the child's points
      const updatedChildren = children.map(child => {
        if (child.id === selectedChild.id) {
          return {
            ...child,
            totalPoints: (child.totalPoints || 0) - redeemingReward.pointsCost
          };
        }
        return child;
      });
      
      setChildren(updatedChildren);
      setSelectedChild({
        ...selectedChild,
        totalPoints: (selectedChild.totalPoints || 0) - redeemingReward.pointsCost
      });
      
      setRedemptionSuccess(true);
    } catch (err) {
      console.error('Error redeeming reward:', err);
      setRedemptionError('Failed to redeem reward. Please try again.');
    } finally {
      setIsRedeeming(false);
    }
  };
  
  if (loading) {
    return <Loader message="Loading rewards..." />;
  }
  
  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Rewards Store
        </Typography>
        
        {tabValue === 0 && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddReward}
          >
            Add Reward
          </Button>
        )}
        
        {tabValue === 1 && selectedChild && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <StarsIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6">
              {selectedChild.totalPoints || 0} points
            </Typography>
          </Box>
        )}
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        sx={{ mb: 3 }}
      >
        <Tab 
          label="Parent View" 
          icon={<RedeemIcon />} 
          iconPosition="start"
        />
        <Tab 
          label="Child View" 
          icon={<StarsIcon />} 
          iconPosition="start"
        />
      </Tabs>
      
      {tabValue === 1 && (
        <Box sx={{ mb: 3 }}>
          <FormControl sx={{ minWidth: 200, mb: 2 }}>
            <InputLabel>Select Child</InputLabel>
            <Select
              value={selectedChild?.id || ''}
              onChange={handleChildChange}
              label="Select Child"
            >
              {children.map(child => (
                <MenuItem key={child.id} value={child.id}>
                  {child.name} ({child.totalPoints || 0} points)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {selectedChild && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="body1" sx={{ mr: 1 }}>
                Available points:
              </Typography>
              <Chip 
                icon={<StarsIcon />}
                label={`${selectedChild.totalPoints || 0} points`}
                color="primary"
              />
            </Box>
          )}
        </Box>
      )}
      
      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Category</InputLabel>
          <Select
            value={filterCategory}
            onChange={handleCategoryChange}
            label="Filter by Category"
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories
              .filter(c => c) // Filter out empty string
              .map(category => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))
            }
          </Select>
        </FormControl>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {filteredRewards.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No rewards available. {tabValue === 0 ? 'Create some rewards to get started!' : 'Check back later for available rewards.'}
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredRewards.map(reward => (
            <Grid item xs={12} sm={6} md={4} key={reward.id}>
              <RewardCard
                reward={reward}
                onEdit={handleEditReward}
                onDelete={handleDeleteReward}
                onRedeem={handleRedeemReward}
                childPoints={selectedChild?.totalPoints || 0}
                isParent={tabValue === 0}
              />
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Dialog for adding/editing rewards */}
      <RewardDialog
        open={rewardDialogOpen}
        onClose={() => setRewardDialogOpen(false)}
        onSave={handleSaveReward}
        reward={selectedReward}
      />
      
      {/* Dialog for redeeming rewards */}
      <RedemptionDialog
        open={redemptionDialogOpen}
        onClose={() => setRedemptionDialogOpen(false)}
        reward={redeemingReward}
        onConfirm={handleConfirmRedemption}
        childPoints={selectedChild?.totalPoints || 0}
        isRedeeming={isRedeeming}
        isSuccess={redemptionSuccess}
        error={redemptionError}
      />
    </Paper>
  );
}

export default RewardsPage; 