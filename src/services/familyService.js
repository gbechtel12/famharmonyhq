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
  where
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
      console.log(`Adding user ${userId} to family ${familyId}`);
      
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
        console.log(`User ${userId} is already a member of family ${familyId}`);
        return; // Already a member, no action needed
      }
      
      // Add the user to the members array
      console.log(`Updating family ${familyId} to add member ${userId}`);
      await updateDoc(familyRef, {
        members: arrayUnion(userId),
        updatedAt: new Date().toISOString()
      });
      
      console.log(`Successfully added user ${userId} to family ${familyId}`);
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
      
      console.log('Created invite with direct path:', inviteCode);
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
        console.log('Found invite by direct lookup:', code);
        return { id: directInviteDoc.id, ...inviteData, collection: 'invites' };
      }
      
      // Next, query the invites collection where code is a field
      const invitesRef = collection(db, 'invites');
      const invitesQuery = query(invitesRef, where('code', '==', code));
      const querySnapshot = await getDocs(invitesQuery);
      
      if (!querySnapshot.empty) {
        const invite = querySnapshot.docs[0];
        console.log('Found invite by code field in invites collection:', code);
        return { id: invite.id, ...invite.data(), collection: 'invites' };
      }
      
      // Finally, try the familyInvites collection (for backward compatibility)
      const familyInvitesRef = collection(db, 'familyInvites');
      const familyInvitesQuery = query(familyInvitesRef, where('code', '==', code));
      const familyQuerySnapshot = await getDocs(familyInvitesQuery);
      
      if (!familyQuerySnapshot.empty) {
        const invite = familyQuerySnapshot.docs[0];
        console.log('Found invite by code field in familyInvites collection:', code);
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
      console.log(`User ${userId} attempting to accept invite with code: ${inviteCodeOrId}`);
      
      // Try to find the invite
      let invite;
      
      try {
        // First, try to find by code
        invite = await this.findInviteByCode(inviteCodeOrId);
        console.log('Found invite:', invite);
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

      // Important: First add the user's UID to the family members array
      // This establishes the relationship needed for subsequent operations
      console.log(`Adding user ${userId} to family members array for family ${invite.familyId}`);
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
      
      console.log(`Updating user profile for ${userId} with family data:`, userData);
      await userService.updateUserProfile(userId, userData);
      
      // Mark the invite as accepted
      const collectionPath = invite.collection || 'invites';
      const inviteRef = doc(db, collectionPath, invite.id);
      
      console.log(`Marking invite ${invite.id} as accepted by user ${userId}`);
      const updateData = { 
        status: 'accepted',
        acceptedBy: userId,
        acceptedAt: new Date().toISOString() 
      };
      
      await updateDoc(inviteRef, updateData);

      console.log(`User ${userId} successfully joined family ${invite.familyId} with invite code ${inviteCodeOrId}`);
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
      console.log('Getting all family members for family:', familyId);
      
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
          color: member.color || null
        }));

      const childMembers = familyMembers
        .filter(member => member.type === 'child' || member.role === 'child')
        .map(child => ({
          id: child.id,
          name: child.name,
          birthYear: child.birthYear,
          type: 'child',
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
          color: child.color || null
        }));

      const allMembers = [...adultMembers, ...childMembers, ...additionalChildren].sort((a, b) => 
        a.name.localeCompare(b.name)
      );
      
      console.log(`Successfully retrieved ${allMembers.length} family members (${adultMembers.length} adults, ${childMembers.length + additionalChildren.length} children)`);
      
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
      console.log('Getting family members for family:', familyId);
      
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
          type: 'adult'
        }));
      
      // Check for duplicates - if a user exists in both the members subcollection
      // and the users collection, prefer the one from the members subcollection
      const adultMemberIds = new Set(validAdultMembers.map(m => m.id));
      const membersCollectionIds = new Set(membersFromCollection.map(m => m.id));
      
      // Only include adult members that don't already exist in the members subcollection
      const uniqueAdultMembers = validAdultMembers.filter(m => !membersCollectionIds.has(m.id));
      
      // Combine both sets of members
      const allMembers = [...membersFromCollection, ...uniqueAdultMembers];
      
      console.log(`Found ${allMembers.length} family members`);
      
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
      console.log(`Added child ${childData.name} to family ${familyId}`);
      return { id: docRef.id, ...childDoc };
    } catch (error) {
      console.error('Error adding child to family:', error);
      throw error;
    }
  }
}; 