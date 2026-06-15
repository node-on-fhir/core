// npmPackages/fhircast-module/client/components/FhircastNavButtons.jsx

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import CastIcon from '@mui/icons-material/Cast';
import CellTowerIcon from '@mui/icons-material/CellTower';

// =============================================================================
// FHIRCAST NAV BUTTONS
// =============================================================================

var footerRoutes = [
  { label: 'Subscribe', path: '/fhircast-subscribe', icon: CastIcon },
  { label: 'Publish', path: '/fhircast-publish', icon: CellTowerIcon }
];

function FhircastNavButtons() {
  var navigate = useNavigate();
  var location = useLocation();

  return (
    <Box className="footer-buttons-fhircast" sx={{
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      alignItems: 'center',
      width: '100%'
    }}>
      {footerRoutes.map(function(route) {
        var isActive = location.pathname === route.path;
        var IconComponent = route.icon;

        return (
          <Button
            key={route.path}
            id={'fhircast-' + route.label.toLowerCase().replace(/\s+/g, '-') + '-footer-btn'}
            variant={isActive ? 'contained' : 'text'}
            color={isActive ? 'secondary' : 'inherit'}
            size="small"
            startIcon={<IconComponent />}
            onClick={function() { navigate(route.path); }}
            sx={{
              textTransform: 'none',
              minWidth: 0,
              px: 1.5,
              fontSize: '0.75rem'
            }}
          >
            {route.label}
          </Button>
        );
      })}
    </Box>
  );
}

export default FhircastNavButtons;
