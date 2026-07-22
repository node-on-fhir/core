// /imports/ui/pages/index.business.js
// DEPRECATED barrel — the business pages moved to imports/ui/extensible/
// (overridable via components: { AboutPage, EulaPage, PrivacyPage,
// SupportPage, TermsPage }). This file survives only as a compatibility shim
// (the project otherwise avoids directory index files); import from
// imports/ui/extensible/ directly in new code.

import { warnOnce } from '/imports/lib/warnOnce.js';

warnOnce('alias-index-business',
  '[Deprecation] imports/ui/pages/index.business.js is deprecated — import business pages from imports/ui/extensible/ instead.');

export { default as AboutPage } from '../extensible/AboutPage';
export { default as EulaPage } from '../extensible/EulaPage';
export { default as PrivacyPage } from '../extensible/PrivacyPage';
export { default as SupportPage } from '../extensible/SupportPage';
export { default as TermsPage } from '../extensible/TermsPage';
