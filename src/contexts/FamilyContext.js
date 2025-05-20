import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { familyService } from '../services/familyService';

const FamilyContext = createContext();

export function useFamily() {
  return useContext(FamilyContext);
}

export function FamilyProvider({ children }) {
  const { user } = useAuth();
  const [family, setFamily] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFamilyData = async () => {
    if (!user) {
      console.log("No user available for loading family data");
      setFamily(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    if (!user.familyId) {
      console.log("User has no family ID, clearing family context state");
      setFamily(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    try {
      console.log("Loading family data for familyId:", user.familyId);
      setLoading(true);
      setError(null);
      
      // Load family data
      const familyData = await familyService.getFamilyById(user.familyId);
      if (!familyData) {
        console.warn("No family found with ID:", user.familyId);
        setError("Your family could not be found");
        setFamily(null);
        setMembers([]);
        setLoading(false);
        return;
      }
      
      console.log("Family data loaded successfully:", familyData?.id);
      setFamily(familyData);
      
      // Load family members
      console.log("Loading family members for familyId:", user.familyId);
      const familyMembers = await familyService.getAllFamilyMembers(user.familyId);
      console.log("Family members loaded successfully:", familyMembers?.length || 0);
      setMembers(familyMembers || []);
    } catch (err) {
      console.error('Error loading family data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFamilyData();
  }, [user]);

  // Refresh family members
  const reloadMembers = async () => {
    if (!user?.familyId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const familyMembers = await familyService.getAllFamilyMembers(user.familyId);
      setMembers(familyMembers || []);
      
      return familyMembers;
    } catch (err) {
      console.error('Error reloading family members:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create or join family
  const createFamily = async (familyName) => {
    try {
      setLoading(true);
      const familyId = await familyService.createFamily(user.uid, familyName);
      await familyService.updateUserProfile(user.uid, { familyId });
      
      // Reload family data
      const familyData = await familyService.getFamilyById(familyId);
      setFamily(familyData);
      
      return familyId;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const joinFamily = async (inviteCode, userName = null) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!inviteCode || typeof inviteCode !== 'string') {
        throw new Error('Please enter a valid invite code');
      }
      
      const familyId = await familyService.acceptInvite(inviteCode, user.uid, userName);
      
      // Reload family data
      const familyData = await familyService.getFamilyById(familyId);
      setFamily(familyData);
      
      return familyId;
    } catch (err) {
      console.error('Error joining family:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const leaveFamily = async () => {
    try {
      setLoading(true);
      await familyService.removeMemberFromFamily(user.familyId, user.uid);
      await familyService.updateUserProfile(user.uid, { familyId: null });
      
      setFamily(null);
      setMembers([]);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Generate a family invitation
  const createFamilyInvite = async (email) => {
    try {
      const invite = await familyService.createInvite(user.familyId, email);
      return invite;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    family,
    members,
    loading,
    error,
    createFamily,
    joinFamily,
    leaveFamily,
    createFamilyInvite,
    reloadMembers
  };

  return (
    <FamilyContext.Provider value={value}>
      {children}
    </FamilyContext.Provider>
  );
} 