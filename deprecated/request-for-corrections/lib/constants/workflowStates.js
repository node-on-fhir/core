// packages/request-for-corrections/lib/constants/workflowStates.js

// Workflow state mappings between Task status and businessStatus
export const WORKFLOW_STATES = {
  // Initial state
  SUBMITTED: {
    taskStatus: 'ready',
    businessStatus: 'queued',
    label: 'Submitted',
    description: 'Correction request has been submitted and is awaiting review'
  },
  
  // Active review states
  UNDER_REVIEW: {
    taskStatus: 'in-progress',
    businessStatus: 'in-review', 
    label: 'Under Review',
    description: 'Healthcare provider is reviewing the correction request'
  },
  
  ADDITIONAL_INFO_NEEDED: {
    taskStatus: 'in-progress',
    businessStatus: 'waiting-for-information',
    label: 'Additional Information Needed',
    description: 'Provider needs more information to process the request'
  },
  
  // Decision states
  ACCEPTED: {
    taskStatus: 'in-progress',
    businessStatus: 'accepted',
    label: 'Accepted',
    description: 'Correction request has been accepted'
  },
  
  PARTIALLY_ACCEPTED: {
    taskStatus: 'in-progress',
    businessStatus: 'partial-accept',
    label: 'Partially Accepted', 
    description: 'Some corrections accepted, others denied'
  },
  
  // Completion states
  AMENDMENT_COMPLETE: {
    taskStatus: 'completed',
    businessStatus: 'amendment-completed',
    label: 'Amendment Complete',
    description: 'Medical record has been updated with corrections'
  },
  
  DENIED: {
    taskStatus: 'completed',
    businessStatus: 'denied',
    label: 'Denied',
    description: 'Correction request has been denied'
  },
  
  DISAGREEMENT_LOGGED: {
    taskStatus: 'completed',
    businessStatus: 'disagreement-logged',
    label: 'Disagreement Logged',
    description: 'Patient disagreement with denial has been recorded'
  },
  
  COMPLETED_WITH_REBUTTAL: {
    taskStatus: 'completed',
    businessStatus: 'completed',
    label: 'Completed with Rebuttal',
    description: 'Process completed with patient rebuttal statement'
  },
  
  // Cancelled state
  CANCELLED: {
    taskStatus: 'cancelled',
    businessStatus: 'requester-cancelled',
    label: 'Cancelled',
    description: 'Request cancelled by patient'
  }
};

// Helper to get workflow state by task and business status
export function getWorkflowState(taskStatus, businessStatus) {
  return Object.values(WORKFLOW_STATES).find(state => 
    state.taskStatus === taskStatus && state.businessStatus === businessStatus
  );
}

// Helper to get display information for current state
export function getStateDisplay(taskStatus, businessStatus) {
  const state = getWorkflowState(taskStatus, businessStatus);
  return state ? {
    label: state.label,
    description: state.description,
    color: getStateColor(businessStatus)
  } : null;
}

// Get color coding for different states
export function getStateColor(businessStatus) {
  const colorMap = {
    'queued': '#2196F3',           // Blue - waiting
    'in-review': '#FF9800',        // Orange - in progress
    'waiting-for-information': '#9C27B0',  // Purple - action needed
    'accepted': '#4CAF50',         // Green - positive
    'partial-accept': '#8BC34A',   // Light Green - partially positive
    'amendment-completed': '#009688',  // Teal - completed positive
    'denied': '#F44336',           // Red - negative
    'disagreement-logged': '#FF5722',  // Deep Orange - disputed
    'completed': '#607D8B',        // Blue Grey - neutral complete
    'requester-cancelled': '#9E9E9E'   // Grey - cancelled
  };
  
  return colorMap[businessStatus] || '#757575';
}

// Workflow action labels
export const WORKFLOW_ACTIONS = {
  START_REVIEW: 'Start Review',
  REQUEST_INFO: 'Request Information',
  PROVIDE_INFO: 'Provide Information',
  ACCEPT: 'Accept Request',
  PARTIAL_ACCEPT: 'Partially Accept',
  DENY: 'Deny Request',
  COMPLETE_AMENDMENT: 'Complete Amendment',
  FILE_DISAGREEMENT: 'File Disagreement',
  ACKNOWLEDGE_REBUTTAL: 'Acknowledge Rebuttal',
  CANCEL: 'Cancel Request'
};