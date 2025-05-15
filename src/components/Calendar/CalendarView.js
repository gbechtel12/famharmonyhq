import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Box, Button, FormControl, InputLabel, Select, MenuItem, Tooltip, Typography, Snackbar, Alert as MuiAlert } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { collection, onSnapshot, query, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { eventService } from '../../services/eventService';
import Loader from '../common/Loader';
import EventModal from './EventModal';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme, useMediaQuery } from '@mui/material';
import CalendarErrorBoundary from './CalendarErrorBoundary';
import { styled } from '@mui/material/styles';
import CustomToolbar from './CustomToolbar';

const locales = {
  'en-US': require('date-fns/locale/en-US')
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const ColorPreview = styled('div')(({ color }) => ({
  width: 20,
  height: 20,
  borderRadius: '50%',
  backgroundColor: color,
  marginRight: 8,
  display: 'inline-block',
  verticalAlign: 'middle'
}));

// Same categories as EventModal
const EVENT_CATEGORIES = [
  { id: 'personal', label: 'Personal', color: '#4CAF50' },
  { id: 'family', label: 'Family', color: '#2196F3' },
  { id: 'work', label: 'Work', color: '#FF5722' },
  { id: 'holiday', label: 'Holiday', color: '#9C27B0' }
];

export default function CalendarView({ familyId }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [viewFilter, setViewFilter] = useState('all'); // 'all', 'personal', etc.
  const [view, setView] = useState(isMobile ? 'day' : 'month');
  const [refreshKey, setRefreshKey] = useState(0);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  // Adjust calendar height based on screen size
  const calendarHeight = isMobile ? 
    'calc(100vh - 160px)' : 
    'calc(100vh - 200px)';

  // Update the event formatting to ensure title is always present
  const formatEvents = (events) => {
    return events.map(event => ({
      ...event,
      title: event.title || 'Untitled Event', // Ensure title is never undefined
      start: new Date(event.start),
      end: new Date(event.end)
    }));
  };

  useEffect(() => {
    let unsubscribe;

    const setupRealtimeEvents = async () => {
      setLoading(true);
      setError(null);

      try {
        // SIMPLIFIED QUERY - just get all events without filtering by familyId
        const eventsRef = collection(db, 'events');
        
        // First try a simple getDocs to test permissions
        const snapshot = await getDocs(eventsRef);
        console.log('Successfully queried events collection. Found:', snapshot.size, 'events');
        
        // Then set up the realtime listener
        unsubscribe = onSnapshot(eventsRef, 
          (snapshot) => {
            const fetchedEvents = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              start: doc.data().start.toDate(),
              end: doc.data().end.toDate(),
              title: doc.data().title || 'Untitled Event'
            }));
            setEvents(fetchedEvents);
            setLoading(false);
          },
          (err) => {
            console.error('Error fetching events:', err);
            setError('Failed to load calendar events');
            setLoading(false);
          }
        );
      } catch (err) {
        console.error('Error setting up realtime events:', err);
        setError('Failed to initialize calendar');
        setLoading(false);
      }
    };

    setupRealtimeEvents();

    return () => unsubscribe?.();
  }, [familyId]);

  const handleSelectSlot = ({ start, end }) => {
    setSelectedEvent(null);
    setModalOpen(true);
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedEvent(null);
  };

  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleError = (error, action) => {
    console.error(`Error ${action}:`, error);
    showNotification(
      `Failed to ${action}. ${error.message || 'Please try again.'}`,
      'error'
    );
  };

  const handleEventSubmit = async (formData) => {
    try {
      if (Array.isArray(formData)) {
        await eventService.createEvent(formData);
        showNotification('Recurring events created successfully');
      } else if (formData.id) {
        await eventService.updateEvent(formData.id, formData);
        showNotification('Event updated successfully');
      } else {
        await eventService.createEvent(formData);
        showNotification('Event created successfully');
      }
    } catch (error) {
      handleError(error, 'save event');
      throw error;
    }
  };

  const handleEventDelete = async (eventId, isRecurring = false) => {
    try {
      if (isRecurring) {
        await eventService.deleteRecurringEvent(eventId);
        showNotification('Recurring events deleted successfully');
      } else {
        await eventService.deleteEvent(eventId);
        showNotification('Event deleted successfully');
      }
    } catch (error) {
      handleError(error, 'delete event');
      throw error;
    }
  };

  const checkEventConflicts = (newDate, isStart) => {
    const checkDate = new Date(newDate);
    return events.filter(event => {
      if (selectedEvent && event.id === selectedEvent.id) return false;
      return (
        (checkDate >= event.start && checkDate <= event.end) ||
        (isStart && event.start >= checkDate && event.start <= selectedEvent?.end)
      );
    });
  };

  // Color-coding for events
  const eventPropGetter = (event) => {
    const category = EVENT_CATEGORIES.find(cat => cat.id === event.category);
    return {
      style: {
        backgroundColor: category?.color || '#1976d2',
        borderRadius: '4px'
      }
    };
  };

  // Filter and format events
  const getFilteredEvents = () => {
    const filtered = events.filter(event => {
      if (viewFilter === 'all') return true;
      if (viewFilter === 'my-events') return event.userId === user.uid;
      return event.category === viewFilter;
    });
    return formatEvents(filtered);
  };

  if (loading) {
    return <Loader message="Loading calendar..." />;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <CalendarErrorBoundary onRetry={() => setRefreshKey(prev => prev + 1)}>
      <Box sx={{ 
        height: calendarHeight, 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        <Box sx={{ 
          mb: 2, 
          display: 'flex', 
          gap: 2, 
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setSelectedEvent(null);
              setModalOpen(true);
            }}
            size={isMobile ? 'small' : 'medium'}
          >
            Add Event
          </Button>
          
          <FormControl sx={{ minWidth: isMobile ? '100%' : 200 }}>
            <InputLabel>View</InputLabel>
            <Select
              value={viewFilter}
              onChange={(e) => setViewFilter(e.target.value)}
              label="View"
              size={isMobile ? 'small' : 'medium'}
            >
              <MenuItem value="all">All Events</MenuItem>
              <MenuItem value="my-events">My Events</MenuItem>
              {EVENT_CATEGORIES.map(category => (
                <MenuItem key={category.id} value={category.id}>
                  <ColorPreview color={category.color} />
                  {category.label} Events
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {!isMobile && (
            <FormControl>
              <InputLabel>Calendar View</InputLabel>
              <Select
                value={view}
                onChange={(e) => setView(e.target.value)}
                label="Calendar View"
              >
                <MenuItem value="month">Month</MenuItem>
                <MenuItem value="week">Week</MenuItem>
                <MenuItem value="day">Day</MenuItem>
                <MenuItem value="agenda">Agenda</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>

        <Calendar
          key={refreshKey}
          localizer={localizer}
          events={getFilteredEvents()}
          startAccessor="start"
          endAccessor="end"
          titleAccessor="title"
          style={{ flex: 1 }}
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventPropGetter}
          view={view}
          onView={setView}
          views={isMobile ? ['day', 'agenda'] : undefined}
          defaultView={isMobile ? 'day' : 'month'}
          components={{
            toolbar: CustomToolbar,
            event: (props) => (
              <Tooltip 
                title={
                  <div>
                    <Typography variant="subtitle2">
                      {props.event.title || 'Untitled Event'}
                    </Typography>
                    {props.event.description && (
                      <Typography variant="body2">
                        {props.event.description}
                      </Typography>
                    )}
                  </div>
                }
                placement="top"
                arrow
              >
                <div style={{ 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  padding: '2px 4px'
                }}>
                  {props.event.title || 'Untitled Event'}
                </div>
              </Tooltip>
            )
          }}
          dayPropGetter={(date) => ({
            style: {
              backgroundColor: date.getDay() === 0 || date.getDay() === 6 
                ? theme.palette.action.hover 
                : undefined
            }
          })}
          slotPropGetter={(date) => ({
            style: {
              backgroundColor: date.getDay() === 0 || date.getDay() === 6 
                ? theme.palette.action.hover 
                : undefined
            }
          })}
        />

        <EventModal
          open={modalOpen}
          onClose={handleModalClose}
          onSubmit={handleEventSubmit}
          onDelete={handleEventDelete}
          event={selectedEvent}
          checkConflicts={checkEventConflicts}
        />

        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <MuiAlert
            elevation={6}
            variant="filled"
            severity={notification.severity}
            onClose={handleCloseNotification}
          >
            {notification.message}
          </MuiAlert>
        </Snackbar>
      </Box>
    </CalendarErrorBoundary>
  );
} 