import React, { useState, useEffect } from 'react';

import PropTypes from 'prop-types';

import { useTracker } from 'meteor/react-meteor-data';

// import { Button, BottomNavigation} from '@mui/material';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Fab from '@mui/material/Fab';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Avatar from '@mui/material/Avatar';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import MoreIcon from '@mui/icons-material/MoreVert';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import RestoreIcon from '@mui/icons-material/Restore';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get, has, cloneDeep } from 'lodash';


// import theme from '../Theme';
import { logger } from '/client/ClientLogger';
// import useStyles from '../Styles';

import { useNavigate, useLocation } from "react-router-dom";
import { DynamicSpacer } from './DynamicSpacer';
import WorkflowRegistry from '/imports/lib/WorkflowRegistry.js';

//----------------------------------------------------------------------
// Helper Components

let useTheme;
Meteor.startup(function(){
  useTheme = Meteor.useTheme;
})

// ==============================================================================
// Main Component

// interface footerProps {
//   ;
// }


function Footer({
  drawerIsOpen = false, 
  ...props
}){


  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [value, setValue] = React.useState(0);

  // let styles = useStyles();

  // if(typeof logger === "undefined"){
  //   logger = props.logger;
  // } 

  const [westNavbar, setWestNavbar] = useState(null);

  if(logger){
    // logger.debug('Rendering the application Footer.');
    // logger.verbose('package.care-cards.client.layout.Footer');  
    // logger.data('Footer.props', {data: props}, {source: "FooterContainer.jsx"});
  }


  // const pathname = useTracker(function(){
  //   logger.info('Pathname was recently updated.  Updating the Footer action buttons.');
  //   return Session.get('pathname');
  //   // return window.location.pathname;
  // }, [props.lastUpdated]);

  


  function renderWestNavbar(pathname){
    console.debug('Checking packages for action buttons that match the following pathname: ' + pathname);    

    let self = this;

    const buttonRenderArray = []

    Object.keys(Package).forEach(function(packageName){
      if(Package[packageName].FooterButtons){
        // we try to build up a route from what's specified in the package
        Package[packageName].FooterButtons.forEach(function(route){
          buttonRenderArray.push(route);
        });
      }
    });

    // Also collect footer buttons from NPM workflow packages via WorkflowRegistry
    WorkflowRegistry.getFooterButtons().forEach(function(route){
      buttonRenderArray.push(route);
    });

    // console.debug('Generated array of buttons to display.', buttonRenderArray)

    let renderDom;
    buttonRenderArray.forEach(function(buttonConfig){
      // right route — support pathname as a string or an array of strings
      let pathnameMatch = false;
      if (pathname && buttonConfig.pathname) {
        if (Array.isArray(buttonConfig.pathname)) {
          pathnameMatch = buttonConfig.pathname.some(function(p){ return pathname.includes(p); });
        } else {
          pathnameMatch = pathname.includes(buttonConfig.pathname);
        }
      }
      if (pathnameMatch){
        // console.debug('Found a route match for Footer buttons', pathname)
        // right security/function enabled
        if(buttonConfig.settings && (get(Meteor, buttonConfig.settings) === false)){
          // there was a settings criteria; and it was set to faulse            
          return false;
        } else {
          if(buttonConfig.element){
            // console.debug('Trying to render a button from package to the footer', buttonConfig.element)
            renderDom = buttonConfig.element;

            // renderDom = React.cloneElement(
            //   buttonConfig.element, {style: appStyle} 
            // );
          } else {
            renderDom = <div >
              <Button onClick={ buttonConfig.onClick }>
                {buttonConfig.label}
              </Button>
            </div>
          }
        }         
      }
    })

    // we want to pass in the props
    if(renderDom){
      // props.style={appStyle}
      renderDom = React.cloneElement(
        renderDom, props 
      );
    }
    return renderDom;
  }


  useEffect(function(){
  // if(this.data.userId){

    setWestNavbar(renderWestNavbar(location.pathname));
  // }
  }, [location])



  let displayNavbars = true;  

  if(Meteor.isClient){
    displayNavbars = useTracker(function(){  
      return Session.get("displayNavbars");  
    }, []);    
  }

  // let footerNavContainerClass = styles.footerNavContainer;

  // if(!displayNavbars){
  //   footerNavContainerClass = styles.footerNavContainer_hidden;
  // }
  // if(get(Meteor, 'settings.public.defaults.disableFooter')){
  //   footerNavContainerClass = styles.footerNavContainer_hidden;
  // }

  let footerContainerOverride = {};

  if(get(Meteor, 'settings.public.defaults.disableFooter')){
    footerContainerOverride.display = 'none'
  }
  if(displayNavbars === false){
    footerContainerOverride.transform = 'translateY(100%)';
    footerContainerOverride.maxHeight = 0;
    footerContainerOverride.overflow = 'hidden';
    footerContainerOverride.opacity = 0;
  }
  if(Meteor.isCordova){
    footerContainerOverride.bottom = '-114px';  //64px footer + -50px safearea 
    footerContainerOverride.height = '114px';   //64px footer + -50px safearea 
  }

  let appStyle = {
    width: '100%',
    bottom: '0px',
    height: '64px',
    maxHeight: '64px',
    position: 'sticky'
  };
  // if(theme === 'light'){
  //   appStyle.background = get(Meteor, 'settings.public.theme.palette.appBarColor'); 
  //   appStyle.color = get(Meteor, 'settings.public.theme.palette.appBarTextColor'); 
  // } else {
  //   appStyle.background = get(Meteor, 'settings.public.theme.palette.appBarColorDark'); 
  //   appStyle.color = get(Meteor, 'settings.public.theme.palette.appBarTextColorDark'); 
  // }


  return (
    <AppBar id="footer" position="fixed" style={{...appStyle, ...footerContainerOverride, transition: 'transform 0.3s ease-in-out, max-height 0.3s ease-in-out, opacity 0.3s ease-in-out'}} >
      <Toolbar>
        { westNavbar }
      </Toolbar>
    </AppBar>

    // <footer id="footerNavigation" style={{position:'fixed', width: '100%', bottom: '0px'}} >
    //   <AppBar id="headerContent" position="static" style={{width: '100%'}}>
    //     <BottomNavigation
    //       showLabels
    //       value={value}
    //       onChange={(event, newValue) => {
    //         setValue(newValue);
    //       }}          
    //     >
    //       <BottomNavigationAction label="Recents" icon={<RestoreIcon />} />
    //       <BottomNavigationAction label="Favorites" icon={<FavoriteIcon />} />
    //       <BottomNavigationAction label="Nearby" icon={<LocationOnIcon />} />
    //     </BottomNavigation>
    //   </AppBar>
    // </footer>
  );
}


Footer.propTypes = {
  drawerIsOpen: PropTypes.bool
}


export default Footer;