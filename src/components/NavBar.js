import React from 'react';
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
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  CalendarMonth,
  Assignment,
  Settings,
  Logout
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { styled } from '@mui/material/styles';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
}));

const NavItem = styled(ListItem)(({ theme, active }) => ({
  borderRadius: theme.shape.borderRadius,
  margin: '4px 8px',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  ...(active && {
    backgroundColor: theme.palette.primary.light,
    '&:hover': {
      backgroundColor: theme.palette.primary.light,
    }
  })
}));

export default function NavBar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);

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

  const navItems = [
    { path: '/calendar', label: 'Calendar', icon: <CalendarMonth /> },
    { path: '/chores', label: 'Chores', icon: <Assignment /> },
    { path: '/settings', label: 'Settings', icon: <Settings /> }
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
            if (isMobile) setDrawerOpen(false);
          }}
        >
          <ListItemIcon sx={{ 
            color: location.pathname === item.path ? 'primary.main' : 'inherit'
          }}>
            {item.icon}
          </ListItemIcon>
          <ListItemText primary={item.label} />
        </NavItem>
      ))}
    </List>
  );

  return (
    <>
      <StyledAppBar position="fixed">
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            FamHarmonyHQ
          </Typography>

          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mr: 2 }}>
              {navItems.map((item) => (
                <Typography
                  key={item.path}
                  sx={{
                    cursor: 'pointer',
                    color: location.pathname === item.path ? 'primary.main' : 'inherit',
                    '&:hover': { color: 'primary.main' }
                  }}
                  onClick={() => navigate(item.path)}
                >
                  {item.label}
                </Typography>
              ))}
            </Box>
          )}

          <IconButton onClick={handleProfileClick}>
            <Avatar 
              src={user?.photoURL} 
              alt={user?.displayName}
              sx={{ width: 32, height: 32 }}
            >
              {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileClose}
            onClick={handleProfileClose}
          >
            <MenuItem onClick={() => navigate('/settings')}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <MenuItem onClick={handleLogout}>
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
      >
        <Box sx={{ width: 250, pt: 2 }}>
          {renderNavItems()}
        </Box>
      </Drawer>

      {/* Add toolbar spacing */}
      <Toolbar />
    </>
  );
} 