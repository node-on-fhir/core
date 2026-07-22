// imports/ui/components/NotAuthorized.jsx
// DEPRECATED ALIAS — the page moved to
// imports/ui/extensible/NoAuthorizationPage.jsx (overridable via
// components: { NoAuthorizationPage: ... }).
// This shim warns at import time (module evaluation), not at render.

import { warnOnce } from '/imports/lib/warnOnce.js';
import NoAuthorizationPage from '../extensible/NoAuthorizationPage';

warnOnce('alias-NotAuthorized',
  '[Deprecation] NotAuthorized (imports/ui/components/NotAuthorized.jsx) is deprecated — import NoAuthorizationPage from imports/ui/extensible/NoAuthorizationPage.jsx instead.');

export { NoAuthorizationPage as NotAuthorized };
export default NoAuthorizationPage;
