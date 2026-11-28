// npmPackages/provider-directory/client/DirectoryDialogHost.jsx
//
// Renders the package-local directory dialog (see ./directoryDialog.mjs).
// Mounted from several places (footer-button route elements, the classic
// faceted-search page); only the instance that owns the host claim renders.
// The registry (`components`, the DialogComponents array from client.js) is
// passed in as a prop to avoid a circular import with client.js.

import React, { useEffect, useId, useSyncExternalStore } from 'react';

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle
} from '@mui/material';

import { find, get } from 'lodash';

import {
  getDirectoryDialog,
  subscribeDirectoryDialog,
  closeDirectoryDialog,
  claimDirectoryDialogHost,
  releaseDirectoryDialogHost,
  getDirectoryDialogHostOwner
} from './directoryDialog.mjs';

export function DirectoryDialogHost(props){
  const hostId = useId();

  const dialog = useSyncExternalStore(subscribeDirectoryDialog, getDirectoryDialog);
  const ownerId = useSyncExternalStore(subscribeDirectoryDialog, getDirectoryDialogHostOwner);

  useEffect(function(){
    claimDirectoryDialogHost(hostId);
    return function(){
      releaseDirectoryDialogHost(hostId);
    };
  }, [hostId]);

  if(ownerId !== hostId){
    return null;
  }

  const componentName = get(dialog, 'component');
  if(!componentName){
    // nothing has been opened yet
    return null;
  }

  const entry = find(get(props, 'components', []), function(candidate){
    return get(candidate, 'name') === componentName;
  });

  // The registry's legacy `actions` (DefaultPostDialogActions and friends) are
  // deliberately NOT rendered. Their "Send" button posts whatever is in
  // Session 'CodeSystem.Current' to the relay regardless of which resource the
  // dialog is for. That was unreachable while no dialog could open; rendering
  // it now would turn a dormant bug into a live write. Each dialog gets a plain
  // Close button until its save path is written for its own resource type.
  let content;
  if(entry && get(entry, 'component')){
    content = get(entry, 'component');
  } else {
    if(get(dialog, 'open')){
      console.warn('[provider-directory] DirectoryDialogHost: no registered dialog component named', componentName);
    }
    content = <DialogContent>
      <Alert severity="warning" id="directoryDialogNotAvailable">
        The "{componentName}" dialog is not available.
      </Alert>
    </DialogContent>;
  }

  return (
    <Dialog
      id="directoryDialog"
      open={Boolean(get(dialog, 'open'))}
      onClose={closeDirectoryDialog}
      fullWidth
      maxWidth={get(dialog, 'maxWidth', 'sm')}
    >
      <DialogTitle>{get(dialog, 'title', '')}</DialogTitle>
      {content}
      <DialogActions>
        <Button id="directoryDialogCloseButton" onClick={closeDirectoryDialog}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default DirectoryDialogHost;
