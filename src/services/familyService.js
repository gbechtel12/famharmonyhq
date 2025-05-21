import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  addDoc, 
  getDocs,
  query,
  where,
  serverTimestamp,
  onSnapshot,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { userService } from './userService';

export const familyService = {
  async createFamily(userId, familyName) {
    try {
      const familyRef = doc(collection(db, 'families'));
      await setDoc(familyRef, {
        name: familyName,
        createdBy: userId,
        members: [userId],
        createdAt: new Date().toISOString()
      });
      return familyRef.id;
    } catch (error) {
      console.error('Error creating family:', error);
      throw error;
    }
  },

  async addMemberToFamily(familyId, userId) {
    try {
      
      // First check if the family exists
      const familyRef = doc(db, 'families', familyId);
      const familyDoc = await getDoc(familyRef);
      
      if (!familyDoc.exists()) {
        console.error(`Family ${familyId} not found`);
        throw new Error('Family not found');
      }
      
      // Check if user is already in the members array to avoid duplicates
      const familyData = familyDoc.data();
      if (familyData.members && familyData.members.includes(userId)) {
      } else {
        // Add the user to the members array
        await updateDoc(familyRef, {
          members: arrayUnion(userId),
          updatedAt: serverTimestamp()
        });
      }
      
      // Ensure the user has a document in the members collection
      await this.ensureMemberInCollection(familyId, userId);
      
      return true;
    } catch (error) {
      console.error(`Error adding member ${userId} to family ${familyId}:`, error);
      throw error;
    }
  },

  async removeMemberFromFamily(familyId, userId) {
    try {
      const familyRef = doc(db, 'families', familyId);
      await updateDoc(familyRef, {
        members: arrayRemove(userId)
      });
    } catch (error) {
      console.error('Error removing member from family:', error);
      throw error;
    }
  },

  async getFamilyById(familyId) {
    try {
      const familyRef = doc(db, 'families', familyId);
      const familyDoc = await getDoc(familyRef);
      if (familyDoc.exists()) {
        return { id: familyDoc.id, ...familyDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting family:', error);
      throw error;
    }
  },

  async createInviteWithDirectPath(familyId, email) {
    try {
      // Check if the family exists
      const familyRef = doc(db, 'families', familyId);
      const familyDoc = await getDoc(familyRef);
      
      if (!familyDoc.exists()) {
        throw new Error('Family not found');
      }
      
      // Generate a random invite code
      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Create the invite document at /invites/{code}
      const inviteRef = doc(db, 'invites', inviteCode);
      const inviteData = {
        familyId,
        email,
        code: inviteCode, // Also storing the code inside for queries
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days expiry
      };
      
      await setDoc(inviteRef, inviteData);
      
      return {
        id: inviteCode,
        code: inviteCode,
        familyId,
        email,
        ...inviteData
      };
    } catch (error) {
      console.error('Error creating direct path invite:', error);
      throw error;
    }
  },

  async createInvite(familyId, email) {
    try {
      // Use the new direct path method
      return await this.createInviteWithDirectPath(familyId, email);
    } catch (error) {
      console.error('Error creating family invite:', error);
      throw error;
    }
  },

  async findInviteByCode(code) {
    try {
      if (!code || typeof code !== 'string') {
        throw new Error('Invalid invite code');
      }
      
      // First try direct lookup by code as document ID in /invites collection
      const directInviteRef = doc(db, 'invites', code);
      const directInviteDoc = await getDoc(directInviteRef);
      
      if (directInviteDoc.exists()) {
        const inviteData = directInviteDoc.data();
        return { id: directInviteDoc.id, ...inviteData, collection: 'invites' };
      }
      
      // Next, query the invites collection where code is a field
      const invitesRef = collection(db, 'invites');
      const invitesQuery = query(invitesRef, where('code', '==', code));
      const querySnapshot = await getDocs(invitesQuery);
      
      if (!querySnapshot.empty) {
        const invite = querySnapshot.docs[0];
        return { id: invite.id, ...invite.data(), collection: 'invites' };
      }
      
      // Finally, try the familyInvites collection (for backward compatibility)
      const familyInvitesRef = collection(db, 'familyInvites');
      const familyInvitesQuery = query(familyInvitesRef, where('code', '==', code));
      const familyQuerySnapshot = await getDocs(familyInvitesQuery);
      
      if (!familyQuerySnapshot.empty) {
        const invite = familyQuerySnapshot.docs[0];
        return { id: invite.id, ...invite.data(), collection: 'familyInvites' };
      }
      
      throw new Error('Invalid code');
    } catch (error) {
      console.error('Error finding invite by code:', error);
      throw error;
    }
  },

  isInviteValid(invite) {
    if (!invite) return false;
    
    // Check if the invite is pending
    if (invite.status !== 'pending') {
      return false;
    }
    
    // Check if the invite has expired
    if (invite.expiresAt) {
      const expiresAt = new Date(invite.expiresAt);
      const now = new Date();
      if (expiresAt < now) {
        return false;
      }
    }
    
    // Check if the invite has a valid family ID
    if (!invite.familyId) {
      return false;
    }
    
    return true;
  },

  async acceptInvite(inviteCodeOrId, userId, userName = null) {
    try {
      
      // Try to find the invite
      let invite;
      
      try {
        // First, try to find by code
        invite = await this.findInviteByCode(inviteCodeOrId);
      } catch (err) {
        console.error('Error finding invite by code:', err);
        throw new Error('Invalid code');
      }
      
      if (!invite) {
        throw new Error('Invite not found');
      }
      
      // Validate the invite
      if (!this.isInviteValid(invite)) {
        if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
          throw new Error('Invite code has expired');
        } else if (invite.status !== 'pending') {
          throw new Error('Invite is no longer valid');
        } else {
          throw new Error('Invalid invite');
        }
      }

      await this.addMemberToFamily(invite.familyId, userId);
      
      // Update user document with family ID and other info
      const userData = {
        familyId: invite.familyId,
        role: 'member',
        joinedAt: new Date().toISOString()
      };
      
      // Add name if provided
      if (userName) {
        userData.displayName = userName;
      }
      
      await userService.updateUserProfile(userId, userData);
      
      // Mark the invite as accepted
      const collectionPath = invite.collection || 'invites';
      const inviteRef = doc(db, collectionPath, invite.id);
      
      const updateData = { 
        status: 'accepted',
        acceptedBy: userId,
        acceptedAt: new Date().toISOString() 
      };
      
      await updateDoc(inviteRef, updateData);

      return invite.familyId;
    } catch (error) {
      console.error('Error accepting invite:', error);
      throw error;
    }
  },

  async addChildProfile(familyId, childData) {
    try {
      const subUsersRef = collection(db, 'families', familyId, 'subUsers');
      const newChild = {
        ...childData,
        role: 'child',
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(subUsersRef, newChild);
      return { id: docRef.id, ...newChild };
    } catch (error) {
      console.error('Error adding child profile:', error);
      throw error;
    }
  },

  async getSubUsers(familyId) {
    try {
      const subUsersRef = collection(db, 'families', familyId, 'subUsers');
      const subUserDocs = await getDocs(subUsersRef);
      
      if (subUserDocs.empty) {
        return [];
      }
      
      return subUserDocs.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting sub-users:', error);
      throw error;
    }
  },

  async getAllFamilyMembers(familyId) {
    if (!familyId) {
      console.error('Family ID is required for getAllFamilyMembers');
      throw new Error('Family ID is required');
    }

    try {
      
      // Get members from the members collection (including children)
      const familyMembers = await this.getFamilyMembers(familyId);
      
      // For backward compatibility, also get any children from subUsers collection
      // This can be removed once all children are migrated to the members collection
      const subUsers = await this.getSubUsers(familyId);

      // Separate adults and children from familyMembers
      const adultMembers = familyMembers
        .filter(member => member.type === 'adult')
        .map(member => ({
          id: member.id,
          name: member.displayName || member.email || member.name,
          email: member.email,
          type: 'adult',
          role: member.role || 'member',
          color: member.color || null
        }));

      const childMembers = familyMembers
        .filter(member => member.type === 'child' || member.role === 'child')
        .map(child => ({
          id: child.id,
          name: child.name,
          birthYear: child.birthYear,
          type: 'child',
          role: 'child',
          color: child.color || null
        }));

      // Get children from subUsers that aren't already in childMembers
      const childIds = new Set(childMembers.map(c => c.id));
      const additionalChildren = subUsers
        .filter(child => !childIds.has(child.id))
        .map(child => ({
          id: child.id,
          name: child.name,
          birthYear: child.birthYear,
          type: 'child',
          role: 'child',
          color: child.color || null
        }));

      const allMembers = [...adultMembers, ...childMembers, ...additionalChildren].sort((a, b) => 
        a.name.localeCompare(b.name)
      );
      
      
      return allMembers;
    } catch (error) {
      console.error('Error getting all family members:', error);
      throw error;
    }
  },

  async getFamilyMembers(familyId) {
    if (!familyId) {
      console.error('Family ID is required for getFamilyMembers');
      throw new Error('Family ID is required');
    }

    try {
      
      // Try to get members from the members subcollection directly
      const membersRef = collection(db, 'families', familyId, 'members');
      const memberDocs = await getDocs(membersRef);
      
      // Transform member documents to a consistent format
      const membersFromCollection = memberDocs.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Ensure type is set for consistent handling
        type: doc.data().type || (doc.data().role === 'child' ? 'child' : 'adult')
      }));
      
      // Fallback to the method that uses the members array in the family document
      // to get adult users from the users collection
      const familyDoc = await this.getFamilyById(familyId);
      if (!familyDoc) {
        console.warn('Family document not found');
        return membersFromCollection; // Return any members we found in the subcollection
      }

      if (!familyDoc.members || !Array.isArray(familyDoc.members)) {
        console.warn('Family document has no members array');
        return membersFromCollection; // Return any members we found in the subcollection
      }

      // Get adult members from users collection
      const memberPromises = familyDoc.members.map(memberId => 
        userService.getUserProfile(memberId)
      );
      const adultMembers = await Promise.all(memberPromises);
      
      const validAdultMembers = adultMembers
        .filter(member => member !== null)
        .map(member => ({
          ...member,
          type: 'adult',
          role: member.role || 'member'
        }));
      
      // Check for duplicates - if a user exists in both the members subcollection
      // and the users collection, prefer the one from the members subcollection
      const membersCollectionIds = new Set(membersFromCollection.map(m => m.id));
      
      // Only include adult members that don't already exist in the members subcollection
      const uniqueAdultMembers = validAdultMembers.filter(m => !membersCollectionIds.has(m.id));
      
      // For each unique adult member, ensure they have a member document
      for (const member of uniqueAdultMembers) {
        // This will create a member document if it doesn't exist
        await this.ensureMemberInCollection(familyId, member.id, member);
      }
      
      // Combine both sets of members
      const allMembers = [...membersFromCollection, ...uniqueAdultMembers];
      
      
      return allMembers;
    } catch (error) {
      console.error('Error getting family members:', error);
      throw error;
    }
  },

  async addChildToFamily(familyId, childData) {
    if (!familyId) {
      throw new Error('Family ID is required');
    }

    try {
      // Add child to the members subcollection
      const membersRef = collection(db, 'families', familyId, 'members');
      const childDoc = {
        ...childData,
        createdAt: new Date().toISOString(),
        role: 'child',
        type: 'child'
      };
      
      const docRef = await addDoc(membersRef, childDoc);
      return { id: docRef.id, ...childDoc };
    } catch (error) {
      console.error('Error adding child to family:', error);
      throw error;
    }
  },

  async ensureMemberInCollection(familyId, userId, userData) {
    if (!familyId || !userId) {
      console.error('Family ID and User ID are required for ensureMemberInCollection');
      throw new Error('Missing required parameters');
    }

    try {
      
      // First, check if member document already exists in the members collection
      const memberDocRef = doc(db, 'families', familyId, 'members', userId);
      const memberDoc = await getDoc(memberDocRef);
      
      // If member document doesn't exist, create it
      if (!memberDoc.exists()) {
        
        // Get user profile to populate member document
        let userProfile = userData;
        if (!userProfile) {
          userProfile = await userService.getUserProfile(userId);
        }
        
        if (!userProfile) {
          console.error(`Failed to get user profile for ${userId}`);
          throw new Error('User profile not found');
        }
        
        // Create member document with user data
        const memberData = {
          uid: userId,
          name: userProfile.displayName || userProfile.email?.split('@')[0] || 'Family Member',
          email: userProfile.email,
          role: userProfile.role || 'member',
          type: userProfile.role === 'child' ? 'child' : 'adult',
          joinedAt: userProfile.joinedAt || new Date().toISOString(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          color: userProfile.color || null
        };
        
        // Set the member document with the user's ID as the document ID
        await setDoc(memberDocRef, memberData);
        
        // If this is a new member, ensure they have the correct role in their user profile
        if (!userProfile.role || userProfile.role !== memberData.role) {
          await userService.updateUserProfile(userId, { 
            role: memberData.role,
            updatedAt: new Date().toISOString()
          });
        }
        
        return memberData;
      }
      
      return { id: userId, ...memberDoc.data() };
    } catch (error) {
      console.error(`Error ensuring member ${userId} in collection:`, error);
      throw error;
    }
  },

  async updateMemberRole(familyId, userId, newRole) {
    if (!familyId || !userId || !newRole) {
      throw new Error('Family ID, User ID, and Role are required');
    }

    try {
      
      // Update the member document
      const memberDocRef = doc(db, 'families', familyId, 'members', userId);
      const memberDoc = await getDoc(memberDocRef);
      
      if (!memberDoc.exists()) {
        throw new Error('Member not found in family');
      }
      
      // Calculate member type based on role
      const memberType = newRole === 'child' ? 'child' : 'adult';
      
      // Update member document
      await updateDoc(memberDocRef, {
        role: newRole,
        type: memberType,
        updatedAt: serverTimestamp()
      });
      
      // Also update the user profile with the new role
      await userService.updateUserProfile(userId, {
        role: newRole,
        updatedAt: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error(`Error updating member ${userId} role:`, error);
      throw error;
    }
  },

  async getFamilyMembersRealtime(familyId, callback) {
    if (!familyId) {
      console.error('Family ID is required for getFamilyMembersRealtime');
      throw new Error('Family ID is required');
    }

    try {
      
      // Set up listener for members subcollection
      const membersRef = collection(db, 'families', familyId, 'members');
      const unsubscribe = onSnapshot(membersRef, async (snapshot) => {
        try {
          // Transform member documents
          const membersFromCollection = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Ensure type is set for consistent handling
            type: doc.data().type || (doc.data().role === 'child' ? 'child' : 'adult'),
            // Mark source for debugging
            source: 'members_collection'
          }));
          
          // For backward compatibility, check subUsers collection for any child profiles
          const subUsersRef = collection(db, 'families', familyId, 'subUsers');
          const subUserDocs = await getDocs(subUsersRef);
          
          // Create a map of members by ID for deduplication
          const membersById = new Map();
          
          // First, add all members from the primary members collection
          // We prioritize the members collection over other sources
          membersFromCollection.forEach(member => {
            membersById.set(member.id, member);
          });
          
          // Also track members by name+birthYear for children to avoid duplicates
          const childrenByNameAndYear = new Map();
          membersFromCollection
            .filter(m => m.type === 'child')
            .forEach(child => {
              // Create a composite key using name and birth year to find duplicates
              if (child.name && child.birthYear) {
                const key = `${child.name.toLowerCase()}_${child.birthYear}`;
                childrenByNameAndYear.set(key, child.id);
              }
            });
          
          // Get the family document to check members array for adult members
          const familyDoc = await this.getFamilyById(familyId);
          if (!familyDoc || !familyDoc.members || !Array.isArray(familyDoc.members)) {
            // If family document doesn't exist or has no members array, use just the members subcollection
            callback(Array.from(membersById.values()));
            return;
          }
          
          // For backward compatibility, also get members from the users collection
          // that are in the family's members array but not in the members subcollection
          const memberIds = new Set(membersFromCollection.map(m => m.id));
          const missingMemberIds = familyDoc.members.filter(id => !memberIds.has(id));
          
          if (missingMemberIds.length > 0) {
            // Get the missing members from the users collection
            const missingMembers = await Promise.all(
              missingMemberIds.map(async (id) => {
                try {
                  const userProfile = await userService.getUserProfile(id);
                  if (userProfile) {
                    // Also create a member document for this user
                    await this.ensureMemberInCollection(familyId, id, userProfile);
                    return {
                      id,
                      ...userProfile,
                      type: 'adult',
                      source: 'users_collection'
                    };
                  }
                  return null;
                } catch (err) {
                  console.error(`Error getting user profile for ${id}:`, err);
                  return null;
                }
              })
            );
            
            // Add missing adult members to our map (after filtering out nulls)
            missingMembers
              .filter(Boolean)
              .forEach(member => {
                if (!membersById.has(member.id)) {
                  membersById.set(member.id, {
                    ...member,
                    name: member.displayName || member.email?.split('@')[0] || 'Family Member'
                  });
                }
              });
          }
          
          // Process any child entries from subUsers collection
          if (!subUserDocs.empty) {
            subUserDocs.docs.forEach(doc => {
              const childData = doc.data();
              
              // First check if this child already exists in the members collection by ID
              if (membersById.has(doc.id)) {
                return;
              }
              
              // Then check for duplicate based on name+birthYear
              if (childData.name && childData.birthYear) {
                const key = `${childData.name.toLowerCase()}_${childData.birthYear}`;
                if (childrenByNameAndYear.has(key)) {
                  const existingId = childrenByNameAndYear.get(key);
                  return;
                }
              }
              
              // If not a duplicate, add to the map
              membersById.set(doc.id, {
                id: doc.id,
                ...childData,
                type: 'child',
                role: 'child',
                source: 'subUsers_collection'
              });
              
              // Also add to name+birthYear map for future checks
              if (childData.name && childData.birthYear) {
                const key = `${childData.name.toLowerCase()}_${childData.birthYear}`;
                childrenByNameAndYear.set(key, doc.id);
              }
            });
          }
          
          // Convert map values to array and sort by name
          const dedupedMembers = Array.from(membersById.values())
            .sort((a, b) => {
              // First sort by type (adults first)
              if (a.type !== b.type) {
                return a.type === 'adult' ? -1 : 1;
              }
              // Then sort by name
              return (a.name || '').localeCompare(b.name || '');
            });
          
          callback(dedupedMembers);
        } catch (err) {
          console.error('Error in realtime members listener:', err);
          callback([]); // Return empty array on error
        }
      }, (error) => {
        console.error('Error in members snapshot listener:', error);
        callback([]); // Return empty array on error
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up realtime members listener:', error);
      throw error;
    }
  },

  async deleteFamilyMember(familyId, memberId) {
    if (!familyId || !memberId) {
      throw new Error('Family ID and Member ID are required');
    }

    try {
      
      // First get the member to check if it's a child
      const memberRef = doc(db, 'families', familyId, 'members', memberId);
      const memberDoc = await getDoc(memberRef);
      
      // Check if this is a members collection document
      if (memberDoc.exists()) {
        
        const memberData = memberDoc.data();
        const isChild = memberData.type === 'child' || memberData.role === 'child';
        
        // Delete the member document from the members collection
        await deleteDoc(memberRef);
        
        // If it's a child, also check if there's an entry in the subUsers collection
        if (isChild) {
          try {
            const subUserRef = doc(db, 'families', familyId, 'subUsers', memberId);
            const subUserDoc = await getDoc(subUserRef);
            
            if (subUserDoc.exists()) {
              await deleteDoc(subUserRef);
            }
          } catch (err) {
            console.warn(`Error checking/deleting subUser for ${memberId}:`, err);
            // Continue even if subUser deletion fails
          }
        }
        
        // If it's an adult user (not a child profile), remove them from the family's members array
        if (!isChild && memberData.uid) {
          const familyRef = doc(db, 'families', familyId);
          await updateDoc(familyRef, {
            members: arrayRemove(memberData.uid),
            updatedAt: serverTimestamp()
          });
          
          // Also update the user's profile to remove familyId if they're a real user
          try {
            const userDoc = await userService.getUserProfile(memberData.uid);
            if (userDoc && userDoc.familyId === familyId) {
              await userService.updateUserProfile(memberData.uid, { 
                familyId: null,
                updatedAt: new Date().toISOString()
              });
            }
          } catch (err) {
            console.warn(`Error updating user profile for ${memberData.uid}:`, err);
            // Continue even if profile update fails
          }
        }
        
        return true;
      } 
      
      // If member wasn't found in members collection, check if it's in the subUsers collection
      const subUserRef = doc(db, 'families', familyId, 'subUsers', memberId);
      const subUserDoc = await getDoc(subUserRef);
      
      if (subUserDoc.exists()) {
        // Delete from subUsers collection
        await deleteDoc(subUserRef);
        return true;
      }
      
      console.warn(`Member ${memberId} not found in either members or subUsers collections`);
      return false;
    } catch (error) {
      console.error(`Error deleting family member ${memberId}:`, error);
      throw error;
    }
  },

  async syncFamilyMembers(familyId) {
    if (!familyId) {
      console.error('Family ID is required for syncFamilyMembers');
      throw new Error('Family ID is required');
    }

    try {
      
      // Get the family document to check the current members array
      const familyDoc = await this.getFamilyById(familyId);
      if (!familyDoc) {
        throw new Error('Family not found');
      }
      
      // Try to get all users that have this familyId
      let usersToProcess = [];
      try {
        usersToProcess = await userService.getUsersWithFamilyId(familyId);
      } catch (err) {
        console.warn(`Error getting all users with familyId ${familyId}, using family.members array as fallback:`, err);
        
        // Fallback: Use the members array from the family document
        if (familyDoc.members && Array.isArray(familyDoc.members) && familyDoc.members.length > 0) {
          
          // Get user profiles from the members array
          const memberProfiles = await Promise.all(
            familyDoc.members.map(async memberId => {
              try {
                return await userService.getUserProfile(memberId);
              } catch (err) {
                console.warn(`Error getting profile for member ${memberId}:`, err);
                return null;
              }
            })
          );
          
          // Filter out nulls and add to users to process
          usersToProcess = memberProfiles.filter(Boolean);
        }
      }
      
      if (usersToProcess.length === 0) {
        console.warn('No users found to synchronize');
        return false;
      }
      
      // Ensure each user has a member document
      for (const user of usersToProcess) {
        await this.ensureMemberInCollection(familyId, user.id, user);
        
        // Also make sure they're in the members array of the family document
        if (!familyDoc.members || !familyDoc.members.includes(user.id)) {
          await this.addMemberToFamily(familyId, user.id);
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Error synchronizing family members for ${familyId}:`, error);
      throw error;
    }
  },

  async manuallyAddFamilyMember(familyId, userData) {
    if (!familyId || !userData) {
      throw new Error('Family ID and user data are required');
    }

    try {
      
      // 1. Create a member document in the members subcollection
      const membersRef = collection(db, 'families', familyId, 'members');
      const memberData = {
        name: userData.displayName || userData.name || userData.email?.split('@')[0] || 'Family Member',
        email: userData.email,
        role: userData.role || 'member',
        type: userData.role === 'child' ? 'child' : 'adult',
        joinedAt: userData.joinedAt || new Date().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        color: userData.color || null,
        source: 'manual_addition'
      };
      
      // If we have an ID, use it, otherwise create a new one
      let memberDocRef;
      if (userData.id) {
        memberDocRef = doc(membersRef, userData.id);
        await setDoc(memberDocRef, memberData);
      } else {
        const docRef = await addDoc(membersRef, memberData);
        memberDocRef = docRef;
      }
      
      // 2. If we have a userId, also make sure it's in the family's members array
      if (userData.id) {
        const familyRef = doc(db, 'families', familyId);
        await updateDoc(familyRef, {
          members: arrayUnion(userData.id),
          updatedAt: serverTimestamp()
        });
      }
      
      return true;
    } catch (error) {
      console.error(`Error manually adding family member to ${familyId}:`, error);
      throw error;
    }
  }
}; 