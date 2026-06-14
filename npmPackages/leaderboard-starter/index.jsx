import React from 'react';

import LeaderboardPage from './client/LeaderboardPage';

import { 
  LeaderboardPageButtons
} from './client/FooterButtons';

let FooterButtons = [{
  pathname: '/leaderboard',
  element: <LeaderboardPageButtons />
}];

var DynamicRoutes = [{
  'name': 'Leaderboard',
  'path': '/leaderboard',
  'element': <LeaderboardPage />
}];

var SidebarElements = [];

let SidebarWorkflows = [{ 
  'primaryText': 'International Patient Summary',
  'to': '/leaderboard',
  'href': '/leaderboard'
}];



const MainPage = {
  'name': 'Leaderboard',
  'path': '/',
  'element': <LeaderboardPage />
};

export { 
  MainPage, 
  FooterButtons, 
  SidebarWorkflows, 
  SidebarElements, 
  DynamicRoutes
};
