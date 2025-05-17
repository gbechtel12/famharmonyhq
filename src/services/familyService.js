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
      // Try to get members from the subcollection directly instead of relying on userService
      // which would require authentication
      const membersRef = collection(db, 'families', familyId, 'members');
      const memberDocs = await getDocs(membersRef);
      
      if (!memberDocs.empty) {
        // Return members from the subcollection
        return memberDocs.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      }
      
      // Fallback to the old method
      const familyDoc = await this.getFamilyById(familyId);
      if (!familyDoc) {
        // If no family is found, return mock data for development
        console.log('No family found, returning mock data');
        return this._getMockFamilyMembers();
      }

      const memberPromises = familyDoc.members.map(memberId => 
        userService.getUserProfile(memberId)
      );
      const members = await Promise.all(memberPromises);
      const validMembers = members.filter(member => member !== null);
      
      // If no valid members are found, return mock data
      if (validMembers.length === 0) {
        return this._getMockFamilyMembers();
      }
      
      return validMembers;
    } catch (error) {
      console.error('Error getting family members:', error);
      // Return mock data instead of throwing an error
      return this._getMockFamilyMembers();
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
  },

  // Mock data for development purposes
  _getMockFamilyMembers() {
    return [
      {
        id: 'parent1',
        name: 'Jennifer Smith',
        displayName: 'Jennifer Smith',
        email: 'jennifer@example.com',
        type: 'parent',
        gender: 'female',
        completedChores: 8,
        totalChores: 10,
        points: 320,
        streak: 5
      },
      {
        id: 'parent2',
        name: 'Michael Smith',
        displayName: 'Michael Smith',
        email: 'michael@example.com',
        type: 'parent',
        gender: 'male',
        completedChores: 6,
        totalChores: 8,
        points: 280,
        streak: 3
      },
      {
        id: 'child1',
        name: 'Alex Smith',
        displayName: 'Alex Smith',
        type: 'child',
        gender: 'male',
        completedChores: 5,
        totalChores: 7,
        points: 150,
        streak: 2
      },
      {
        id: 'child2',
        name: 'Taylor Smith',
        displayName: 'Taylor Smith',
        type: 'child',
        gender: 'female',
        completedChores: 4,
        totalChores: 6,
        points: 120,
        streak: 1
      }
    ];
  }
}; 