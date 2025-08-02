// /imports/ui/components/AuthenticatedRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

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
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    const loginPath = get(Meteor, 'settings.public.defaults.landingPage', '/login');
    return <Navigate to={loginPath} replace />;
  }

  // User is authenticated, render the protected component
  return children;
}

export default AuthenticatedRoute;