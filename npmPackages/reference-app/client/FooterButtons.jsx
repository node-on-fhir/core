// npmPackages/reference-app/client/FooterButtons.jsx

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import AssessmentIcon from '@mui/icons-material/Assessment';
import FactCheckIcon from '@mui/icons-material/FactCheck';

const footerRoutes = [
  { label: 'Score Card', path: '/reference-app', icon: AssessmentIcon },
  { label: 'G10 Criteria', path: '/g10-certification', icon: FactCheckIcon }
];

export function ReferenceAppFooterButtons() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Box className="footer-buttons-reference-app" sx={{
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
            id={'reference-app-' + route.label.toLowerCase().replace(/\s+/g, '-') + '-footer-btn'}
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

export default ReferenceAppFooterButtons;
