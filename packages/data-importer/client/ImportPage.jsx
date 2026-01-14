// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/data-importer/client/ImportPage.jsx
// https://www.npmjs.com/package/react-dropzone-component
// http://www.dropzonejs.com/import { 


import { Meteor } from 'meteor/meteor';
import React from 'react';
import { Box } from '@mui/material';

import { get } from 'lodash';

import { ImportEditorBindings } from './ImportEditorBindings';

let useAppTheme;
Meteor.startup(function(){
  useAppTheme = Meteor.useTheme;
})

//============================================================================
// Main Component

export function ImportPage(props){
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };

  return(
    <Box
      id="ImportPage"
      sx={{
        minHeight: '100vh',
        py: 2.5,
        px: 2.5,
        mb: 10
      }}
    >
      <ImportEditorBindings history={props.history} />
    </Box>
  );
}


export default ImportPage;