// npmPackages/radiology-workflow/client/PacioExamRoomFooterButtons.jsx

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import AssignmentIcon from '@mui/icons-material/Assignment';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import VisibilityIcon from '@mui/icons-material/Visibility';

const footerRoutes = [
  { label: 'Exam Room', path: '/pacio-exam-room', icon: MeetingRoomIcon },
  { label: 'Order Entry', path: '/radiology/order-entry', icon: AssignmentIcon },
  { label: 'Technologist Worklist', path: '/radiology/tech', icon: MedicalServicesIcon },
  { label: 'Radiologist Worklist', path: '/radiology/reading', icon: VisibilityIcon }
];

function PacioExamRoomFooterButtons() {
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
              // Active route: white pill with blue text — clear, high-contrast on the
              // blue footer bar (replaces the previous purple 'secondary' highlight).
              ...(isActive && {
                backgroundColor: 'common.white',
                color: 'primary.main',
                fontWeight: 600,
                '&:hover': { backgroundColor: 'common.white' }
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

export default PacioExamRoomFooterButtons;
