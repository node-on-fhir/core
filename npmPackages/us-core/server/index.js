// npmPackages/us-core/server/index.js
//
// Server entry — US Core 7.0.0 FHIR profile provider. This is NOT a UI workflow;
// it contributes ProfileSet (CapabilityStatement.supportedProfile) and
// ProfileDecorators (REST egress decoration) to the host app.
//
// Discovery: the host app iterates the global `Package` registry in
// server/Metadata.js (ProfileSet) and server/RestHelpers.js (ProfileDecorators).
// NPM workflow packages are registered into `Package['<pkg>']` by the generated
// imports/workflows/server-loader.js (see workflows/rspack.workflowParser.js),
// which namespace-imports this module — so re-exporting ProfileSet +
// ProfileDecorators below is what makes them discoverable.
// See .claude/rules/fhir/package-registry.md.

import { ProfileSet } from './ProfileSet.js';
import { patientDecorator } from '../lib/decorators/PatientDecorator.js';
import { organizationDecorator } from '../lib/decorators/OrganizationDecorator.js';

export const ProfileDecorators = {
  Patient: patientDecorator,
  Organization: organizationDecorator
};

export { ProfileSet };

console.log('US Core (npm) server loaded — exposes ProfileSet + ProfileDecorators (Patient, Organization) via the Package registry'); // phi-audit: ok
