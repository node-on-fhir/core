// imports/ui/components/PatientRequiredRoute.jsx

import React from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import { SELECTED_PATIENT } from '/imports/lib/SessionKeys.js';
import NoPatientSelectedCard from './NoPatientSelectedCard';

// Route guard for workflow routes declaring `requirePatient: true`.
// Sibling of AuthenticatedRoute: reactive Session check, fallback UI.
// Compose auth outermost (NotAuthorized wins over the patient card).
export function PatientRequiredRoute({ children }) {
  const selectedPatient = useTracker(() => Session.get(SELECTED_PATIENT), []);

  if (!selectedPatient) {
    return <NoPatientSelectedCard />;
  }

  return children;
}

export default PatientRequiredRoute;
