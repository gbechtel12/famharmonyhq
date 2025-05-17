import React from 'react';
import { Paper } from '@mui/material';
import classNames from 'classnames';

const Card = ({ 
  children, 
  className, 
  elevation = 1, 
  hover = true, 
  ...props 
}) => {
  const cardClasses = classNames(
    'bg-white dark:bg-background-paperDark rounded-2xl p-4 border border-gray-100 dark:border-gray-800',
    hover && 'transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1',
    className
  );

  return (
    <Paper 
      className={cardClasses} 
      elevation={elevation}
      {...props}
    >
      {children}
    </Paper>
  );
};

export default Card; 