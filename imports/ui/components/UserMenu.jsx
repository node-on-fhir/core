// imports/ui/components/UserMenu.jsx

import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
  Avatar,
  Chip
} from '@mui/material';
import {
  Person,
  Settings,
  Security,
  Logout,
  Dashboard,
  Help,
  BugReport,
  LightMode,
  DarkMode,
  Language,
  Notifications
} from '@mui/icons-material';
import { Session } from 'meteor/session';
import { get } from 'lodash';

// User menu component - only shows when appropriate
export function UserMenu({ anchorEl, open, onClose, user, onLogout, onNavigate }) {
  if (!user) return null;

  // Get current theme
  const currentTheme = Session.get('theme') || 'light';

  // Get user info
  const getUserName = () => {
    return user.profile?.name || 
           user.username || 
           user.emails?.[0]?.address?.split('@')[0] || 
           'User';
  };

  const getUserEmail = () => {
    return user.emails?.[0]?.address || '';
  };

  const getUserAvatar = () => {
    return user.profile?.avatar || 
           user.services?.google?.picture ||
           user.services?.github?.avatar_url ||
           null;
  };

  const getUserRole = () => {
    if (user.roles?.includes('admin')) return { label: 'Admin', color: 'error' };
    if (user.roles?.includes('clinician')) return { label: 'Clinician', color: 'primary' };
    if (user.roles?.includes('patient')) return { label: 'Patient', color: 'info' };
    return { label: 'User', color: 'default' };
  };

  // Handle theme toggle
  const handleThemeToggle = () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    Session.set('theme', newTheme);
    localStorage.setItem('userTheme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const role = getUserRole();

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: 280, maxWidth: '100%' }
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      {/* User Header */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar 
            src={getUserAvatar()} 
            alt={getUserName()}
            sx={{ width: 40, height: 40, mr: 2 }}
          >
            {!getUserAvatar() && getUserName()[0]?.toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" noWrap>
              {getUserName()}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {getUserEmail()}
            </Typography>
          </Box>
        </Box>
        <Chip 
          label={role.label} 
          size="small" 
          color={role.color}
          sx={{ mt: 0.5 }}
        />
      </Box>

      <Divider />

      {/* Profile */}
      <MenuItem onClick={() => { onNavigate('/profile'); onClose(); }}>
        <ListItemIcon>
          <Person fontSize="small" />
        </ListItemIcon>
        <ListItemText>My Profile</ListItemText>
      </MenuItem>

      {/* Dashboard */}
      <MenuItem onClick={() => { onNavigate('/dashboard'); onClose(); }}>
        <ListItemIcon>
          <Dashboard fontSize="small" />
        </ListItemIcon>
        <ListItemText>Dashboard</ListItemText>
      </MenuItem>

      {/* Settings */}
      <MenuItem onClick={() => { onNavigate('/settings'); onClose(); }}>
        <ListItemIcon>
          <Settings fontSize="small" />
        </ListItemIcon>
        <ListItemText>Settings</ListItemText>
      </MenuItem>

      {/* Notifications */}
      {get(Meteor, 'settings.public.features.notifications', true) && (
        <MenuItem onClick={() => { onNavigate('/notifications'); onClose(); }}>
          <ListItemIcon>
            <Notifications fontSize="small" />
          </ListItemIcon>
          <ListItemText>Notifications</ListItemText>
          {Session.get('notificationCount') > 0 && (
            <Chip 
              label={Session.get('notificationCount')} 
              size="small" 
              color="error"
              sx={{ ml: 1 }}
            />
          )}
        </MenuItem>
      )}

      <Divider />

      {/* Theme Toggle */}
      <MenuItem onClick={handleThemeToggle}>
        <ListItemIcon>
          {currentTheme === 'light' ? <DarkMode fontSize="small" /> : <LightMode fontSize="small" />}
        </ListItemIcon>
        <ListItemText>{currentTheme === 'light' ? 'Dark Mode' : 'Light Mode'}</ListItemText>
      </MenuItem>

      {/* Language (if multilingual is enabled) */}
      {get(Meteor, 'settings.public.features.multilingual', false) && (
        <MenuItem onClick={() => { onNavigate('/language'); onClose(); }}>
          <ListItemIcon>
            <Language fontSize="small" />
          </ListItemIcon>
          <ListItemText>Language</ListItemText>
        </MenuItem>
      )}

      <Divider />

      {/* Admin Options */}
      {user.roles?.includes('admin') && (
        <>
          <MenuItem onClick={() => { onNavigate('/admin'); onClose(); }}>
            <ListItemIcon>
              <Security fontSize="small" />
            </ListItemIcon>
            <ListItemText>Admin Panel</ListItemText>
          </MenuItem>
          <Divider />
        </>
      )}

      {/* Help & Support */}
      <MenuItem onClick={() => { onNavigate('/help'); onClose(); }}>
        <ListItemIcon>
          <Help fontSize="small" />
        </ListItemIcon>
        <ListItemText>Help & Support</ListItemText>
      </MenuItem>

      {/* Debug (in development) */}
      {get(Meteor, 'settings.public.environment') === 'development' && (
        <MenuItem onClick={() => { onNavigate('/debug'); onClose(); }}>
          <ListItemIcon>
            <BugReport fontSize="small" />
          </ListItemIcon>
          <ListItemText>Debug Info</ListItemText>
        </MenuItem>
      )}

      <Divider />

      {/* Logout */}
      <MenuItem onClick={onLogout}>
        <ListItemIcon>
          <Logout fontSize="small" />
        </ListItemIcon>
        <ListItemText>Sign Out</ListItemText>
      </MenuItem>
    </Menu>
  );
}