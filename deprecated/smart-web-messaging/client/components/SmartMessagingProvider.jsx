// packages/smart-web-messaging/client/components/SmartMessagingProvider.jsx

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { get } from 'lodash';

// Create context
const SmartMessagingContext = createContext(null);

// Hook to use the context
export const useSmartMessaging = () => {
  const context = useContext(SmartMessagingContext);
  if (!context) {
    throw new Error('useSmartMessaging must be used within SmartMessagingProvider');
  }
  return context;
};

/**
 * SmartMessagingProvider component
 * Provides SMART Web Messaging functionality to React apps
 */
export const SmartMessagingProvider = function({ children, options = {} }) {
  const [initialized, setInitialized] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [capabilities, setCapabilities] = useState(null);
  
  // Track scratchpad items reactively
  const scratchpadItems = useTracker(() => {
    const items = ScratchpadService.items.get();
    return Array.from(items.values());
  }, []);
  
  // Initialize on mount
  useEffect(() => {
    const initializeMessaging = async () => {
      try {
        await SmartMessagingClient.initialize(options);
        setInitialized(true);
        setReady(SmartMessagingClient.ready);
        
        // Get parent capabilities if available
        const caps = Session.get('parentCapabilities');
        if (caps) {
          setCapabilities(caps);
        }
      } catch (err) {
        console.error('Failed to initialize SMART messaging:', err);
        setError(err.message);
      }
    };
    
    initializeMessaging();
    
    // Cleanup on unmount
    return () => {
      SmartMessagingClient.shutdown();
    };
  }, []);
  
  // Listen for capability updates
  useEffect(() => {
    const handleReady = (event, data) => {
      setReady(true);
      if (data && data.message && data.message.payload) {
        setCapabilities(data.message.payload.capabilities);
      }
    };
    
    const handleError = (event, data) => {
      setError(data.error);
    };
    
    $(document).on('smart:messaging:ready', handleReady);
    $(document).on('smart:messaging:error', handleError);
    
    return () => {
      $(document).off('smart:messaging:ready', handleReady);
      $(document).off('smart:messaging:error', handleError);
    };
  }, []);
  
  // Done callback
  const done = useCallback(async (result) => {
    try {
      await SmartMessagingClient.done(result);
    } catch (err) {
      console.error('Failed to send done message:', err);
      throw err;
    }
  }, []);
  
  // Launch activity callback
  const launchActivity = useCallback(async (activityType, parameters, context) => {
    try {
      return await SmartMessagingClient.launchActivity(activityType, parameters, context);
    } catch (err) {
      console.error('Failed to launch activity:', err);
      throw err;
    }
  }, []);
  
  // Scratchpad operations
  const scratchpad = {
    create: useCallback(async (resource) => {
      try {
        return await SmartMessagingClient.scratchpad.create(resource);
      } catch (err) {
        console.error('Failed to create scratchpad resource:', err);
        throw err;
      }
    }, []),
    
    read: useCallback(async (id) => {
      try {
        return await SmartMessagingClient.scratchpad.read(id);
      } catch (err) {
        console.error('Failed to read scratchpad resource:', err);
        throw err;
      }
    }, []),
    
    update: useCallback(async (id, resource) => {
      try {
        return await SmartMessagingClient.scratchpad.update(id, resource);
      } catch (err) {
        console.error('Failed to update scratchpad resource:', err);
        throw err;
      }
    }, []),
    
    delete: useCallback(async (id) => {
      try {
        return await SmartMessagingClient.scratchpad.delete(id);
      } catch (err) {
        console.error('Failed to delete scratchpad resource:', err);
        throw err;
      }
    }, []),
    
    list: useCallback(async () => {
      try {
        return await SmartMessagingClient.scratchpad.list();
      } catch (err) {
        console.error('Failed to list scratchpad resources:', err);
        throw err;
      }
    }, []),
    
    items: scratchpadItems
  };
  
  // FHIR operations
  const fhir = {
    request: useCallback(async (method, url, options) => {
      try {
        return await SmartMessagingClient.fhir.request(method, url, options);
      } catch (err) {
        console.error('Failed to make FHIR request:', err);
        throw err;
      }
    }, []),
    
    get: useCallback(async (url, options) => {
      return SmartMessagingClient.fhir.get(url, options);
    }, []),
    
    post: useCallback(async (url, body, options) => {
      return SmartMessagingClient.fhir.post(url, body, options);
    }, []),
    
    put: useCallback(async (url, body, options) => {
      return SmartMessagingClient.fhir.put(url, body, options);
    }, []),
    
    delete: useCallback(async (url, options) => {
      return SmartMessagingClient.fhir.delete(url, options);
    }, [])
  };
  
  // Register message handler
  const onMessage = useCallback((messageType, handler) => {
    SmartMessagingClient.onMessage(messageType, handler);
  }, []);
  
  // Context value
  const contextValue = {
    initialized,
    ready,
    error,
    capabilities,
    done,
    launchActivity,
    scratchpad,
    fhir,
    onMessage,
    // Expose raw client for advanced use cases
    client: SmartMessagingClient
  };
  
  return (
    <SmartMessagingContext.Provider value={contextValue}>
      {children}
    </SmartMessagingContext.Provider>
  );
};