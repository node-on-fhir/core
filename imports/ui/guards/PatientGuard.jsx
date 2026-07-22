// imports/ui/guards/PatientGuard.jsx
//
// Router-level guard mirroring AuthGuard, but for patient context.
// When a route declares `requirePatient: true` (see App.jsx StyledMainRouter),
// its element is wrapped in this guard. If no patient is selected
// (Session.get('selectedPatient') / 'selectedPatientId' are both falsy), the
// NoSelectedPatientPage fallback renders instead of the protected children
// (overridable via components: { NoSelectedPatientPage: ... }).
//
// An explicit `fallback` element prop is still honored for standalone use and
// legacy callers; when absent the guard self-resolves through the registry.
//
// Formerly imports/ui/components/RequirePatientRoute.jsx — the old path
// re-exports this component as a deprecated alias.

import React from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import { useOverridableComponent } from '../hooks/useOverridableComponent';
import NoSelectedPatientPage from '../extensible/NoSelectedPatientPage';

export function PatientGuard({ children, fallback }) {
  const NoPatientComponent = useOverridableComponent('NoSelectedPatientPage', NoSelectedPatientPage);

  const hasPatient = useTracker(function() {
    const selectedPatient = Session.get('selectedPatient');
    const selectedPatientId = Session.get('selectedPatientId');
    return !!(selectedPatient || selectedPatientId);
  }, []);

  if (!hasPatient) {
    return fallback || <NoPatientComponent />;
  }

  // Patient is selected, render the protected component
  return children;
}

export default PatientGuard;
