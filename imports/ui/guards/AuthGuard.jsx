// imports/ui/guards/AuthGuard.jsx
//
// Render-tree guard for routes declaring `requireAuth: true` (and for ad-hoc
// wrapping). Renders children when a user is signed in; otherwise the
// NoAuthorizationPage fallback (overridable via
// components: { NoAuthorizationPage: ... }). While the login handshake is in
// flight it renders LoadingPage (overridable via components: { LoadingPage }).
//
// Route preservation: the guard renders IN PLACE (the browser URL is still
// the blocked route), so it captures pathname+search and passes it to the
// fallback as `requestedPath`. NoAuthorizationPage threads it to
// /signin | /signup as ?returnTo=<encoded>, and Login/Register pages navigate
// there after successful auth (see imports/lib/WorkflowNavigation.js).
//
// Formerly imports/ui/components/AuthenticatedRoute.jsx; also absorbs the
// legacy NotSignedInWrapper (imports/ui/NotSignedInWrapper.jsx) — both old
// paths re-export this component as deprecated aliases.

import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { useOverridableComponent } from '../hooks/useOverridableComponent';
import NoAuthorizationPage from '../extensible/NoAuthorizationPage';
import LoadingPage from '../extensible/LoadingPage';

export function AuthGuard({ children }) {
  const NoAuthComponent = useOverridableComponent('NoAuthorizationPage', NoAuthorizationPage);
  const LoadingComponent = useOverridableComponent('LoadingPage', LoadingPage);
  const location = useLocation();

  const { user, loggingIn } = useTracker(() => {
    return {
      user: Meteor.user(),
      loggingIn: Meteor.loggingIn()
    };
  }, []);

  // The blocked route (guard renders in place, so this IS the requested URL).
  // Root is suppressed — returning to '/' is already the default.
  const requestedPath = location.pathname === '/' ? null : location.pathname + location.search;

  // Still checking authentication status
  if (loggingIn) {
    return <LoadingComponent message="Checking authentication..." />;
  }

  if (!user) {
    // Escape hatch for debugging / demo environments
    const bypassNotAuthorized = get(Meteor, 'settings.public.NotAuthorizedUiBypass', false);
    if (bypassNotAuthorized) {
      console.log('[AuthGuard] NotAuthorized UI bypassed due to Meteor.settings.public.NotAuthorizedUiBypass = true');
      return children;
    }
    return <NoAuthComponent requestedPath={requestedPath} />;
  }

  // User is authenticated, render the protected component
  return children;
}

export default AuthGuard;
