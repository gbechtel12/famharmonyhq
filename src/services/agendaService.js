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
import { withErrorHandling } from '../utils/errorHandler';

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
      console.error('Family ID is required for getDailyAgenda');
      throw new Error('Family ID is required');
    }

    return withErrorHandling(
      async () => {
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
            // Handle both startTime and start field names
            const aTime = a.startTime?.seconds || a.start?.seconds || 0;
            const bTime = b.startTime?.seconds || b.start?.seconds || 0;
            return aTime - bTime;
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
        
        return agendaItems;
      },
      {
        context: 'daily-agenda',
        dataType: 'agenda',
        fallbackData: []
      }
    );
  },
  
  // Get calendar events for the family
  async getCalendarEvents(familyId, dayBoundary) {
    if (!familyId) {
      console.error('Family ID is required for getCalendarEvents');
      throw new Error('Family ID is required');
    }

    return withErrorHandling(
      async () => {
        // Query family events from subcollection
        const eventsRef = collection(db, 'families', familyId, 'events');
        
        // First, try to get events with 'start' field (from CalendarView)
        const startQuery = query(
          eventsRef,
          where('start', '>=', dayBoundary.start),
          where('start', '<=', dayBoundary.end)
        );
        
        const startEvents = await getDocs(startQuery);
        
        // Then, try to get events with 'startTime' field (for backward compatibility)
        const startTimeQuery = query(
          eventsRef,
          where('startTime', '>=', dayBoundary.start),
          where('startTime', '<=', dayBoundary.end)
        );
        
        const startTimeEvents = await getDocs(startTimeQuery);
        
        // Process both sets of events
        const events = [
          ...startEvents.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              // Normalize field names for consistent handling
              startTime: data.startTime || data.start,
              endTime: data.endTime || data.end,
              isAllDay: data.isAllDay || false
            };
          }),
          ...startTimeEvents.docs.map(doc => {
            const data = doc.data();
            if (startEvents.docs.some(e => e.id === doc.id)) {
              // Skip duplicates (already included in startEvents)
              return null;
            }
            return {
              id: doc.id,
              ...data,
              // Ensure both field names are available
              start: data.start || data.startTime,
              end: data.end || data.endTime,
              isAllDay: data.isAllDay || false
            };
          }).filter(Boolean)
        ];
        
        return events;
      },
      {
        context: 'calendar-events',
        dataType: 'events',
        fallbackData: []
      }
    );
  },
  
  // Get chores for the family
  async getChores(familyId, date) {
    if (!familyId) {
      console.error('Family ID is required for getChores');
      throw new Error('Family ID is required');
    }

    return withErrorHandling(
      async () => {
        // Get chores from family subcollection
        const choresRef = collection(db, 'families', familyId, 'chores');
        const choreDocs = await getDocs(choresRef);
        
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
      },
      {
        context: 'chores',
        dataType: 'chores',
        fallbackData: []
      }
    );
  },
  
  // Get meals for a day
  async getMeals(familyId, dayId) {
    if (!familyId) {
      console.error('Family ID is required for getMeals');
      throw new Error('Family ID is required');
    }

    return withErrorHandling(
      async () => {
        // Get the current meal plan
        const mealPlanRef = doc(db, 'families', familyId, 'mealPlans', 'current');
        const mealPlanDoc = await getDoc(mealPlanRef);
        
        if (!mealPlanDoc.exists()) {
          return [];
        }
        
        const mealPlan = mealPlanDoc.data();
        const dayMeals = mealPlan[dayId] || {};
        
        // Convert to array for consistent handling
        const meals = Object.entries(dayMeals)
          .filter(([mealType, meal]) => meal && typeof meal === 'object')
          .map(([mealType, meal]) => ({
            id: `${dayId}-${mealType}`,
            mealType,
            name: meal.name || '',
            recipe: meal.recipe || '',
            ingredients: meal.ingredients || []
          }));
        
        return meals;
      },
      {
        context: 'meals',
        dataType: 'meals',
        fallbackData: []
      }
    );
  },
  
  // Helper to get meal time for agenda sorting
  getMealTimeSlot(mealType) {
    const mealTimes = {
      breakfast: '08:00',
      lunch: '12:00',
      dinner: '18:00',
      snack: '15:00'
    };
    
    return mealTimes[mealType.toLowerCase()] || '12:00';
  }
}; 