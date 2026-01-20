// imports/ui/layouts/AppLayoutNoAuth.jsx

import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  Container,
  useTheme,
  useMediaQuery,
  Button
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft,
  Home,
  Info
} from '@mui/icons-material';
import { Session } from 'meteor/session';
import { get } from 'lodash';

// Simplified layout without authentication
export function AppLayoutNoAuth({ children }) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);

  // Get app configuration
  const appName = get(Meteor, 'settings.public.appName', 'Honeycomb');
  const currentTheme = Session.get('theme') || 'light';

  // Handle drawer toggle
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
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

          {/* Simple navigation buttons */}
          <Button 
            color="inherit" 
            startIcon={<Home />}
            onClick={() => navigate('/')}
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            Home
          </Button>
          <Button 
            color="inherit" 
            startIcon={<Info />}
            onClick={() => navigate('/about')}
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            About
          </Button>
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
        <Box sx={{ overflow: 'auto', flex: 1, p: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Public Access Mode
          </Typography>
          
          {/* Simple navigation */}
          <Button
            fullWidth
            startIcon={<Home />}
            onClick={() => {
              navigate('/');
              if (isMobile) setDrawerOpen(false);
            }}
            sx={{ 
              justifyContent: 'flex-start',
              mb: 1,
              backgroundColor: location.pathname === '/' ? 'action.selected' : undefined
            }}
          >
            Home
          </Button>
          
          <Button
            fullWidth
            startIcon={<Info />}
            onClick={() => {
              navigate('/about');
              if (isMobile) setDrawerOpen(false);
            }}
            sx={{ 
              justifyContent: 'flex-start',
              backgroundColor: location.pathname === '/about' ? 'action.selected' : undefined
            }}
          >
            About
          </Button>
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
    </Box>
  );
}