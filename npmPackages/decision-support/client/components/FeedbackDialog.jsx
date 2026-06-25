// npmPackages/decision-support/client/components/FeedbackDialog.jsx
//
// Capture electronic feedback for a fired DSI — § (ii)(C). Records action taken
// + free-text feedback (user/date/location stamped server-side).

import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TextField, MenuItem, Alert
} from '@mui/material';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

const ACTIONS = [
  { value: 'accepted', label: 'Accepted recommendation' },
  { value: 'overridden', label: 'Overridden' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: 'modified', label: 'Order modified' }
];

function FeedbackDialog(props) {
  const firing = props.firing || {};
  const [actionTaken, setActionTaken] = useState('accepted');
  const [userFeedback, setUserFeedback] = useState('');
  const [error, setError] = useState(null);

  function handleSubmit() {
    const payload = {
      interventionId: get(firing, 'interventionId', ''),
      interventionTitle: get(firing, 'title', ''),
      guidanceResponseId: get(firing, 'guidanceResponseId', ''),
      serviceRequestId: get(firing, 'serviceRequestId', ''),
      patientId: get(firing, 'patientId', ''),
      actionTaken: actionTaken,
      userFeedback: userFeedback
    };
    Meteor.call('decisionSupport.recordFeedback', payload, function(err) {
      if (err) { setError(get(err, 'reason', err.message)); }
      else { props.onClose && props.onClose(true); }
    });
  }

  return (
    <Dialog open={!!props.open} onClose={function() { props.onClose && props.onClose(false); }} fullWidth maxWidth="sm">
      <DialogTitle>Decision support feedback</DialogTitle>
      <DialogContent>
        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
        <TextField
          id="dsi-feedback-action"
          select fullWidth label="Action taken" value={actionTaken}
          onChange={function(e) { setActionTaken(e.target.value); }}
          sx={{ mt: 1, mb: 2 }}
        >
          {ACTIONS.map(function(a) { return <MenuItem key={a.value} value={a.value}>{a.label}</MenuItem>; })}
        </TextField>
        <TextField
          id="dsi-feedback-text"
          fullWidth multiline minRows={3} label="Feedback (optional)"
          value={userFeedback} onChange={function(e) { setUserFeedback(e.target.value); }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={function() { props.onClose && props.onClose(false); }}>Cancel</Button>
        <Button id="dsi-feedback-submit" variant="contained" onClick={handleSubmit}>Save feedback</Button>
      </DialogActions>
    </Dialog>
  );
}

export default FeedbackDialog;
