// imports/ui/NavigationContext.jsx

import React, { createContext, useContext, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';

const NavigationContext = createContext(null);

export const NavigationProvider = ({ children }) => {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);

  console.log('[NavigationProvider] Component mounted, navigate:', typeof navigate);
  console.log('[NavigationProvider] Meteor.isDevelopment:', Meteor.isDevelopment);
  console.log('[NavigationProvider] process.env.TEST_RUN:', process.env.TEST_RUN);

  // Use useLayoutEffect to set this synchronously before browser paint
  // This ensures Meteor.navigate is available as early as possible
  useLayoutEffect(function() {
    console.log('[NavigationProvider] useLayoutEffect running...');

    // Always expose in client (browser) environment
    // Production safety: only works client-side anyway, not server-side
    if (typeof Meteor !== 'undefined') {
      // Store navigate function on Meteor object for global access
      Meteor.navigate = function(path, options) {
        console.log('[Meteor.navigate] Navigating to:', path);
        navigate(path, options);
      };

      console.log('[NavigationProvider] ✓ Meteor.navigate() is now available');
      console.log('[NavigationProvider] Usage: Meteor.navigate("/path")');

      // Cleanup on unmount
      return function() {
        console.log('[NavigationProvider] Cleaning up Meteor.navigate');
        delete Meteor.navigate;
      };
    } else {
      console.error('[NavigationProvider] Meteor is not defined!');
    }
  }, [navigate]);

  return (
    <NavigationContext.Provider value={navigateRef.current}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  return useContext(NavigationContext);
};