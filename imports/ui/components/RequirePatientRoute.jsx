// /imports/ui/components/RequirePatientRoute.jsx
//
// Router-level guard mirroring AuthenticatedRoute, but for patient context.
// When a route declares `requirePatient: true` (see App.jsx StyledMainRouter),
// its element is wrapped in this guard. If no patient is selected
// (Session.get('selectedPatient') / 'selectedPatientId' are both falsy), the
// `fallback` page is rendered instead of the protected children.
//
// The router supplies `fallback` (resolved from
// WorkflowRegistry.getNoPatientSelectedPage() or the core default), but the
// component also falls back to <NoPatientSelectedPage /> inline so it stays
// usable standalone.

import React from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import NoPatientSelectedPage from './NoPatientSelectedPage';

export function RequirePatientRoute({ children, fallback }) {
  const hasPatient = useTracker(function() {
    const selectedPatient = Session.get('selectedPatient');
    const selectedPatientId = Session.get('selectedPatientId');
    return !!(selectedPatient || selectedPatientId);
  }, []);

  if (!hasPatient) {
    return fallback || <NoPatientSelectedPage />;
  }

  // Patient is selected, render the protected component
  return children;
}

export default RequirePatientRoute;
