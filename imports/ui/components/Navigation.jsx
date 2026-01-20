// imports/ui/components/Navigation.jsx

import React from 'react';
import { Meteor } from 'meteor/meteor';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Collapse,
  Divider,
  Typography,
  Box,
  Chip
} from '@mui/material';
import {
  Dashboard,
  People,
  LocalHospital,
  Assignment,
  BarChart,
  Settings,
  Security,
  ExpandLess,
  ExpandMore,
  Home,
  PersonAdd,
  Policy,
  Biotech,
  Medication,
  CalendarMonth
} from '@mui/icons-material';
import { get } from 'lodash';

// Context-aware navigation component
export function Navigation({ onNavigate, currentPath, isAuthenticated, userRole }) {
  const [openSections, setOpenSections] = React.useState({});

  // Get enabled modules from settings
  const modules = get(Meteor, 'settings.public.modules', {});

  // Toggle section
  const handleSectionToggle = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Check if path is active
  const isActive = (path) => {
    return currentPath === path || currentPath.startsWith(path + '/');
  };

  // Navigation structure based on authentication and role
  const getNavigationItems = () => {
    const items = [];

    // Public items (always visible)
    items.push({
      type: 'item',
      label: 'Home',
      icon: <Home />,
      path: '/',
      public: true
    });

    if (!isAuthenticated) {
      // Not authenticated - show limited options
      if (modules.accounts?.enabled) {
        items.push({
          type: 'divider'
        });
        items.push({
          type: 'item',
          label: 'Sign In',
          icon: <PersonAdd />,
          path: '/login',
          public: true
        });
      }
      return items;
    }

    // Authenticated users
    items.push({
      type: 'divider'
    });

    // Dashboard
    items.push({
      type: 'item',
      label: 'Dashboard',
      icon: <Dashboard />,
      path: '/dashboard',
      roles: ['admin', 'clinician', 'patient', 'user']
    });

    // Clinical Data (for clinicians and admins)
    if (['admin', 'clinician'].includes(userRole)) {
      items.push({
        type: 'section',
        label: 'Clinical Data',
        icon: <LocalHospital />,
        key: 'clinical',
        children: [
          { label: 'Patients', path: '/patients', icon: <People /> },
          { label: 'Encounters', path: '/encounters', icon: <Assignment /> },
          { label: 'Observations', path: '/observations', icon: <Biotech /> },
          { label: 'Medications', path: '/medications', icon: <Medication /> },
          { label: 'Appointments', path: '/appointments', icon: <CalendarMonth /> }
        ]
      });
    }

    // Patient Portal (for patients)
    if (userRole === 'patient') {
      items.push({
        type: 'section',
        label: 'My Health',
        icon: <LocalHospital />,
        key: 'myhealth',
        children: [
          { label: 'My Records', path: '/my-records', icon: <Assignment /> },
          { label: 'My Medications', path: '/my-medications', icon: <Medication /> },
          { label: 'My Appointments', path: '/my-appointments', icon: <CalendarMonth /> }
        ]
      });
    }

    // Reports (for authorized users)
    if (['admin', 'clinician', 'auditor'].includes(userRole)) {
      items.push({
        type: 'item',
        label: 'Reports',
        icon: <BarChart />,
        path: '/reports',
        roles: ['admin', 'clinician', 'auditor']
      });
    }

    // Compliance (if HIPAA module is enabled)
    if (modules.hipaa?.enabled && ['admin', 'auditor'].includes(userRole)) {
      items.push({
        type: 'section',
        label: 'Compliance',
        icon: <Policy />,
        key: 'compliance',
        children: [
          { label: 'Audit Log', path: '/hipaa/audit-log', icon: <Security /> },
          { label: 'Policies', path: '/hipaa/policies', icon: <Policy /> }
        ]
      });
    }

    // Admin section
    if (userRole === 'admin') {
      items.push({
        type: 'divider'
      });
      items.push({
        type: 'section',
        label: 'Administration',
        icon: <Settings />,
        key: 'admin',
        children: [
          { label: 'Users', path: '/admin/users', icon: <People /> },
          { label: 'Settings', path: '/admin/settings', icon: <Settings /> },
          { label: 'Security', path: '/admin/security', icon: <Security /> }
        ]
      });
    }

    return items;
  };

  // Render navigation item
  const renderNavigationItem = (item, index) => {
    // Divider
    if (item.type === 'divider') {
      return <Divider key={index} sx={{ my: 1 }} />;
    }

    // Section with children
    if (item.type === 'section') {
      const isOpen = openSections[item.key];
      const hasActiveChild = item.children.some(child => isActive(child.path));

      return (
        <React.Fragment key={item.key}>
          <ListItemButton 
            onClick={() => handleSectionToggle(item.key)}
            selected={hasActiveChild}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
            {isOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children.map((child, childIndex) => (
                <ListItemButton
                  key={childIndex}
                  sx={{ pl: 4 }}
                  selected={isActive(child.path)}
                  onClick={() => onNavigate(child.path)}
                >
                  <ListItemIcon>{child.icon}</ListItemIcon>
                  <ListItemText primary={child.label} />
                </ListItemButton>
              ))}
            </List>
          </Collapse>
        </React.Fragment>
      );
    }

    // Simple item
    return (
      <ListItemButton
        key={index}
        selected={isActive(item.path)}
        onClick={() => onNavigate(item.path)}
      >
        <ListItemIcon>{item.icon}</ListItemIcon>
        <ListItemText primary={item.label} />
        {item.badge && (
          <Chip 
            label={item.badge} 
            size="small" 
            color={item.badgeColor || 'default'}
          />
        )}
      </ListItemButton>
    );
  };

  // Filter items based on role
  const navigationItems = getNavigationItems().filter(item => {
    if (item.public) return true;
    if (!isAuthenticated) return false;
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });

  return (
    <Box>
      {/* User info */}
      {isAuthenticated && userRole && (
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Logged in as
          </Typography>
          <Chip 
            label={userRole} 
            size="small" 
            color="primary"
            sx={{ mt: 0.5 }}
          />
        </Box>
      )}

      {/* Navigation items */}
      <List>
        {navigationItems.map((item, index) => renderNavigationItem(item, index))}
      </List>
    </Box>
  );
}