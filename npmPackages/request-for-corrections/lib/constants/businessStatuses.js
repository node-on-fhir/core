// packages/request-for-corrections/lib/constants/businessStatuses.js

// Business status code system
export const BUSINESS_STATUS_SYSTEM = 'http://hl7.org/fhir/uv/patient-corrections/CodeSystem/PatientCorrectionBusinessStatus';

// Business status definitions
export const BUSINESS_STATUSES = {
  QUEUED: {
    code: 'queued',
    display: 'Queued',
    definition: 'Correction request has been received but not yet reviewed',
    taskStatus: 'ready'
  },
  IN_REVIEW: {
    code: 'in-review',
    display: 'In Review',
    definition: 'Correction request is actively being reviewed',
    taskStatus: 'in-progress'
  },
  WAITING_FOR_INFORMATION: {
    code: 'waiting-for-information',
    display: 'Waiting for Information',
    definition: 'Reviewer needs additional information to process the request',
    taskStatus: 'in-progress'
  },
  ACCEPTED: {
    code: 'accepted',
    display: 'Accepted',
    definition: 'Correction request has been accepted and amendment is in process',
    taskStatus: 'in-progress'
  },
  PARTIAL_ACCEPT: {
    code: 'partial-accept',
    display: 'Partially Accepted',
    definition: 'Part of the correction request has been accepted',
    taskStatus: 'in-progress'
  },
  AMENDMENT_COMPLETED: {
    code: 'amendment-completed',
    display: 'Amendment Completed',
    definition: 'Record amendment has been completed',
    taskStatus: 'completed'
  },
  DENIED: {
    code: 'denied',
    display: 'Denied',
    definition: 'Correction request has been denied',
    taskStatus: 'completed'
  },
  DISAGREEMENT_LOGGED: {
    code: 'disagreement-logged',
    display: 'Disagreement Logged',
    definition: 'Patient disagreement with denial has been logged',
    taskStatus: 'completed'
  },
  COMPLETED: {
    code: 'completed',
    display: 'Completed with Rebuttal',
    definition: 'Process completed with patient rebuttal statement',
    taskStatus: 'completed'
  }
};

// Additional business status for cancelled state
export const CANCELLED_STATUS = {
  code: 'requester-cancelled',
  display: 'Cancelled by Requester',
  definition: 'Request cancelled by the patient or their representative',
  taskStatus: 'cancelled'
};

// Helper to get business status by code
export function getBusinessStatus(code) {
  return BUSINESS_STATUSES[code.toUpperCase().replace(/-/g, '_')] || 
         (code === 'requester-cancelled' ? CANCELLED_STATUS : null);
}

// Helper to get valid business statuses for a given task status
export function getBusinessStatusesForTaskStatus(taskStatus) {
  const statuses = [];
  
  Object.values(BUSINESS_STATUSES).forEach(status => {
    if (status.taskStatus === taskStatus) {
      statuses.push(status);
    }
  });
  
  if (taskStatus === 'cancelled') {
    statuses.push(CANCELLED_STATUS);
  }
  
  return statuses;
}

// Workflow transitions - defines valid state transitions
export const WORKFLOW_TRANSITIONS = {
  'queued': ['in-review', 'requester-cancelled'],
  'in-review': ['waiting-for-information', 'accepted', 'partial-accept', 'denied', 'requester-cancelled'],
  'waiting-for-information': ['in-review', 'accepted', 'partial-accept', 'denied', 'requester-cancelled'],
  'accepted': ['amendment-completed', 'requester-cancelled'],
  'partial-accept': ['amendment-completed', 'denied', 'requester-cancelled'],
  'amendment-completed': ['disagreement-logged'],
  'denied': ['disagreement-logged'],
  'disagreement-logged': ['completed'],
  'completed': [],
  'requester-cancelled': []
};

// Helper to check if a transition is valid
export function isValidTransition(fromStatus, toStatus) {
  const validTransitions = WORKFLOW_TRANSITIONS[fromStatus] || [];
  return validTransitions.includes(toStatus);
}