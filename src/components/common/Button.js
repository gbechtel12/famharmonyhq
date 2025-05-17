import React from 'react';
import { Button as MuiButton } from '@mui/material';
import classNames from 'classnames';

const variants = {
  primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-md hover:shadow-lg focus:ring-primary-500',
  secondary: 'bg-secondary-500 hover:bg-secondary-600 text-white shadow-md hover:shadow-lg focus:ring-secondary-500',
  accent: 'bg-accent-500 hover:bg-accent-600 text-gray-900 shadow-md hover:shadow-lg focus:ring-accent-500',
  outline: 'bg-transparent border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white focus:ring-gray-500',
  text: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-primary-500 focus:ring-primary-500',
};

const sizes = {
  small: 'text-xs px-3 py-1.5',
  medium: 'text-sm px-4 py-2',
  large: 'text-base px-5 py-2.5 font-semibold',
};

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  className, 
  startIcon,
  endIcon,
  fullWidth,
  ...props 
}) => {
  const buttonClasses = classNames(
    'font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-opacity-50 transform hover:-translate-y-0.5 active:translate-y-0',
    variants[variant] || variants.primary,
    sizes[size] || sizes.medium,
    fullWidth && 'w-full',
    className
  );

  return (
    <MuiButton 
      className={buttonClasses}
      startIcon={startIcon}
      endIcon={endIcon}
      fullWidth={fullWidth}
      disableRipple
      disableElevation
      {...props}
    >
      {children}
    </MuiButton>
  );
};

export default Button; 