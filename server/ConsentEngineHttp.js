
import { Consents } from '../imports/lib/schemas/SimpleSchemas/Consents';
import { FhirUtilities } from '../imports/lib/FhirUtilities';

import { AccessControl } from 'role-acl';

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { WebApp } from 'meteor/webapp';
import { get } from 'lodash';

import mongoose from 'mongoose';
import { Mongo } from '@accounts/mongo';
import { AccountsServer } from '@accounts/server';

import base64url from 'base64url'

//---------------------------------------------------------------
// accounts and access control
let accountsServer;
Meteor.startup(async function(){
  // Need to add a default language for accessibility purposes
  WebApp.addHtmlAttributeHook(function() {
    return {
      "lang": "en"
    }
  })

  // Establish a database connection
  mongoose.connect(process.env.MONGO_URL, {
    useUnifiedTopology: true,
    useNewUrlParser: true
  });

  const db = mongoose.connection;
  let accountsMongo = new Mongo(db, {
    // options
  });

  // Connect to the accounts server for authentication 
  let accountsServer = new AccountsServer(
    {
      db: accountsMongo,
      tokenSecret: get(Meteor, 'settings.private.accountServerTokenSecret', Random.secret()) 
    }
  );
});

//---------------------------------------------------------------
// Methods

export async function parseHttpAuthorization(req){
  process.env.DEBUG && console.log("Parsing user authorization....")

  let isAuthorized = true;

  let headers = get(req, 'headers');
  console.log('parseHttpAuthorization.headers', headers)

  let accessToken = get(req, 'headers.session');

  if(get(Meteor, 'settings.private.accessControl.enableHttpAccessRestrictions')){
    process.env.DEBUG && console.log("parseRpcAuthorization().accessToken", accessToken)
    
    try {
      const session = await accountsServer.findSessionByAccessToken(accessToken);
      process.env.DEBUG && console.log("parseRpcAuthorization().session", session);

      if(session){
        isAuthorized = true;
      }        
    } catch (error) {
      console.log('findSessionByAccessToken.error', error)
      isAuthorized = false;
    }
  } else if(get(Meteor, 'settings.private.accessControl.enableBasicAuth')){
    let encodedAuth = get(req, "headers.authorization");
    if(typeof encodedAuth === "string"){
      let decodedAuth = base64url.decode(encodedAuth.replace("Basic ", ""))
      console.log('decodedAuth: ' + decodedAuth)
  
      let authParts = decodedAuth.split(":");
      if(authParts[0] && OAuthClientsCollections){
        let clientRegistration = OAuthClientsCollections.findOne({client_id: authParts[0]})
        console.log('clientRegistration', clientRegistration)
        if(clientRegistration && authParts[1]){
          if(get(clientRegistration, 'client_secret') === authParts[1]){
            isAuthorized = true;
            console.log('User presented registered client_secret via Basic Auth. Granting system access.');
          }          
        }
      } else {
        console.log("For some reason the OAuthClients collection doesn't exist.")
      }  
    } else {
      console.log("headers.authorization not set in request.")
    }
  }  
  if(get(Meteor, 'settings.private.accessControl.enableTestingAccess')){
    isAuthorized = true;
  }

  return isAuthorized;
}



//---------------------------------------------------------------


if(process.env.DEBUG){


  WebApp.handlers.get("/access-control-list", async (req, res) => {

    console.log('GET ' + '/access-control-list');

    res.setHeader('Content-type', 'application/json');
    res.setHeader("Access-Control-Allow-Origin", "*");

    let isAuthorized = await parseHttpAuthorization(req);
    process.env.DEBUG_ACCOUNTS && console.log('isAuthorized', isAuthorized)

    if(isAuthorized){
      let accessControlList = [];
      Consents.find({'category.coding.code': 'IDSCL'}).forEach(function(consentRecord){
        accessControlList.push(FhirUtilities.consentIntoAccessControl(consentRecord));
      })
  
      const acl = new AccessControl(accessControlList);
  
      let returnPayload = {
        code: 200,
        data: accessControlList
      }
  
      console.log('Publishing access control list...')
     
      res.status(401).json(returnPayload);
    } else {
      res.status(401).json();
    }
   
    
  });



  WebApp.handlers.get("/access-control-test", async (req, res) => {

    console.log("GET /access-control-test");
  
    res.setHeader('Content-type', 'application/json');
    res.setHeader("Access-Control-Allow-Origin", "*");
  
    let accessControlList = [];
    Consents.find({'category.coding.code': 'IDSCL'}).forEach(function(consentRecord){
      accessControlList.push(FhirUtilities.consentIntoAccessControl(consentRecord));
    })
  
    console.log('accessControlList.length', accessControlList.length)
    console.log('accessControlList', accessControlList)
  
    const acl = new AccessControl(accessControlList);
  
    let returnPayload;
    try {
      const permission = acl.can('healthcare provider').execute('read').with({confidentiality: 'restricted'}).sync().on('Organization');    
      returnPayload = {
        code: 200,
        data: {
          granted: permission.granted,
          attributes: permission.attributes
        }
      }
    } catch (error) {
      returnPayload = {
        code: 401
      }        
    }
   
    res.json(returnPayload);
  });
}




