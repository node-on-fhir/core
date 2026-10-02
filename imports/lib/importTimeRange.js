// imports/lib/importTimeRange.js
//
// Time-range presets + resolver for import filtering (Apple Health today;
// PDF / Data / Social-Media importers later). Dependency-free and isomorphic.
//
// Semantics: pastNDays / lastMonth / lastYear / last5Years / lastDecade are
// ROLLING windows ending now (open end bound); yesterday and lastQuarter are
// CALENDAR units (inclusive end bound); custom takes date-only strings,
// inclusive on both ends, either side optional. Unknown presets and invalid
// custom dates degrade to open bounds (permissive-in).

export const TIME_RANGE_OPTIONS = [
  { value: 'all', label: 'All Data' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'past7Days', label: 'Past 7 Days' },
  { value: 'past30Days', label: 'Past 30 Days' },
  { value: 'lastQuarter', label: 'Last Quarter' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'lastYear', label: 'Last Year' },
  { value: 'last5Years', label: 'Last 5 Years' },
  { value: 'lastDecade', label: 'Last 10 Years' },
  { value: 'custom', label: 'Custom Range…' }
];

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

// 'YYYY-MM-DD' → local Date, or null for anything else
function parseDateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const parts = value.split('-');
  const parsed = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Resolve a time-range selection into concrete bounds.
 *
 * @param {String} timeRange    one of TIME_RANGE_OPTIONS values
 * @param {Object} customRange  { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' } for 'custom'
 * @param {Date}   now          injected clock (defaults to new Date())
 * @returns {{ start: Date|null, end: Date|null }}  null = open bound
 */
export function resolveTimeRange(timeRange, customRange, now) {
  const clock = now instanceof Date ? now : new Date();

  switch (timeRange) {
    case 'yesterday': {
      const yesterday = new Date(clock.getFullYear(), clock.getMonth(), clock.getDate() - 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    }
    case 'past7Days':
      return { start: new Date(clock.getTime() - 7 * 86400000), end: null };
    case 'past30Days':
      return { start: new Date(clock.getTime() - 30 * 86400000), end: null };
    case 'lastQuarter': {
      const currentQuarterStartMonth = Math.floor(clock.getMonth() / 3) * 3;
      const start = new Date(clock.getFullYear(), currentQuarterStartMonth - 3, 1);
      const end = new Date(clock.getFullYear(), currentQuarterStartMonth, 0); // day 0 = last day of prior month
      return { start: startOfDay(start), end: endOfDay(end) };
    }
    case 'lastMonth':
      return { start: new Date(clock.getFullYear(), clock.getMonth() - 1, clock.getDate(), clock.getHours(), clock.getMinutes(), clock.getSeconds()), end: null };
    case 'lastYear':
      return { start: new Date(clock.getFullYear() - 1, clock.getMonth(), clock.getDate(), clock.getHours(), clock.getMinutes(), clock.getSeconds()), end: null };
    case 'last5Years':
      return { start: new Date(clock.getFullYear() - 5, clock.getMonth(), clock.getDate(), clock.getHours(), clock.getMinutes(), clock.getSeconds()), end: null };
    case 'lastDecade':
      return { start: new Date(clock.getFullYear() - 10, clock.getMonth(), clock.getDate(), clock.getHours(), clock.getMinutes(), clock.getSeconds()), end: null };
    case 'custom': {
      const start = parseDateOnly(customRange && customRange.start);
      const end = parseDateOnly(customRange && customRange.end);
      return {
        start: start ? startOfDay(start) : null,
        end: end ? endOfDay(end) : null
      };
    }
    default:
      return { start: null, end: null };
  }
}

/**
 * Convenience predicate: is `date` (Date or parseable string) inside the
 * resolved bounds? Open bounds always pass; unparseable dates pass
 * (permissive-in — let downstream decide).
 */
export function isWithinTimeRange(date, resolved) {
  if (!resolved || (!resolved.start && !resolved.end)) {
    return true;
  }
  const parsed = date instanceof Date ? date : new Date(date);
  if (isNaN(parsed.getTime())) {
    return true;
  }
  if (resolved.start && parsed < resolved.start) {
    return false;
  }
  if (resolved.end && parsed > resolved.end) {
    return false;
  }
  return true;
}

export default { TIME_RANGE_OPTIONS, resolveTimeRange, isWithinTimeRange };
