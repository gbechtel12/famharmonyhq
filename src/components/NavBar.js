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
  Tooltip,
  Container,
  Divider
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
  backgroundColor: theme.palette.mode === 'dark' 
    ? 'rgba(22, 28, 36, 0.95)' 
    : 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  color: theme.palette.text.primary,
  boxShadow: theme.palette.mode === 'dark' 
    ? '0 1px 3px rgba(0,0,0,0.4)' 
    : '0 1px 2px rgba(0,0,0,0.08)',
  position: 'sticky',
  top: 0,
  zIndex: 1100,
  height: 64,
  borderBottom: theme.palette.mode === 'dark' 
    ? '1px solid rgba(255, 255, 255, 0.08)' 
    : '1px solid rgba(0, 0, 0, 0.06)'
}));

const NavItem = styled(ListItem)(({ theme, isActive }) => ({
  borderRadius: theme.shape.borderRadius,
  margin: '4px 8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  backgroundColor: isActive 
    ? (theme.palette.mode === 'dark' ? 'rgba(69, 133, 245, 0.15)' : 'rgba(69, 133, 245, 0.08)')
    : 'transparent',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'
  }
}));

// Custom styled IconButton for toolbar
const ToolbarIconButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
  padding: 8,
  margin: '0 4px',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
    transform: 'translateY(-2px)'
  },
  transition: 'all 0.2s ease'
}));

const LogoText = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  fontSize: '1.5rem',
  color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
  cursor: 'pointer',
  textAlign: 'center',
  letterSpacing: '0.5px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'color 0.3s ease, transform 0.2s ease',
  '&:hover': {
    transform: 'scale(1.03)'
  }
}));

const NavButton = styled(Box)(({ theme, isActive }) => ({
  cursor: 'pointer',
  padding: '6px 12px',
  height: 40,
  display: 'flex',
  alignItems: 'center',
  borderRadius: theme.shape.borderRadius,
  transition: 'all 0.2s ease',
  fontWeight: isActive ? 600 : 500,
  color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
  backgroundColor: isActive ? (theme.palette.mode === 'dark' ? 'rgba(69, 133, 245, 0.15)' : 'rgba(69, 133, 245, 0.08)') : 'transparent',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
    transform: 'translateY(-2px)',
    color: theme.palette.primary.main
  }
}));

const HeroIcon = ({ icon: Icon }) => (
  <Icon className="h-5 w-5" />
);

export default function NavBar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { themeMode, toggleThemeMode } = useThemeMode();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
  
  // Add scroll detection for navbar styling
  React.useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Main navigation items - keep the most important ones for the top bar
  const mainNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: ArrowsPointingOutIcon },
    { path: '/calendar', label: 'Calendar', icon: CalendarIcon },
    { path: '/agenda', label: 'Daily Agenda', icon: ViewColumnsIcon },
    { path: '/chores', label: 'Chores', icon: ClipboardDocumentListIcon },
    { path: '/rewards', label: 'Rewards', icon: StarIcon },
    { path: '/meals', label: 'Meal Planner', icon: HomeIcon }
  ];
  
  // Additional navigation items for the drawer
  const allNavItems = [
    ...mainNavItems,
    { path: '/grocery', label: 'Grocery List', icon: ShoppingCartIcon },
    { path: '/settings', label: 'Settings', icon: Cog6ToothIcon },
    { path: '/tailwind-example', label: 'UI Examples', icon: SwatchIcon }
  ];

  const renderNavItems = () => (
    <List sx={{ width: '100%' }}>
      {allNavItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <NavItem
            button
            key={item.path}
            isActive={isActive}
            onClick={() => {
              navigate(item.path);
              setDrawerOpen(false);
            }}
          >
            <ListItemIcon sx={{ 
              color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
              minWidth: 40
            }}>
              <HeroIcon icon={item.icon} />
            </ListItemIcon>
            <ListItemText 
              primary={item.label} 
              primaryTypographyProps={{ 
                fontWeight: isActive ? 600 : 400,
                color: isActive ? theme.palette.primary.main : 'inherit'
              }}
            />
          </NavItem>
        );
      })}
    </List>
  );

  return (
    <>
      <StyledAppBar elevation={0} className={scrolled ? 'scrolled' : ''}>
        <Toolbar disableGutters>
          <Container maxWidth="xl">
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', px: { xs: 1, sm: 2 } }}>
              {/* Mobile menu button */}
              <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
                <ToolbarIconButton
                  edge="start"
                  onClick={() => setDrawerOpen(true)}
                  aria-label="menu"
                  size="small"
                >
                  <Bars3Icon className="h-6 w-6" />
                </ToolbarIconButton>
              </Box>
              
              {/* Desktop navigation */}
              <Box 
                sx={{ 
                  display: { xs: 'none', md: 'flex' }, 
                  alignItems: 'center', 
                  gap: 2,
                  flex: 1,
                  justifyContent: 'flex-end'
                }}
              >
                {mainNavItems.slice(0, 3).map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <NavButton
                      key={item.path}
                      isActive={isActive}
                      onClick={() => navigate(item.path)}
                      sx={{ display: 'flex', alignItems: 'center' }}
                      className={isActive ? 'active' : ''}
                    >
                      <Box sx={{ mr: 0.5, display: 'flex', alignItems: 'center' }}>
                        <HeroIcon icon={item.icon} />
                      </Box>
                      {item.label}
                    </NavButton>
                  );
                })}
              </Box>
              
              {/* Logo - centered on all displays */}
              <Box
                sx={{ 
                  display: 'flex',
                  justifyContent: 'center',
                  flex: { xs: 1, md: 0 },
                  mx: { xs: 2, md: 4 }
                }}
              >
                <LogoText onClick={() => navigate('/dashboard')}>
                  FamHarmonyHQ
                </LogoText>
              </Box>
              
              {/* Desktop navigation - right side */}
              <Box 
                sx={{ 
                  display: { xs: 'none', md: 'flex' }, 
                  alignItems: 'center', 
                  gap: 2,
                  flex: 1,
                  justifyContent: 'flex-start'
                }}
              >
                {mainNavItems.slice(3, 6).map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <NavButton
                      key={item.path}
                      isActive={isActive}
                      onClick={() => navigate(item.path)}
                      sx={{ display: 'flex', alignItems: 'center' }}
                      className={isActive ? 'active' : ''}
                    >
                      <Box sx={{ mr: 0.5, display: 'flex', alignItems: 'center' }}>
                        <HeroIcon icon={item.icon} />
                      </Box>
                      {item.label}
                    </NavButton>
                  );
                })}
              </Box>
              
              {/* Action buttons - always visible */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: { xs: 0.5, sm: 1 }
                }}
              >
                <Tooltip title={`Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode`}>
                  <ToolbarIconButton onClick={toggleThemeMode} size="small">
                    {themeMode === 'light' 
                      ? <MoonIcon className="h-5 w-5" /> 
                      : <SunIcon className="h-5 w-5" />
                    }
                  </ToolbarIconButton>
                </Tooltip>
                
                <Tooltip title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
                  <ToolbarIconButton onClick={toggleFullscreen} size="small">
                    {isFullscreen 
                      ? <ArrowsPointingInIcon className="h-5 w-5" /> 
                      : <ArrowsPointingOutIcon className="h-5 w-5" />
                    }
                  </ToolbarIconButton>
                </Tooltip>

                <ToolbarIconButton 
                  onClick={handleProfileClick}
                  size="small"
                  sx={{
                    ml: { xs: 0.5, sm: 1 },
                    '&:hover': {
                      boxShadow: `0 0 0 2px ${theme.palette.primary.main}`
                    }
                  }}
                >
                  <Avatar 
                    src={user?.photoURL} 
                    alt={user?.displayName}
                    sx={{ 
                      width: 32, 
                      height: 32,
                      bgcolor: theme.palette.primary.main
                    }}
                  >
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
                  </Avatar>
                </ToolbarIconButton>
              </Box>
            </Box>
          </Container>
        </Toolbar>
      </StyledAppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileClose}
        onClick={handleProfileClose}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            borderRadius: 2,
            minWidth: 180,
            overflow: 'hidden',
            border: theme.palette.mode === 'dark' 
              ? '1px solid rgba(255, 255, 255, 0.08)'
              : '1px solid rgba(0, 0, 0, 0.08)'
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem 
          onClick={() => navigate('/settings')}
          sx={{ 
            py: 1.5, 
            px: 2,
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          <ListItemIcon>
            <Settings fontSize="small" color="primary" />
          </ListItemIcon>
          <Typography variant="body2">Settings</Typography>
        </MenuItem>
        
        <Divider />
        
        <MenuItem 
          onClick={handleLogout}
          sx={{ 
            py: 1.5, 
            px: 2,
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(0, 0, 0, 0.04)'
            }
          }}
        >
          <ListItemIcon>
            <Logout fontSize="small" color="error" />
          </ListItemIcon>
          <Typography variant="body2">Logout</Typography>
        </MenuItem>
      </Menu>

      {/* Mobile navigation drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: { 
            width: { xs: '85%', sm: 320 },
            backgroundImage: theme.palette.mode === 'dark'
              ? 'linear-gradient(to bottom, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))'
              : 'linear-gradient(to bottom, rgba(255, 255, 255, 0.95), rgba(249, 250, 251, 0.95))',
            backdropFilter: 'blur(12px)',
            borderRight: theme.palette.mode === 'dark' 
              ? '1px solid rgba(255, 255, 255, 0.08)'
              : '1px solid rgba(0, 0, 0, 0.08)'
          }
        }}
      >
        <Box sx={{ pt: 3, pb: 2 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              mb: 3, 
              mt: 1 
            }}
          >
            <LogoText 
              variant="h6" 
              component="div" 
              onClick={() => {
                navigate('/dashboard');
                setDrawerOpen(false);
              }}
            >
              FamHarmonyHQ
            </LogoText>
          </Box>

          {/* User info in drawer */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            px: 3, 
            pb: 2 
          }}>
            <Avatar 
              src={user?.photoURL} 
              alt={user?.displayName}
              sx={{ 
                width: 40, 
                height: 40,
                bgcolor: theme.palette.primary.main
              }}
            >
              {user?.displayName?.charAt(0) || user?.email?.charAt(0)}
            </Avatar>
            <Box sx={{ ml: 1.5 }}>
              <Typography variant="subtitle2">
                {user?.displayName || 'Welcome!'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.email || ''}
              </Typography>
            </Box>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          {renderNavItems()}
        </Box>
      </Drawer>
    </>
  );
} 