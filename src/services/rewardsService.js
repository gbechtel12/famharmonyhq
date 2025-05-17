import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  getDocs, 
  increment,
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebase';

export const rewardsService = {
  // Get all rewards for a family
  async getRewards(familyId) {
    try {
      const rewardsRef = collection(db, 'rewards');
      const q = query(rewardsRef, where('familyId', '==', familyId));
      const querySnapshot = await getDocs(q);
      
      const rewards = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // If no rewards found, return mock data
      if (rewards.length === 0) {
        return this._getMockRewards(familyId);
      }
      
      return rewards;
    } catch (error) {
      console.error('Error getting rewards:', error);
      // Return mock data instead of throwing an error
      return this._getMockRewards(familyId);
    }
  },

  // Create a new reward
  async createReward(rewardData) {
    try {
      const rewardsRef = collection(db, 'rewards');
      const docRef = await addDoc(rewardsRef, {
        ...rewardData,
        createdAt: new Date().toISOString()
      });
      return { id: docRef.id, ...rewardData };
    } catch (error) {
      console.error('Error creating reward:', error);
      throw error;
    }
  },

  // Update an existing reward
  async updateReward(rewardId, rewardData) {
    try {
      const rewardRef = doc(db, 'rewards', rewardId);
      await updateDoc(rewardRef, {
        ...rewardData,
        updatedAt: new Date().toISOString()
      });
      return { id: rewardId, ...rewardData };
    } catch (error) {
      console.error('Error updating reward:', error);
      throw error;
    }
  },

  // Delete a reward
  async deleteReward(rewardId) {
    try {
      const rewardRef = doc(db, 'rewards', rewardId);
      await deleteDoc(rewardRef);
      return rewardId;
    } catch (error) {
      console.error('Error deleting reward:', error);
      throw error;
    }
  },

  // Redeem a reward for a child
  async redeemReward(familyId, childId, rewardId, pointsCost) {
    try {
      // Update the child's points
      const familyRef = doc(db, 'families', familyId);
      const childRef = doc(familyRef, 'subUsers', childId);
      
      // Deduct points
      await updateDoc(childRef, {
        totalPoints: increment(-pointsCost)
      });
      
      // Add to redemption history
      const redemptionRef = collection(db, 'redemptions');
      await addDoc(redemptionRef, {
        familyId,
        childId,
        rewardId,
        pointsCost,
        redeemedAt: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error('Error redeeming reward:', error);
      throw error;
    }
  },

  // Get redemption history for a child
  async getRedemptionHistory(familyId, childId) {
    try {
      const redemptionsRef = collection(db, 'redemptions');
      const q = query(
        redemptionsRef, 
        where('familyId', '==', familyId),
        where('childId', '==', childId)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting redemption history:', error);
      throw error;
    }
  },
  
  // Mock rewards data for development
  _getMockRewards(familyId) {
    return [
      {
        id: 'reward1',
        name: 'Movie Night',
        description: 'Choose a movie for family movie night',
        pointCost: 100,
        familyId: familyId,
        assignedTo: 'child1', // Corresponds to Alex from family mock data
        createdAt: new Date().toISOString()
      },
      {
        id: 'reward2',
        name: 'Extra Screen Time',
        description: '30 minutes of extra screen time',
        pointCost: 50,
        familyId: familyId,
        assignedTo: 'child1',
        createdAt: new Date().toISOString()
      },
      {
        id: 'reward3',
        name: 'Choose Restaurant',
        description: 'Choose where to eat out this weekend',
        pointCost: 200,
        familyId: familyId,
        assignedTo: 'child2', // Corresponds to Taylor
        createdAt: new Date().toISOString()
      },
      {
        id: 'reward4',
        name: 'New Video Game',
        description: 'Get a new video game of your choice',
        pointCost: 500,
        familyId: familyId,
        createdAt: new Date().toISOString()
      }
    ];
  }
}; 