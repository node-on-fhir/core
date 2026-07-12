// imports/lib/schemas/SimpleSchemas/DeviceUseStatements.js
//
// FHIR DeviceUseStatement collection. Records that a patient is/was using a
// Device (links Patient ⇄ Device with a timing period). Referenced by
// implantable-devices (getPatientDevices / assignToPatient / register),
// international-patient-summary, and the $everything patient compartment in
// server/FhirEndpoints.js — but the collection itself was never registered, so
// those writes/reads silently no-op'd. This registers it.
//
// Like Devices, no SimpleSchema is attached (validation is handled at the method
// layer); this keeps the FHIR resource shape flexible.

import { createFhirCollection } from '/imports/lib/ValidatedCollection';

export const DeviceUseStatements = createFhirCollection('DeviceUseStatement', 'DeviceUseStatements');
