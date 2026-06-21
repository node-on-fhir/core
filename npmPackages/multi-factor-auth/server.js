// npmPackages/multi-factor-auth/server.js
// Server entry — delegates to the existing server/index.js (MFACore + methods +
// Accounts.onLogin hooks + mfa.status publication). Migrated from
// packages/multi-factor-auth (Atmosphere clinical:multi-factor-auth) 2026-06-13.
import './server/index.js';

console.log('[multi-factor-auth] Server entry loaded');
