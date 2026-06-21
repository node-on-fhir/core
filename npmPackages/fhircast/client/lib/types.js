// npmPackages/fhircast-module/client/lib/types.js

export const SubscriptionParams = {
  callback: 'hub.callback',
  mode: 'hub.mode',
  events: 'hub.events',
  secret: 'hub.secret',
  topic: 'hub.topic',
  lease: 'hub.lease',
  channelType: 'hub.channel.type',
  channelEndpoint: 'hub.channel.endpoint'
};

export const SubscriptionMode = {
  subscribe: 'subscribe',
  unsubscribe: 'unsubscribe'
};

// FHIRcast STU3 event names
export const EventType = {
  PatientOpen: 'patient-open',
  PatientClose: 'patient-close',
  ImagingStudyOpen: 'imagingstudy-open',
  ImagingStudyClose: 'imagingstudy-close',
  EncounterOpen: 'encounter-open',
  EncounterClose: 'encounter-close',
  DiagnosticReportOpen: 'diagnosticreport-open',
  DiagnosticReportClose: 'diagnosticreport-close',
  PatientUpdate: 'patient-update',
  ImagingStudyUpdate: 'imagingstudy-update',
  EncounterUpdate: 'encounter-update',
  DiagnosticReportUpdate: 'diagnosticreport-update',
  DiagnosticReportSelect: 'diagnosticreport-select',
  SyncError: 'syncerror',
  LogoutUser: 'userlogout',
  HibernateUser: 'userhibernate'
};

export const WebSocketStatus = {
  Closed: 'Closed',
  Opening: 'Opening',
  Open: 'Open'
};
