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
      
      // Try to get members from the subcollection directly
      const membersRef = collection(db, 'families', familyId, 'members');
      const memberDocs = await getDocs(membersRef);
      
      if (!memberDocs.empty) {
        // Return members from the subcollection
        return memberDocs.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
      
      // Fallback to the method that uses the members array in the family document
      const familyDoc = await this.getFamilyById(familyId);
      if (!familyDoc) {
        console.warn('Family document not found');
        return [];
      }

      if (!familyDoc.members || !Array.isArray(familyDoc.members)) {
        console.warn('Family document has no members array');
        return [];
      }

      const memberPromises = familyDoc.members.map(memberId => 
        userService.getUserProfile(memberId)
      );
      const members = await Promise.all(memberPromises);
      
      const validMembers = members.filter(member => member !== null);
      console.log(`Found ${validMembers.length} valid members out of ${members.length} total`);
      
      return validMembers;
    } catch (error) {
      console.error('Error getting family members:', error);
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
      
      const [familyMembers, subUsers] = await Promise.all([
        this.getFamilyMembers(familyId),
        this.getSubUsers(familyId)
      ]);

      const adultMembers = (familyMembers || []).map(member => ({
        id: member.id,
        name: member.displayName || member.email,
        email: member.email,
        type: 'adult',
        color: member.color || null
      }));

      const childMembers = (subUsers || []).map(child => ({
        id: child.id,
        name: child.name,
        type: 'child',
        color: child.color || null
      }));

      const allMembers = [...adultMembers, ...childMembers].sort((a, b) => 
        a.name.localeCompare(b.name)
      );
      
      console.log(`Successfully retrieved ${allMembers.length} family members (${adultMembers.length} adults, ${childMembers.length} children)`);
      
      return allMembers;
    } catch (error) {
      console.error('Error getting all family members:', error);
      throw error;
    }
  }
}; 