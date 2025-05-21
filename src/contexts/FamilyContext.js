import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { familyService } from '../services/familyService';
import { userService } from '../services/userService';

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
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Reference to the members unsubscribe function for cleanup
  const membersUnsubscribeRef = React.useRef(null);

  const loadFamilyData = async () => {
    if (!user) {
      setFamily(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    if (!user.familyId) {
      setFamily(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    try {
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
      
      setFamily(familyData);
      
      // Set up real-time listener for family members
      setupMembersListener(user.familyId);
    } catch (err) {
      console.error('Error loading family data:', err);
      setError(err.message);
      setLoading(false);
    }
  };
  
  // Setup real-time listener for family members
  const setupMembersListener = (familyId) => {
    // Clean up previous listener if it exists
    if (membersUnsubscribeRef.current && typeof membersUnsubscribeRef.current === 'function') {
      try {
        membersUnsubscribeRef.current();
      } catch (e) {
        console.error('Error unsubscribing from previous listener:', e);
      }
      membersUnsubscribeRef.current = null;
    }
    
    if (!familyId) return;
    
    try {
      // Set up new listener
      const unsubscribe = familyService.getFamilyMembersRealtime(familyId, (familyMembers) => {
        setMembers(familyMembers || []);
        setLoading(false);
      });
      
      // Store the unsubscribe function for cleanup
      if (unsubscribe && typeof unsubscribe === 'function') {
        membersUnsubscribeRef.current = unsubscribe;
      }
    } catch (err) {
      console.error('Error setting up real-time members listener:', err);
      setError(err.message);
      setLoading(false);
    }
  };
  
  // Clean up listeners on unmount or family ID change
  useEffect(() => {
    return () => {
      if (membersUnsubscribeRef.current && typeof membersUnsubscribeRef.current === 'function') {
        try {
          membersUnsubscribeRef.current();
        } catch (e) {
          console.error('Error unsubscribing in cleanup:', e);
        }
        membersUnsubscribeRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    loadFamilyData();
    
    // Clean up on familyId change
    return () => {
      if (membersUnsubscribeRef.current && typeof membersUnsubscribeRef.current === 'function') {
        try {
          membersUnsubscribeRef.current();
        } catch (e) {
          console.error('Error unsubscribing in user change cleanup:', e);
        }
        membersUnsubscribeRef.current = null;
      }
    };
  }, [user]);

  // Refresh family members manually if needed
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
      await userService.updateUserProfile(user.uid, { familyId });
      
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
      
      // First try to find the invite to check if it's valid
      const familyId = await familyService.acceptInvite(inviteCode, user.uid, userName);
      
      // Update the user context to include the new familyId
      user.familyId = familyId;
      
      // Reload family data
      const familyData = await familyService.getFamilyById(familyId);
      setFamily(familyData);
      
      // Set up real-time listener for family members
      setupMembersListener(familyId);
      
      return familyId;
    } catch (err) {
      console.error('Error joining family:', err);
      setError(err.message || 'Failed to join family. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const leaveFamily = async () => {
    try {
      setLoading(true);
      await familyService.removeMemberFromFamily(user.familyId, user.uid);
      await userService.updateUserProfile(user.uid, { familyId: null });
      
      setFamily(null);
      setMembers([]);
      
      // Clean up real-time listener
      if (membersUnsubscribeRef.current && typeof membersUnsubscribeRef.current === 'function') {
        try {
          membersUnsubscribeRef.current();
        } catch (e) {
          console.error('Error unsubscribing in leave family:', e);
        }
        membersUnsubscribeRef.current = null;
      }
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
  
  // Update a member's role
  const updateMemberRole = async (memberId, newRole) => {
    if (!user?.familyId || !memberId || !newRole) {
      throw new Error('Missing required parameters');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      await familyService.updateMemberRole(user.familyId, memberId, newRole);
      
      // No need to manually reload members since we have a real-time listener
      
      return true;
    } catch (err) {
      console.error('Error updating member role:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a family member
  const deleteFamilyMember = async (memberId) => {
    if (!user?.familyId || !memberId) {
      throw new Error('Missing required parameters');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await familyService.deleteFamilyMember(user.familyId, memberId);
      
      // No need to manually reload members since we have a real-time listener
      
      return result;
    } catch (err) {
      console.error('Error deleting family member:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Get filtered members list
  const getFilteredMembers = (filter) => {
    if (!members || members.length === 0) return [];
    
    if (!filter) return members;
    
    // Filter members by type, role, etc.
    if (filter.role) {
      return members.filter(member => member.role === filter.role);
    }
    
    if (filter.type) {
      return members.filter(member => member.type === filter.type);
    }
    
    return members;
  };

  // Synchronize all users with this familyId to ensure they appear in the members list
  const syncFamilyMembers = async () => {
    if (!user?.familyId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await familyService.syncFamilyMembers(user.familyId);
      
      // Reload members
      await reloadMembers();
      
      setSuccessMessage('Family members synchronized successfully');
      return true;
    } catch (err) {
      console.error('Error synchronizing family members:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Manually add a member
  const manuallyAddMember = async (userData) => {
    if (!user?.familyId) return;
    
    try {
      setLoading(true);
      setError(null);
    
      await familyService.manuallyAddFamilyMember(user.familyId, userData);
      
      // Reload members
      await reloadMembers();
      
      setSuccessMessage('Family member manually added successfully');
      return true;
    } catch (err) {
      console.error('Error manually adding family member:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
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
    reloadMembers,
    updateMemberRole,
    deleteFamilyMember,
    getFilteredMembers,
    syncFamilyMembers,
    manuallyAddMember
  };

  return (
    <FamilyContext.Provider value={value}>
      {children}
    </FamilyContext.Provider>
  );
} 