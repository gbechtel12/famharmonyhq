import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  query, 
  where, 
  getDocs, 
  Timestamp, 
  deleteField,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';

// Helper to get the start and end of the current week (Sunday to Saturday)
const getCurrentWeekRange = () => {
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
};

export const mealService = {
  // Get the current week's meal plan
  async getCurrentWeekPlan(familyId) {
    try {
      const weekRange = getCurrentWeekRange();
      const weekId = weekRange.weekId;
      
      // Document path: 'mealPlans/{familyId}/weeks/{weekId}'
      const weekDocRef = doc(db, 'mealPlans', familyId, 'weeks', weekId);
      const weekDoc = await getDoc(weekDocRef);
      
      if (weekDoc.exists()) {
        return weekDoc.data();
      } else {
        // If no meal plan exists for this week, create an empty one
        const emptyPlan = {
          startDate: weekRange.startTimestamp,
          endDate: weekRange.endTimestamp,
          createdAt: Timestamp.now()
        };
        
        await setDoc(weekDocRef, emptyPlan);
        return emptyPlan;
      }
    } catch (error) {
      console.error('Error getting current week meal plan:', error);
      throw error;
    }
  },
  
  // Update a specific meal
  async updateMeal(familyId, dayId, mealType, meal) {
    try {
      const weekRange = getCurrentWeekRange();
      const weekId = weekRange.weekId;
      
      const weekDocRef = doc(db, 'mealPlans', familyId, 'weeks', weekId);
      
      // Prepare the path for the meal in the Firestore document
      const mealPath = `${dayId}.${mealType}`;
      
      if (meal) {
        // Add or update a meal
        await updateDoc(weekDocRef, {
          [mealPath]: {
            ...meal,
            updatedAt: Timestamp.now()
          }
        });
      } else {
        // Remove a meal
        await updateDoc(weekDocRef, {
          [mealPath]: deleteField()
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating meal:', error);
      throw error;
    }
  },
  
  // Get meal plan for a specific week
  async getWeekPlan(familyId, weekId) {
    try {
      const weekDocRef = doc(db, 'mealPlans', familyId, 'weeks', weekId);
      const weekDoc = await getDoc(weekDocRef);
      
      if (weekDoc.exists()) {
        return weekDoc.data();
      }
      
      return null;
    } catch (error) {
      console.error('Error getting week meal plan:', error);
      throw error;
    }
  },
  
  // Get all ingredients from a meal plan for grocery list
  async getAllIngredients(familyId, weekId) {
    try {
      const weekPlan = await this.getWeekPlan(familyId, weekId || getCurrentWeekRange().weekId);
      
      if (!weekPlan) {
        return [];
      }
      
      // Collect all ingredients
      const ingredients = [];
      
      // Loop through all days and meal types
      Object.values(weekPlan).forEach(day => {
        if (typeof day === 'object' && day !== null && !day.seconds) { // Skip metadata fields like startDate
          Object.values(day).forEach(meal => {
            if (meal && meal.ingredients && Array.isArray(meal.ingredients)) {
              ingredients.push(...meal.ingredients);
            }
          });
        }
      });
      
      // Count occurrences of each ingredient
      const counts = {};
      ingredients.forEach(ingredient => {
        counts[ingredient] = (counts[ingredient] || 0) + 1;
      });
      
      // Convert to array of objects
      return Object.entries(counts).map(([name, count]) => ({
        name,
        count
      }));
    } catch (error) {
      console.error('Error getting all ingredients:', error);
      throw error;
    }
  }
}; 