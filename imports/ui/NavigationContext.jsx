// imports/ui/NavigationContext.jsx

import React, { createContext, useContext, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Meteor } from 'meteor/meteor';
import { RouteAnnouncer } from './a11y/RouteAnnouncer';

const NavigationContext = createContext(null);

export const NavigationProvider = ({ children }) => {
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);

  // Use useLayoutEffect to set this synchronously before browser paint
  // This ensures Meteor.navigate is available as early as possible
  useLayoutEffect(function() {
    // Always expose in client (browser) environment
    if (typeof Meteor !== 'undefined') {
      // Store navigate function on Meteor object for global access
      Meteor.navigate = function(path, options) {
        console.log('[Meteor.navigate] Navigating to:', path);
        navigate(path, options);
      };

      // Cleanup on unmount
      return function() {
        delete Meteor.navigate;
      };
    } else {
      console.error('[NavigationProvider] Meteor is not defined!');
    }
  }, [navigate]);

  return (
    <NavigationContext.Provider value={navigateRef.current}>
      <RouteAnnouncer />
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  return useContext(NavigationContext);
};