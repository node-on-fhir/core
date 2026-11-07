// npmPackages/radiology-workflow/client/SelectHomepageDialog.jsx
//
// First-login "Choose your workspace" dialog — registered as this package's
// welcomeComponent (the WelcomeDialog host's legacy dialog slot). The host
// (imports/ui/components/WelcomeDialog.jsx) owns the show/skip logic
// (settings.public.welcome.*, profile.hasSeenWelcome) and clones this element
// with { open, onClose, dontShowAgain, onDontShowAgainChange }. The checkbox
// alone rules recurrence — picking a tile does NOT implicitly set
// hasSeenWelcome, so the dialog reappears each login until the user checks
// "Don't show this dialog again".

import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { getHomepageOptions, resolveHomepageIcon } from '/imports/lib/homepageOptions.js';

// Matches the Select Patient Source tiles (TechDashboard SOURCE_TILE_SX)
var HOMEPAGE_TILE_SX = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 1,
  p: 3,
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 1,
  cursor: 'pointer',
  '&:hover': { backgroundColor: 'action.hover', borderColor: 'primary.main' }
};

// Fallback when settings.public.preferences.homepageOptions is absent
var DEFAULT_OPTIONS = [
  { label: 'Patient Chart', path: '/patient-chart', iconName: 'MenuBook' },
  { label: 'Technologist Worklist', path: '/radiology/tech', iconName: 'ListAlt' },
  { label: 'Radiologist Worklist', path: '/radiology/reading', iconName: 'Visibility' }
];

export function SelectHomepageDialog({ open, onClose, dontShowAgain, onDontShowAgainChange }) {
  const navigate = useNavigate();

  const settingsOptions = getHomepageOptions();
  const options = settingsOptions.length ? settingsOptions : DEFAULT_OPTIONS;

  async function handleTileClick(option) {
    try {
      await Meteor.rpc('users.setHomePagePreference', { path: option.path });
    } catch (error) {
      // Non-fatal: still navigate; the preference can be set from /my-profile
      console.warn('[SelectHomepageDialog] Error saving homepage preference:', error.reason || error.message);
    }
    if (onClose) {
      // Host persists hasSeenWelcome iff the checkbox is checked; with no
      // settings.public.welcome.linkTo it does not navigate — we do.
      onClose();
    }
    navigate(option.path);
  }

  return (
    <Dialog
      open={!!open}
      maxWidth="sm"
      fullWidth
      onClose={function(event, reason) {
        // Match the host dialog: no dismiss via backdrop or escape
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
          return;
        }
      }}
    >
      <DialogTitle>Choose your workspace</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Pick where you want to land when you sign in. You can change this anytime from My Profile.
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, pt: 1 }}>
          {options.map(function(option) {
            const IconComponent = resolveHomepageIcon(option.iconName);
            return (
              <Box
                key={option.path}
                id={'select-homepage-tile' + option.path.replace(/\//g, '-')}
                onClick={function() { handleTileClick(option); }}
                sx={HOMEPAGE_TILE_SX}
              >
                <IconComponent color="primary" sx={{ fontSize: 40 }} />
                <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'center' }}>
                  {option.label}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              id="selectHomepageDontShowAgain"
              checked={!!dontShowAgain}
              onChange={onDontShowAgainChange}
            />
          }
          label={
            <Typography variant="body2" color="text.secondary">
              Don't show this dialog again
            </Typography>
          }
        />
        <Button id="selectHomepageSkipButton" onClick={function() { if (onClose) { onClose(); } }}>
          Skip
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SelectHomepageDialog;
