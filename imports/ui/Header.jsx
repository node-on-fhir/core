// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/ui/Header.jsx
import React, { useState } from 'react';

import PropTypes from 'prop-types';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';

import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';


import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { get, has } from 'lodash';
import moment from 'moment';

import { useTracker } from 'meteor/react-meteor-data';
import { FhirUtilities } from '../FhirUtilities';

import { logger } from '/client/ClientLogger';
import { DynamicSpacer } from './DynamicSpacer';

import { useNavigate } from "react-router-dom";
import { useTheme as useMuiTheme } from '@mui/material/styles';
// import { history, useTheme } from './App';

// import { useNavigation } from './NavigationContext';


//----------------------------------------------------------------------
// Helper Components

let useTheme;
Meteor.startup(function(){
  useTheme = Meteor.useTheme;
})

// ==============================================================================
// Icons  
import { Icon } from 'react-icons-kit';
import {ic_menu} from 'react-icons-kit/md/ic_menu';
import {ic_donut_large} from 'react-icons-kit/md/ic_donut_large';
import {ic_track_changes} from 'react-icons-kit/md/ic_track_changes';
import {ic_gps_not_fixed} from 'react-icons-kit/md/ic_gps_not_fixed';
import {ic_gps_off} from 'react-icons-kit/md/ic_gps_off';
import {ic_radio_button_checked} from 'react-icons-kit/md/ic_radio_button_checked';
import {ic_radio_button_unchecked} from 'react-icons-kit/md/ic_radio_button_unchecked';

let headerMenuIcon = ic_radio_button_checked;

// ==============================================================================
// Dynamic Imports 

let headerWorkflows = [];


// dynamic dialog components
Object.keys(Package).forEach(function(packageName){
  if(Package[packageName].WorkflowTabs){
    // we try to build up a route from what's specified in the package
    Package[packageName].WorkflowTabs.forEach(function(componentReference){
      headerWorkflows.push(componentReference);      
    });    
  }
});

// ==============================================================================
// Main Component

function Header({ drawerIsOpen, handleDrawerOpen, lastUpdated }) {

  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const muiTheme = useMuiTheme();

  // if(typeof logger === "undefined"){
  //   logger = logger;
  // }
  
  // if(logger){
  //   console.debug('package.care-cards.client.layout.Header');  
  // }

  // let [drawerIsOpen, setDrawerIsOpen] = useState(false);
  let [currentUser, setCurrentUser] = useState({
    givenName: 'Anonymous'
  });

  

  // ------------------------------------------------------------
  // Trackers

  // Make the header reactive to settings changes
  const settingsRefresh = useTracker(() => {
    return Session.get('settingsRefreshRequest');
  });

  let selectedStartDate;
  let selectedEndDate;
  let useDateRangeInQueries;
  let currentPatientId = "";
  let currentPatient = null;  
  let workflowTabs = "default";  
  let displayNavbars = true;
  let selectedPatient = null;
  let showProminentHeader = false;  

  if(Meteor.isClient){
    selectedStartDate = useTracker(function(){
      return Session.get("fhirKitClientStartDate");
    }, [lastUpdated]);
    selectedEndDate = useTracker(function(){
      return Session.get("fhirKitClientEndDate");
    }, [lastUpdated]);
  
    useDateRangeInQueries = useTracker(function(){
      return Session.get("useDateRangeInQueries");
    }, [lastUpdated]);
  
    currentPatientId = useTracker(function(){
      return Session.get("currentPatientId");
    }, [lastUpdated]);
  
    currentPatient = useTracker(function(){  
      return Session.get("currentPatient");  
    }, [lastUpdated]);  
  
    workflowTabs = useTracker(function(){  
      return Session.get("workflowTabs");  
    }, [lastUpdated]);  
  
  
    displayNavbars = useTracker(function(){  
      return Session.get("displayNavbars");  
    }, []);  

    selectedPatient = useTracker(function(){
      const patient = Session.get("selectedPatient");
      const patientId = Session.get("selectedPatientId");
      console.log('Header useTracker - patient data:', {
        patient,
        patientId,
        sessionKeys: Object.keys(Session.keys),
        patientTruthy: !!patient,
        patientType: typeof patient
      });
      return patient;
    }, [lastUpdated]);

    showProminentHeader = useTracker(function(){
      const prominentHeaderSetting = get(Meteor, 'settings.public.defaults.prominentHeader', false);
      const selectedPatientFromSession = Session.get("selectedPatient");
      const selectedPatientId = Session.get("selectedPatientId");
      // Check if we have either a selected patient object or ID
      const hasPatient = !!(selectedPatientFromSession || selectedPatientId);
      const shouldShow = Boolean(prominentHeaderSetting && hasPatient);
      console.log('Header useTracker - showProminentHeader:', {
        prominentHeaderSetting,
        prominentHeaderSettingType: typeof prominentHeaderSetting,
        hasSelectedPatient: hasPatient,
        patientData: selectedPatientFromSession,
        patientId: selectedPatientId,
        shouldShow,
        meteorSettings: Meteor.settings,
        publicDefaults: get(Meteor, 'settings.public.defaults')
      });
      return shouldShow;
    }, [lastUpdated]);

    // Get the actual Meteor user
    const meteorUser = useTracker(() => {
      const user = Meteor.user();
      console.log('Meteor.user():', user);
      console.log('Meteor.userId():', Meteor.userId());
      return user;
    });
    
    // Use the Meteor user directly
    currentUser = meteorUser;
  } // Close the if(Meteor.isClient) block

  // if(!displayNavbars){
  //   componentStyles.headerNavContainer.top = '-128px'
  // }
  // if(get(Meteor, 'settings.public.defaults.disableHeader')){
  //   componentStyles.headerNavContainer.display = 'none'
  // }


  // ------------------------------------------------------------  
  // Layout  

  // if(Meteor.isClient && drawerIsOpen){
  //   componentStyles.headerNavContainer.width = window.innerWidth - drawerWidth;
  //   componentStyles.headerNavContainer.left = drawerWidth;
  // }

  let workflowTabsToRender;
  let selectedWorkflow;
  if(get(Meteor, 'settings.public.defaults.prominentHeader', false)){    
    if(Meteor.isClient){
      headerWorkflows.forEach(function(workflow){
        if(Array.isArray(workflow.matchingPaths)){
          if(workflow.matchingPaths.includes(window.location.pathname)){
            // console.log('Found a matching workflow component to render.')
            
            // did we find a matching component?
            workflowTabsToRender = workflow.component;  
          }  

          if(workflowTabsToRender){
            workflowTabsToRender = React.cloneElement(
              workflowTabsToRender, props 
            );
          }
        }
      })
    }     
  }




  // ------------------------------------------------------------
  // Helper Methods

  function parseTitle(){
    let titleText = get(Meteor, 'settings.public.title', 'Honeycomb');
    let secondaryTitleText = get(Meteor, 'settings.public.secondaryTitle', '');
    let selectedPatient;

    if(Meteor.isClient){
      // Check if prominent header is enabled
      const prominentHeaderEnabled = get(Meteor, 'settings.public.defaults.prominentHeader', false);
      
      // Only show patient name in title if prominentHeader is NOT enabled
      if(get(Meteor, 'settings.public.defaults.showPatientNameInHeader') && !prominentHeaderEnabled){
        if(Session.get("selectedPatient")){
          selectedPatient = Session.get("selectedPatient");
  
          let patientName = FhirUtilities.pluckName(selectedPatient); 
          console.log('parseTitle - showPatientNameInHeader:', {
            selectedPatient,
            patientName,
            prominentHeaderEnabled,
            willReplaceTitleWithPatientName: !prominentHeaderEnabled
          });
          // Only replace title if we actually got a patient name and prominent header is disabled
          if(patientName && patientName.trim() !== ''){
            titleText = patientName;
          }
          logger.verbose("Selected patients name that we're displaying in the Title: " + titleText)
        } else {
          if(!Meteor.isCordova){      
            titleText = titleText + secondaryTitleText;
          }
        }
      } else {
        if(!Meteor.isCordova){      
          titleText = titleText + secondaryTitleText;
        }
      }
    }

    console.log('parseTitle() returning:', titleText);
    return titleText;    
  }

  
  function parseId(){
    let patientId = '';
    if(Meteor.isClient){
      patientId = get(Session.get('selectedPatient'), 'id');
    }
    return patientId;
  }


  function getSearchDateRange(){
    return moment(selectedStartDate).format("MMM DD, YYYY") + " until " + moment(selectedEndDate).format("MMM DD, YYYY")
  }
  // console.log('AuthContext.loginWithService()', service, credentials);


  function toggleLoginDialog(){
    // console.log('Toggle login dialog open/close.')
    Session.set('mainAppDialogJson', false);
    Session.set('mainAppDialogMaxWidth', "sm");

    if(Session.get('currentUser')){
      Session.set('mainAppDialogTitle', "Logout");
      Session.set('mainAppDialogComponent', "LogoutDialog");
    } else {
      Session.set('mainAppDialogTitle', "Login");
      Session.set('mainAppDialogComponent', "LoginDialog");      
    }

    Session.toggle('mainAppDialogOpen');
  }

  function toggleLoginDialog(){
    console.log('Toggle login dialog open/close.')
    Session.set('mainAppDialogJson', false);
    Session.set('mainAppDialogMaxWidth', "sm");

    if(Session.get('currentUser')){
      Session.set('mainAppDialogTitle', "Logout");
      Session.set('mainAppDialogComponent', "LogoutDialog");
    } else {
      Session.set('mainAppDialogTitle', "Login");
      Session.set('mainAppDialogComponent', "LoginDialog");      
    }

    Session.toggle('mainAppDialogOpen');
  }


  let demographicItems;
  let dateTimeItems;
  let userItems;



  if(Meteor.isClient){
    // console.log('Header.Meteor.isClient')
    // if we have a selected patient, we show that info
    if(!Meteor.isCordova){
      // console.log('Header.Meteor.!isCordova')
      if(get(Meteor, 'settings.public.defaults.enablePatientOveride')){
        if(Session.get('selectedPatient')){
          demographicItems = <div style={{float: 'right', top: '10px', position: 'absolute', right: '20px'}}>
            <Typography variant="h6" color="inherit" >Patient ID: </Typography>
            <Typography variant="h6" color="inherit" noWrap className="barcode" >
              <span className="barcode helvetica">
                { parseId() }
              </span>
            </Typography>
          </div>     
        }
      } else {
        // console.log('Header.Meteor.!patientId')
        // otherwise, we default to population/search level info to display
        if(useDateRangeInQueries){
          if(selectedStartDate && selectedEndDate){
            dateTimeItems = <div style={{float: 'right', top: '10px', position: 'absolute', right: '20px'}}>
              <Typography variant="h6" color="inherit" >Date Range: </Typography>
              <Typography variant="h6" color="inherit" noWrap >
                { getSearchDateRange() }
              </Typography>
            </div>   
          }      
        }
        if(get(Meteor, 'settings.public.defaults.displayUserNameInHeader')){
          userItems = <div style={{float: 'right', top: '5px', position: 'absolute', right: '20px', cursor: 'pointer'}} onClick={toggleLoginDialog.bind(this)}>
          <Typography variant="h6" color="inherit" >User: </Typography>
          <Typography variant="h6" color="inherit" noWrap >
            { currentUser }
          </Typography>
        </div>             
        }
      }
    }
  }



  function handleClickHomeButton(){

    if(typeof handleDrawerOpen === "function"){
      handleDrawerOpen();
    } else {
      let homeUrl = get(Meteor, 'settings.public.defaults.homePageUrl', '/home');
      navigate(homeUrl, { replace: true });      
    }
  }

  
  let appStyle = {
    position: "relative",
    zIndex: 10000
  };
  // if(theme === 'light'){
  //   appStyle.background = get(Meteor, 'settings.public.theme.palette.appBarColor'); 
  //   appStyle.color = get(Meteor, 'settings.public.theme.palette.appBarTextColor'); 
  // } else if(theme === 'dark'){
  //   appStyle.background = get(Meteor, 'settings.public.theme.palette.appBarColorDark'); 
  //   appStyle.color = get(Meteor, 'settings.public.theme.palette.appBarTextColorDark'); 
  // }

  // Prepare patient demographic data
  let patientName = '';
  let patientBirthDate = '';
  let patientGender = '';
  let patientIdentifier = '';
  let patientPhone = '';
  
  console.log('Header render - checking prominent header:', {
    showProminentHeader,
    selectedPatient,
    prominentHeaderSetting: get(Meteor, 'settings.public.defaults.prominentHeader')
  });
  
  if(selectedPatient){
    console.log('Header: Processing selectedPatient:', selectedPatient);
    patientName = FhirUtilities.pluckName(selectedPatient);
    console.log('Header: Patient name:', patientName);
    patientBirthDate = get(selectedPatient, 'birthDate', '');
    patientGender = get(selectedPatient, 'gender', '');
    
    // Get first identifier
    let identifiers = get(selectedPatient, 'identifier', []);
    if(identifiers.length > 0){
      patientIdentifier = get(identifiers[0], 'value', '');
    }
    
    // Get phone
    let telecoms = get(selectedPatient, 'telecom', []);
    telecoms.forEach(function(telecom){
      if(get(telecom, 'system') === 'phone'){
        patientPhone = get(telecom, 'value', '');
      }
    });
  }

  return (
    <Box id="header" sx={{
        flexShrink: 0,
        zIndex: 1000,
        transition: 'transform 0.3s ease-in-out',
        transform: (displayNavbars === false) ? 'translateY(-100%)' : 'translateY(0)'
      }}>
      <AppBar 
        id="headerContent" 
        position="static" 
        sx={{ 
          backgroundColor: muiTheme.palette.appbar?.main || muiTheme.palette.primary.main,
          color: muiTheme.palette.appbar?.contrastText || muiTheme.palette.primary.contrastText
        }}
      >
        <Toolbar>
          <IconButton
            id="sidebarMenuButton"
            size="large"
            edge="start"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={handleClickHomeButton}
          >
            <MenuIcon sx={{ color: muiTheme.palette.appbar?.contrastText || muiTheme.palette.primary.contrastText }} />
          </IconButton>
          <Typography id="headerTitle" variant="h6" component="div" sx={{ flexGrow: 1, color: muiTheme.palette.appbar?.contrastText || muiTheme.palette.primary.contrastText }}>
          { parseTitle() || get(Meteor, 'settings.public.title', 'Honeycomb') }
          </Typography>
          <IconButton  
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? <Brightness4Icon sx={{ color: muiTheme.palette.appbar?.contrastText || muiTheme.palette.primary.contrastText }} /> : <Brightness7Icon sx={{ color: muiTheme.palette.appbar?.contrastText || muiTheme.palette.primary.contrastText }} />}
          </IconButton>
          {/* Clear patient button for testing */}
          {selectedPatient && (
            <Button 
              sx={{ 
                color: muiTheme.palette.appbar?.contrastText || muiTheme.palette.primary.contrastText,
                mx: 1 
              }} 
              onClick={() => {
                console.log('Clearing selected patient');
                Session.set('selectedPatient', null);
                Session.set('selectedPatientId', null);
              }}
            >
              Clear Patient
            </Button>
          )}
          {/* { userItems }
          { dateTimeItems }        
          { demographicItems }
          { workflowTabsToRender }
          */}
          {(console.log('currentUser in render:', currentUser), currentUser) ? (
            <>
              <Typography variant="body2" sx={{ mr: 2, color: muiTheme.palette.appbar?.contrastText || muiTheme.palette.primary.contrastText }}>
                {currentUser.username || currentUser.emails?.[0]?.address}
              </Typography>
              <Button 
                sx={{ color: muiTheme.palette.appbar?.contrastText || muiTheme.palette.primary.contrastText }} 
                name="logout"
                id="logout"
                onClick={() => {
                  console.log('Logout clicked');
                  Meteor.logout((err) => {
                    if (err) {
                      console.error('Logout error:', err);
                    } else {
                      console.log('Logged out successfully');
                      navigate('/');
                    }
                  });
                }}
              >
                Logout
              </Button>
            </>
          ) : (
            <Button sx={{ color: muiTheme.palette.appbar?.contrastText || muiTheme.palette.primary.contrastText }} onClick={() => navigate('/login')}>Login</Button>
          )}
        </Toolbar>
      </AppBar>
      {console.log('Render - showProminentHeader value:', showProminentHeader, typeof showProminentHeader)}
      <Collapse 
        in={showProminentHeader} 
        timeout={300}
        sx={{
          position: 'absolute',
          top: '64px', // Height of the main toolbar
          left: 0,
          right: 0,
          zIndex: 999
        }}
      >
        <AppBar 
          position="static" 
          sx={{ 
            boxShadow: 1
          }}
        >
          <Toolbar sx={{ paddingLeft: '75px !important', minHeight: '64px' }}>
            <Box display="flex" alignItems="center" gap={3}>
              <Box>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif',
                    fontWeight: 300,
                    letterSpacing: '-0.5px'
                  }}
                >
                  {patientName}
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>ID</Typography>
                <Typography variant="body2">{patientIdentifier || parseId() || 'Unknown'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>Birth Date</Typography>
                <Typography variant="body2">{patientBirthDate ? moment(patientBirthDate).format('MMM DD, YYYY') : 'Unknown'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>Gender</Typography>
                <Typography variant="body2">{patientGender || 'Unknown'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>Phone</Typography>
                <Typography variant="body2">{patientPhone || 'Unknown'}</Typography>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>
      </Collapse>
    </Box>
  );
}


export default Header;
