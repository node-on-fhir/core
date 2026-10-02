// imports/api/dedup/referencePaths.js
//
// The FHIR reference paths the dedup engine searches when looking for inbound
// references to a candidate-for-deletion, and rewrites when re-pointing
// references onto a surviving record. Mongo dot-notation matches through
// arrays, so 'derivedFrom.reference' covers derivedFrom[] entries.
//
// Not exhaustive against the full R4 reference graph — these are the paths
// that occur in honeycomb's collections. Add a path here when a new resource
// family introduces one; the engine treats this list as authoritative.

const REFERENCE_PATHS = [
  'subject.reference',
  'patient.reference',
  'encounter.reference',
  'specimen.reference',
  'derivedFrom.reference',
  'result.reference',
  'basedOn.reference',
  'partOf.reference',
  'focus.reference',
  'hasMember.reference',
  'target.reference',
  'medicationReference.reference',
  'requester.reference',
  'performer.reference',
  'performer.actor.reference',
  'author.reference',
  'asserter.reference',
  'recorder.reference',
  'participant.actor.reference',
  'actor.reference',
  'entity.what.reference',
  'content.attachment.url',
  'supportingInformation.reference',
  'reasonReference.reference',
  'link.other.reference'
];

export { REFERENCE_PATHS };
export default REFERENCE_PATHS;
