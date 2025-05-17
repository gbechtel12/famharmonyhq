import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  IconButton, 
  Typography, 
  Avatar, 
  Menu, 
  MenuItem, 
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  Tooltip
} from '@mui/material';
import {
  Settings,
  Logout,
} from '@mui/icons-material';

// Hero icons
import { 
  Bars3Icon, 
  CalendarIcon, 
  ClipboardDocumentListIcon, 
  Cog6ToothIcon,
  StarIcon,
  ShoppingCartIcon,
  ViewColumnsIcon,
  SunIcon,
  MoonIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  HomeIcon,
  SwatchIcon
} from '@heroicons/react/24/outline';

import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../contexts/ThemeContext';
import { styled } from '@mui/material/styles';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
  position: 'sticky',
  top: 0
}));

const NavItem = styled(ListItem)(({ theme, active }) => ({
  borderRadius: theme.shape.borderRadius,
  margin: '4px 8px',
  cursor: 'pointer',
}));

// Custom styled IconButton to ensure proper display and cursor
const StyledIconButton = styled(IconButton)({
  cursor: 'pointer',
  color: 'inherit',
  padding: 8,
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
});

const HeroIcon = ({ icon: Icon }) => (
  <Icon className="h-5 w-5" />
);

export default function NavBar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { themeMode, toggleThemeMode } = useThemeMode();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Listen for fullscreen change events
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const navItems = [
    { path: '/calendar', label: 'Calendar', icon: CalendarIcon },
    { path: '/agenda', label: 'Daily Agenda', icon: ViewColumnsIcon },
    { path: '/dashboard', label: 'Dashboard', icon: ArrowsPointingOutIcon },
    { path: '/chores', label: 'Chores', icon: ClipboardDocumentListIcon },
    { path: '/rewards', label: 'Rewards', icon: StarIcon },
    { path: '/meals', label: 'Meal Planner', icon: HomeIcon },
    { path: '/grocery', label: 'Grocery List', icon: ShoppingCartIcon },
    { path: '/settings', label: 'Settings', icon: Cog6ToothIcon },
    { path: '/tailwind-example', label: 'UI Examples', icon: SwatchIcon },
  ];

  const renderNavItems = () => (
    <List>
      {navItems.map((item) => (
        <NavItem
          button
          key={item.path}
          active={location.pathname === item.path ? 1 : 0}
          onClick={() => {
            navigate(item.path);
            if (isMobile || isTablet) setDrawerOpen(false);
          }}
          className={`hover:bg-gray-100 dark:hover:bg-gray-800 ${
            location.pathname === item.path 
              ? 'bg-primary-100 dark:bg-primary-900' 
              : ''
          } transition-all duration-250 cursor-pointer`}
        >
          <ListItemIcon>
            <div className={`${
              location.pathname === item.path 
                ? 'text-primary-500' 
                : 'text-gray-600 dark:text-gray-300'
            }`}>
              <HeroIcon icon={item.icon} />
            </div>
          </ListItemIcon>
          <ListItemText 
            primary={item.label} 
            className={`${
              location.pathname === item.path 
                ? 'text-primary-500 font-medium' 
                : ''
            }`}
          />
        </NavItem>
      ))}
    </List>
  );

  return (
    <>
      <StyledAppBar className="border-b dark:border-gray-800">
        <Toolbar>
          {(isMobile || isTablet) && (
            <StyledIconButton
              edge="start"
              onClick={() => setDrawerOpen(true)}
              className="mr-2 cursor-pointer"
            >
              <Bars3Icon className="h-6 w-6" />
            </StyledIconButton>
          )}
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} className="font-semibold">
            FamHarmonyHQ
          </Typography>

          {!isMobile && !isTablet && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mr: 2 }}>
              {navItems.map((item) => (
                <div
                  key={item.path}
                  className={`nav-link ${location.pathname === item.path ? 'nav-link-active' : ''} cursor-pointer`}
                  onClick={() => navigate(item.path)}
                >
                  {item.label}
                </div>
              ))}
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode`}>
              <StyledIconButton 
                onClick={toggleThemeMode} 
                className="text-gray-700 dark:text-gray-200 hover:text-primary-500 dark:hover:text-primary-400 transition-all duration-250 cursor-pointer"
                size="medium"
              >
                {themeMode === 'light' 
                  ? <MoonIcon className="h-5 w-5" /> 
                  : <SunIcon className="h-5 w-5" />
                }
              </StyledIconButton>
            </Tooltip>
            
            <Tooltip title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
              <StyledIconButton 
                onClick={toggleFullscreen} 
                className="text-gray-700 dark:text-gray-200 hover:text-primary-500 dark:hover:text-primary-400 transition-all duration-250 cursor-pointer"
                size="medium"
              >
                {isFullscreen 
                  ? <ArrowsPointingInIcon className="h-5 w-5" /> 
                  : <ArrowsPointingOutIcon className="h-5 w-5" />
                }
              </StyledIconButton>
            </Tooltip>

            <StyledIconButton 
              onClick={handleProfileClick}
              className="ml-1 hover:ring-2 hover:ring-primary-200 dark:hover:ring-primary-800 transition-all duration-250 cursor-pointer"
            >
              <Avatar 
                src={user?.photoURL} 
                alt={user?.displayName}
                sx={{ width: 32, height: 32 }}
                className="bg-primary-500"
              >
                {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
              </Avatar>
            </StyledIconButton>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileClose}
            onClick={handleProfileClose}
            PaperProps={{
              className: 'mt-1 shadow-lg rounded-lg'
            }}
          >
            <MenuItem onClick={() => navigate('/settings')} className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <MenuItem onClick={handleLogout} className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </StyledAppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          className: 'dark:bg-background-paperDark'
        }}
      >
        <Box sx={{ width: 250, pt: 2 }}>
          {renderNavItems()}
        </Box>
      </Drawer>
    </>
  );
} 