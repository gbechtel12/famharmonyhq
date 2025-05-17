// Constants for chore status configuration
export const STATUS_CONFIG = {
  open: {
    label: 'Open',
    color: '#9e9e9e',
    bgcolor: '#f5f5f5',
    textColor: '#616161'
  },
  todo: {
    label: 'To Do',
    color: '#2196f3',
    bgcolor: '#e3f2fd',
    textColor: '#0d47a1'
  },
  in_progress: {
    label: 'In Progress',
    color: '#ff9800',
    bgcolor: '#fff3e0',
    textColor: '#e65100'
  },
  done: {
    label: 'Done',
    color: '#4caf50',
    bgcolor: '#e8f5e9',
    textColor: '#1b5e20'
  }
};

// Columns for Kanban board
export const COLUMNS = {
  todo: {
    id: 'todo',
    title: 'To Do',
    statuses: ['todo', 'open'],
    color: '#2196f3' // Blue color
  },
  in_progress: {
    id: 'in_progress',
    title: 'In Progress',
    statuses: ['in_progress'],
    color: '#ff9800' // Orange color
  },
  done: {
    id: 'done',
    title: 'Done',
    statuses: ['done'],
    color: '#4caf50' // Green color
  }
};

// Mapping from column ID to status
export const COLUMN_TO_STATUS = {
  todo: 'todo',
  in_progress: 'in_progress',
  done: 'done'
};

// Frequency options for chores
export const FREQUENCY_OPTIONS = [
  { value: 'once', label: 'One time task' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' }
]; 