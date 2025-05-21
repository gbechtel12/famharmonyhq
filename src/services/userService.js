import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { getAuth } from 'firebase/auth';

export const userService = {
  async createUserProfile(userId, data) {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  },

  async updateUserProfile(userId, data) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  async getUserProfile(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  },

  async updateFamilyId(userId, familyId) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        familyId,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating family ID:', error);
      throw error;
    }
  },
  
  async getUsersWithFamilyId(familyId) {
    try {
      const usersRef = collection(db, 'users');
      
      // First ensure we can read the users collection at all
      try {
        // Create a query with the familyId filter
        const q = query(usersRef, where('familyId', '==', familyId));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          return [];
        }
        
        const users = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        return users;
      } catch (queryError) {
        console.error('Error querying users by familyId:', queryError);
        
        // Fallback: Try to get just the current user
        // This might be all we have permission for
        const auth = getAuth();
        const currentUser = auth.currentUser;
        
        if (currentUser) {
          const userDoc = await this.getUserProfile(currentUser.uid);
          if (userDoc && userDoc.familyId === familyId) {
            return [userDoc];
          }
        }
        
        // If we still don't have results, throw the original error
        throw queryError;
      }
    } catch (error) {
      console.error('Error getting users with familyId:', error);
      throw error;
    }
  }
}; 