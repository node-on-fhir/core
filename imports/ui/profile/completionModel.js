// imports/ui/profile/completionModel.js
//
// Pure profile-completion model for the My Profile page (design handoff
// "State Management" section). No Meteor imports — testable standalone.
//
// Weights: account 15 · patient record linked 25 · email verified 10 ·
// photo 10 · phone+address 10 · ≥1 linked external record 10 · ≥1 device 10 ·
// consent reviewed 10.  nextSteps = the first three undone, in this order.

import { get } from 'lodash';

export function computeProfileCompletion({ user, patient, linkedRecords, devices, consents } = {}) {
  const hasPhone = Boolean(get(patient, 'telecom', []).find(function(t) { return get(t, 'system') === 'phone' && get(t, 'value'); }));
  const hasAddress = Boolean(get(patient, 'address.0'));

  const steps = [
    { id: 'account', label: 'Create your account', weight: 15, done: Boolean(user) },
    { id: 'patient', label: 'Link a patient record', weight: 25, done: Boolean(patient) },
    { id: 'email', label: 'Verify your email', weight: 10, done: Boolean(get(user, 'emails.0.verified')) },
    { id: 'photo', label: 'Add a profile photo', weight: 10, done: Boolean(get(patient, 'photo.0')) },
    { id: 'contact', label: 'Add phone & address', weight: 10, done: hasPhone && hasAddress },
    { id: 'linked', label: 'Link an external record', weight: 10, done: (linkedRecords || []).length > 0 },
    { id: 'device', label: 'Add a device', weight: 10, done: (devices || []).length > 0 },
    { id: 'consent', label: 'Review a consent', weight: 10, done: (consents || []).length > 0 }
  ];

  const score = steps.reduce(function(sum, step) {
    return sum + (step.done ? step.weight : 0);
  }, 0);

  const nextSteps = steps.filter(function(step) { return !step.done; }).slice(0, 3);

  return { score, steps, nextSteps };
}

export default computeProfileCompletion;
