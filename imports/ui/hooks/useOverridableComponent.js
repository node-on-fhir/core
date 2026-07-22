// imports/ui/hooks/useOverridableComponent.js
// Resolve a WorkflowRegistry component override at render time, reactively.
// Returns the override component (stable reference — normalized once at
// registration) or the supplied default. Subscribes to registry changes so
// late-registering workflows take effect without a reload.
//
// Usage:
//   const HeaderComponent = useOverridableComponent('Header', Header);
//   return <HeaderComponent {...props} />;

import { useSyncExternalStore, useCallback } from 'react';
import WorkflowRegistry from '/imports/lib/WorkflowRegistry.js';

export function useOverridableComponent(name, DefaultComponent) {
  const subscribe = useCallback(function(callback) {
    return WorkflowRegistry.subscribe(callback);
  }, []);

  const override = useSyncExternalStore(subscribe, function() {
    return WorkflowRegistry.getComponent(name);
  });

  return override || DefaultComponent;
}

export default useOverridableComponent;
