// imports/accounts/client/useLastUser.js
//
// React hook over the chronicle.lastUser remembered-device contract
// (lastUser.js). Returns { lastUser, forget } — forget() clears the key and
// re-renders (the "Not you? Switch account" action). localStorage failures
// (private mode) read as absent; invalid/unknown versions read as absent.

import { useState, useCallback } from 'react';
import { readLastUser, clearLastUser } from './lastUser';

export function useLastUser() {
  const [lastUser, setLastUser] = useState(function() { return readLastUser(); });

  const forget = useCallback(function() {
    clearLastUser();
    setLastUser(null);
  }, []);

  return { lastUser: lastUser, forget: forget };
}

export default useLastUser;
