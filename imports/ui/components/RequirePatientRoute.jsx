// imports/ui/components/RequirePatientRoute.jsx
// DEPRECATED ALIAS — the guard moved to imports/ui/guards/PatientGuard.jsx.
// This shim warns at import time (module evaluation), not at render.

import { warnOnce } from '/imports/lib/warnOnce.js';
import PatientGuard from '../guards/PatientGuard';

warnOnce('alias-RequirePatientRoute',
  '[Deprecation] RequirePatientRoute (imports/ui/components/RequirePatientRoute.jsx) is deprecated — import PatientGuard from imports/ui/guards/PatientGuard.jsx instead.');

export { PatientGuard as RequirePatientRoute };
export default PatientGuard;
