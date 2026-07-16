// import '/imports/startup/server';
// import '/imports/api/users/methods';


import { exec } from 'child_process';
// import moment from 'moment-timezone';
import { get } from 'lodash';
import { DDPGracefulShutdown } from '@meteorjs/ddp-graceful-shutdown';
import { Meteor } from 'meteor/meteor';

import LoggerModule from '/imports/lib/Logger.js';
const log = LoggerModule.Logger.for('VaultServer');

import { Patients } from '../imports/lib/schemas/SimpleSchemas/Patients';
import { CodeSystems } from '../imports/lib/schemas/SimpleSchemas/CodeSystems';
import { ValueSets } from '../imports/lib/schemas/SimpleSchemas/ValueSets';


Meteor.startup(function(){
  log.info('Meteor application framework is starting.');
  // console.log('Patients', Patients)
  // console.log('CodeSystems', CodeSystems)

  log.info('');
  log.info('Clock check...');
  // console.log('Current time zone: ' + moment.tz.guess());
  log.info('');


  // DDP Graceful Shutdown
  new DDPGracefulShutdown({
    gracePeriodMillis: 1000 * process.env.METEOR_SIGTERM_GRACE_PERIOD_SECONDS,
    server: Meteor.server,
  }).installSIGTERMHandler();


  // pick up version info
  try {
    var version = {};
    // version = JSON.parse(await Assets.getTextAsync("version.json"));    
    Meteor.settings.public.version = version;
  } catch(e) { 
    Meteor.settings.public.version = {};
  }
  log.info('Meteor.settings.public.version', { version: Meteor.settings.public.version })

  // if OAuth is configured, load oauth configs into active memory
  if(Package['symptomtic:smart-on-fhir-client']){
    log.info('Resyncing OAuth configuration....');
    Meteor.call('resyncConfiguration');
  }

  // browser content policies (Content-Security-Policy) are an important
  // security measure to only allow connections to specific websites.
  //
  // NOTE: the browser-policy package (.meteor/packages) enforces Meteor's
  // default CSP as soon as it loads — script-src 'self' 'unsafe-inline'
  // 'unsafe-eval' etc. — regardless of anything in this file. So the
  // sensible defaults below (same-origin, Google fonts/maps, blob:/data:)
  // are ALWAYS applied; otherwise the default policy silently blocks
  // pre-approved integrations like Google Maps while this block believes
  // the policy is "not configured".
  //
  // Two ways to whitelist ADDITIONAL origins:
  //   1. Set Meteor.settings.private.browserPolicy (see
  //      settings/settings.fhir.server.json for an example), or
  //   2. Pass a CORS environment variable at launch, e.g.
  //         CORS=https://www.wikipedia.org meteor run
  //      (comma-separated for multiple, e.g. CORS=https://a.com,https://b.com)
  //
  // We don't rely on browser-policy-common already being initialized; we
  // dynamically import (install) it on demand.

  var browserPolicyConfig = get(Meteor, 'settings.private.browserPolicy');
  var corsEnv = process.env.CORS;

  // Supplying a Google Maps API key (env var or settings) means the app
  // intends to load the Maps JS SDK, so allowlist its origins in the CSP
  // without requiring every settings file to repeat a browserPolicy block.
  var googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY ||
    get(Meteor, 'settings.private.google.maps.apiKey') ||
    get(Meteor, 'settings.private.google.mapsApiKey') ||
    get(Meteor, 'settings.private.googleMapsApiKey');

  if(browserPolicyConfig || corsEnv || googleMapsApiKey){
    log.info('Configuring content-security-policy (browserPolicy setting, CORS env var, and/or Google Maps API key detected).');
  } else {
    log.info('Applying default content-security-policy allowances (defaults still applied; the browser-policy package enforces its policy regardless).');
  }

  // import { BrowserPolicy } from 'meteor/browser-policy-common';
  import('meteor/browser-policy-common').then(({ BrowserPolicy }) => {

      // ---------------------------------------------------------------
      // Sensible defaults (always applied — see note above)
      // ---------------------------------------------------------------
      BrowserPolicy.content.allowSameOriginForAll();
      BrowserPolicy.content.allowDataUrlForAll();
      BrowserPolicy.content.allowOriginForAll('fonts.googleapis.com');
      BrowserPolicy.content.allowOriginForAll('fonts.gstatic.com');
      BrowserPolicy.content.allowImageOrigin('* data:');
      BrowserPolicy.content.allowOriginForAll('blob:');
      BrowserPolicy.content.allowImageOrigin('blob:');
      BrowserPolicy.content.allowEval();
      BrowserPolicy.content.allowInlineScripts();
      BrowserPolicy.content.allowInlineStyles();

      // local development / desktop origins
      [
        'http://localhost:3000', 
        'ws://localhost:3000', 
        'wss://localhost:3000',
        'http://localhost:12072', 
        'ws://localhost:12072', 
        'wss://localhost:12072'
      ].forEach(function(origin){
        BrowserPolicy.content.allowConnectOrigin(origin);
      });

      // ---------------------------------------------------------------
      // Additional origins from Meteor.settings.private.browserPolicy.
      // Each key maps to the matching BrowserPolicy.content method, so a
      // cross-origin FHIR server (e.g. http://localhost:3200) can be added
      // to allowConnectOrigin without touching code.
      // ---------------------------------------------------------------
      get(browserPolicyConfig, 'allowOriginForAll', []).forEach(function(origin){
        BrowserPolicy.content.allowOriginForAll(origin);
      });
      get(browserPolicyConfig, 'allowConnectOrigin', []).forEach(function(origin){
        BrowserPolicy.content.allowConnectOrigin(origin);
      });
      get(browserPolicyConfig, 'allowImageOrigin', []).forEach(function(origin){
        BrowserPolicy.content.allowImageOrigin(origin);
      });
      get(browserPolicyConfig, 'allowFrameOrigin', []).forEach(function(origin){
        BrowserPolicy.content.allowFrameOrigin(origin);
      });
      get(browserPolicyConfig, 'allowScriptOrigin', []).forEach(function(origin){
        BrowserPolicy.content.allowScriptOrigin(origin);
      });
      get(browserPolicyConfig, 'allowStyleOrigin', []).forEach(function(origin){
        BrowserPolicy.content.allowStyleOrigin(origin);
      });
      get(browserPolicyConfig, 'allowFontOrigin', []).forEach(function(origin){
        BrowserPolicy.content.allowFontOrigin(origin);
      });

      // ---------------------------------------------------------------
      // Interfaces registry (Meteor.settings.public.interfaces).
      // Every configured interface endpoint is a declared integration
      // target (inbound fetch, outbound relay, remote FHIR server), so
      // allow browser-side fetch/XHR to its origin.  Visible on
      // /server-configuration → Interfaces.
      // ---------------------------------------------------------------
      const configuredInterfaces = get(Meteor, 'settings.public.interfaces', {});
      Object.keys(configuredInterfaces).forEach(function(interfaceKey){
        const interfaceEndpoint = get(configuredInterfaces, [interfaceKey, 'channel', 'endpoint'], '');
        if(interfaceEndpoint && /^https?:\/\//.test(interfaceEndpoint)){
          try {
            const interfaceOrigin = new URL(interfaceEndpoint).origin;
            log.info('Allowing connect origin for configured interface', { interface: interfaceKey, origin: interfaceOrigin });
            BrowserPolicy.content.allowConnectOrigin(interfaceOrigin);
          } catch (parseError) {
            log.warn('Could not parse interface endpoint for browser policy', { interface: interfaceKey, endpoint: interfaceEndpoint });
          }
        } else if(interfaceEndpoint) {
          log.debug('Skipping non-http interface endpoint for browser policy', { interface: interfaceKey, endpoint: interfaceEndpoint });
        }
      });

      // ---------------------------------------------------------------
      // CORS Support (legacy: Meteor.settings.public.cors)
      // ---------------------------------------------------------------
      if(Array.isArray(get(Meteor, 'settings.public.cors'))){
        Meteor.settings.public.cors.forEach(function(corsDomain){
          BrowserPolicy.content.allowOriginForAll(corsDomain);
          BrowserPolicy.content.allowConnectOrigin(corsDomain);
          BrowserPolicy.content.allowImageOrigin(corsDomain);
        });
      }

      // ---------------------------------------------------------------
      // CORS environment variable.  Lets you whitelist an origin at launch
      // without editing any settings file, e.g.
      //     CORS=https://www.wikipedia.org meteor run
      // A comma-separated list adds several origins:
      //     CORS=https://a.example.com,https://b.example.com
      // Each origin is allowed for content, connect (fetch/XHR/websocket),
      // and image loading.
      // ---------------------------------------------------------------
      if(corsEnv){
        corsEnv.split(',').map(function(corsDomain){
          return corsDomain.trim();
        }).filter(Boolean).forEach(function(corsDomain){
          log.info('Allowing CORS origin from CORS env var', { corsDomain });
          BrowserPolicy.content.allowOriginForAll(corsDomain);
          BrowserPolicy.content.allowConnectOrigin(corsDomain);
          BrowserPolicy.content.allowImageOrigin(corsDomain);
        });
      }

      // ---------------------------------------------------------------
      // Google Maps.  The Maps JS SDK loads scripts from maps.googleapis.com,
      // tiles/sprites from maps.gstatic.com, and makes XHR calls back to
      // maps.googleapis.com.  Allow those origins whenever a Maps API key
      // is configured (GOOGLE_MAPS_API_KEY env var or settings.private.google.*).
      // ---------------------------------------------------------------
      if(googleMapsApiKey){
        log.info('Google Maps API key detected; allowing maps.googleapis.com and maps.gstatic.com in content-security-policy.');
        BrowserPolicy.content.allowOriginForAll('maps.googleapis.com');
        BrowserPolicy.content.allowOriginForAll('maps.gstatic.com');
        BrowserPolicy.content.allowConnectOrigin('maps.googleapis.com');
        BrowserPolicy.content.allowImageOrigin('maps.googleapis.com');
        BrowserPolicy.content.allowImageOrigin('maps.gstatic.com');
      }

      // ---------------------------------------------------------------
      // Reference: external EHR / anatomy / reference origins.
      // Prefer adding these to Meteor.settings.private.browserPolicy
      // (e.g. "allowOriginForAll": ["https://fhir.epic.com"]) rather than
      // uncommenting here.  See settings/settings.fhir.server.json.
      // ---------------------------------------------------------------
      // BrowserPolicy.content.allowOriginForAll('https://fhir.epic.com');
      // BrowserPolicy.content.allowOriginForAll('https://fhir-ehr-code.cerner.com');
      // BrowserPolicy.content.allowOriginForAll('*.wikipedia.com');
      // BrowserPolicy.content.allowOriginForAll('*.wikipedia.org');
      // BrowserPolicy.content.allowObjectOrigin('zygotebody.com');
      // BrowserPolicy.content.allowFrameOrigin('zygotebody.com');
      // BrowserPolicy.content.allowObjectDataUrl('zygotebody.com');
      // BrowserPolicy.content.allowOriginForAll('zygotebody.com');
      // BrowserPolicy.content.allowConnectOrigin('zygotebody.com');
      // BrowserPolicy.content.allowImageOrigin('zygotebody.com');
      // BrowserPolicy.content.allowOriginForAll('http://meteor.local');
    }).catch(function(error){
      log.error('Could not load meteor/browser-policy-common; is the browser-policy package in .meteor/packages?', { error: error && error.message });
    });


  // if(Package['clinical:hipaa-logger']){
  //   console.log('HIPAA Logger Infrastructure installed and ready to use.')

  //   Meteor.call('initializeEventLog')

  //   let startupEvent = {
  //     "resourceType" : "AuditEvent",
  //     "action" : "Startup", // Type of action performed during the event
  //     "recorded" : new Date(), // R!  Time when the event occurred on source
  //     "outcome" : "Success", // Whether the event succeeded or failed
  //     "outcomeDesc" : "System Started", // Description of the event outcome
  //     "agent" : [{ // R!  Actor involved in the event
  //       "altId" : "System", // Alternative User id e.g. authentication
  //       "name" : "System", // Human-meaningful name for the agent
  //       "requestor" : false
  //     }],
  //     "source" : { // R!  Audit Event Reporter
  //       "site" : Meteor.absoluteUrl(), // Logical source location within the enterprise
  //     }
  //   };

  //   HipaaLogger.logEvent(startupEvent, {validate: get(Meteor, 'settings.public.defaults.schemas.validate', false)}, function(error, result){
  //     if(error) console.error('HipaaLogger.logEvent.error.invalidKeys', error.invalidKeys)
  //     if(result) console.error(result)
  //   });      

  //   // // refactor this to HipaaLogger
  //   // if(get(Meteor, 'settings.public.modules.fhir.AuditEvents.enabled')){
  //   //   console.log('AuditLog enabled.  Logging application startup.')
  //   //   HipaaLogger.logEvent({eventType: "Startup", userId: "System", userName: "System Account"});    
  //   // }
  // }


  // Detect the operating system.
  // possible values are: 'darwin', 'freebsd', 'linux', 'sunos' or 'win32'
  var isWin = process.platform === "win32";
  var isMac = process.platform === "darwin";

  log.info('Detecting operating system', { platform: process.platform });
  
  // // Execute a child process...
  // exec('fsutil fsinfo volumeinfo c:', (err, stdout, stderr) => {
  //   if (err) {
  //     // node couldn't execute the command
  //     return;
  //   }

  //   // the *entire* stdout and stderr (buffered)
  //   console.log(`fsutil fsinfo volumeinfo c: ${stdout}`);
  // });

  // Execute a child process...
  exec('fdesetup status', (err, stdout, stderr) => {
    if (err) {
      // node couldn't execute the command
      return;
    }

    // the *entire* stdout and stderr (buffered)
    log.info('fdesetup status', { stdout: stdout && stdout.trim() });

    if(stdout.includes("FileVault is On.")){
      log.info('FileVault is On - updating public settings');
      Meteor.settings.public.fileVault = 'on';
    } else {
      Meteor.settings.public.fileVault = 'off';
    }
  });

  log.info('Initializing codesystems...');

  // let operationOutcomeCodeSystem = JSON.parse(await Assets.getTextAsync('CodeSystem-operation-outcome.json'));
  // if(!CodeSystems.findOne({id: get(operationOutcomeCodeSystem, 'id')})){
  //   CodeSystems.insert(operationOutcomeCodeSystem, {filter: false, validate: false})
  // }

  // console.log('Initializing valuesets...');
  // let valueSetCodeSystem = JSON.parse(await Assets.getTextAsync('ValueSet-operation-outcome.json'));
  // if(!ValueSets.findOne({id: get(valueSetCodeSystem, 'id')})){
  //   ValueSets.insert(valueSetCodeSystem, {filter: false, validate: false})
  // }

  log.info('Meteor.startup() completed....');
})