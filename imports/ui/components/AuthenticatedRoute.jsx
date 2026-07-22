// imports/ui/components/AuthenticatedRoute.jsx
// DEPRECATED ALIAS — the guard moved to imports/ui/guards/AuthGuard.jsx.
// This shim warns at import time (module evaluation), not at render.

import { warnOnce } from '/imports/lib/warnOnce.js';
import AuthGuard from '../guards/AuthGuard';

warnOnce('alias-AuthenticatedRoute',
  '[Deprecation] AuthenticatedRoute (imports/ui/components/AuthenticatedRoute.jsx) is deprecated — import AuthGuard from imports/ui/guards/AuthGuard.jsx instead.');

export { AuthGuard as AuthenticatedRoute };
export default AuthGuard;
