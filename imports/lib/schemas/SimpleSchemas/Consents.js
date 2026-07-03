// imports/lib/schemas/SimpleSchemas/Consents.js
// Collection definition for Consent resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Consent.json.
import { get, uniq } from 'lodash';

import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// Create the object using our BaseModel
let Consent = BaseModel.extend();

export let Consents = createFhirCollection('Consent', 'Consents');

// Assign a collection so the object knows how to perform CRUD operations
Consent.prototype._collection = Consents;

// Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Consents._transform = function (document) {
  return new Consent(document);
};


Consent.prototype.toFhir = function(){
  console.log('Consent.toFhir()');



  return EJSON.stringify(this.name);
}



/**
 * @summary Search the Consents collection for a specific Meteor.userId().
 * @memberOf Consents
 * @name findMrn
 * @version 1.2.3
 * @returns {Boolean}
 * @example
 * ```js
 *  let consents = Consents.findMrn('12345').fetch();
 * ```
 */

Consents.fetchBundle = function (query, parameters, callback) {
  process.env.TRACE && console.log("Consents.fetchBundle()");
  var consentArray = Consents.find(query, parameters, callback).map(function(consent){
    consent.id = consent._id;
    delete consent._document;
    return consent;
  });

  // console.log("consentArray", consentArray);

  var result = Bundle.generate(consentArray);

  // console.log("result", result.entry[0]);

  return result;
};


/**
 * @summary This function takes a FHIR resource and prepares it for storage in Mongo.
 * @memberOf Consents
 * @name toMongo
 * @version 1.6.0
 * @returns { Consent }
 * @example
 * ```js
 *  let consents = Consents.toMongo('12345').fetch();
 * ```
 */

Consents.toMongo = function (originalConsent) {
  var mongoRecord;
  process.env.TRACE && console.log("Consents.toMongo()");

  if (originalConsent.identifier) {
    originalConsent.identifier.forEach(function(identifier){
      if (identifier.period) {
        if (identifier.period.start) {
          var startArray = identifier.period.start.split('-');
          identifier.period.start = new Date(startArray[0], startArray[1] - 1, startArray[2]);
        }
        if (identifier.period.end) {
          var endArray = identifier.period.end.split('-');
          identifier.period.end = new Date(startArray[0], startArray[1] - 1, startArray[2]);
        }
      }
    });
  }

  return originalConsent;
};



/**
 * @summary This function takes a DTSU2 resource and returns it as STU3.  i.e. it converts from v1.0.2 to v3.0.0
 * @name toMongo
 * @version 3.0.0
 * @returns { Consent }
 * @example
 * ```js
 * ```
 */
Consents.toStu3 = function(consentJson){
  if(consentJson){

    // quick cast from string to boolean
    if(typeof consentJson.birthDate === "string"){
      consentJson.birthDate = new Date(consentJson.birthDate);
    }

    // quick cast from string to boolean
    if(consentJson.deceasedBoolean){
      consentJson.deceasedBoolean = (consentJson.deceasedBoolean == "true") ? true : false;
    }

    // STU3 only has a single entry for family name; not an array
    if(consentJson.name && consentJson.name[0] && consentJson.name[0].family && consentJson.name[0].family[0] ){
      consentJson.name[0].family = consentJson.name[0].family[0];
    }

    // make sure the full name is filled out
    if(consentJson.name && consentJson.name[0] && consentJson.name[0].family && !consentJson.name[0].text ){
      consentJson.name[0].text = consentJson.name[0].given[0] + ' ' + consentJson.name[0].family;
    }
  }
  return consentJson;
}


/**
 * @summary Similar to toMongo(), this function prepares a FHIR record for storage in the Mongo database.  The difference being, that this assumes there is already an existing record.
 * @memberOf Consents
 * @name prepForUpdate
 * @version 1.6.0
 * @returns { Object }
 * @example
 * ```js
 *  let consents = Consents.findMrn('12345').fetch();
 * ```
 */

Consents.prepForUpdate = function (consent) {
  process.env.TRACE && console.log("Consents.prepForUpdate()");

  if (consent.name && consent.name[0]) {
    //console.log("consent.name", consent.name);

    consent.name.forEach(function(name){
      name.resourceType = "HumanName";
    });
  }

  if (consent.telecom && consent.telecom[0]) {
    //console.log("consent.telecom", consent.telecom);
    consent.telecom.forEach(function(telecom){
      telecom.resourceType = "ContactPoint";
    });
  }

  if (consent.address && consent.address[0]) {
    //console.log("consent.address", consent.address);
    consent.address.forEach(function(address){
      address.resourceType = "Address";
    });
  }

  if (consent.contact && consent.contact[0]) {
    //console.log("consent.contact", consent.contact);

    consent.contact.forEach(function(contact){
      if (contact.name) {
        contact.name.resourceType = "HumanName";
      }

      if (contact.telecom && contact.telecom[0]) {
        contact.telecom.forEach(function(telecom){
          telecom.resourceType = "ContactPoint";
        });
      }
    });
  }

  return consent;
};


/**
 * @summary Scrubbing the consent; make sure it conforms to v1.6.0
 * @memberOf Consents
 * @name scrub
 * @version 1.2.3
 * @returns {Boolean}
 * @example
 * ```js
 *  let consents = Consents.findMrn('12345').fetch();
 * ```
 */

Consents.prepForFhirTransfer = function (consent) {
  process.env.TRACE && console.log("Consents.prepForFhirTransfer()");


  // FHIR has complicated and unusual rules about dates in order
  // to support situations where a family member might report on a consent's
  // date of birth, but not know the year of birth; and the other way around
  if (consent.birthDate) {
    consent.birthDate = moment(consent.birthDate).format("YYYY-MM-DD");
  }


  if (consent.name && consent.name[0]) {
    //console.log("consent.name", consent.name);

    consent.name.forEach(function(name){
      delete name.resourceType;
    });
  }

  if (consent.telecom && consent.telecom[0]) {
    //console.log("consent.telecom", consent.telecom);
    consent.telecom.forEach(function(telecom){
      delete telecom.resourceType;
    });
  }

  if (consent.address && consent.address[0]) {
    //console.log("consent.address", consent.address);
    consent.address.forEach(function(address){
      delete address.resourceType;
    });
  }

  if (consent.contact && consent.contact[0]) {
    //console.log("consent.contact", consent.contact);

    consent.contact.forEach(function(contact){

      console.log("contact", contact);


      if (contact.name && contact.name.resourceType) {
        //console.log("consent.contact.name", contact.name);
        delete contact.name.resourceType;
      }

      if (contact.telecom && contact.telecom[0]) {
        contact.telecom.forEach(function(telecom){
          delete telecom.resourceType;
        });
      }

    });
  }

  //console.log("Consents.prepForBundle()", consent);

  return consent;
};



Consents.readProfile = function(){
  console.log("Reading user profile for consents....")

  let results = [];
  let consentsObject = get(Meteor.user(), 'profile.consents');
  Object.keys(consentsObject).forEach(function(key){
    results.push(consentsObject[key])
  });

  return results;
}

Consents.readProfileIntoCollection = function(){
  console.log("Reading user profile for consents....")

  let results = [];
  let consentsObject = get(Meteor.user(), 'profile.consents');
  Object.keys(consentsObject).forEach(function(key){
    Consents._collection.insert(consentsObject[key])
  });
}

// https://medium.com/@jafarim/using-json-to-model-complex-oauth-scopes-fa8a054b2a28
Consent.prototype.parseIntoUmaScopeRequest = function(){
  console.log("Parsing consent into an UMA scope request....");

  // UMA formatted scope request
  return {
    "resourceType" : [get(this, 'except[0].class[0].code')],
    "accessType": ["read"],
    "purposeOfUse": [
      {
       "system": "http://hl7.org/fhir/ValueSet/v3-PurposeOfUse",
       "code": "TREAT"
      }
    ]
  };
}

// https://medium.com/@jafarim/using-json-to-model-complex-oauth-scopes-fa8a054b2a28
Consent.prototype.parseIntoScopeRequest = function(type, capitalize){
  console.log("Parsing consent into an OAuth scope....");

  var result = '';

  if (type) {
    result = type + '/';
  }

  // we're basically just plucking a value out of the Consent resource
  // and returning it as a string
  result = result + get(this, 'except[0].class[0].code') + '.read';

  if(capitalize){
    result = result.toUpperCase();
  }

  return result;
}

// https://medium.com/@jafarim/using-json-to-model-complex-oauth-scopes-fa8a054b2a28
Consents.generateScopeRequest = function(consentArray, vendorDialect, capitalize, urlEncoded){
  console.log("Parsing array of consents into an aggregated OAuth scope request....");

  var result = '';
  var scopeArray = [];

  // the following seem to be common to the major EHR vendors
  // and is referenced in the SMART on FHIR specification
  result = 'launch/patient '
            + 'online_access '
            + 'openid '
            + 'profile '
            + 'user/Patient.read';

  // general idea is to use any consents that are passed into the function
  // otherwise, default to generating across the entire local collection
  // be careful about running this on the server!
  if(!consentArray){
    consentArray = Consents.find().fetch();
  }

  // for each Consent
  // we map the big gnarly Consent resource
  // into a single scope
  // basically just plucking two key fields out of the object
  if(consentArray.length > 0){
    consentArray.forEach(function(consent){
      scopeArray.push(consent.parseIntoScopeRequest('user', false))
    })
  }

  if(scopeArray.length > 0){
    // remove duplicates
    scopeArray = uniq(scopeArray);

    // now parse into the final string
    scopeArray.forEach(function(scope){
      result = result + ' ' + scope;
    })
  }

  if(urlEncoded){
    result = encodeURI(result);
  }

  if(capitalize){
    result = result.toUpperCase();
  }

  return result;
}

export { Consent };
