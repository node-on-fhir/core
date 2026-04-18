// imports/ui/components/WelcomeDialog.jsx

import React, { useState, cloneElement } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';
import { get } from 'lodash';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
  Box
} from '@mui/material';

import WorkflowRegistry from '/imports/lib/WorkflowRegistry.js';

export function WelcomeDialog() {
  const [dismissed, setDismissed] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const navigate = useNavigate();

  const welcomeEnabled = get(Meteor, 'settings.public.welcome.enabled', false);
  const requireLoggedIn = get(Meteor, 'settings.public.welcome.requireLoggedIn', true);

  const user = useTracker(function() {
    return Meteor.user();
  }, []);

  // If welcome is disabled in settings, render nothing
  if (!welcomeEnabled) {
    return null;
  }

  // If login is required and no user logged in, render nothing
  if (requireLoggedIn && !user) {
    return null;
  }

  // If user already saw welcome, render nothing
  if (user && get(user, 'profile.hasSeenWelcome', false)) {
    return null;
  }

  // If dismissed for this session, render nothing
  if (dismissed) {
    return null;
  }

  const title = get(Meteor, 'settings.public.welcome.title', 'Welcome');
  const message = get(Meteor, 'settings.public.welcome.message', '');
  const buttonText = get(Meteor, 'settings.public.welcome.buttonText', 'Continue');
  const linkTo = get(Meteor, 'settings.public.welcome.linkTo', '');
  const imageUrl = get(Meteor, 'settings.public.welcome.imageUrl', '');

  async function handleContinue() {
    if (dontShowAgain && user) {
      try {
        await Meteor.callAsync('users.setWelcomeSeen', true);
      } catch (error) {
        console.error('[WelcomeDialog] Error setting welcome seen:', error);
      }
    }

    setDismissed(true);

    if (linkTo) {
      navigate(linkTo);
    }
  }

  function handleDontShowAgainChange(event) {
    setDontShowAgain(event.target.checked);
  }

  // Check for a custom welcome component from WorkflowRegistry
  const customWelcome = WorkflowRegistry.getWelcomeComponent();
  if (customWelcome) {
    return cloneElement(customWelcome, {
      open: true,
      onClose: handleContinue,
      dontShowAgain: dontShowAgain,
      onDontShowAgainChange: handleDontShowAgainChange
    });
  }

  // Render default welcome dialog
  return (
    <Dialog
      open={true}
      onClose={function(event, reason) {
        // Prevent closing by backdrop click or escape
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
          return;
        }
      }}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>{title}</DialogTitle>
      {imageUrl ? (
        <Box
          component="img"
          src={imageUrl}
          alt=""
          sx={{
            width: '100%',
            maxHeight: '300px',
            objectFit: 'cover',
            display: 'block'
          }}
        />
      ) : null}
      <DialogContent>
        {message.split('\\n').map(function(line, index) {
          return (
            <Typography
              key={index}
              variant="body1"
              color="text.secondary"
              sx={{ mb: line === '' ? 1.5 : 0.5 }}
            >
              {line || '\u00A0'}
            </Typography>
          );
        })}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
        {user ? (
          <FormControlLabel
            control={
              <Checkbox
                checked={dontShowAgain}
                onChange={handleDontShowAgainChange}
                size="small"
              />
            }
            label={
              <Typography variant="body2" color="text.secondary">
                Don't show again
              </Typography>
            }
          />
        ) : null}
        <Button
          variant="contained"
          onClick={handleContinue}
        >
          {buttonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default WelcomeDialog;
