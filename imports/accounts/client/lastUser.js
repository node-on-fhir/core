// imports/accounts/client/lastUser.js
//
// The remembered-device contract for the one-door landing (design handoff
// 2026-11-01): ONE namespaced localStorage key holding JSON. Written on
// LOGIN_OK and CREATE_OK; read by the landing (useLastUser); cleared ONLY by
// "Not you? Switch account" — never on logout (logout → returning-user
// landing is the whole point). All access try/caught: private mode or
// blocked storage degrades to "absent".

import { get } from 'lodash';

export const LAST_USER_KEY = 'chronicle.lastUser';

export function readLastUser() {
  try {
    const raw = window.localStorage.getItem(LAST_USER_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (get(parsed, 'v') !== 1) {
      return null; // unknown version → treat as absent
    }
    return parsed;
  } catch (err) {
    return null;
  }
}

// displayName falls back to username, then the email local-part. initials =
// first letters of the first two words of displayName, upper-cased.
export function buildLastUser({ userId, email, username, displayName, passkeyEnrolled }) {
  const resolvedDisplayName = displayName || username || (email ? email.split('@')[0] : '');
  const initials = resolvedDisplayName
    .split(/\s+/)
    .slice(0, 2)
    .map(function(word) { return word.charAt(0); })
    .join('')
    .toUpperCase();

  return {
    v: 1,
    userId: userId || null,
    email: email || '',
    username: username || '',
    displayName: resolvedDisplayName,
    initials: initials,
    lastLoginAt: new Date().toISOString(),
    passkeyEnrolled: !!passkeyEnrolled
  };
}

export function writeLastUser(fields) {
  try {
    window.localStorage.setItem(LAST_USER_KEY, JSON.stringify(buildLastUser(fields)));
  } catch (err) {
    // Private mode / blocked storage — remembered-device UX just won't engage
  }
}

export function clearLastUser() {
  try {
    window.localStorage.removeItem(LAST_USER_KEY);
  } catch (err) {
    // ignore
  }
}
