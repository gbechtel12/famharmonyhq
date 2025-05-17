import React from 'react';
import Button from '../common/Button';
import Card from '../common/Card';
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon, 
  HeartIcon, 
  StarIcon, 
  BellIcon, 
  ShoppingCartIcon,
  UserIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { Box, Typography, Grid, Divider, Badge, Avatar } from '@mui/material';

const TailwindExample = () => {
  return (
    <div className="space-y-10 max-w-5xl mx-auto py-6">
      <header className="text-center mb-12">
        <Typography variant="h4" className="font-bold text-primary-700 dark:text-primary-400 mb-2">
          UI Component Examples
        </Typography>
        <Typography variant="body1" className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          A showcase of UI components styled with Tailwind CSS integrated with Material UI
        </Typography>
      </header>

      <section className="bg-white dark:bg-background-paperDark rounded-lg shadow-md p-6 mb-8">
        <Typography variant="h5" className="font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center">
          <StarIcon className="h-6 w-6 mr-2 text-primary-500" />
          Button Examples
        </Typography>
        <Divider className="mb-6" />
        <div className="flex flex-wrap gap-4">
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="accent">Accent Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="text">Text Button</Button>
        </div>
      </section>

      <section className="bg-white dark:bg-background-paperDark rounded-lg shadow-md p-6 mb-8">
        <Typography variant="h5" className="font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center">
          <CogIcon className="h-6 w-6 mr-2 text-primary-500" />
          Button Sizes
        </Typography>
        <Divider className="mb-6" />
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="primary" size="small">Small</Button>
          <Button variant="primary" size="medium">Medium</Button>
          <Button variant="primary" size="large">Large</Button>
        </div>
      </section>

      <section className="bg-white dark:bg-background-paperDark rounded-lg shadow-md p-6 mb-8">
        <Typography variant="h5" className="font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center">
          <PencilIcon className="h-6 w-6 mr-2 text-primary-500" />
          Buttons with Icons
        </Typography>
        <Divider className="mb-6" />
        <div className="flex flex-wrap gap-4">
          <Button 
            variant="primary"
            startIcon={<PlusIcon className="h-5 w-5" />}
          >
            Add Item
          </Button>
          <Button 
            variant="secondary"
            startIcon={<UserIcon className="h-5 w-5" />}
          >
            Profile
          </Button>
          <Button 
            variant="accent"
            startIcon={<ShoppingCartIcon className="h-5 w-5" />}
          >
            Add to Cart
          </Button>
          <Button 
            variant="outline" 
            startIcon={<PencilIcon className="h-5 w-5" />}
          >
            Edit
          </Button>
          <Button 
            variant="text" 
            startIcon={<TrashIcon className="h-5 w-5 text-red-500" />}
            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Delete
          </Button>
          <Button 
            variant="outline" 
            startIcon={<HeartIcon className="h-5 w-5 text-pink-500" />}
            className="text-pink-500 border-pink-300 hover:bg-pink-50 dark:hover:bg-pink-900/20"
          >
            Favorite
          </Button>
          <Button 
            variant="outline" 
            startIcon={<BellIcon className="h-5 w-5 text-amber-500" />}
            className="text-amber-500 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
          >
            Notify
          </Button>
        </div>
      </section>

      <section className="bg-white dark:bg-background-paperDark rounded-lg shadow-md p-6">
        <Typography variant="h5" className="font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center">
          <ShoppingCartIcon className="h-6 w-6 mr-2 text-primary-500" />
          Card Examples
        </Typography>
        <Divider className="mb-6" />
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card>
              <div className="p-2">
                <div className="flex justify-between items-center mb-4">
                  <Typography variant="h6" className="font-semibold">
                    Card Title
                  </Typography>
                  <Badge badgeContent={3} color="primary">
                    <BellIcon className="h-5 w-5 text-gray-500" />
                  </Badge>
                </div>
                <Typography variant="body2" className="text-gray-600 dark:text-gray-300 mb-4">
                  This is a simple card with Tailwind styling. Cards can contain various types of content.
                </Typography>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Avatar sx={{ width: 28, height: 28 }} className="mr-2">J</Avatar>
                    <Typography variant="caption" className="text-gray-500">John Smith</Typography>
                  </div>
                  <Button variant="primary" size="small">
                    Action
                  </Button>
                </div>
              </div>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card className="border-2 border-secondary-200 dark:border-secondary-900">
              <div className="p-2">
                <div className="flex justify-between items-center mb-4">
                  <Typography variant="h6" className="font-semibold text-secondary-700 dark:text-secondary-400">
                    Bordered Card
                  </Typography>
                  <HeartIcon className="h-5 w-5 text-secondary-500" />
                </div>
                <Typography variant="body2" className="text-gray-600 dark:text-gray-300 mb-4">
                  This card has a colored border. Borders can help distinguish different card types.
                </Typography>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-1">
                    <StarIcon className="h-4 w-4 text-amber-400" />
                    <StarIcon className="h-4 w-4 text-amber-400" />
                    <StarIcon className="h-4 w-4 text-amber-400" />
                    <StarIcon className="h-4 w-4 text-amber-400" />
                    <StarIcon className="h-4 w-4 text-gray-300" />
                  </div>
                  <Button variant="secondary" size="small">
                    Action
                  </Button>
                </div>
              </div>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card className="bg-primary-50 dark:bg-primary-900/20">
              <div className="p-2">
                <div className="flex justify-between items-center mb-4">
                  <Typography variant="h6" className="font-semibold text-primary-800 dark:text-primary-300">
                    Colored Background
                  </Typography>
                  <Badge color="accent" variant="dot">
                    <CogIcon className="h-5 w-5 text-primary-700 dark:text-primary-400" />
                  </Badge>
                </div>
                <Typography variant="body2" className="text-primary-700 dark:text-primary-400 mb-4">
                  This card has a colored background. Use background colors to highlight important cards.
                </Typography>
                <div className="flex justify-between items-center">
                  <div className="px-2 py-1 bg-primary-200 dark:bg-primary-800 rounded-md text-xs font-medium text-primary-800 dark:text-primary-200">
                    Featured
                  </div>
                  <Button variant="outline" size="small" className="border-primary-300 text-primary-700">
                    Action
                  </Button>
                </div>
              </div>
            </Card>
          </Grid>
        </Grid>
      </section>
    </div>
  );
};

export default TailwindExample; 