// npmPackages/radiology-workflow/client/RadiologyToolsFooterButtons.jsx

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import ChecklistIcon from '@mui/icons-material/Checklist';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import QuizIcon from '@mui/icons-material/Quiz';

const allFooterRoutes = [
  { label: 'Checklists', path: '/checklist-manifesto', icon: ChecklistIcon, requirePackage: 'clinical:checklist-manifesto' },
  { label: 'Vital Signs', path: '/take-vital-signs', icon: MonitorHeartIcon, requirePackage: 'clinical:vital-signs' },
  { label: 'Questionnaires', path: '/structured-data-capture', icon: QuizIcon, requirePackage: 'clinical:structured-data-capture' }
];

const footerRoutes = allFooterRoutes.filter(function(route) {
  if (route.requirePackage) {
    return typeof Package !== 'undefined' && !!Package[route.requirePackage];
  }
  return true;
});

function RadiologyToolsFooterButtons() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box className="footer-buttons-radiology-workflow" sx={{
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      alignItems: 'center',
      width: '100%'
    }}>
      {footerRoutes.map(function(route) {
        const isActive = location.pathname === route.path;
        const IconComponent = route.icon;

        return (
          <Button
            key={route.path}
            id={'radiology-workflow-' + route.label.toLowerCase().replace(/\s+/g, '-') + '-footer-btn'}
            variant={isActive ? 'contained' : 'text'}
            color="inherit"
            size="small"
            startIcon={<IconComponent />}
            onClick={function() { navigate(route.path); }}
            sx={{
              textTransform: 'none',
              minWidth: 0,
              px: 1.5,
              fontSize: '0.75rem',
              // Active route: white pill with footer-background-colored text
              // (the footer paints the appbar navy in BOTH light and dark
              // mode, so secondary/purple never fit)
              ...(isActive && {
                bgcolor: '#ffffff',
                color: 'primary.main',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.85)' }
              })
            }}
          >
            {route.label}
          </Button>
        );
      })}
    </Box>
  );
}

export default RadiologyToolsFooterButtons;
