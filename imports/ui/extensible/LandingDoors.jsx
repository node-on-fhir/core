// imports/ui/extensible/LandingDoors.jsx
//
// The one-door landing's center region (design handoff 2026-11-01), shared
// by all three NoAuthorizationPage layouts. Two states driven by the
// chronicle.lastUser remembered-device contract:
//   first visit  → "Welcome to {title}." + I'm-new-here / I-have-an-account
//   returning    → "Welcome back, {firstName}." + Continue-as tile
// Tiles are ButtonBase-wrapped Papers (whole tile = one focusable target).
// Keyboard order: first-visit (new, existing); returning (continue,
// password, switch).

import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  ButtonBase,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import moment from 'moment';
import { get } from 'lodash';
import { AuthThemeScope } from '/imports/ui/theme/AuthThemeScope.jsx';

function TilePaper({ filled, children }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        height: '100%',
        width: '100%',
        textAlign: 'left',
        bgcolor: filled ? 'primary.main' : 'background.paper',
        color: filled ? 'primary.contrastText' : 'text.primary',
        '&:hover': { borderColor: 'primary.main' }
      }}
    >
      {children}
    </Paper>
  );
}

export function LandingDoors({ lastUser, forget, signInPath, signUpPath, appTitle }) {
  const navigate = useNavigate();

  const tagline = get(Meteor, 'settings.public.landing.tagline',
    'Early access · Clinical workstation on FHIR');

  function continueAs() {
    // Passkeys are feature-flagged off → open the card in password with the
    // chip filled and focus on the passphrase (handoff p.7).
    navigate(signInPath, { state: { email: lastUser.email, step: 'password' } });
  }

  if (!lastUser) {
    return (
      <AuthThemeScope>
        <Box>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Welcome to {appTitle}.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            {tagline}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'stretch' }}>
            <ButtonBase
              data-testid="landing-new"
              onClick={function() { navigate(signUpPath); }}
              sx={{ flex: 1, borderRadius: '20px', minHeight: 56, display: 'block' }}
            >
              <TilePaper filled>
                <Box sx={{
                  width: 44, height: 44, borderRadius: '12px', mb: 2,
                  bgcolor: 'rgba(20,20,19,0.85)', color: '#D9D2BF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <AddIcon />
                </Box>
                <Typography sx={{ fontWeight: 600, mb: 0.5 }}>I'm new here</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Create an account in under a minute
                </Typography>
              </TilePaper>
            </ButtonBase>
            <ButtonBase
              data-testid="landing-existing"
              onClick={function() { navigate(signInPath); }}
              sx={{ flex: 1, borderRadius: '20px', minHeight: 56, display: 'block' }}
            >
              <TilePaper>
                <Box sx={{
                  width: 44, height: 44, borderRadius: '12px', mb: 2,
                  bgcolor: 'background.default', color: 'text.secondary',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <PersonOutlineIcon />
                </Box>
                <Typography sx={{ fontWeight: 600, mb: 0.5 }}>I have an account</Typography>
                <Typography variant="body2" color="text.secondary">
                  Sign in with email or passkey
                </Typography>
              </TilePaper>
            </ButtonBase>
          </Stack>
        </Box>
      </AuthThemeScope>
    );
  }

  const firstName = (lastUser.displayName || '').split(/\s+/)[0] || lastUser.username;
  const lastSeen = lastUser.lastLoginAt ? moment(lastUser.lastLoginAt).calendar() : null;

  return (
    <AuthThemeScope>
      <Box>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Welcome back, {firstName}.
        </Typography>
        {lastSeen && (
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Last signed in {lastSeen} on this device
          </Typography>
        )}
        <ButtonBase
          data-testid="landing-continue"
          onClick={continueAs}
          sx={{ width: '100%', borderRadius: '20px', minHeight: 56, display: 'block', mb: 2 }}
        >
          <TilePaper filled>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                width: 48, height: 48, borderRadius: '12px',
                bgcolor: 'rgba(20,20,19,0.85)', color: '#D9D2BF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 600
              }}>
                {lastUser.initials}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontWeight: 600 }}>
                  Continue as {lastUser.displayName}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {lastUser.email} · passphrase
                </Typography>
              </Box>
              <LockOutlinedIcon sx={{ opacity: 0.7 }} />
            </Box>
          </TilePaper>
        </ButtonBase>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            data-testid="landing-use-password"
            variant="outlined"
            onClick={continueAs}
            sx={{ flex: 1 }}
          >
            Use password instead
          </Button>
          <Button
            data-testid="landing-switch"
            variant="outlined"
            onClick={function() { forget(); }}
            sx={{ flex: 1 }}
          >
            Not you? Switch account
          </Button>
        </Stack>
      </Box>
    </AuthThemeScope>
  );
}

export default LandingDoors;
