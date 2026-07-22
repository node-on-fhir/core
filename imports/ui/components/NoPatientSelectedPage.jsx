// imports/ui/components/NoPatientSelectedPage.jsx
// DEPRECATED ALIAS — the page moved to
// imports/ui/extensible/NoSelectedPatientPage.jsx (note the normalized name:
// NoSelectedPatientPage) and is overridable via
// components: { NoSelectedPatientPage: ... }.
// This shim warns at import time (module evaluation), not at render.

import { warnOnce } from '/imports/lib/warnOnce.js';
import NoSelectedPatientPage from '../extensible/NoSelectedPatientPage';

warnOnce('alias-NoPatientSelectedPage',
  '[Deprecation] NoPatientSelectedPage (imports/ui/components/NoPatientSelectedPage.jsx) is deprecated — import NoSelectedPatientPage from imports/ui/extensible/NoSelectedPatientPage.jsx instead.');

export { NoSelectedPatientPage as NoPatientSelectedPage };
export default NoSelectedPatientPage;
