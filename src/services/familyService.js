import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  addDoc, 
  getDocs 
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

  async getFamilyMembers(familyId) {
    try {
      const familyDoc = await this.getFamilyById(familyId);
      if (!familyDoc) return [];

      const memberPromises = familyDoc.members.map(memberId => 
        userService.getUserProfile(memberId)
      );
      const members = await Promise.all(memberPromises);
      return members.filter(member => member !== null);
    } catch (error) {
      console.error('Error getting family members:', error);
      throw error;
    }
  },

  async inviteMember(familyId, email) {
    try {
      const inviteRef = doc(collection(db, 'familyInvites'));
      await setDoc(inviteRef, {
        familyId,
        email,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      return inviteRef.id;
    } catch (error) {
      console.error('Error creating invite:', error);
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
      const snapshot = await getDocs(subUsersRef);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting sub-users:', error);
      throw error;
    }
  },

  async getAllFamilyMembers(familyId) {
    try {
      const [familyMembers, subUsers] = await Promise.all([
        this.getFamilyMembers(familyId),
        this.getSubUsers(familyId)
      ]);

      const adultMembers = familyMembers.map(member => ({
        id: member.id,
        name: member.displayName || member.email,
        email: member.email,
        type: 'adult',
        color: member.color || null
      }));

      const childMembers = subUsers.map(child => ({
        id: child.id,
        name: child.name,
        type: 'child',
        color: child.color || null
      }));

      return [...adultMembers, ...childMembers].sort((a, b) => 
        a.name.localeCompare(b.name)
      );
    } catch (error) {
      console.error('Error getting all family members:', error);
      throw error;
    }
  }
}; 