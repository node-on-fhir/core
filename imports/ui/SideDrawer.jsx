import React, { useState } from 'react';
import PropTypes from 'prop-types';

import { useTracker } from 'meteor/react-meteor-data';

import { 
  IconButton,
  Button,
  Divider,
  List,
  Typography,
  Drawer,
  SwipeableDrawer
} from '@mui/material';


import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { get, has, cloneDeep } from 'lodash';

import PatientSidebar from '../patient/PatientSidebar'

// import theme from '../Theme';
import { logger } from '/client/ClientLogger';
// import useStyles from '../Styles';

import clsx from 'clsx';

import { useSwipeable } from 'react-swipeable';

const drawerWidth = get(Meteor, 'settings.public.defaults.drawerWidth', 280);

// ==============================================================================
// Device Detection

const iOS = process.browser && /iPad|iPhone|iPod/.test(navigator.userAgent);

// ==============================================================================
// Main Component

function SideDrawer({ 
  children,
  history,
  drawerIsOpen = false, 
  onDrawerOpen,
  onDrawerClose,
  ...otherProps 
}) {
  // let styles = useStyles();

  // Verbose rendering log removed — use React DevTools for component render tracking

  // ------------------------------------------------------------------
  // Styling & Theming

  // const classes = useStyles();


  // ------------------------------------------------------------------
  // Helper Functions

  function handleDrawerClose(event){

    if(typeof onDrawerClose === "function"){
      onDrawerClose();
    }
  }
  function handleDrawerOpen(event){

    if(typeof onDrawerOpen === "function"){
      onDrawerOpen();
    }
  }


   const toggleDrawer = (anchor, open) => (event) => {
    console.log('toggleDrawer')
    if (event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }

    setState({ ...state, [anchor]: open });
  };

  // ------------------------------------------------------------------
  // User Interfaces
  
  const drawerHandlers = useSwipeable({
    // onSwiped: function(eventData){
    //   console.log("User Swiped!", eventData)
    // },
    onSwipedLeft: function(eventData){
      console.log("User SwipedLeft!", eventData)

      if(typeof onDrawerClose === "function"){
        onDrawerClose();
      }

      // setDrawerIsOpen(false)
    },
    onSwipedRight: function(eventData){
      console.log("User SwipedRight!", eventData)
      // setDrawerIsOpen(true)

      if(typeof onDrawerOpen === "function"){
        onDrawerOpen();
      }
    },
    onSwipedUp: function(eventData){
      console.log("User SwipedUp!", eventData)
    },
    onSwiping: function(eventData){
      console.log("User Swiping!", eventData)
    },
    onTap: function(eventData){
      console.log("User Tapped!", eventData)
    }
  });


  // ------------------------------------------------------------------
  // Rendering

  let drawerVarient = "temporary";
  // let drawerContainerClassNames = styles.drawerContents;;
  // let drawerContentsClassNames = styles.drawerContents;

  if(!get(Meteor, 'settings.public.defaults.disableCanvasSlide')){
    drawerVarient = "persistent";
    // drawerContainerClassNames = clsx(classes.drawer, {
    //   [classes.drawerOpen]: drawerIsOpen,
    //   [classes.drawerClose]: !drawerIsOpen
    // })
    // drawerContentsClassNames = clsx(classes.drawer, {
    //   [classes.drawerOpen]: drawerIsOpen,
    //   [classes.drawerClose]: !drawerIsOpen
    // })
  } 

  let containerContents;

  containerContents = <Drawer
    id="appDrawer"
    // variant={drawerVarient}
    anchor="left"
    // className={drawerContentsClassNames}
    // classes={{paper: drawerContentsClassNames}}
    // open={false}
    open={drawerIsOpen}
    onClose={handleDrawerClose.bind(this)}
    // onOpen={handleDrawerOpen.bind(this)}
    {...drawerHandlers}
  >
    <div >
      <IconButton onClick={handleDrawerClose.bind(this)} style={{width: '64px', height: '64px'}}>
        <ChevronLeftIcon /> 
        {/* {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />} */}
      </IconButton>
    </div>
    <Divider  />
    <List>
      <PatientSidebar history={history} { ...otherProps } />
    </List>
  </Drawer>

  // if(Meteor.isClient){
    
  // }

  // ------------------------------------------------------------------
  // Rendering

  let appDrawerContainerStyle = {
    position: 'absolute',
    height: '100%',
    width: drawerWidth,
    zIndex: 0
  }

  return containerContents;
}


SideDrawer.propTypes = {
  drawerIsOpen: PropTypes.bool,
  onDrawerOpen: PropTypes.func,
  onDrawerClose: PropTypes.func,
  children: PropTypes.oneOf([PropTypes.array, PropTypes.object])
}

export default SideDrawer;