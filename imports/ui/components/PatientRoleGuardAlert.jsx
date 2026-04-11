// imports/ui/components/PatientRoleGuardAlert.jsx

import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';
import { get } from 'lodash';

import {
  Alert,
  AlertTitle,
  Button,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export function PatientRoleGuardAlert() {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  const showAlert = useTracker(function() {
    const user = Meteor.user();
    if (!user) return false;

    const roles = get(user, 'roles', []);

    // If user has a higher clinical role, no warning needed
    if (roles.includes('healthcare practitioner') || roles.includes('healthcare provider')) {
      return false;
    }

    // Check if user has a linked patientId (top-level or profile)
    const patientId = get(user, 'patientId') || get(user, 'profile.patientId');
    if (patientId) {
      return false;
    }

    // Patient-role user with no linked patientId
    return true;
  }, []);

  if (!showAlert || dismissed) {
    return null;
  }

  return (
    <Alert
      severity="warning"
      sx={{ mx: 2, mt: 1 }}
      action={
        <IconButton
          aria-label="dismiss"
          color="inherit"
          size="small"
          onClick={function() { setDismissed(true); }}
        >
          <CloseIcon fontSize="inherit" />
        </IconButton>
      }
    >
      <AlertTitle>Patient Record Not Linked</AlertTitle>
      Your account does not have a linked patient record. Some features may be unavailable until your profile is connected to a patient record.
      <Button
        size="small"
        sx={{ ml: 1 }}
        onClick={function() { navigate('/my-profile'); }}
      >
        Go to My Profile
      </Button>
    </Alert>
  );
}

export default PatientRoleGuardAlert;
