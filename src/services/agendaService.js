import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { format, startOfDay, endOfDay, parseISO, isSameDay } from 'date-fns';

// Helper to get start/end of day in Firestore Timestamp format
const getDayBoundaries = (date) => {
  const startDate = startOfDay(date);
  const endDate = endOfDay(date);
  return {
    start: Timestamp.fromDate(startDate),
    end: Timestamp.fromDate(endDate)
  };
};

export const agendaService = {
  // Get all agenda items for a specific day
  async getDailyAgenda(familyId, date = new Date()) {
    if (!familyId) {
      throw new Error('Family ID is required');
    }

    try {
      // Get day boundaries
      const dayBoundary = getDayBoundaries(date);
      const dayId = format(date, 'EEEE').toLowerCase(); // Get day of week for meal plans
      
      // Parallelize data fetching with Promise.all
      // Use Promise.allSettled to ensure all promises complete even if some fail
      const results = await Promise.allSettled([
        this.getCalendarEvents(familyId, dayBoundary),
        this.getChores(familyId, date),
        this.getMeals(familyId, dayId)
      ]);
      
      // Extract successful results or empty arrays for failed promises
      const [eventsResult, choresResult, mealsResult] = results;
      
      const events = eventsResult.status === 'fulfilled' ? eventsResult.value : [];
      const chores = choresResult.status === 'fulfilled' ? choresResult.value : [];
      const meals = mealsResult.status === 'fulfilled' ? mealsResult.value : [];
      
      // Log any failures
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const sources = ['events', 'chores', 'meals'];
          console.error(`Failed to fetch ${sources[index]}:`, result.reason);
        }
      });
      
      // Combine and sort all items
      const agendaItems = [
        ...events.map(event => ({ ...event, type: 'event' })),
        ...chores.map(chore => ({ ...chore, type: 'chore' })),
        ...meals.map(meal => ({ ...meal, type: 'meal' }))
      ];
      
      // Sort by time (events with start time first, then meals by mealType, then chores)
      agendaItems.sort((a, b) => {
        // Events with start time come first sorted by time
        if (a.type === 'event' && b.type === 'event') {
          return a.startTime?.seconds - b.startTime?.seconds;
        }
        // Meals sorted by meal type (breakfast, lunch, dinner)
        if (a.type === 'meal' && b.type === 'meal') {
          const mealOrder = { breakfast: 1, lunch: 2, dinner: 3, snack: 4 };
          return mealOrder[a.mealType] - mealOrder[b.mealType];
        }
        // Put events first, then meals, then chores
        if (a.type !== b.type) {
          const typeOrder = { event: 1, meal: 2, chore: 3 };
          return typeOrder[a.type] - typeOrder[b.type];
        }
        // Default sorting
        return 0;
      });
      
      if (agendaItems.length === 0) {
        // If no real data is found, return mock data for development
        return this._getMockAgenda();
      }
      
      return agendaItems;
    } catch (error) {
      console.error('Error getting daily agenda:', error);
      // Return mock data for development instead of throwing an error
      return this._getMockAgenda();
    }
  },
  
  // Get calendar events for the family
  async getCalendarEvents(familyId, dayBoundary) {
    try {
      // Query family events
      const eventsRef = collection(db, 'familyEvents', familyId, 'events');
      const q = query(
        eventsRef,
        where('startTime', '>=', dayBoundary.start),
        where('startTime', '<=', dayBoundary.end)
      );
      
      const eventDocs = await getDocs(q);
      const events = eventDocs.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isAllDay: doc.data().isAllDay || false
      }));
      
      return events;
    } catch (error) {
      console.error('Error getting calendar events:', error);
      return [];
    }
  },
  
  // Get chores for the family
  async getChores(familyId, date) {
    try {
      // Get chores for the family
      const choresRef = collection(db, 'chores');
      const q = query(choresRef, where('familyId', '==', familyId));
      const choreDocs = await getDocs(q);
      
      const today = format(date, 'yyyy-MM-dd');
      
      // Filter chores based on frequency and due date
      const chores = choreDocs.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(chore => {
          // Check if chore is due based on frequency and due date
          let dueDate = null;
          
          // Safely handle different types of dueDate
          if (chore.dueDate) {
            if (typeof chore.dueDate.toDate === 'function') {
              // It's a Firestore Timestamp
              dueDate = chore.dueDate.toDate();
            } else if (chore.dueDate instanceof Date) {
              // It's already a Date object
              dueDate = chore.dueDate;
            } else if (typeof chore.dueDate === 'string') {
              // It's a date string - try to parse it
              try {
                dueDate = new Date(chore.dueDate);
              } catch (e) {
                console.warn('Invalid date string in chore dueDate:', chore.dueDate);
              }
            }
          }
          
          // Daily chores
          if (chore.frequency === 'daily') {
            return true;
          }
          
          // Weekly chores - check if today is the due day
          if (chore.frequency === 'weekly') {
            const dueDay = chore.dayOfWeek?.toLowerCase();
            return dueDay === format(date, 'EEEE').toLowerCase();
          }
          
          // Monthly chores - check if today is the due date
          if (chore.frequency === 'monthly' && dueDate) {
            return format(dueDate, 'yyyy-MM-dd') === today;
          }
          
          // One-time chores - check if today is the due date
          if (chore.frequency === 'once' && dueDate) {
            return format(dueDate, 'yyyy-MM-dd') === today;
          }
          
          return false;
        });
      
      return chores;
    } catch (error) {
      console.error('Error getting chores:', error);
      return [];
    }
  },
  
  // Get meals for the day
  async getMeals(familyId, dayId) {
    try {
      // Get the current week's meal plan
      const weekRange = this.getCurrentWeekRange();
      const weekDocRef = doc(db, 'mealPlans', familyId, 'weeks', weekRange.weekId);
      const weekDoc = await getDoc(weekDocRef);
      
      if (!weekDoc.exists() || !weekDoc.data()[dayId]) {
        return [];
      }
      
      // Get meals for this day
      const dayMeals = weekDoc.data()[dayId];
      
      // Make sure we have an object
      if (!dayMeals || typeof dayMeals !== 'object') {
        console.warn(`Invalid meal data for day ${dayId}`);
        return [];
      }
      
      // Convert to array with meal type
      return Object.entries(dayMeals)
        .filter(([_, meal]) => meal && typeof meal === 'object') // Filter out invalid meals
        .map(([mealType, meal]) => ({
          ...meal,
          mealType,
          timeSlot: this.getMealTimeSlot(mealType)
        }));
    } catch (error) {
      console.error('Error getting meals:', error);
      return [];
    }
  },
  
  // Helper to get the current week range (copied from mealService)
  getCurrentWeekRange() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday, 6 is Saturday
    
    // Calculate the date of this week's Sunday
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - dayOfWeek);
    sunday.setHours(0, 0, 0, 0);
    
    // Calculate the date of this week's Saturday
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    saturday.setHours(23, 59, 59, 999);
    
    return { 
      start: sunday, 
      end: saturday,
      startTimestamp: Timestamp.fromDate(sunday),
      endTimestamp: Timestamp.fromDate(saturday),
      weekId: `${sunday.getFullYear()}-${sunday.getMonth() + 1}-${sunday.getDate()}`
    };
  },
  
  // Helper to get approximate time for meal types
  getMealTimeSlot(mealType) {
    switch (mealType) {
      case 'breakfast':
        return { hour: 7, minute: 0 };
      case 'lunch':
        return { hour: 12, minute: 0 };
      case 'dinner':
        return { hour: 18, minute: 0 };
      case 'snack':
        return { hour: 15, minute: 0 };
      default:
        return { hour: 12, minute: 0 };
    }
  },
  
  // Mock data for development purposes
  _getMockAgenda() {
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    
    return [
      {
        id: 'event-1',
        title: 'Family Breakfast',
        startTime: {
          toDate: () => new Date(today + 'T08:00:00'),
          seconds: new Date(today + 'T08:00:00').getTime() / 1000
        },
        type: 'event',
        time: '08:00'
      },
      {
        id: 'event-2',
        title: 'Doctor Appointment',
        startTime: {
          toDate: () => new Date(today + 'T10:30:00'),
          seconds: new Date(today + 'T10:30:00').getTime() / 1000
        },
        type: 'event',
        time: '10:30'
      },
      {
        id: 'meal-1',
        title: 'Grilled Chicken Salad',
        mealType: 'lunch',
        type: 'meal',
        time: '12:00'
      },
      {
        id: 'chore-1',
        name: 'Clean Kitchen',
        assignedTo: 'Alex',
        dueTime: '14:00',
        completed: false,
        type: 'chore'
      },
      {
        id: 'chore-2',
        name: 'Take out Trash',
        assignedTo: 'Taylor',
        dueTime: '16:00',
        completed: true,
        type: 'chore'
      },
      {
        id: 'meal-2',
        title: 'Pasta with Meatballs',
        mealType: 'dinner',
        type: 'meal',
        time: '18:00'
      },
      {
        id: 'event-3',
        title: 'Family Game Night',
        startTime: {
          toDate: () => new Date(today + 'T19:30:00'),
          seconds: new Date(today + 'T19:30:00').getTime() / 1000
        },
        type: 'event',
        time: '19:30'
      }
    ];
  }
}; 