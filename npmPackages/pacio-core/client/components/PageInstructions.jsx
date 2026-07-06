// npmPackages/pacio-core/client/components/PageInstructions.jsx
//
// Light user instructions under a page's breadcrumb: an outlined info
// Alert with one or two sentences. Dismissal is Session-scoped
// (pacioInstructions.<page>.dismissed) — quiet for the rest of the
// session, back on the next one, no DB writes.

import React from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';
import { Alert } from '@mui/material';

/**
 * @param {Object} props
 * @param {string} props.page - session-key slug (e.g. 'advanceDirectives')
 * @param {React.ReactNode} props.children - the instruction copy
 */
export function PageInstructions(props) {
  const sessionKey = 'pacioInstructions.' + props.page + '.dismissed';
  const dismissed = useTracker(function() {
    return Session.get(sessionKey) === true;
  }, [sessionKey]);

  if (dismissed) { return null; }

  return (
    <Alert
      severity="info"
      variant="outlined"
      onClose={function() { Session.set(sessionKey, true); }}
      sx={{ mb: 2 }}
    >
      {props.children}
    </Alert>
  );
}

export default PageInstructions;
