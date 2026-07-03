// npmPackages/decision-support/lib/collections.js
//
// Package-local collection for the (ii)(C) feedback loop. The intervention
// catalog itself lives in the global PlanDefinitions collection; firings in
// GuidanceResponses + DetectedIssues. This stores the exportable feedback
// records (computable format): intervention, action taken, user feedback,
// user, date, location.

import { Mongo } from 'meteor/mongo';

export const DecisionSupportFeedback = new Mongo.Collection('DecisionSupportFeedback');
