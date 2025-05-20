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
      const familyRef = doc(db, 'families', familyId);
      await updateDoc(familyRef, {
        members: arrayUnion(userId)
      });
    } catch (error) {
      console.error('Error adding member to family:', error);
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

  async createInvite(familyId, email) {
    try {
      // Check if the family exists
      const familyRef = doc(db, 'families', familyId);
      const familyDoc = await getDoc(familyRef);
      
      if (!familyDoc.exists()) {
        throw new Error('Family not found');
      }
      
      // Generate a random invite code
      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Create the invite document
      const inviteRef = doc(collection(db, 'familyInvites'));
      await setDoc(inviteRef, {
        familyId,
        email,
        code: inviteCode,
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days expiry
      });
      
      return {
        id: inviteRef.id,
        code: inviteCode,
        familyId,
        email
      };
    } catch (error) {
      console.error('Error creating family invite:', error);
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
  },

  async acceptInvite(inviteId, userId) {
    try {
      const inviteRef = doc(db, 'familyInvites', inviteId);
      const inviteDoc = await getDoc(inviteRef);
      
      if (!inviteDoc.exists()) {
        throw new Error('Invite not found');
      }

      const invite = inviteDoc.data();
      if (invite.status !== 'pending') {
        throw new Error('Invite is no longer valid');
      }

      await this.addMemberToFamily(invite.familyId, userId);
      await userService.updateFamilyId(userId, invite.familyId);
      await updateDoc(inviteRef, { status: 'accepted' });

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
  }
}; 