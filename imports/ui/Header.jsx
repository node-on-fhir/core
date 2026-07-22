// imports/ui/Header.jsx
import React, { useState } from 'react';

import PropTypes from 'prop-types';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';

import MenuIcon from '@mui/icons-material/Menu';
import LightMode from '@mui/icons-material/LightMode';
import DarkMode from '@mui/icons-material/DarkMode';
import CastIcon from '@mui/icons-material/Cast';


import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { get, has } from 'lodash';
import moment from 'moment';

import { useTracker } from 'meteor/react-meteor-data';
import { FhirUtilities } from '../FhirUtilities';

// Patient banner (extracted; overridable via components: { ProminentHeader })
import ProminentHeader from './extensible/ProminentHeader.jsx';
import { useOverridableComponent } from './hooks/useOverridableComponent.js';

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
// Main Component

function Header({ drawerIsOpen, handleDrawerOpen, lastUpdated }) {

  const navigate = useNavigate();
  // Patient banner rendered inside the Collapse below; overridable via
  // components: { ProminentHeader: ... } (see extensions/API.md).
  const ProminentHeaderComponent = useOverridableComponent('ProminentHeader', ProminentHeader);
  const appTheme = useTheme ? useTheme() : { theme: 'light', toggleTheme: function(){} };
  const { theme, toggleTheme } = appTheme;
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
      return Session.get("selectedPatient");
    }, [lastUpdated]);

    showProminentHeader = useTracker(function(){
      const prominentHeaderSetting = get(Meteor, 'settings.public.defaults.prominentHeader', false);
      const selectedPatientFromSession = Session.get("selectedPatient");
      const selectedPatientId = Session.get("selectedPatientId");
      // Check if we have either a selected patient object or ID
      const hasPatient = !!(selectedPatientFromSession || selectedPatientId);
      return Boolean(prominentHeaderSetting && hasPatient);
    }, [lastUpdated]);

    // Get the actual Meteor user
    const meteorUser = useTracker(() => {
      return Meteor.user();
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

  return (
    <Box id="header" sx={{
        flexShrink: 0,
        height: 'var(--header-height, 64px)',
        overflow: 'hidden',
        zIndex: 1000,
        position: 'relative',
        transition: 'height 0.3s ease-in-out',
      }}>
      <AppBar
        id="headerContent"
        component="nav"
        aria-label="Primary navigation"
        position="static"
        sx={{
          backgroundColor: muiTheme.palette.appbar?.main || muiTheme.palette.primary.main,
          color: muiTheme.palette.appbar?.contrastText || muiTheme.palette.primary.contrastText,
          transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
          transform: (displayNavbars === false) ? 'translateY(-100%)' : 'translateY(0)',
          opacity: (displayNavbars === false) ? 0 : 1
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
            {theme === 'light' ? <LightMode sx={{ color: muiTheme.palette.appbar?.contrastText || muiTheme.palette.primary.contrastText }} /> : <DarkMode sx={{ color: muiTheme.palette.appbar?.contrastText || muiTheme.palette.primary.contrastText }} />}
          </IconButton>
          <IconButton
            onClick={function() { navigate('/fhircast-publish'); }}
            aria-label="FHIRcast"
            title="FHIRcast Publish"
            sx={{ mr: 1 }}
          >
            <CastIcon sx={{ color: muiTheme.palette.appbar?.contrastText || muiTheme.palette.primary.contrastText }} />
          </IconButton>
          {/* Clear patient button for testing */}
          {selectedPatient && (
            <Button 
              sx={{ 
                color: muiTheme.palette.appbar?.contrastText || muiTheme.palette.primary.contrastText,
                mx: 1 
              }} 
              onClick={() => {
                console.log('Clearing selected patient'); // phi-audit: ok
                Session.set('selectedPatient', null);
                Session.set('selectedPatientId', null);
                Session.set('ipsComposition', "");
              }}
            >
              Clear Patient
            </Button>
          )}
          {/* { userItems }
          { dateTimeItems }
          { demographicItems }
          */}
          {currentUser ? (
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
      <Collapse
        in={showProminentHeader && displayNavbars !== false}
        timeout={300}
        unmountOnExit
        sx={{
          position: 'absolute',
          top: '64px', // Height of the main toolbar (the banner tucks directly beneath it)
          left: 0,
          right: 0,
          zIndex: 999
        }}
      >
        <ProminentHeaderComponent patient={selectedPatient} lastUpdated={lastUpdated} />
      </Collapse>
    </Box>
  );
}


export default Header;
