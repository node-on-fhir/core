// imports/components/resolveShareModalDialog.js
//
// Override resolver for the Share dialog. Honeycomb ships a default
// ShareModalDialog (registered as Meteor.ShareModalDialog in App.jsx), but any
// workflow package may export its own `ShareModalDialog` from its client entry —
// the generated client loader registers each package's client module into
// `globalThis.Package[<packageName>]` (see .claude/rules/fhir/package-registry.md).
//
// This guard scans that registry the same way PatientSidebar scans for
// SidebarWorkflows/ClinicianWorkflows: the FIRST package that exports a
// `ShareModalDialog` overrides the default. Falls back to the shared default,
// and finally returns `null` so callers can no-op rather than crash when neither
// is present (e.g. a server-side or pre-startup render).
//
// Hook points for the future (license / provenance / billing gating of WHICH
// dialog a deployment is entitled to render) belong here, at the resolution
// boundary — keep that logic in this one function.

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

export function resolveShareModalDialog() {
  const registry = (typeof globalThis !== 'undefined' && globalThis.Package) || {};

  // Package override wins. Iterate deterministically over the registry; the
  // first package exporting a ShareModalDialog takes precedence over the default.
  const packageNames = Object.keys(registry);
  for (let i = 0; i < packageNames.length; i++) {
    const override = get(registry[packageNames[i]], 'ShareModalDialog');
    if (override) {
      console.log('[resolveShareModalDialog] Using override from package:', packageNames[i]);
      return override;
    }
  }

  // Shared default registered in imports/ui/App.jsx.
  const fallback = get(Meteor, 'ShareModalDialog', null);
  if (!fallback) {
    console.warn('[resolveShareModalDialog] No ShareModalDialog override and no Meteor.ShareModalDialog default registered.');
  }
  return fallback;
}

export default resolveShareModalDialog;
