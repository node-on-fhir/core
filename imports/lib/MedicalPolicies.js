// /Volumes/MobileDev/Code/honeycomb/imports/lib/MedicalPolicies.js
//
// Resolver for deployment "medical policies" — currently the per-field
// visibility/inference flags that govern how sex/gender/karyotype demographics
// are displayed (see PatientSexGender.js and the Prominent Header).
//
// Effective value for each flag, highest precedence first:
//   1. runtime override  — a MedicalPolicies ServerConfiguration doc (Phase 5),
//                          passed in as `override` so this stays Meteor-decoupled
//                          and reactive at the call site.
//   2. Meteor.settings.public.defaults.<flag>
//   3. built-in default below.

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

export const DEMOGRAPHIC_POLICY_DEFAULTS = {
  showGender: true,
  showBirthSex: true,
  showSex: false,
  showKaryotype: false,
  inferBirthSexFromGender: true,
  inferKaryotypeFromGender: true
};

// Resolve the effective demographic-display policy. `override` is an optional
// plain object (e.g. the `data` of a MedicalPolicies config doc); undefined/null
// keys fall through to settings, then to DEMOGRAPHIC_POLICY_DEFAULTS.
export function getDemographicPolicy(override){
  const policy = {};

  Object.keys(DEMOGRAPHIC_POLICY_DEFAULTS).forEach(function(key){
    const overrideValue = override ? get(override, key) : undefined;
    const settingsValue = get(Meteor, 'settings.public.defaults.' + key);

    if(overrideValue !== undefined && overrideValue !== null){
      policy[key] = overrideValue;
    } else if(settingsValue !== undefined && settingsValue !== null){
      policy[key] = settingsValue;
    } else {
      policy[key] = DEMOGRAPHIC_POLICY_DEFAULTS[key];
    }
  });

  return policy;
}
