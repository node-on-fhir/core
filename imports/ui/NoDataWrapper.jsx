// imports/ui/NoDataWrapper.jsx
// DEPRECATED ALIAS — the guard moved to imports/ui/guards/DataGuard.jsx and
// its "no data" card is now imports/ui/extensible/NoDataPage.jsx.
// This shim warns at import time (module evaluation), not at render.

import { warnOnce } from '/imports/lib/warnOnce.js';
import DataGuard from './guards/DataGuard';

warnOnce('alias-NoDataWrapper',
  '[Deprecation] NoDataWrapper (imports/ui/NoDataWrapper.jsx) is deprecated — import DataGuard from imports/ui/guards/DataGuard.jsx instead.');

export { DataGuard as NoDataWrapper };
export default DataGuard;
