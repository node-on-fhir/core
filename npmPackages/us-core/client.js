// npmPackages/us-core/client.js
//
// Client entry — US Core is primarily a SERVER-SIDE profile provider
// (ProfileSet + ProfileDecorators via server/index.js and the Package
// registry). Its only client UI is the server-configuration panel: a
// "us-core" vertical tab on /server-configuration with the conformance
// seed census + idempotent Init US Core ValueSets button (serverConfigs
// contract — see npmPackages/CLAUDE.md § workflow export contract).
import React from 'react';
import UsCoreServerConfig from './client/UsCoreServerConfig.jsx';

const ServerConfigs = [<UsCoreServerConfig key="us-core-conformance" />];

export { ServerConfigs };

export default {
  name: 'us-core',
  routes: [],
  sidebarItems: [],
  serverConfigs: ServerConfigs
};
