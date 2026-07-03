// npmPackages/prescription-benefit/lib/collections.js
//
// Package-local collections (NOT FHIR resources, not registered in
// global.Collections). They persist the two halves of an RTPB transaction
// (§ 170.315(b)(4)) — canonical JSON plus the wire XML rendering.

import { Mongo } from 'meteor/mongo';

// One document per RTPBRequest sent.
//   { _id, id, patientId, medicationRequestId?, mode, status,
//     requestJson, requestXml, createdAt, createdBy }
export const PrescriptionBenefitRequest = new Mongo.Collection('PrescriptionBenefitRequest');

// One document per RTPBResponse received, linked to its request.
//   { _id, id, requestId, patientId, source ('mock'|'live'),
//     responseJson, responseXml, summary, createdAt }
export const PrescriptionBenefitResponse = new Mongo.Collection('PrescriptionBenefitResponse');
