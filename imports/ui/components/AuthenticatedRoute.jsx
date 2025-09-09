// /imports/ui/components/AuthenticatedRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import NotAuthorized from './NotAuthorized';

export function AuthenticatedRoute({ children }) {
  const { user, loggingIn } = useTracker(() => {
    const user = Meteor.user();
    const loggingIn = Meteor.loggingIn();
    return {
      user,
      loggingIn
    };
  }, []);

  // If still checking authentication status, show loading
  if (loggingIn) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f5f5f5' 
      }}>
        <div style={{ 
          fontSize: '18px', 
          color: '#666',
          fontFamily: 'Roboto, sans-serif' 
        }}>
          Checking authentication...
        </div>
      </div>
    );
  }

  // If not authenticated, show NotAuthorized component
  if (!user) {
    // Check if we should bypass the NotAuthorized UI for debugging
    const bypassNotAuthorized = get(Meteor, 'settings.public.NotAuthorizedUiBypass', false);
    if (bypassNotAuthorized) {
      console.log('[AuthenticatedRoute] NotAuthorized UI bypassed due to Meteor.settings.public.NotAuthorizedUiBypass = true');
      return children;
    }
    return <NotAuthorized />;
  }

  // User is authenticated, render the protected component
  return children;
}

export default AuthenticatedRoute;