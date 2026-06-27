// npmPackages/decision-support/client/components/DsiInitialize.jsx
//
// ServerConfigs card for initializing the DSI catalog (§ 170.315(b)(11)).
// Seeds the bundled sample interventions via decisionSupport.seedSampleInterventions
// (idempotent). Gated by Meteor.settings.private.decisionSupport.seedSamples — when
// disabled, the button is locked and the exact settings path is surfaced. Rendered
// as a card on the Server Configuration page's decision-support tab, alongside
// DsiSourceAttributePolicy.

import React, { useState, useEffect } from 'react';
import {
  Card, CardHeader, CardContent, Button, Typography, Alert, AlertTitle, Box, CircularProgress
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

function DsiInitialize() {
  const [status, setStatus] = useState(null);   // null = loading; { seedSamplesEnabled, catalogCount }
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);

  function refresh() {
    Meteor.call('decisionSupport.getSeedStatus', function(err, result) {
      if (err) { setError(get(err, 'reason', err.message)); setStatus({ seedSamplesEnabled: false, catalogCount: 0 }); }
      else { setStatus(result); }
    });
  }

  useEffect(function() { refresh(); }, []);

  function handleInitialize() {
    setLoading(true);
    setNotice(null);
    setError(null);
    Meteor.call('decisionSupport.seedSampleInterventions', function(err, res) {
      setLoading(false);
      if (err) {
        setError(get(err, 'reason', err.message));
      } else {
        setNotice('Seeded ' + get(res, 'inserted', 0) + ' sample intervention(s).');
        refresh();
      }
    });
  }

  const seedEnabled = get(status, 'seedSamplesEnabled', false);
  const catalogCount = get(status, 'catalogCount', 0);

  return (
    <Card sx={{ bgcolor: 'background.paper', mb: 2 }}>
      <CardHeader
        avatar={<StorageIcon color="primary" />}
        title="Decision Support — Initialize Catalog"
        subheader="Seed the bundled sample evidence-based interventions (§ 170.315(b)(11))"
      />
      <CardContent>
        {status === null ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
        ) : (
          <Box>
            {seedEnabled === false ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                <AlertTitle>Sample Seeding Disabled</AlertTitle>
                Sample seeding is not enabled. Contact your administrator to enable it in the
                server settings (Meteor.settings.private.decisionSupport.seedSamples).
              </Alert>
            ) : null}

            {notice ? <Alert severity="success" sx={{ mb: 2 }} onClose={function() { setNotice(null); }}>{notice}</Alert> : null}
            {error ? <Alert severity="error" sx={{ mb: 2 }} onClose={function() { setError(null); }}>{error}</Alert> : null}

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Catalog currently holds <strong>{catalogCount}</strong> decision support intervention(s).
              Seeding is idempotent — existing interventions are left untouched.
            </Typography>

            <Button
              id="dsi-initialize-button"
              variant="contained"
              disabled={seedEnabled === false || loading}
              startIcon={loading ? <CircularProgress size={20} /> : <StorageIcon />}
              onClick={handleInitialize}
            >
              {loading ? 'Initializing...' : 'Initialize sample interventions'}
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default DsiInitialize;
