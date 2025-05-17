import React, { useState, useEffect } from 'react';
import { Paper, Typography, Divider, Box, CircularProgress } from '@mui/material';
import { format } from 'date-fns';
import { Event as EventIcon, RestaurantMenu as MealIcon, CheckCircleOutline as ChoreIcon } from '@mui/icons-material';

// Mock data - replace with actual data fetching in a real implementation
const mockEvents = [
  { id: 1, title: 'School Pickup', time: '15:30', type: 'event' },
  { id: 2, title: 'Soccer Practice', time: '16:30', type: 'event' },
  { id: 3, title: 'Family Dinner', time: '18:30', type: 'meal' },
  { id: 4, title: 'Take out trash', assignedTo: 'Alex', dueTime: '19:00', type: 'chore' },
  { id: 5, title: 'Help with dishes', assignedTo: 'Emma', dueTime: '19:30', type: 'chore' },
  { id: 6, title: 'Bedtime Story', time: '20:30', type: 'event' },
];

function TodayScheduleView() {
  const [isLoading, setIsLoading] = useState(true);
  const [todayItems, setTodayItems] = useState([]);
  
  useEffect(() => {
    // Simulate data loading
    const loadData = async () => {
      // In a real app, fetch data from your services or API
      setTodayItems(mockEvents);
      setIsLoading(false);
    };
    
    loadData();
  }, []);

  // Sort items by time
  const sortedItems = [...todayItems].sort((a, b) => {
    const timeA = a.time || a.dueTime || '23:59';
    const timeB = b.time || b.dueTime || '23:59';
    return timeA.localeCompare(timeB);
  });

  return (
    <div className="w-full h-full p-6 bg-gradient-to-br from-primary-50 to-primary-100 overflow-auto">
      <Paper className="w-full h-full rounded-xl shadow-xl overflow-hidden bg-white bg-opacity-90 backdrop-blur">
        <div className="p-6 flex flex-col h-full">
          <div className="text-center mb-6 bg-primary-50 py-4 rounded-lg">
            <Typography variant="h3" className="font-bold text-primary-800">
              Today's Schedule
            </Typography>
            <Typography variant="h5" className="font-medium text-primary-600">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </Typography>
          </div>

          {isLoading ? (
            <div className="flex-1 flex justify-center items-center">
              <CircularProgress size={60} />
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar Events */}
              <div className="bg-blue-50 rounded-xl p-4 shadow-md border border-blue-200">
                <div className="flex items-center mb-4">
                  <EventIcon className="text-blue-600 mr-2" />
                  <Typography variant="h5" className="font-semibold text-blue-800">
                    Events
                  </Typography>
                </div>
                <Divider className="mb-4" />
                <div className="space-y-3">
                  {sortedItems
                    .filter(item => item.type === 'event')
                    .map(event => (
                      <div key={event.id} className="p-3 bg-white rounded-lg shadow-sm border-l-4 border-blue-500 flex justify-between items-center">
                        <Typography variant="h6" className="font-medium">
                          {event.title}
                        </Typography>
                        <Typography variant="body1" className="bg-blue-100 px-2 py-1 rounded text-blue-800 font-medium">
                          {event.time}
                        </Typography>
                      </div>
                    ))}
                </div>
              </div>

              {/* Meals */}
              <div className="bg-green-50 rounded-xl p-4 shadow-md border border-green-200">
                <div className="flex items-center mb-4">
                  <MealIcon className="text-green-600 mr-2" />
                  <Typography variant="h5" className="font-semibold text-green-800">
                    Meals
                  </Typography>
                </div>
                <Divider className="mb-4" />
                <div className="space-y-3">
                  {sortedItems
                    .filter(item => item.type === 'meal')
                    .map(meal => (
                      <div key={meal.id} className="p-3 bg-white rounded-lg shadow-sm border-l-4 border-green-500 flex justify-between items-center">
                        <Typography variant="h6" className="font-medium">
                          {meal.title}
                        </Typography>
                        <Typography variant="body1" className="bg-green-100 px-2 py-1 rounded text-green-800 font-medium">
                          {meal.time}
                        </Typography>
                      </div>
                    ))}
                </div>
              </div>

              {/* Chores */}
              <div className="bg-amber-50 rounded-xl p-4 shadow-md border border-amber-200">
                <div className="flex items-center mb-4">
                  <ChoreIcon className="text-amber-600 mr-2" />
                  <Typography variant="h5" className="font-semibold text-amber-800">
                    Chores
                  </Typography>
                </div>
                <Divider className="mb-4" />
                <div className="space-y-3">
                  {sortedItems
                    .filter(item => item.type === 'chore')
                    .map(chore => (
                      <div key={chore.id} className="p-3 bg-white rounded-lg shadow-sm border-l-4 border-amber-500">
                        <div className="flex justify-between items-center">
                          <Typography variant="h6" className="font-medium">
                            {chore.title}
                          </Typography>
                          <Typography variant="body1" className="bg-amber-100 px-2 py-1 rounded text-amber-800 font-medium">
                            {chore.dueTime}
                          </Typography>
                        </div>
                        <Typography variant="body2" className="text-gray-600 mt-1">
                          Assigned to: <span className="font-medium">{chore.assignedTo}</span>
                        </Typography>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </Paper>
    </div>
  );
}

export default TodayScheduleView; 