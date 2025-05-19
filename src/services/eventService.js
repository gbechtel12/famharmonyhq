import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  doc,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';

export const eventService = {
  // Create a new event
  async createEvent(familyId, eventData) {
    if (!familyId) {
      throw new Error('Family ID is required');
    }
    
    try {
      // Handle recurring events
      if (Array.isArray(eventData)) {
        const batch = writeBatch(db);
        const eventsRef = collection(db, 'families', familyId, 'events');
        
        eventData.forEach(event => {
          const newEventRef = doc(eventsRef);
          const newEvent = {
            ...event,
            start: Timestamp.fromDate(new Date(event.start)),
            end: Timestamp.fromDate(new Date(event.end)),
            createdAt: Timestamp.now(),
            category: event.category || 'personal'
          };
          batch.set(newEventRef, newEvent);
        });

        await batch.commit();
        return eventData;
      }

      // Handle single event
      const eventsRef = collection(db, 'families', familyId, 'events');
      const newEvent = {
        ...eventData,
        start: Timestamp.fromDate(new Date(eventData.start)),
        end: Timestamp.fromDate(new Date(eventData.end)),
        createdAt: Timestamp.now(),
        category: eventData.category || 'personal'
      };
      const docRef = await addDoc(eventsRef, newEvent);
      return { id: docRef.id, ...newEvent };
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  // Fetch events for a family
  async getEventsByFamilyId(familyId) {
    if (!familyId) {
      throw new Error('Family ID is required');
    }
    
    try {
      const eventsRef = collection(db, 'families', familyId, 'events');
      const querySnapshot = await getDocs(eventsRef);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        start: doc.data().start.toDate(),
        end: doc.data().end.toDate()
      }));
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  },

  // Update an event
  async updateEvent(familyId, eventId, updateData) {
    if (!familyId || !eventId) {
      throw new Error('Family ID and Event ID are required');
    }
    
    try {
      const eventRef = doc(db, 'families', familyId, 'events', eventId);
      const updates = {
        ...updateData,
        updatedAt: Timestamp.now()
      };
      if (updateData.start) {
        updates.start = Timestamp.fromDate(new Date(updateData.start));
      }
      if (updateData.end) {
        updates.end = Timestamp.fromDate(new Date(updateData.end));
      }
      await updateDoc(eventRef, updates);
      return { id: eventId, ...updates };
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },

  // Delete an event
  async deleteEvent(familyId, eventId) {
    if (!familyId || !eventId) {
      throw new Error('Family ID and Event ID are required');
    }
    
    try {
      const eventRef = doc(db, 'families', familyId, 'events', eventId);
      await deleteDoc(eventRef);
      return eventId;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },

  async deleteRecurringEvent(familyId, eventId) {
    if (!familyId || !eventId) {
      throw new Error('Family ID and Event ID are required');
    }
    
    try {
      const batch = writeBatch(db);
      const eventsRef = collection(db, 'families', familyId, 'events');
      const q = query(eventsRef, where('recurringEventId', '==', eventId));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error('Error deleting recurring event:', error);
      throw error;
    }
  }
}; 