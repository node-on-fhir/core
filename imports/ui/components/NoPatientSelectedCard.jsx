// imports/ui/components/NoPatientSelectedCard.jsx

import React from 'react';
import { Card, CardContent, Typography, Button, Box } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useNavigate } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

let useAppTheme;
if (Meteor.isClient) {
  Meteor.startup(function(){
    useAppTheme = Meteor.useTheme;
  });
}

// `context` is optional (design v2 §D) — the diagnostic slot. Shape:
//   { reason, routePath, role, hasProfileLink }
// Absent context degrades to the original "No Patient Selected" copy, so
// legacy/prop-less callers are unaffected.
export function NoPatientSelectedCard({ context }) {
  const navigate = useNavigate();
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';

  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';
  const borderColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
  const subTextColor = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)';

  const reason = get(context, 'reason');
  const routePath = get(context, 'routePath');
  const noProfileLink = reason === 'no-profile-link';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        textAlign: 'center'
      }}
    >
      <Card
        sx={{
          maxWidth: '600px',
          width: '100%',
          borderRadius: 3,
          boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid',
          borderColor: borderColor,
          bgcolor: cardBgColor
        }}
      >
        <CardContent sx={{ p: 6 }}>
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 500,
                color: cardTextColor,
                mb: 2
              }}
            >
              No Patient Selected
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: subTextColor,
                lineHeight: 1.7,
                maxWidth: '480px',
                mx: 'auto'
              }}
            >
              {noProfileLink
                ? "You're signed in as a patient but no record is linked to your profile. Link one to continue."
                : 'Please select a patient to view their data.'}
            </Typography>
            {routePath ? (
              <Typography
                variant="caption"
                sx={{ display: 'block', mt: 1.5, color: subTextColor }}
              >
                Blocked route: {routePath}
              </Typography>
            ) : null}
          </Box>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Button
              id="no-patient-lookup-btn"
              variant="contained"
              color="primary"
              size="large"
              startIcon={<GroupIcon />}
              onClick={() => navigate('/patient-directory')}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 500,
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                '&:hover': {
                  boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
                }
              }}
            >
              Lookup Patient
            </Button>
            {noProfileLink ? (
              <Button
                id="no-patient-my-profile-btn"
                variant="outlined"
                color="primary"
                size="large"
                startIcon={<AccountCircleIcon />}
                onClick={() => navigate('/my-profile')}
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 500,
                  borderRadius: 2,
                  textTransform: 'none'
                }}
              >
                Go to My Profile
              </Button>
            ) : null}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default NoPatientSelectedCard;
