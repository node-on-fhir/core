// import '/imports/startup/server';
// import '/imports/api/users/methods';


import { exec } from 'child_process';
// import moment from 'moment-timezone';
import { get } from 'lodash';
import { DDPGracefulShutdown } from '@meteorjs/ddp-graceful-shutdown';
import { Meteor } from 'meteor/meteor';

import { Patients } from '../imports/lib/schemas/SimpleSchemas/Patients';
import { CodeSystems } from '../imports/lib/schemas/SimpleSchemas/CodeSystems';
import { ValueSets } from '../imports/lib/schemas/SimpleSchemas/ValueSets';


Meteor.startup(function(){
  console.log('Meteor application framework is starting.');
  // console.log('Patients', Patients)
  // console.log('CodeSystems', CodeSystems)

  console.log('');
  console.log('Clock check...');
  // console.log('Current time zone: ' + moment.tz.guess());
  console.log('');


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
  console.log('Meteor.settings.public.version', Meteor.settings.public.version)

  // if OAuth is configured, load oauth configs into active memory
  if(Package['symptomtic:smart-on-fhir-client']){
    console.log('Resyncing OAuth configuration....');
    Meteor.call('resyncConfiguration');
  }

  // browser content policies (Content-Security-Policy) are an important
  // security measure to only allow connections to specific websites.
  //
  // We keep this section optional and gate it behind a private setting,
  // because some people want to use meteor-on-fhir during hackathons,
  // research, and various projects where HIPAA grade security isn't
  // always needed.
  //
  // There are two ways to enable it:
  //   1. Set Meteor.settings.private.browserPolicy (see
  //      settings/settings.fhir.server.json for an example), or
  //   2. Pass a CORS environment variable at launch, e.g.
  //         CORS=https://www.wikipedia.org meteor run
  //      (comma-separated for multiple, e.g. CORS=https://a.com,https://b.com)
  //
  // We don't rely on browser-policy-common already being initialized; when
  // either is present we dynamically import (install) it on demand.

  var browserPolicyConfig = get(Meteor, 'settings.private.browserPolicy');
  var corsEnv = process.env.CORS;

  if(browserPolicyConfig || corsEnv){
    console.log('Configuring content-security-policy (browserPolicy setting and/or CORS env var detected).');

    // import { BrowserPolicy } from 'meteor/browser-policy-common';
    import('meteor/browser-policy-common').then(({ BrowserPolicy }) => {

      // ---------------------------------------------------------------
      // Sensible defaults (always applied when browserPolicy is enabled)
      // ---------------------------------------------------------------
      BrowserPolicy.content.allowSameOriginForAll();
      BrowserPolicy.content.allowDataUrlForAll();
      BrowserPolicy.content.allowOriginForAll('self');
      BrowserPolicy.content.allowObjectOrigin('self');
      BrowserPolicy.content.allowOriginForAll('font src');
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
          console.log('Allowing CORS origin from CORS env var:', corsDomain);
          BrowserPolicy.content.allowOriginForAll(corsDomain);
          BrowserPolicy.content.allowConnectOrigin(corsDomain);
          BrowserPolicy.content.allowImageOrigin(corsDomain);
        });
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
      console.error('Could not load meteor/browser-policy-common; is the browser-policy package in .meteor/packages?', error);
    });
  } else {
    console.log('Browser content-security-policy not configured (set Meteor.settings.private.browserPolicy or pass a CORS env var to enable).');
  }


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

  console.log('Detecting operating system: ' + process.platform);
  
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
    console.log(`fdesetup status: ${stdout}`);

    if(stdout.includes("FileVault is On.")){
      console.log('Should tell the client that FileVault is on')
      Meteor.settings.public.fileVault = 'on';
    } else {
      Meteor.settings.public.fileVault = 'off';
    }
  });

  console.log('Initializing codesystems...');

  // let operationOutcomeCodeSystem = JSON.parse(await Assets.getTextAsync('CodeSystem-operation-outcome.json'));
  // if(!CodeSystems.findOne({id: get(operationOutcomeCodeSystem, 'id')})){
  //   CodeSystems.insert(operationOutcomeCodeSystem, {filter: false, validate: false})
  // }

  // console.log('Initializing valuesets...');
  // let valueSetCodeSystem = JSON.parse(await Assets.getTextAsync('ValueSet-operation-outcome.json'));
  // if(!ValueSets.findOne({id: get(valueSetCodeSystem, 'id')})){
  //   ValueSets.insert(valueSetCodeSystem, {filter: false, validate: false})
  // }

  console.log('Meteor.startup() completed....');
})