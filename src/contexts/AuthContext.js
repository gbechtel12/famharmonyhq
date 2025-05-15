import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { auth } from '../firebase';
import { userService } from '../services/userService';

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
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              familyId: null // Initially no family
            });
            userProfile = await userService.getUserProfile(currentUser.uid);
          }

          // Merge auth user with profile data
          setUser({
            ...currentUser,
            familyId: userProfile.familyId,
            // Add any other profile fields you need
          });
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

  const value = {
    user,
    loading,
    authError,
    signInWithEmail,
    signInWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 