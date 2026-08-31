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
import { useLocation } from 'react-router-dom';
import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { useOverridableComponent } from '../hooks/useOverridableComponent';
import NoSelectedPatientPage from '../extensible/NoSelectedPatientPage';
import patientSetCore from '/imports/lib/patientSetCore.js';

// Reuse the isomorphic, hand-synced role precedence (patientSetCore mirrors
// server/publications/selectedPatient.js:getAuthorizedRole). CJS default-interop.
const getAuthorizedRole = get(patientSetCore, 'getAuthorizedRole', function() { return 'patient'; });

export function PatientGuard({ children, fallback }) {
  const NoPatientComponent = useOverridableComponent('NoSelectedPatientPage', NoSelectedPatientPage);

  // routePath: mirror ErrorBoundary's precedent (App.jsx threads route.path into
  // ErrorPageComponent). Here the guard reads it live via react-router — the same
  // useLocation() pattern AuthGuard uses — so the fallback can name the blocked route.
  const location = useLocation();
  const routePath = get(location, 'pathname', '');

  const { hasPatient, role, hasProfileLink } = useTracker(function() {
    const selectedPatient = Session.get('selectedPatient');
    const selectedPatientId = Session.get('selectedPatientId');

    const currentUser = Meteor.user ? Meteor.user() : null;
    const profileLink = get(currentUser, 'patientId') || get(currentUser, 'profile.patientId') || null;

    return {
      hasPatient: !!(selectedPatient || selectedPatientId),
      role: getAuthorizedRole(get(currentUser, 'roles')),
      hasProfileLink: !!profileLink
    };
  }, []);

  if (!hasPatient) {
    // Diagnostics context (design v2 §D). Backward compatible — prop-less
    // overrides simply ignore it. React drops unknown props, so passing this to
    // legacy fallbacks is harmless.
    //
    // Emitted reasons (kept intentionally simple, per spec "do NOT over-engineer"):
    //   'no-profile-link' — a patient-role account with no user.patientId link.
    //                       The actionable case: link a record to your profile.
    //   'no-selection'    — everyone else (clinician, or a patient-role account
    //                       that HAS a profile link but hasn't focused a patient).
    // 'selection-not-in-set' / 'empty-set' are NOT emitted here: the guard only
    //   fires when nothing is selected, so a selected-but-out-of-set focus never
    //   reaches this branch, and distinguishing empty-set from no-profile-link
    //   would require the full resolvePatientSet fan-out (deferred — see spec).
    const reason = (role === 'patient' && !hasProfileLink) ? 'no-profile-link' : 'no-selection';
    const context = { reason, routePath, role, hasProfileLink };

    return fallback || <NoPatientComponent context={context} />;
  }

  // Patient is selected, render the protected component
  return children;
}

export default PatientGuard;
