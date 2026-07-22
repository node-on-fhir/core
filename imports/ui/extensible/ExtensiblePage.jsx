// imports/ui/extensible/ExtensiblePage.jsx
// Render-time indirection for overridable pages referenced from module-scope
// route tables (App.jsx dynamicRoutes). Resolving the override inside render
// (instead of baking an element at module scope) means both boot-time and
// late-registering workflow overrides take effect.

import React from 'react';
import { useOverridableComponent } from '../hooks/useOverridableComponent';

export function ExtensiblePage({ name, DefaultComponent, ...rest }) {
  const Component = useOverridableComponent(name, DefaultComponent);
  return <Component {...rest} />;
}

export default ExtensiblePage;
