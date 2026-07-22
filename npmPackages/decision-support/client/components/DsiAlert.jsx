// npmPackages/decision-support/client/components/DsiAlert.jsx
//
// Drop-in interruptive DSI alert (§ (i) "actively presented" in clinical
// workflow). An order screen renders <DsiAlert context={{ serviceRequest,
// patientId }} /> (or calls useDecisionSupport) BEFORE finalizing the order;
// matched evidence-based interventions are presented synchronously.

import React, { useState, useEffect } from 'react';
import { Alert, AlertTitle, Box, Stack } from '@mui/material';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Hook: evaluate the given context (re-runs when the serialized context changes).
export function useDecisionSupport(context) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const key = JSON.stringify(context || {});

  useEffect(function() {
    const ctx = context || {};
    if (!get(ctx, 'patientId')) { setMatches([]); return; }
    setLoading(true);
    (async function() {
      try {
        const result = await Meteor.rpc('decisionSupport.evaluate', { evalContext: ctx });
        setLoading(false);
        setMatches(get(result, 'matches', []));
      } catch (error) {
        setLoading(false);
        console.error('[decision-support] evaluate failed:', get(error, 'reason', error.message));
        setMatches([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { matches: matches, loading: loading };
}

function DsiAlert(props) {
  const result = useDecisionSupport(props.context);
  const matches = result.matches;
  if (!matches || matches.length === 0) return null;

  return (
    <Box className="decision-support-alerts" sx={{ mb: 2 }}>
      <Stack spacing={1}>
        {matches.map(function(m) {
          return (
            <Alert
              key={get(m, 'interventionId')}
              id={'dsi-alert-' + get(m, 'interventionId')}
              severity="warning"
              onClose={props.onDismiss ? function() { props.onDismiss(m); } : undefined}
            >
              <AlertTitle>{get(m, 'title')}</AlertTitle>
              {get(m, 'message')}
            </Alert>
          );
        })}
      </Stack>
    </Box>
  );
}

export default DsiAlert;
