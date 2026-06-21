// packages/quality-measures/lib/collections.js
//
// Package-local collections (not FHIR resources).

import { Mongo } from 'meteor/mongo';

// Saved measure-filter criteria per user (ONC 170.315(c)(4))
export const QualityMeasureFilterSets = new Mongo.Collection('QualityMeasureFilterSets');
