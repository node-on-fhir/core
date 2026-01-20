import React, { useState } from 'react';
import { useLocation, useNavigate } from "react-router-dom";


import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import {
  makeStyles,
  createTheme
} from '@mui/material/styles';
import { 
  AppBar, 
  Button, 
  Toolbar, 
  Typography, 
  Input,
  InputLabel,
  TextField,
  InputAdornment,
  FormControl
} from '@mui/material';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';


import { get } from 'lodash';



const useStyles = makeStyles(theme => ({
  input: {
    backgroundColor: theme.palette.appBar.main,
    color: theme.palette.appBar.contrastText
  }, 
  searchForm: {
    margin: theme.spacing(1),
    float: 'right',
    marginRight: '10px',
    position: 'absolute',
    bottom: '0px',
    right: '10px'
  }
}));


const useTabStyles = makeStyles(theme => ({
  menu_items: {
    position: 'absolute',
    bottom: '10px',
    left: '0px', 
    display: 'flex', 
    float: 'left', 
    top: '64px', 
    marginTop: '5px', 
    marginLeft: '20px',
    cursor: 'pointer'
  },
  menu_items_right: {
    position: 'absolute',
    bottom: '10px',
    right: '0px', 
    display: 'flex', 
    float: 'right', 
    top: '64px', 
    marginTop: '5px', 
    marginRight: '20px',
    zIndex: 1
  },
  button: {
    margin: theme.spacing(1)
  },
  textField: {
    position: 'absolute',
    right: '20px', 
    width: '200px'
  }
}));



  //========================================================================================================
  // Global Theming 

  // This is necessary for the Material UI component render layer
  let theme = {
    primaryColor: "rgb(177, 128, 13)",
    primaryText: "rgba(255, 255, 255, 1) !important",

    secondaryColor: "rgb(177, 128, 13)",
    secondaryText: "rgba(255, 255, 255, 1) !important",

    cardColor: "rgba(255, 255, 255, 1) !important",
    cardTextColor: "rgba(0, 0, 0, 1) !important",

    errorColor: "rgb(128,20,60) !important",
    errorText: "#ffffff !important",

    appBarColor: "#f5f5f5 !important",
    appBarTextColor: "rgba(0, 0, 0, 1) !important",

    paperColor: "#f5f5f5 !important",
    paperTextColor: "rgba(0, 0, 0, 1) !important",

    backgroundCanvas: "rgba(255, 255, 255, 1) !important",
    background: "linear-gradient(45deg, rgb(177, 128, 13) 30%, rgb(150, 202, 144) 90%)",

    nivoTheme: "greens"
  }

  // if we have a globally defined theme from a settings file
  if(get(Meteor, 'settings.public.theme.palette')){
    theme = Object.assign(theme, get(Meteor, 'settings.public.theme.palette'));
  }


//========================================================================================================
// Main Component

if(Meteor.isClient){
  Session.setDefault('quickchartTabIndex', 0)
}
//========================================================================================================
// Main Component

export function PatientChartWorkflowTabs(props){
  console.log('PatientChartWorkflowTabs.props', props)
  let value = 0;

  let location = useLocation();
  console.log('PatientChartWorkflowTabs.location', location)

  function parseIndexFromLocation(pathname){
    switch (pathname) {
      case '/patient-intake':
        return 0;
      case '/patient-chart':
        return 1;
      default:
        return 0;
    }
  }
  let startingIndex = parseIndexFromLocation(location.pathname)

  const classes = useStyles();
  const tabClasses = useTabStyles();
  const [tabIndex, setTabIndex] = useState(0);

  function selectSlide(event, newIndex){
    logger.info('PatientChartWorkflowTabs.selectSlide', startingIndex);
    setTabIndex(newIndex);    

    switch (newIndex) {
      case 0:
        Session.set('quickchartTabIndex', 0)
        break;
      case 1:
        Session.set('quickchartTabIndex', 1)
        break;
      default:
        break;
    }
  }

  return (        
    <div style={{display: 'contents'}}>
      <div >
        <Tabs id="headerNavigationTabs" value={tabIndex} onChange={selectSlide} aria-label="simple tabs example" className={ tabClasses.menu_items }>        
          <Tab id="fetchTab" label="Patient Chart" />
          <Tab id="fetchTab" label="Patient Intake" />
        </Tabs>
        <div id="headerUrl" aria-label="sitename" className={ tabClasses.menu_items_right }>        
          <h3 id="fetchTab">{Session.get('fhirServerEndpoint')}</h3>          
        </div>
      </div>
    </div>
  );
}

export default PatientChartWorkflowTabs;