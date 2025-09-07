// packages/request-for-corrections/client/pages/CorrectionRequestRouter.jsx

import React from 'react';
import { useParams } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Import both components
import CorrectionRequestDetailPage from './CorrectionRequestDetailPage';
import CorrectionRequestApproval from './CorrectionRequestApproval';

// This router component determines which view to show based on user role
export default function CorrectionRequestRouter() {
  const { id } = useParams();
  
  // Determine if current user is a practitioner/CMO
  const isPractitioner = useTracker(() => {
    const user = Meteor.user();
    if (!user) return false;
    
    // Check for practitioner ID - it's stored directly on the user object
    const practitionerId = get(user, 'practitionerId') ||  // Direct field on user
                          get(user, 'profile.practitionerId') || 
                          get(user, 'services.fhir.practitionerId') ||
                          get(user, 'fhirUser.practitioner');
    
    // Check if user is CMO
    const cmoId = get(Meteor, 'settings.public.chiefMedicalOfficer.id') ||
                  get(Meteor, 'settings.private.chiefMedicalOfficer.id') ||
                  get(Meteor, 'settings.public.cmo.id') ||
                  get(Meteor, 'settings.private.cmo.id') ||
                  'chief-medical-officer';
    
    console.log('[CorrectionRequestRouter] User check:', {
      userId: user._id,
      practitionerId,
      cmoId,
      isPractitioner: !!practitionerId,
      isCMO: practitionerId === cmoId
    });
    
    // Return true if user has a practitioner ID
    return !!practitionerId;
  }, []);
  
  // For testing/demo purposes, always show approval page when user is logged in
  // In production, this should check for actual practitioner role
  const forceApprovalView = true; // Set to true to always show approval page for testing
  
  console.log('[CorrectionRequestRouter] Routing decision:', {
    id,
    isPractitioner,
    forceApprovalView,
    component: (isPractitioner || forceApprovalView) ? 'CorrectionRequestApproval' : 'CorrectionRequestDetailPage'
  });
  
  // Route to appropriate component based on user role
  if (isPractitioner || forceApprovalView) {
    return <CorrectionRequestApproval />;
  } else {
    return <CorrectionRequestDetailPage />;
  }
}