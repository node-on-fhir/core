// npmPackages/allergy-testing/client/NoKnownAllergiesCard.jsx

import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

import { Box, Typography, Button, Alert } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Records the US Core "no known allergy" sentinel (SNOMED 716186003, confirmed).
export function NoKnownAllergiesCard({ patientReference, recordedBy, hasExistingAllergies, onRecorded }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleRecord() {
    setSaving(true);
    setError('');
    try {
      await Meteor.rpc('allergyTesting.recordNoKnownAllergies', { patientReference: patientReference, recordedBy: recordedBy });
      onRecorded();
    } catch (err) {
      console.error('[allergy-testing] recordNoKnownAllergies failed', err);
      setError(get(err, 'reason', err.message));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="body1" sx={{ color: 'text.primary', mb: 1 }}>
        Confirm that this patient has no known allergies.
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        This records a FHIR AllergyIntolerance with the US Core "No known allergy" code
        (SNOMED CT 716186003), verification status confirmed.
      </Typography>

      {hasExistingAllergies && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          This patient already has recorded allergies. Recording "no known allergies"
          may conflict with the existing list.
        </Alert>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Button
        id="allergyTestingNoKnownAllergies"
        variant="contained"
        color="primary"
        startIcon={<CheckCircleIcon />}
        disabled={saving}
        onClick={handleRecord}
      >
        Record No Known Allergies
      </Button>
    </Box>
  );
}

export default NoKnownAllergiesCard;
