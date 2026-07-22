// imports/ui/NotSignedInWrapper.jsx
// DEPRECATED ALIAS — NotSignedInWrapper duplicated the auth gate and is
// absorbed into imports/ui/guards/AuthGuard.jsx (which renders the
// overridable NoAuthorizationPage instead of the old inline sign-in card).
// This shim warns at import time (module evaluation), not at render.
//
// Behavior change vs the legacy wrapper: auth state comes from Meteor.user()
// (not Session.get('currentUser')), and the fallback is the full
// NoAuthorizationPage. The old card props (title, subheader, buttonLabel,
// notSignedInImagePath, redirectPath, dataCount) are accepted but ignored.

import { warnOnce } from '/imports/lib/warnOnce.js';
import AuthGuard from './guards/AuthGuard';

warnOnce('alias-NotSignedInWrapper',
  '[Deprecation] NotSignedInWrapper (imports/ui/NotSignedInWrapper.jsx) is deprecated — import AuthGuard from imports/ui/guards/AuthGuard.jsx instead.');

export { AuthGuard as NotSignedInWrapper };
export default AuthGuard;
