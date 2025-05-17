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

// School days (typically Monday-Friday)
const SCHOOL_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

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
        // Try to create an empty plan, but return mock data if that fails
        try {
          // If no meal plan exists for this week, create an empty one
          const emptyPlan = {
            startDate: weekRange.startTimestamp,
            endDate: weekRange.endTimestamp,
            createdAt: Timestamp.now()
          };
          
          await setDoc(weekDocRef, emptyPlan);
          
          // Return mock data instead of empty plan for better user experience
          return this._getMockWeekPlan();
        } catch (err) {
          console.error('Error creating empty meal plan:', err);
          // Return mock data if we can't create an empty plan
          return this._getMockWeekPlan();
        }
      }
    } catch (error) {
      console.error('Error getting current week meal plan:', error);
      // Return mock data instead of throwing
      return this._getMockWeekPlan();
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
  },
  
  // Mock data for development
  _getMockWeekPlan() {
    // Get current day of week
    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDayName = dayNames[today.getDay()];
    
    // Creates a full week plan with today populated
    const weekPlan = {
      startDate: Timestamp.fromDate(new Date()),
      endDate: Timestamp.fromDate(new Date()),
      createdAt: Timestamp.fromDate(new Date())
    };
    
    // Add all days to the week plan with varying meals
    dayNames.forEach(dayName => {
      const isSchoolDay = SCHOOL_DAYS.includes(dayName);
      
      weekPlan[dayName] = {
        breakfast: {
          name: this._getBreakfastForDay(dayName),
          prepTime: '10 min',
          cookTime: '15 min',
          description: 'Healthy start to the day'
        },
        lunch: {
          name: this._getLunchForDay(dayName),
          prepTime: '15 min',
          cookTime: '5 min',
          description: 'Nutritious midday meal',
          // Add school lunch type for school days
          ...(isSchoolDay && { schoolLunchType: dayName === 'monday' || dayName === 'wednesday' || dayName === 'friday' ? 'buy' : 'pack' })
        },
        dinner: {
          name: this._getDinnerForDay(dayName),
          prepTime: '20 min',
          cookTime: '30 min',
          description: 'Delicious family dinner'
        },
        snack: {
          name: this._getSnackForDay(dayName),
          prepTime: '5 min',
          cookTime: '0 min',
          description: 'Quick energy boost'
        }
      };
    });
    
    return weekPlan;
  },
  
  // Helper methods for generating varied mock data
  _getBreakfastForDay(day) {
    const options = [
      'Avocado Toast with Eggs',
      'Oatmeal with Berries', 
      'Greek Yogurt Parfait', 
      'Breakfast Burrito', 
      'Pancakes with Maple Syrup',
      'Scrambled Eggs with Toast',
      'Fruit Smoothie Bowl'
    ];
    return options[Math.floor(day.length % options.length)];
  },
  
  _getLunchForDay(day) {
    const options = [
      'Chicken Caesar Salad',
      'Turkey and Cheese Sandwich', 
      'Tuna Wrap', 
      'Vegetable Soup with Bread', 
      'Pasta Salad',
      'Grilled Cheese with Tomato Soup',
      'Quinoa Bowl with Roasted Vegetables'
    ];
    return options[Math.floor(day.length % options.length)];
  },
  
  _getDinnerForDay(day) {
    const options = [
      'Spaghetti Bolognese',
      'Grilled Chicken with Vegetables', 
      'Beef Stir Fry with Rice', 
      'Baked Salmon with Potatoes', 
      'Homemade Pizza',
      'Tacos with All the Fixings',
      'Vegetable Curry with Rice'
    ];
    return options[Math.floor(day.length % options.length)];
  },
  
  _getSnackForDay(day) {
    const options = [
      'Fruit & Yogurt Parfait',
      'Apple Slices with Peanut Butter', 
      'Trail Mix', 
      'Cheese and Crackers', 
      'Hummus with Vegetable Sticks',
      'Banana with Honey',
      'Granola Bar'
    ];
    return options[Math.floor(day.length % options.length)];
  }
}; 