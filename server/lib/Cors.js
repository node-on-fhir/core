// server/lib/Cors.js
// Shared inbound CORS configuration and middleware for HTTP endpoints
// (FHIR REST at /baseR4, DICOM at /api/dicom).
//
// Canonical settings location:
//
//   Meteor.settings.private.cors = {
//     enabled: true,
//     allowedOrigins: ["http://localhost:3000"],   // or ["*"]
//     browserPolicy: { ... }                       // outbound CSP, consumed by VaultServer.js
//   }
//
// Legacy locations honored with a deprecation warning:
//   - Meteor.settings.private.security.cors  ({ enabled, allowedOrigins })
//   - Meteor.settings.private.fhir.corsOrigin  (string or array)
//
// Note: browserPolicy/CSP controls what pages served BY this server may connect
// out to; the CORS headers set here control which foreign origins may call IN
// to this server's HTTP APIs. They are different mechanisms — see VaultServer.js
// for the CSP half.

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

const log = (Meteor.Logger ? Meteor.Logger.for('Cors') : console);

let _resolvedConfig = null;

export function getCorsConfig() {
  if (_resolvedConfig) {
    return _resolvedConfig;
  }

  const canonical = get(Meteor, 'settings.private.cors');
  if (canonical) {
    _resolvedConfig = {
      enabled: get(canonical, 'enabled', true),
      allowedOrigins: get(canonical, 'allowedOrigins', ['*'])
    };
    return _resolvedConfig;
  }

  const legacySecurityCors = get(Meteor, 'settings.private.security.cors');
  if (legacySecurityCors) {
    log.warn('DEPRECATED: Meteor.settings.private.security.cors is deprecated. Move it to Meteor.settings.private.cors ({ enabled, allowedOrigins }). Legacy value honored for now.');
    _resolvedConfig = {
      enabled: get(legacySecurityCors, 'enabled', true),
      allowedOrigins: get(legacySecurityCors, 'allowedOrigins', ['*'])
    };
    return _resolvedConfig;
  }

  const legacyFhirCorsOrigin = get(Meteor, 'settings.private.fhir.corsOrigin');
  if (legacyFhirCorsOrigin) {
    log.warn('DEPRECATED: Meteor.settings.private.fhir.corsOrigin is deprecated. Move it to Meteor.settings.private.cors.allowedOrigins. Legacy value honored for now.');
    _resolvedConfig = {
      enabled: true,
      allowedOrigins: Array.isArray(legacyFhirCorsOrigin) ? legacyFhirCorsOrigin : [legacyFhirCorsOrigin]
    };
    return _resolvedConfig;
  }

  // Default matches the historical DicomEndpoints behavior (always-on, '*')
  // so zero-config development setups keep working.
  _resolvedConfig = {
    enabled: true,
    allowedOrigins: ['*']
  };
  return _resolvedConfig;
}

export function corsMiddleware() {
  return function(req, res, next) {
    const corsConfig = getCorsConfig();

    if (!corsConfig.enabled) {
      return next();
    }

    const requestOrigin = req.headers.origin;
    const allowedOrigins = corsConfig.allowedOrigins || ['*'];

    let allowedOrigin = null;
    if (allowedOrigins.includes('*')) {
      allowedOrigin = '*';
    } else if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      allowedOrigin = requestOrigin;
      res.setHeader('Vary', 'Origin');
    }

    if (allowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, session');
      res.setHeader('Access-Control-Max-Age', '86400');
    }

    if (req.method === 'OPTIONS') {
      if (!allowedOrigin && requestOrigin) {
        log.warn('CORS preflight from disallowed origin', {
          origin: requestOrigin,
          url: req.url,
          allowedOrigins: allowedOrigins,
          hint: 'Add this origin to Meteor.settings.private.cors.allowedOrigins to allow it.'
        });
      }
      res.writeHead(204);
      res.end();
      return;
    }

    next();
  };
}
