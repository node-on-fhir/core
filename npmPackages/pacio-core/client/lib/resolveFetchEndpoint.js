// /packages/pacio-core/client/lib/resolveFetchEndpoint.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

const log = (Meteor.Logger ? Meteor.Logger.for('resolveFetchEndpoint') : console);

// Resolves the FHIR base the /patient-fetch page should talk to.
// Returns { url, name, source } where source is one of:
//   'explicit'  — a valid ?endpoint= query param (directory hand-off / sandbox pick)
//   'interface' — settings.public.interfaces.default.channel.endpoint
//   'fallback'  — this app's own /baseR4 (nothing configured; chip shows a warning)
export function resolveFetchEndpoint(search) {
  const params = new URLSearchParams(search || '');
  const raw = params.get('endpoint');
  if (raw) {
    try {
      const parsed = new URL(raw);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return {
          url: raw.replace(/\/+$/, ''),
          name: params.get('endpointName') || '',
          source: 'explicit'
        };
      }
      log.warn('Rejected ?endpoint= with non-http(s) protocol', { endpoint: raw });
    } catch (err) {
      log.warn('Rejected unparseable ?endpoint= param', { endpoint: raw });
    }
  }
  const configured = get(Meteor, 'settings.public.interfaces.default.channel.endpoint', '');
  if (configured) {
    return { url: configured.replace(/\/+$/, ''), name: '', source: 'interface' };
  }
  return { url: Meteor.absoluteUrl('baseR4'), name: '', source: 'fallback' };
}

export default resolveFetchEndpoint;
