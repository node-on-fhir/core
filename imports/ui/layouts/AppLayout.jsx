// imports/ui/layouts/AppLayout.jsx

import React from 'react';
import { Meteor } from 'meteor/meteor';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';

// Import layout variants
import { AppLayoutWithAuth } from './AppLayoutWithAuth';
import { AppLayoutNoAuth } from './AppLayoutNoAuth';

// Smart layout selector that chooses the appropriate layout based on configuration
export function AppLayout({ children }) {
  // Track accounts configuration
  const { accountsEnabled, isLoading } = useTracker(() => {
    const accountsEnabled = get(Meteor, 'settings.public.modules.accounts.enabled', true);
    
    return {
      accountsEnabled,
      isLoading: Meteor.loggingIn()
    };
  });

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  // Choose layout based on configuration
  if (accountsEnabled) {
    return <AppLayoutWithAuth>{children}</AppLayoutWithAuth>;
  } else {
    return <AppLayoutNoAuth>{children}</AppLayoutNoAuth>;
  }
}