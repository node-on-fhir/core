// npmPackages/structured-data-capture/client/components/IpsPrefillControls.jsx
//
// "Kill the Clipboard" — Prefill-from-Patient-Summary button. Renders ONLY
// when @orbital/mcp is installed (lazy render-time Package check + server
// availability RPC); calls sdc.prefillFromIps and hands validated answers to
// the parent page. The user's saved BYOLLMK keys are resolved server-side.

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { Box, Button, Alert, CircularProgress, Tooltip } from '@mui/material';
import { AutoAwesome as AutoAwesomeIcon } from '@mui/icons-material';
import { get } from 'lodash';

export function IpsPrefillControls({ questionnaire, onPrefilled, isDark }) {
  // Tri-state: null = checking, true = available, false = unavailable
  const [available, setAvailable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastMeta, setLastMeta] = useState(null);

  const patientId = useTracker(function() { return Session.get('selectedPatientId'); }, []);
  // Hook order: must be called unconditionally, BEFORE the early return below
  const navigate = Meteor.useNavigate ? Meteor.useNavigate() : function() {};

  // Lazy render-time registry check — NEVER at module scope (sibling
  // workflows register after this module loads).
  const mcpInstalled = !!(globalThis.Package && globalThis.Package['@orbital/mcp']);

  useEffect(function() {
    if (!mcpInstalled) { return; }
    Meteor.rpc('sdc.checkPrefillAvailability', {}).then(function(result) {
      setAvailable(get(result, 'available', false));
    }).catch(function(err) {
      console.warn('[IpsPrefillControls] availability check failed:', err.reason || err.message);
      setAvailable(false);
    });
  }, [mcpInstalled]);

  if (!mcpInstalled || available !== true) {
    return null;
  }

  async function handlePrefill() {
    setLoading(true);
    setError(null);
    try {
      const result = await Meteor.rpc('sdc.prefillFromIps', {
        questionnaire: questionnaire,
        patientId: patientId,
        narrative: Session.get('ipsComposition') || undefined
      });
      setLastMeta({ provider: get(result, 'provider'), count: get(result, 'answers.length', 0) });
      onPrefilled(get(result, 'answers', []), result);
    } catch (err) {
      console.warn('[IpsPrefillControls] prefill failed:', err.reason || err.message);
      setError({ code: get(err, 'error'), message: err.reason || err.message });
    } finally {
      setLoading(false);
    }
  }

  const needsPatient = !patientId;

  return (
    <Box id="ipsPrefillControls" sx={{ mb: 2 }}>
      <Tooltip title={needsPatient ? 'Select a patient first' : 'Fill this form from the patient\'s International Patient Summary narrative'}>
        <span>
          <Button
            id="prefillFromIpsButton"
            variant="outlined"
            startIcon={loading ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
            disabled={needsPatient || loading}
            onClick={handlePrefill}
          >
            {loading ? 'Prefilling…' : 'Prefill from Patient Summary'}
          </Button>
        </span>
      </Tooltip>
      {error && (
        <Alert
          severity="warning"
          sx={{ mt: 1 }}
          onClose={function() { setError(null); }}
          action={error.code === 'no-ips-narrative' ? (
            <Button color="inherit" size="small" onClick={function() { navigate('/international-patient-summary'); }}>
              Open IPS
            </Button>
          ) : null}
        >
          {error.message}
        </Alert>
      )}
      {!error && lastMeta && !loading && (
        <Alert severity="info" sx={{ mt: 1 }} onClose={function() { setLastMeta(null); }} icon={<AutoAwesomeIcon fontSize="inherit" />}>
          {lastMeta.count} answer{lastMeta.count === 1 ? '' : 's'} suggested from the patient summary. Review AI-suggested answers before submitting.
        </Alert>
      )}
    </Box>
  );
}
