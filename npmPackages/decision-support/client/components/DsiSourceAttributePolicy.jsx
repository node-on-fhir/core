// npmPackages/decision-support/client/components/DsiSourceAttributePolicy.jsx
//
// ServerConfigs toggle UI for the source-attribute usage policy
// (§ 170.315(b)(11)(iv)(A)(5)-(13)). Flips
// Meteor.settings.private.decisionSupport.sourceAttributes.* via server methods.
// Rendered as a tab on the Server Configuration page (mirrors fhircast's
// CollectionsToPublish.jsx).

import React, { useState, useEffect } from 'react';
import {
  Card, CardHeader, CardContent, FormGroup, FormControlLabel, Switch,
  Typography, Alert, Box, CircularProgress
} from '@mui/material';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { SOURCE_ATTRIBUTE_KEYS, SOURCE_ATTRIBUTE_LABELS } from '../../lib/sourceAttributes.js';

function DsiSourceAttributePolicy() {
  const [policy, setPolicy] = useState(null);
  const [error, setError] = useState(null);

  useEffect(function() {
    Meteor.call('decisionSupport.getSourceAttributePolicy', function(err, result) {
      if (err) { setError(get(err, 'reason', err.message)); setPolicy({}); }
      else { setPolicy(get(result, 'sourceAttributes', {})); }
    });
  }, []);

  function handleToggle(key) {
    const next = !get(policy, key, false);
    setPolicy(function(prev) { return Object.assign({}, prev, { [key]: next }); }); // optimistic
    Meteor.call('decisionSupport.setSourceAttributeUsage', key, next, function(err) {
      if (err) {
        setError(get(err, 'reason', err.message));
        setPolicy(function(prev) { return Object.assign({}, prev, { [key]: !next }); }); // revert
      }
    });
  }

  return (
    <Card sx={{ bgcolor: 'background.paper' }}>
      <CardHeader
        title="Decision Support — Source Attribute Usage Policy"
        subheader="Allow which demographic / SDOH categories DSIs in this deployment may use (§ 170.315(b)(11)(iv))"
      />
      <CardContent>
        <Alert severity="info" sx={{ mb: 2 }}>
          Whether these categories are appropriate is region-dependent. Disabled categories
          are not permitted; any intervention that uses one is suppressed until it is allowed.
        </Alert>
        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
        {policy === null ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
        ) : (
          <FormGroup>
            {SOURCE_ATTRIBUTE_KEYS.map(function(key) {
              return (
                <FormControlLabel
                  key={key}
                  control={
                    <Switch
                      id={'dsi-source-attr-' + key}
                      checked={get(policy, key, false)}
                      onChange={function() { handleToggle(key); }}
                    />
                  }
                  label={<Typography color="text.primary">{SOURCE_ATTRIBUTE_LABELS[key]}</Typography>}
                />
              );
            })}
          </FormGroup>
        )}
      </CardContent>
    </Card>
  );
}

export default DsiSourceAttributePolicy;
