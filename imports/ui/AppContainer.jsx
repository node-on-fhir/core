
import React from 'react';


import { get } from 'lodash';

import { Meteor } from 'meteor/meteor';
import { createBrowserHistory } from "history";



import App from './App.jsx';
// import AppLoadingPage from '../core/AppLoadingPage.jsx';


// import { theme, defaultAppPalette} from '../Theme';
// import { logger } from '/client/ClientLogger';
// import useStyles from '../Styles';


// Global App-Wide Session Variables

// const router = createBrowserRouter([
//   {
//     path: "/",
//     element: <App />
//   },
// ]);

if(Meteor.isClient){
  Session.setDefault('lastUpdated', new Date());

  Session.setDefault('appHeight', window.innerHeight);
  Session.setDefault('appWidth', window.innerWidth);  
  
  Session.setDefault('displayNavbars', get(Meteor, 'settings.public.defaults.displayNavbars', true));
}


if(Meteor.isClient){
  Session.set('appHeight', window.innerHeight);
  Session.set('appWidth', window.innerWidth);  
}


if(Meteor.isClient){
  window.appHistory = createBrowserHistory();
}

// we need this so that pages and routes know their location and history
// const AppWithRouter = withRouter(<App>);

function AppContainer(props){
  // logger.debug('Rendering the AppContainer');
  // logger.verbose('client.app.layout.AppContainer');
  // logger.data('AppContainer.props', {data: props}, {source: "AppContainer.jsx"});

  let renderedApp;
  // if(Meteor.isClient){
    renderedApp = <div>
      <App />
    </div>
    
  return renderedApp;  
}

export default AppContainer;