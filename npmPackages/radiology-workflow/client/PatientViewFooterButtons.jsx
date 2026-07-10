// npmPackages/radiology-workflow/client/PatientViewFooterButtons.jsx

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import DescriptionIcon from '@mui/icons-material/Description';
import SummarizeIcon from '@mui/icons-material/Summarize';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import TimelineIcon from '@mui/icons-material/Timeline';
import ViewTimelineIcon from '@mui/icons-material/ViewTimeline';

const footerRoutes = [
  { label: 'Patient Chart', path: '/patient-chart', icon: DescriptionIcon },
  { label: 'IPS', path: '/international-patient-summary', icon: SummarizeIcon },
  { label: 'FHIR Graph', path: '/fhir-graph', icon: AccountTreeIcon },
  { label: 'Clinical Story', path: '/clinical-story', icon: AutoStoriesIcon }
];

// Conditionally add Editor button if the timeline-editor extension is installed
if (typeof Package !== 'undefined' && Package['@orbital/timeline-editor']) {
  footerRoutes.push({ label: 'Editor', path: '/timeline-editor', icon: TimelineIcon });
}

// Conditionally add Chronology button if timelines package is loaded
if (typeof Package !== 'undefined' && Package['symptomatic:timelines']) {
  footerRoutes.push({ label: 'Chronology', path: '/timeline-vertical', icon: ViewTimelineIcon });
}

function PatientViewFooterButtons() {
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

export default PatientViewFooterButtons;
