import { 
  doc, 
  setDoc, 
  collection,
  addDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';

const FAMILY_ID = 'defaultFamily123';

export const sampleDataService = {
  async initializeSampleData() {
    try {
      // Check if sample data already exists
      const defaultFamilyRef = doc(db, 'defaultFamily', 'current');
      const defaultFamilyDoc = await getDoc(defaultFamilyRef);
      
      if (defaultFamilyDoc.exists()) {
        console.log('Sample data already initialized');
        return;
      }
      
      console.log('Initializing sample data...');
      
      // Set default family ID
      await setDoc(defaultFamilyRef, {
        familyId: FAMILY_ID
      });
      
      // Create sample family
      await setDoc(doc(db, 'families', FAMILY_ID), {
        name: 'Sample Family',
        createdAt: new Date().toISOString(),
        members: ['parent1', 'parent2']
      });
      
      // Create sample family members
      const familyMembers = [
        {
          id: 'parent1',
          name: 'Mom',
          displayName: 'Mom',
          type: 'parent',
          gender: 'female',
          completedChores: 22,
          totalChores: 25,
          points: 110,
          streak: 7
        },
        {
          id: 'parent2',
          name: 'Dad',
          displayName: 'Dad',
          type: 'parent',
          gender: 'male',
          completedChores: 18,
          totalChores: 22,
          points: 90,
          streak: 4
        },
        {
          id: 'child1',
          name: 'Emma',
          displayName: 'Emma',
          type: 'child',
          gender: 'female',
          completedChores: 15,
          totalChores: 20,
          points: 85,
          streak: 5
        },
        {
          id: 'child2',
          name: 'Alex',
          displayName: 'Alex',
          type: 'child',
          gender: 'male',
          completedChores: 12,
          totalChores: 18,
          points: 72,
          streak: 3
        }
      ];
      
      // Add family members to database
      for (const member of familyMembers) {
        const id = member.id;
        delete member.id;
        await setDoc(doc(db, 'families', FAMILY_ID, 'members', id), member);
      }
      
      // Create sample rewards
      const rewards = [
        {
          name: 'Ice Cream Trip',
          pointCost: 50,
          familyId: FAMILY_ID,
          createdAt: new Date().toISOString()
        },
        {
          name: 'Movie Night',
          pointCost: 100,
          familyId: FAMILY_ID,
          createdAt: new Date().toISOString()
        },
        {
          name: 'Video Game Time',
          pointCost: 60,
          familyId: FAMILY_ID,
          createdAt: new Date().toISOString()
        },
        {
          name: 'Sleepover',
          pointCost: 120,
          familyId: FAMILY_ID,
          createdAt: new Date().toISOString()
        }
      ];
      
      for (const reward of rewards) {
        await addDoc(collection(db, 'rewards'), reward);
      }
      
      // Create sample chores
      const chores = [
        {
          name: 'Take out trash',
          assignedTo: 'Alex',
          familyId: FAMILY_ID,
          frequency: 'daily',
          completed: false,
          dueTime: '19:00'
        },
        {
          name: 'Help with dishes',
          assignedTo: 'Emma',
          familyId: FAMILY_ID,
          frequency: 'daily',
          completed: true,
          dueTime: '19:30'
        },
        {
          name: 'Clean room',
          assignedTo: 'Alex',
          familyId: FAMILY_ID,
          frequency: 'weekly',
          dayOfWeek: 'saturday',
          completed: false,
          dueTime: '12:00'
        }
      ];
      
      for (const chore of chores) {
        await addDoc(collection(db, 'chores'), chore);
      }
      
      // Create sample meal plan
      const today = new Date();
      const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const weekId = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
      
      // Create meal plan
      await setDoc(doc(db, 'mealPlans', FAMILY_ID, 'weeks', weekId), {
        startDate: today,
        endDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
        [dayOfWeek]: {
          breakfast: {
            title: 'Oatmeal with Berries',
            prepTime: '10 min',
            cookTime: '5 min',
            description: 'Hearty oatmeal with fresh berries and a drizzle of honey.',
            notes: 'Emma prefers extra berries'
          },
          lunch: {
            title: 'Turkey Sandwiches',
            prepTime: '15 min',
            cookTime: '0 min',
            description: 'Turkey and cheese sandwiches with lettuce and tomato.',
            notes: 'Alex needs gluten-free bread'
          },
          dinner: {
            title: 'Spaghetti Bolognese',
            prepTime: '20 min',
            cookTime: '30 min',
            description: 'Classic spaghetti with homemade meat sauce.',
            notes: 'Make extra for leftovers'
          },
          snack: {
            title: 'Fruit & Yogurt',
            prepTime: '5 min',
            cookTime: '0 min',
            description: 'Fresh fruit with Greek yogurt for after-school snack.',
            notes: ''
          }
        }
      });
      
      console.log('Sample data initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing sample data:', error);
      return false;
    }
  }
}; 