// npmPackages/pacio-core/lib/dateHelpers.js
//
// Date rendering that never leaks moment's "Invalid date" into the UI.

import moment from 'moment';

/**
 * Format a FHIR date/dateTime for display; em-dash when absent/unparseable.
 * @param {string|Date|undefined} value
 * @param {string} [format='MMM DD, YYYY']
 * @returns {string}
 */
export function formatDate(value, format = 'MMM DD, YYYY') {
  if (!value) { return '—'; }
  const parsed = moment(value);
  return parsed.isValid() ? parsed.format(format) : '—';
}

export default formatDate;
