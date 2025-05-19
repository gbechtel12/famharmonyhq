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
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { mealService } from './mealService';

export const groceryService = {
  // Get the current grocery list for a family
  async getGroceryList(familyId) {
    try {
      // Use the subcollection in families collection
      const docRef = doc(db, 'families', familyId, 'groceryLists', 'current');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        // Create a new empty grocery list if none exists
        const emptyList = {
          items: [],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };
        
        await setDoc(docRef, emptyList);
        return emptyList;
      }
    } catch (error) {
      console.error('Error getting grocery list:', error);
      throw error;
    }
  },

  // Add a new grocery item
  async addGroceryItem(familyId, item) {
    try {
      const groceryListRef = doc(db, 'families', familyId, 'groceryLists', 'current');
      const groceryListSnap = await getDoc(groceryListRef);
      
      const newItem = {
        id: Date.now().toString(), // Simple ID generation
        name: item.name,
        category: item.category || 'other',
        mealId: item.mealId || null,
        completed: false,
        createdAt: Timestamp.now()
      };
      
      if (groceryListSnap.exists()) {
        // We can't use arrayUnion with complex objects due to Firestore limitations
        // Instead, get the current items and add the new one
        const currentItems = groceryListSnap.data().items || [];
        await updateDoc(groceryListRef, {
          items: [...currentItems, newItem],
          updatedAt: Timestamp.now()
        });
      } else {
        await setDoc(groceryListRef, {
          items: [newItem],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
      }
      
      return newItem;
    } catch (error) {
      console.error('Error adding grocery item:', error);
      throw error;
    }
  },

  // Update a grocery item (e.g., mark as completed)
  async updateGroceryItem(familyId, itemId, updates) {
    try {
      const groceryListRef = doc(db, 'families', familyId, 'groceryLists', 'current');
      const groceryListSnap = await getDoc(groceryListRef);
      
      if (!groceryListSnap.exists()) {
        throw new Error('Grocery list not found');
      }
      
      const groceryList = groceryListSnap.data();
      const items = groceryList.items || [];
      
      const updatedItems = items.map(item => {
        if (item.id === itemId) {
          return { ...item, ...updates };
        }
        return item;
      });
      
      await updateDoc(groceryListRef, {
        items: updatedItems,
        updatedAt: Timestamp.now()
      });
      
      return updatedItems.find(item => item.id === itemId);
    } catch (error) {
      console.error('Error updating grocery item:', error);
      throw error;
    }
  },

  // Remove a grocery item
  async removeGroceryItem(familyId, itemId) {
    try {
      const groceryListRef = doc(db, 'families', familyId, 'groceryLists', 'current');
      const groceryListSnap = await getDoc(groceryListRef);
      
      if (!groceryListSnap.exists()) {
        throw new Error('Grocery list not found');
      }
      
      const groceryList = groceryListSnap.data();
      const items = groceryList.items || [];
      
      const updatedItems = items.filter(item => item.id !== itemId);
      
      await updateDoc(groceryListRef, {
        items: updatedItems,
        updatedAt: Timestamp.now()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error removing grocery item:', error);
      throw error;
    }
  },

  // Add ingredients from a meal plan to the grocery list
  async addIngredientsFromMealPlan(familyId, weekId) {
    try {
      const ingredients = await mealService.getAllIngredients(familyId, weekId);
      
      if (ingredients.length === 0) {
        return { success: true, count: 0 };
      }
      
      const groceryListRef = doc(db, 'families', familyId, 'groceryLists', 'current');
      const groceryListSnap = await getDoc(groceryListRef);
      
      // Convert ingredients to grocery items
      const newItems = ingredients.map(ingredient => ({
        id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9), // Unique ID
        name: ingredient.name,
        category: 'mealIngredients',
        mealId: weekId || null,
        quantity: ingredient.count,
        completed: false,
        createdAt: Timestamp.now()
      }));
      
      if (groceryListSnap.exists()) {
        // Get current items
        const currentItems = groceryListSnap.data().items || [];
        
        // Merge with existing items - avoid duplicates
        const existingNames = currentItems.map(item => item.name.toLowerCase());
        const filteredNewItems = newItems.filter(item => !existingNames.includes(item.name.toLowerCase()));
        
        // Update existing items with same name (increase quantity if from meal plan)
        const updatedCurrentItems = currentItems.map(item => {
          const matchingNew = newItems.find(newItem => 
            newItem.name.toLowerCase() === item.name.toLowerCase()
          );
          
          if (matchingNew) {
            return {
              ...item,
              quantity: (item.quantity || 1) + matchingNew.quantity
            };
          }
          return item;
        });
        
        await updateDoc(groceryListRef, {
          items: [...updatedCurrentItems, ...filteredNewItems],
          updatedAt: Timestamp.now()
        });
        
        return { 
          success: true, 
          count: filteredNewItems.length, 
          updated: updatedCurrentItems.length - currentItems.length
        };
      } else {
        await setDoc(groceryListRef, {
          items: newItems,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        
        return { success: true, count: newItems.length };
      }
    } catch (error) {
      console.error('Error adding ingredients to grocery list:', error);
      throw error;
    }
  },
  
  // Clear completed items
  async clearCompletedItems(familyId) {
    try {
      const groceryListRef = doc(db, 'families', familyId, 'groceryLists', 'current');
      const groceryListSnap = await getDoc(groceryListRef);
      
      if (!groceryListSnap.exists()) {
        return { success: true };
      }
      
      const groceryList = groceryListSnap.data();
      const items = groceryList.items || [];
      
      const remainingItems = items.filter(item => !item.completed);
      
      await updateDoc(groceryListRef, {
        items: remainingItems,
        updatedAt: Timestamp.now()
      });
      
      return { 
        success: true, 
        count: items.length - remainingItems.length 
      };
    } catch (error) {
      console.error('Error clearing completed items:', error);
      throw error;
    }
  }
}; 