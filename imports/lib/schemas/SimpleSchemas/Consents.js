
if(Package['clinical:autopublish']){
  console.log("*****************************************************************************")
  console.log("HIPAA WARNING:  Your app has the 'clinical-autopublish' package installed.");
  console.log("Any protected health information (PHI) stored in this app should be audited."); 
  console.log("Please consider writing secure publish/subscribe functions and uninstalling.");  
  console.log("");  
  console.log("meteor remove clinical:autopublish");  
  console.log("");  
}
if(Package['autopublish']){
  console.log("*****************************************************************************")
  console.log("HIPAA WARNING:  DO NOT STORE PROTECTED HEALTH INFORMATION IN THIS APP. ");  
  console.log("Your application has the 'autopublish' package installed.  Please uninstall.");
  console.log("");  
  console.log("meteor remove autopublish");  
  console.log("meteor add clinical:autopublish");  
  console.log("");  
}

import { get, uniq, uniqBy } from 'lodash';


import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// REFACTOR:  we want to deprecate meteor/clinical:hl7-resource-datatypes
// so please remove references from the following line
// and replace with import from ../../datatypes/*
import { BaseSchema, DomainResourceSchema, IdentifierSchema, ContactPointSchema, AddressSchema, ReferenceSchema, SignatureSchema, CodeableConceptSchema, CodingSchema, AttachmentSchema, PeriodSchema, Code } from 'meteor/clinical:hl7-resource-datatypes';


// Create the object using our BaseModel
let Consent = BaseModel.extend();

export let Consents = new Mongo.Collection('Consents');

// Assign a collection so the object knows how to perform CRUD operations
Consent.prototype._collection = Consents;

// // We need to create server and client data cursors, based on which type of 
// // publication strategy we're using
// if(typeof Consents === 'undefined'){
//   if(Package['clinical:autopublish']){
//     Consents = new Mongo.Collection('Consents');
//   } else if(Package['clinical:desktop-publish']){
//     Consents = new Mongo.Collection('Consents');
//   } else {
//     // A null connection disables DDP
//     Consents = new Mongo.Collection('Consents', {connection: null});
//   }
// }




// Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Consents._transform = function (document) {
  return new Consent(document);
};


let ConsentSchemaDstu2 = new SimpleSchema({
  "_id" : {
    type: String,
    optional: true
  },
  "id" : {
    type: String,
    optional: true
  },
  "meta" : {
    type: Object,
    optional: true,
    blackbox: true
  },
  "resourceType" : {
    type: String,
    defaultValue: "Consent"
  },
  "identifier" : {
    optional: true,
    type:  Array
    },
  "identifier.$" : {
    optional: true,
    type:  IdentifierSchema 
    },
  "extension" : {
    optional: true,
    type:  Array
    },
  "extension.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
    },
  "modifierExtension" : {
    optional: true,
    type:  Array
    },
  "modifierExtension.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
    },
  "status" : {
    optional: true,
    type: Code
  }, 
  "category" : {
    optional: true,
    type: Array
  }, 
  "category.$" : {
    optional: true,
    type: CodeableConceptSchema 
  }, 
  "patient" : { 
    optional: true,
    type: ReferenceSchema
  }, 
  "period" : { 
    optional: true,
    blackbox: true,
    type: PeriodSchema 
  }, 
  "dateTime" : {
    optional: true,
    type: Date
  }, 
  "consentingParty" : {
    optional: true,
    type: Array
  }, 
  "consentingParty.$" : {
    optional: true,
    type: ReferenceSchema 
  }, 
  "actor" : {
    optional: true,
    type: Array 
  }, 
  "actor.$" : {
    optional: true,
    type: Object 
  }, 

  "actor.$.role" : {
    optional: true,
    type: CodeableConceptSchema 
  }, 
  "actor.$.reference" : {
    optional: true,
    type: ReferenceSchema 
  },
  "action" : {
    optional: true,
    type: Array
  }, 
  "action.$" : {
    optional: true,
    type: CodeableConceptSchema 
  }, 
  "organization" : {
    optional: true,
    type: Array
  },   
  "organization.$" : {
    optional: true,
    type: ReferenceSchema
  },   
  "sourceAttachment" : {
    optional: true,
    type: AttachmentSchema 
  },
  "sourceIdentifier" : {
    optional: true,
    type: IdentifierSchema 
  },
  "sourceReference" : {
    optional: true,
    type: ReferenceSchema 
  },


  "policy" : {
    optional: true,
    type: Array
  }, 
  "policy.$" : {
    optional: true,
    type: Object
  },   

  "policy.$.authority" : {
    optional: true,
    type: String
  }, 
  "policy.$.uri" : {
    optional: true,
    type: String
  }, 
  "policyRule" : {
    optional: true,
    type: String
  }, 
  "securityLabel" : {
    optional: true,
    type: Array
  }, 
  "securityLabel.$" : {
    optional: true,
    type: CodingSchema
  }, 
  "purpose" : {
    optional: true,
    type: Array
  }, 
  "purpose.$" : {
    optional: true,
    type: CodingSchema
  }, 
  "dataPeriod" : {
    optional: true,
    type: PeriodSchema 
  }, 

  "data" : {
    optional: true,
    type: Array
  }, 
  "data.$" : {
    optional: true,
    type: Object
  }, 

  "data.$.meaning" : {
    optional: true,
    type: Code
  }, 
  "data.$.reference" : {
    optional: true,
    type: ReferenceSchema 
  },


  "except" : {
    optional: true,
    type: Array
  }, 
  "except.$" : {
    optional: true,
    type: Object
  }, 

  "except.$.type" : {
    optional: true,
    type: Code
  }, 
  "except.$.period" : {
    optional: true,
    type: PeriodSchema 
  }, 


  "except.$.actor" : {
    optional: true,
    type: Array 
  }, 
  "except.$.actor.$" : {
    optional: true,
    type: Object 
  }, 

  "except.$.actor.$.role" : {
    optional: true,
    type: CodeableConceptSchema 
  }, 
  "except.$.actor.$.reference" : {
    optional: true,
    type: ReferenceSchema 
  },
  "except.$.action" : {
    optional: true,
    type: Array
  }, 
  "except.$.action.$" : {
    optional: true,
    type:  CodeableConceptSchema 
  }, 
  "except.$.securityLabel" : {
    optional: true,
    type: Array
  }, 
  "except.$.securityLabel.$" : {
    optional: true,
    type: CodingSchema
  }, 
  "except.$.purpose" : {
    optional: true,
    type: Array
  }, 
  "except.$.purpose.$" : {
    optional: true,
    type: CodingSchema
  }, 

  "except.$.class" : {
    optional: true,
    type: Array
  }, 
  "except.$.class.$" : {
    optional: true,
    type: CodingSchema 
  }, 

  "except.$.code" : {
    optional: true,
    type: Array
  }, 
  "except.$.code.$" : {
    optional: true,
    type: CodingSchema
  }, 
  "except.$.dataPeriod" : {
    optional: true,
    type: PeriodSchema 
  }, 


  "except.$.data" : {
    optional: true,
    type: Array
  }, 
  "except.$.data.$" : {
    optional: true,
    type: Object
  }, 

  "except.$.data.$.meaning" : {
    optional: true,
    type: Code
  }, 
  "except.$.data.$.reference" : {
    optional: true,
    type: ReferenceSchema 
  }
});


let ConsentSchemaR4 = new SimpleSchema({
  "_id" : {
    type: String,
    optional: true
  },
  "id" : {
    type: String,
    optional: true
  },
  "meta" : {
    type: Object,
    optional: true,
    blackbox: true
  },
  "resourceType" : {
    type: String,
    defaultValue: "Consent"
  },
  "identifier" : {
    optional: true,
    type:  Array
    },
  "identifier.$" : {
    optional: true,
    type:  IdentifierSchema 
    },
  "extension" : {
    optional: true,
    type:  Array
    },
  "extension.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
    },
  "modifierExtension" : {
    optional: true,
    type:  Array
    },
  "modifierExtension.$" : {
    optional: true,
    blackbox: true,
    type:  Object 
    },
  "status" : {
    optional: true,
    type: Code
  }, 
  "scope" : {
    optional: true,
    type: CodeableConceptSchema
  }, 
  "category" : {
    optional: true,
    type: Array
  }, 
  "category.$" : {
    optional: true,
    type: CodeableConceptSchema 
  }, 
  "patient" : { 
    optional: true,
    type: ReferenceSchema
  }, 
  "period" : { 
    optional: true,
    blackbox: true,
    type: PeriodSchema 
  }, 
  "dateTime" : {
    optional: true,
    type: Date
  }, 
  "performer" : {
    optional: true,
    type: Array
  }, 
  "performer.$" : {
    optional: true,
    type: ReferenceSchema 
  }, 
  "organization" : {
    optional: true,
    type: Array
  }, 
  "organization.$" : {
    optional: true,
    type: ReferenceSchema 
  }, 
  "sourceReference" : {
    optional: true,
    type: ReferenceSchema
  }, 
  
  "sourceAttachment" : {
    optional: true,
    type: AttachmentSchema 
  },

  "policy" : {
    optional: true,
    type: Array
  }, 
  "policy.$" : {
    optional: true,
    type: Object
  },   
  "policy.$.authority" : {
    optional: true,
    type: String
  }, 
  "policy.$.uri" : {
    optional: true,
    type: String
  }, 
  "policyRule" : {
    optional: true,
    type: String
  }, 
  "verification" : {
    optional: true,
    type: Array
  }, 
  "verification.$" : {
    optional: true,
    type: Object
  },   
  "verification.$.verified" : {
    optional: true,
    type: Boolean
  }, 
  "verification.$.verifiedWith" : {
    optional: true,
    type: ReferenceSchema
  }, 
  "verification.$.verificationDate" : {
    optional: true,
    type: Date
  },
  "provision" : {
    optional: true,
    type: Array
  }, 
  "provision.$" : {
    optional: true,
    type: Object
  }, 

  "provision.$.type" : {
    optional: true,
    type: Code
  }, 
  "provision.$.period" : {
    optional: true,
    type: PeriodSchema 
  }, 


  "provision.$.actor" : {
    optional: true,
    type: Array 
  }, 
  "provision.$.actor.$" : {
    optional: true,
    type: Object 
  }, 

  "provision.$.actor.$.role" : {
    optional: true,
    type: CodeableConceptSchema 
  }, 
  "provision.$.actor.$.reference" : {
    optional: true,
    type: ReferenceSchema 
  },
  "provision.$.action" : {
    optional: true,
    type: Array
  }, 
  "provision.$.action.$" : {
    optional: true,
    type:  CodeableConceptSchema 
  }, 
  "provision.$.securityLabel" : {
    optional: true,
    type: Array
  }, 
  "provision.$.securityLabel.$" : {
    optional: true,
    type: CodingSchema
  }, 
  "provision.$.purpose" : {
    optional: true,
    type: Array
  }, 
  "provision.$.purpose.$" : {
    optional: true,
    type: CodingSchema
  }, 

  "provision.$.class" : {
    optional: true,
    type: Array
  }, 
  "provision.$.class.$" : {
    optional: true,
    type: CodingSchema 
  }, 

  "provision.$.code" : {
    optional: true,
    type: Array
  }, 
  "provision.$.code.$" : {
    optional: true,
    type: CodingSchema
  }, 
  "provision.$.dataPeriod" : {
    optional: true,
    type: PeriodSchema 
  }, 
  "provision.$.data" : {
    optional: true,
    type: Array
  }, 
  "provision.$.data.$" : {
    optional: true,
    type: Object
  }, 
  "provision.$.data.$.meaning" : {
    optional: true,
    type: Code
  }, 
  "provision.$.data.$.reference" : {
    optional: true,
    type: ReferenceSchema 
  }
});

BaseSchema.extend(ConsentSchemaR4);
DomainResourceSchema.extend(ConsentSchemaR4);

// Consents.attachSchema(ConsentSchemaR4);

let ConsentSchema = ConsentSchemaR4;


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

export { Consent, ConsentSchema, ConsentSchemaR4, ConsentSchemaDstu2 };
