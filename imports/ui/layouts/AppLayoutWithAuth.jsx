// imports/ui/layouts/AppLayoutWithAuth.jsx

import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  useTheme,
  useMediaQuery,
  Container,
  Chip
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Notifications,
  Settings,
  Logout,
  Dashboard,
  Security,
  Help,
  ChevronLeft
} from '@mui/icons-material';
import { Session } from 'meteor/session';
import { get } from 'lodash';

// Import components
import { Navigation } from '../components/Navigation';
import { UserMenu } from '../components/UserMenu';

// Layout with authentication features
export function AppLayoutWithAuth({ children }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);

  // Track user and application state
  const { user, isAuthenticated, notificationCount, currentTheme } = useTracker(() => {
    const user = Meteor.user();
    
    return {
      user,
      isAuthenticated: !!user,
      notificationCount: Session.get('notificationCount') || 0,
      currentTheme: Session.get('theme') || 'light'
    };
  });

  // Get app configuration
  const appName = get(Meteor, 'settings.public.appName', 'Honeycomb');
  const showNotifications = get(Meteor, 'settings.public.features.notifications', true);
  const showUserAvatar = get(Meteor, 'settings.public.features.userAvatar', true);

  // Handle drawer toggle
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Handle user menu
  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  // Handle notifications
  const handleNotificationOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  // Handle logout
  const handleLogout = () => {
    handleUserMenuClose();
    Meteor.logout(() => {
      navigate('/login');
    });
  };

  // Handle navigation
  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  // Get user display info
  const getUserName = () => {
    if (!user) return 'Guest';
    return user.profile?.name || user.username || user.emails?.[0]?.address?.split('@')[0] || 'User';
  };

  const getUserAvatar = () => {
    if (!user) return null;
    return user.profile?.avatar || 
           user.services?.google?.picture ||
           user.services?.github?.avatar_url ||
           null;
  };

  const getUserRole = () => {
    if (!user) return null;
    if (user.roles?.includes('admin')) return 'Admin';
    if (user.roles?.includes('clinician')) return 'Clinician';
    if (user.roles?.includes('patient')) return 'Patient';
    return 'User';
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: currentTheme === 'dark' ? '#1a1a1a' : undefined
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {appName}
          </Typography>

          {/* Notifications */}
          {isAuthenticated && showNotifications && (
            <IconButton 
              color="inherit" 
              onClick={handleNotificationOpen}
              sx={{ mr: 1 }}
            >
              <Badge badgeContent={notificationCount} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          )}

          {/* User Menu */}
          {isAuthenticated ? (
            <IconButton
              onClick={handleUserMenuOpen}
              color="inherit"
            >
              {showUserAvatar && getUserAvatar() ? (
                <Avatar 
                  src={getUserAvatar()} 
                  alt={getUserName()}
                  sx={{ width: 32, height: 32 }}
                />
              ) : (
                <AccountCircle />
              )}
            </IconButton>
          ) : (
            <Chip
              label="Not logged in"
              size="small"
              variant="outlined"
              sx={{ color: 'white', borderColor: 'white' }}
              onClick={() => navigate('/login')}
            />
          )}
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={drawerOpen}
        onClose={handleDrawerToggle}
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            backgroundColor: currentTheme === 'dark' ? '#1a1a1a' : undefined
          }
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', flex: 1 }}>
          <Navigation 
            onNavigate={handleNavigate}
            currentPath={location.pathname}
            isAuthenticated={isAuthenticated}
            userRole={getUserRole()}
          />
        </Box>
        
        {/* Drawer Footer */}
        {!isMobile && (
          <Box sx={{ p: 2 }}>
            <IconButton 
              onClick={handleDrawerToggle}
              sx={{ ml: 'auto', display: 'block' }}
            >
              <ChevronLeft />
            </IconButton>
          </Box>
        )}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerOpen ? 240 : 0}px)` },
          ml: { sm: drawerOpen ? 0 : 0 },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          })
        }}
      >
        <Toolbar />
        <Container maxWidth="lg">
          {children}
        </Container>
      </Box>

      {/* User Menu */}
      <UserMenu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        user={user}
        onLogout={handleLogout}
        onNavigate={(path) => {
          handleUserMenuClose();
          navigate(path);
        }}
      />

      {/* Notification Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationClose}
        PaperProps={{
          sx: { width: 320, maxHeight: 400 }
        }}
      >
        <MenuItem>
          <Typography variant="subtitle2">No new notifications</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
}