import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// This is a workaround for react-beautiful-dnd to work with React 18 StrictMode
// See: https://github.com/atlassian/react-beautiful-dnd/issues/2399
const root = ReactDOM.createRoot(document.getElementById('root'));

// Apply patch for react-beautiful-dnd to work with strict mode
const strictModeWrapper = process.env.NODE_ENV === 'development' ? 
  element => element :
  element => <React.StrictMode>{element}</React.StrictMode>;

root.render(strictModeWrapper(<App />));
