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
    if (!familyId) {
      throw new Error('Family ID is required');
    }
    
    try {
      // Use subcollection approach for better organization and security
      const rewardsRef = collection(db, 'families', familyId, 'rewards');
      const querySnapshot = await getDocs(rewardsRef);
      
      const rewards = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return rewards;
    } catch (error) {
      console.error('Error getting rewards:', error);
      throw error;
    }
  },

  // Create a new reward
  async createReward(familyId, rewardData) {
    if (!familyId) {
      throw new Error('Family ID is required');
    }
    
    try {
      // Use subcollection approach
      const rewardsRef = collection(db, 'families', familyId, 'rewards');
      const docRef = await addDoc(rewardsRef, {
        ...rewardData,
        familyId, // Still include familyId in document for consistency
        createdAt: new Date().toISOString()
      });
      return { id: docRef.id, ...rewardData };
    } catch (error) {
      console.error('Error creating reward:', error);
      throw error;
    }
  },

  // Update an existing reward
  async updateReward(familyId, rewardId, rewardData) {
    if (!familyId) {
      throw new Error('Family ID is required');
    }
    
    try {
      const rewardRef = doc(db, 'families', familyId, 'rewards', rewardId);
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
  async deleteReward(familyId, rewardId) {
    if (!familyId) {
      throw new Error('Family ID is required');
    }
    
    try {
      const rewardRef = doc(db, 'families', familyId, 'rewards', rewardId);
      await deleteDoc(rewardRef);
      return rewardId;
    } catch (error) {
      console.error('Error deleting reward:', error);
      throw error;
    }
  },

  // Redeem a reward for a child
  async redeemReward(familyId, childId, rewardId, pointsCost) {
    if (!familyId) {
      throw new Error('Family ID is required');
    }
    
    try {
      // Update the child's points
      const childRef = doc(db, 'families', familyId, 'subUsers', childId);
      
      // Deduct points
      await updateDoc(childRef, {
        totalPoints: increment(-pointsCost)
      });
      
      // Add to redemption history in family subcollection
      const redemptionRef = collection(db, 'families', familyId, 'redemptions');
      await addDoc(redemptionRef, {
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
    if (!familyId) {
      throw new Error('Family ID is required');
    }
    
    try {
      const redemptionsRef = collection(db, 'families', familyId, 'redemptions');
      const q = query(
        redemptionsRef, 
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
  }
}; 