// imports/ui/guards/MapGuard.jsx
//
// Render-tree guard for Google-Maps-backed surfaces, mirroring DataGuard.
// variant="page": no key -> NoMapKeyPage (overridable slot 'NoMapKeyPage')
//   carrying the BYOK onramp — for full-page map surfaces.
// variant="card": no key -> the `fallback` prop (default null, i.e. the
//   embedded map card simply collapses) — for maps inside cards/forms.
// children may be a function receiving the resolved apiKey string.

import React from 'react';
import PropTypes from 'prop-types';
import { useOverridableComponent } from '../hooks/useOverridableComponent';
import { useGoogleMapsApiKey } from '../hooks/useGoogleMapsApiKey';
import NoMapKeyPage from '../extensible/NoMapKeyPage';

export function MapGuard({ children, variant, fallback }) {
  var resolvedVariant = variant || 'page';
  var resolvedFallback = fallback !== undefined ? fallback : null;

  var result = useGoogleMapsApiKey();
  var apiKey = result.apiKey;
  var checked = result.checked;

  var NoMapKeyComponent = useOverridableComponent('NoMapKeyPage', NoMapKeyPage);

  if (!checked && !apiKey) {
    return null; // resolution in flight — avoid flashing the onramp
  }
  if (apiKey) {
    return typeof children === 'function' ? children(apiKey) : (children || null);
  }
  if (resolvedVariant === 'card') {
    return resolvedFallback;
  }
  // One-time reload after first key save is deliberate: GoogleMapsLoader
  // memoizes its script promise and the Maps JS API cannot be re-keyed
  // in-place. Sanctioned exception to the no-window.location rule.
  return React.createElement(NoMapKeyComponent, {
    onKeySaved: function() { window.location.reload(); }
  });
}

MapGuard.propTypes = {
  variant: PropTypes.oneOf(['page', 'card']),
  fallback: PropTypes.node
};

export default MapGuard;
