import React from 'react';

import { 
  Button,
  Grid,  
} from '@mui/material';


import { get } from 'lodash';
import { Index } from './Index.jsx';



function HomePage(props){

  //----------------------------------------------------------------------
  // Page Styling 

  let headerHeight = 64;
  if(get(Meteor, 'settings.public.defaults.prominentHeader')){
    headerHeight = 128;
  }

  let pageStyle = {
    paddingLeft: '100px', 
    paddingRight: '100px',
    position: 'absolute',
    top: '0px'
  }

  //----------------------------------------------------------------------
  // Main Render Method  


  if(Meteor.isCordova){
    pageStyle.width = '100%';
    pageStyle.padding = 20;
    pageStyle.marginLeft = '0px';
    pageStyle.marginRight = '0px';
  }


  let hasTitle = get(Meteor, 'settings.public.title', false);
  let hasTheme = get(Meteor, 'settings.public.theme', false);

  let missingTitleElements;
  let missingThemeElements;

  if(!hasTitle){
    missingTitleElements = <Grid item xs={12}>
      <Button fullWidth variant="contained">
          Todo:  Add a settings file.  
      </Button>
    </Grid>
    
  }
  if(!hasTheme){
    missingThemeElements = <Grid item xs={12}>
      <Button fullWidth variant="contained">
          Todo:  Add a theme and color palette.
      </Button>
    </Grid>
    
  }


  return (
    <div id='HomePage'>
        <Index />
    </div>      
  );
}

export default HomePage;