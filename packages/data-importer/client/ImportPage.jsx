// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/data-importer/client/ImportPage.jsx
// https://www.npmjs.com/package/react-dropzone-component
// http://www.dropzonejs.com/import { 


import { Meteor } from 'meteor/meteor';
import React from 'react';

import { get } from 'lodash';
import { useTheme } from '@mui/material/styles';

import { ImportEditorBindings } from './ImportEditorBindings';

let useAppTheme;
Meteor.startup(function(){
  useAppTheme = Meteor.useTheme;
})

//============================================================================
// Main Component  

export function ImportPage(props){
  const theme = useTheme();
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };

  return(
    <div id="ImportPage" style={{
      padding: '20px', 
      height: window.innerHeight, 
      overflow: 'scroll', 
      marginBottom: '80px',
      backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.default : '#f6f6f6'
    }}>
        <ImportEditorBindings history={props.history} />
    </div>
  );
}


export default ImportPage;