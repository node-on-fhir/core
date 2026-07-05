import React from 'react';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { Button } from '@mui/material';
import { Box } from '@mui/material';

//============================================================================================================================
// MAIN COMPONENT


export function SampleDialogComponent(props){
  return(
    <div>
      This is a sample component!
    </div>
  )
}

Session.setDefault('editorWrapEnabled', false);
export function ImportButtons(props){

  function loadData(){
    let data = Session.get('previewBuffer') || Session.get('importBuffer');

    if(!data){
      console.warn('[ImportButtons.loadData] No data to import');
      return;
    }

    console.log('[ImportButtons.loadData] Opening import dialog');
    Session.set('importDialogRequested', true);
  }

  // The footer bar is an AppBar (dark appbar palette in BOTH light and dark
  // mode), so buttons must inherit the AppBar's contrast text — never the
  // page text color, which is black in light mode and illegible here.
  return (
    <Box className="footer-buttons-data-importer">
      <Button id="data-importer-load-data-footer-btn" color="inherit" onClick={ loadData }>
        Load Data
      </Button>
    </Box>
  );
}


