// imports/ui/components/AnalyticsConsentBanner.jsx
//
// Shown once per browser when a GA measurementId is configured and the
// visitor has not yet decided. Theme tokens only; fixed to the bottom edge
// (out-of-flow: uses the CSS chrome vars per layout-patterns.md).

import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { Paper, Typography, Button, Box } from '@mui/material';
import { getAnalyticsConsent, setAnalyticsConsent } from '/imports/lib/analyticsConsent';

export function AnalyticsConsentBanner() {
  const measurementId = get(Meteor, 'settings.public.google.analytics.measurementId', '');
  const [decision, setDecision] = useState(getAnalyticsConsent());

  if (!measurementId || decision) {
    return null;
  }

  function decide(value) {
    setAnalyticsConsent(value);
    setDecision(value);
  }

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        bottom: 'calc(var(--footer-height, 0px) + 12px)',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: function(theme) { return theme.zIndex.snackbar; },
        p: 2,
        maxWidth: 560,
        width: 'calc(100% - 32px)',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        flexWrap: 'wrap'
      }}
    >
      <Typography variant="body2" sx={{ flex: 1, minWidth: 240 }}>
        We use anonymized analytics cookies to understand which features get used.
        No personal or health data is ever sent.
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button id="analyticsConsentDeclineButton" size="small" onClick={function() { decide('denied'); }}>
          Decline
        </Button>
        <Button id="analyticsConsentAcceptButton" size="small" variant="contained" onClick={function() { decide('granted'); }}>
          Accept
        </Button>
      </Box>
    </Paper>
  );
}

export default AnalyticsConsentBanner;
