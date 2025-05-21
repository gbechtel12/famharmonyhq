import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { auth } from '../firebase';
import { userService } from '../services/userService';
import { familyService } from '../services/familyService';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const handleUser = async (currentUser) => {
      if (currentUser) {
        try {
          
          // Get or create user profile
          let userProfile = await userService.getUserProfile(currentUser.uid);
          
          if (!userProfile) {
            // Create new user profile if it doesn't exist
            await userService.createUserProfile(currentUser.uid, {
              email: currentUser.email,
              displayName: currentUser.displayName || currentUser.email.split('@')[0],
              photoURL: currentUser.photoURL,
              familyId: null, // Initially no family
              role: 'member' // Default role
            });
            userProfile = await userService.getUserProfile(currentUser.uid);
          }
          
          // If user has a familyId, ensure they have a corresponding member document
          if (userProfile?.familyId) {
            try {
              await familyService.ensureMemberInCollection(
                userProfile.familyId, 
                currentUser.uid,
                userProfile
              );
            } catch (memberError) {
              console.error("Error ensuring member document:", memberError);
              // Non-blocking error - we'll continue with auth
            }
          }
          
          // Merge auth user with profile data
          const userWithProfile = {
            ...currentUser,
            familyId: userProfile?.familyId || null,
            displayName: userProfile?.displayName || currentUser.displayName || currentUser.email.split('@')[0],
            color: userProfile?.color || null,
            role: userProfile?.role || 'member',
            // Add any other profile fields you need
          };
          
          setUser(userWithProfile);
        } catch (error) {
          console.error('Error setting up user profile:', error);
          setAuthError(error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    return onAuthStateChanged(auth, handleUser);
  }, []);

  const signInWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      console.error("Email sign-in error:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email, password, displayName) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile
      await userService.createUserProfile(result.user.uid, {
        email,
        displayName: displayName || email.split('@')[0],
        photoURL: null,
        familyId: null
      });
      
      return result;
    } catch (error) {
      console.error("Email sign-up error:", error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result;
    } catch (error) {
      console.error("Google sign-in error:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const updateUserFamilyId = async (familyId) => {
    try {
      if (!user) throw new Error("User not authenticated");
      
      await userService.updateFamilyId(user.uid, familyId);
      
      // Update local user state
      setUser(prevUser => ({
        ...prevUser,
        familyId
      }));
      
      return true;
    } catch (error) {
      console.error("Error updating user family ID:", error);
      throw error;
    }
  };

  const updateUserProfile = async (profileData) => {
    try {
      if (!user) throw new Error("User not authenticated");
      
      await userService.updateUserProfile(user.uid, profileData);
      
      // Update local user state
      setUser(prevUser => ({
        ...prevUser,
        ...profileData
      }));
      
      return true;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    authError,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    logout,
    updateUserFamilyId,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 