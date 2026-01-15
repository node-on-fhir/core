import { get } from 'lodash';
import validator from 'validator';

import BaseModel from '../../BaseModel';
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// REFACTOR:  we want to deprecate meteor/clinical:hl7-resource-datatypes
// so please remove references from the following line
// and replace with import from ../../datatypes/*
import { BaseSchema, HumanNameSchema, DomainResourceSchema, IdentifierSchema, ContactPointSchema, AddressSchema, CodeableConceptSchema, ReferenceSchema } from 'meteor/clinical:hl7-resource-datatypes';
// import HumanNameSchema from '../../../datatypes/HumanName';

// import { MetaSchema } from '../../datatypes/Meta';
// import { BaseSchema } from '../../datatypes/Base';
// import { DomainResourceSchema } from '../../datatypes/DomainResource';
// import { HumanNameSchema } from '../../datatypes/HumanName';
// import { IdentifierSchema } from '../../datatypes/Identifier';
// import { ContactPointSchema } from '../../datatypes/ContactPoint';
// import { CodeableConceptSchema } from '../../datatypes/CodeableConcept';
// import { AddressSchema } from '../../datatypes/Address';
// import { ReferenceSchema } from '../../datatypes/Reference';
// import { PeriodSchema } from '../../datatypes/Period';


// if(Package['clinical:autopublish']){
//   console.log("*****************************************************************************")
//   console.log("HIPAA WARNING:  Your app has the 'clinical-autopublish' package installed.");
//   console.log("Any protected health information (PHI) stored in this app should be audited."); 
//   console.log("Please consider writing secure publish/subscribe functions and uninstalling.");  
//   console.log("");  
//   console.log("meteor remove clinical:autopublish");  
//   console.log("");  
// }
// if(Package['autopublish']){
//   console.log("*****************************************************************************")
//   console.log("HIPAA WARNING:  DO NOT STORE PROTECTED HEALTH INFORMATION IN THIS APP. ");  
//   console.log("Your application has the 'autopublish' package installed.  Please uninstall.");
//   console.log("");  
//   console.log("meteor remove autopublish");  
//   console.log("meteor add clinical:autopublish");  
//   console.log("");  
// }



// create the object using our BaseModel
let Organization = BaseModel.extend();

export const Organizations = new Mongo.Collection('Organizations');

//Assign a collection so the object knows how to perform CRUD operations
Organization.prototype._collection = Organizations;

//Add the transform to the collection since Meteor.users is pre-defined by the accounts package
Organizations._transform = function (document) {
  return new Organization(document);
};

let OrganizationSchema = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "Organization"
  },
  "_id" : {
    optional: true,
    type:  String
    },
  "id" : {
    optional: true,
    type:  String
    },
  "meta" : {
    optional: true,
    blackbox: true,
    type:  Object
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
  "identifier" : {
    optional: true,
    type:  Array
    },
  "identifier.$" : {
    optional: true,
    // type:  IdentifierSchema 
    blackbox: true,
    type:  Object 
    },
  "active" : {
    optional: true,
    type: Boolean,
    defaultValue: true
  }, // Whether the organization's record is still in active use
  "type" : {
    optional: true,
    type: Array
  }, // Kind of organization
  "type.$" : {
    optional: true,
    type: CodeableConceptSchema 
  }, // Kind of organization
  "name" : {
    optional: true,
    type: String
  }, // C? Name used for the organization
  "telecom" : {
    optional: true,
    type: Array
  }, // C? A contact detail for the organization
  "telecom.$" : {
    optional: true,
    // type: ContactPointSchema 
    blackbox: true,
    type:  Object 
  }, // C? A contact detail for the organization
  "address" : {
    optional: true,
    type: Array
  }, // C? An address for the organization
  "address.$" : {
    optional: true,
    blackbox:true,
    type: Object 
  }, // C? An address for the organization
  "partOf" : {
    optional: true,
    type: ReferenceSchema
  }, // (Organization) The organization of which this organization forms a part

  "contact" : {
    optional: true,
    type:  Array
    },
  "contact.$" : {
    optional: true,
    type:  Object 
    },
  "contact.$.purpose" : {
    optional: true,
    type: CodeableConceptSchema
  }, // The type of contact
  "contact.$.name" : {
    optional: true,
    type: HumanNameSchema
  }, // A name associated with the contact
  "contact.$.telecom" : {
    optional: true,
    type: Array
  }, // Contact details (telephone, email, etc.)  for a contact
  "contact.$.telecom.$" : {
    optional: true,
    type: ContactPointSchema 
  }, // Contact details (telephone, email, etc.)  for a contact
  "contact.$.address" : {
    optional: true,
    type: AddressSchema
  }, // Visiting or postal addresses for the contact
  "alias" : {
    optional: true,
    type: Array
  }, 
  "alias.$" : {
    optional: true,
    type: String
  }, 
  "endpoint" : {
    optional: true,
    type: ReferenceSchema
  }
});


let OrganizationStu3 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "Organization"
  },
  "_id" : {
    optional: true,
    type:  String
    },
  "id" : {
    optional: true,
    type:  String
    },
  "meta" : {
    optional: true,
    blackbox: true,
    type:  Object
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
  "identifier" : {
    optional: true,
    type:  Array
    },
  "identifier.$" : {
    optional: true,
    type:  IdentifierSchema 
    },
  "active" : {
    optional: true,
    type: Boolean,
    defaultValue: true
  }, // Whether the organization's record is still in active use
  "type" : {
    optional: true,
    type: Array
  }, // Kind of organization
  "type.$" : {
    optional: true,
    type: CodeableConceptSchema 
  }, // Kind of organization
  "name" : {
    optional: true,
    type: String
  }, // C? Name used for the organization
  "telecom" : {
    optional: true,
    type: Array
  }, // C? A contact detail for the organization
  "telecom.$" : {
    optional: true,
    type: ContactPointSchema 
  }, // C? A contact detail for the organization
  "address" : {
    optional: true,
    type: Array
  }, // C? An address for the organization
  "address.$" : {
    optional: true,
    type: AddressSchema 
  }, // C? An address for the organization
  "partOf" : {
    optional: true,
    type: ReferenceSchema
  }, // (Organization) The organization of which this organization forms a part

  "contact" : {
    optional: true,
    type:  Array
    },
  "contact.$" : {
    optional: true,
    type:  Object 
    },
  "contact.$.purpose" : {
    optional: true,
    type: CodeableConceptSchema
  }, // The type of contact
  "contact.$.name" : {
    optional: true,
    type: HumanNameSchema
  }, // A name associated with the contact
  "contact.$.telecom" : {
    optional: true,
    type: Array
  }, // Contact details (telephone, email, etc.)  for a contact
  "contact.$.telecom.$" : {
    optional: true,
    type: ContactPointSchema 
  }, // Contact details (telephone, email, etc.)  for a contact
  "contact.$.address" : {
    optional: true,
    type: AddressSchema
  }, // Visiting or postal addresses for the contact
  "alias" : {
    optional: true,
    type: Array
  }, 
  "alias.$" : {
    optional: true,
    type: String
  }, 
  "endpoint" : {
    optional: true,
    type: ReferenceSchema
  }
});

let OrganizationDstu2 = new SimpleSchema({
  "resourceType" : {
    type: String,
    defaultValue: "Organization"
  },
  "_id" : {
    optional: true,
    type:  String
    },
  "id" : {
    optional: true,
    type:  String
    },
  "meta" : {
    optional: true,
    blackbox: true,
    type:  Object
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
  "identifier" : {
    optional: true,
    type:  Array
    },
  "identifier.$" : {
    optional: true,
    type:  IdentifierSchema 
    },
  "active" : {
    optional: true,
    type: Boolean,
    defaultValue: true
  }, // Whether the organization's record is still in active use
  "type" : {
    optional: true,
    type: CodeableConceptSchema
  }, // Kind of organization
  "name" : {
    optional: true,
    type: String
  }, // C? Name used for the organization
  "telecom" : {
    optional: true,
    type: Array
  }, // C? A contact detail for the organization
  "telecom.$" : {
    optional: true,
    type: ContactPointSchema 
  }, // C? A contact detail for the organization
  "address" : {
    optional: true,
    type: Array
  }, // C? An address for the organization
  "address.$" : {
    optional: true,
    type: AddressSchema 
  }, // C? An address for the organization
  "partOf" : {
    optional: true,
    type: ReferenceSchema
  }, // (Organization) The organization of which this organization forms a part

  "contact" : {
    optional: true,
    type:  Array
    },
  "contact.$" : {
    optional: true,
    type:  Object 
    },
  "contact.$.purpose" : {
    optional: true,
    type: CodeableConceptSchema
  }, // The type of contact
  "contact.$.name" : {
    optional: true,
    type: HumanNameSchema
  }, // A name associated with the contact
  "contact.$.telecom" : {
    optional: true,
    type: Array
  }, // Contact details (telephone, email, etc.)  for a contact
  "contact.$.telecom.$" : {
    optional: true,
    type: ContactPointSchema 
  }, // Contact details (telephone, email, etc.)  for a contact
  "contact.$.address" : {
    optional: true,
    type: AddressSchema
  }
});

MetaSchema.extend(OrganizationSchema);
BaseSchema.extend(OrganizationSchema);
DomainResourceSchema.extend(OrganizationSchema);


export default { Organization, Organizations, OrganizationSchema, OrganizationDstu2, OrganizationStu3 };



//=================================================================
// FHIR Methods

Organizations.fetchBundle = function (query, parameters, callback) {
  var organizationArray = Organizations.find(query, parameters, callback).map(function(organization){
    organization.id = organization._id;
    delete organization._document;
    return organization;
  });

  // console.log("organizationArray", organizationArray);

  var result = Bundle.generate(organizationArray);

  // console.log("result", result.entry[0]);

  return result;
};


/**
 * @summary This function takes a FHIR resource and prepares it for storage in Mongo.
 * @memberOf Organizations
 * @name toMongo
 * @version 1.6.0
 * @returns { Organization }
 * @example
 * ```js
 *  let organizations = Organizations.toMongo('12345').fetch();
 * ```
 */

Organizations.toMongo = function (originalOrganization) {
  var mongoRecord;

  // if (originalOrganization.identifier) {
  //   originalOrganization.identifier.forEach(function(identifier){
  //     if (identifier.period) {
  //       if (identifier.period.start) {
  //         var startArray = identifier.period.start.split('-');
  //         identifier.period.start = new Date(startArray[0], startArray[1] - 1, startArray[2]);
  //       }
  //       if (identifier.period.end) {
  //         var endArray = identifier.period.end.split('-');
  //         identifier.period.end = new Date(startArray[0], startArray[1] - 1, startArray[2]);
  //       }
  //     }
  //   });
  // }

  return originalOrganization;
};


/**
 * @summary Similar to toMongo(), this function prepares a FHIR record for storage in the Mongo database.  The difference being, that this assumes there is already an existing record.
 * @memberOf Organizations
 * @name prepForUpdate
 * @version 1.6.0
 * @returns { Object }
 * @example
 * ```js
 *  let organizations = Organizations.findMrn('12345').fetch();
 * ```
 */

Organizations.prepForUpdate = function (organization) {

  if (organization.identifier && organization.identifier[0]) {
    process.env.TRACE && console.log("organization.identifier", organization.identifier);

    organization.identifier.forEach(function(identifier){
      identifier.resourceType = "HumanName";
    });
  }

  if (organization.telecom && organization.telecom[0]) {
    process.env.TRACE && console.log("organization.telecom", organization.telecom);
    organization.telecom.forEach(function(telecom){
      telecom.resourceType = "ContactPoint";
    });
  }

  if (organization.address && organization.address[0]) {
    process.env.TRACE && console.log("organization.address", organization.address);
    organization.address.forEach(function(address){
      address.resourceType = "Address";
    });
  }

  if (organization.contact && organization.contact[0]) {
    process.env.TRACE && console.log("organization.contact", organization.contact);

    organization.contact.forEach(function(contact){
      if (contact.name) {
        contact.name.resourceType = "HumanName";
      }

      if (contact.telecom && contact.telecom[0]) {
        contact.telecom.forEach(function(telecom){
          telecom.resourceType = "ContactPoint";
        });
      }

      if (contact.address) {
        contact.address.resourceType = "HumanName";
      }

    });
  }

  return organization;
};


/**
 * @summary Scrubbing the organization; make sure it conforms to v1.6.0
 * @memberOf Organizations
 * @name scrub
 * @version 1.2.3
 * @returns {Boolean}
 * @example
 * ```js
 *  let organizations = Organizations.findMrn('12345').fetch();
 * ```
 */

Organizations.prepForFhirTransfer = function (organization) {
  process.env.DEBUG && console.log("Organizations.prepForBundle()");


  if (organization.telecom && organization.telecom[0]) {
    process.env.TRACE && console.log("organization.telecom", organization.telecom);
    organization.telecom.forEach(function(telecom){
      delete telecom.resourceType;
    });
  }

  if (organization.address && organization.address[0]) {
    process.env.TRACE && console.log("organization.address", organization.address);
    organization.address.forEach(function(address){
      delete address.resourceType;
    });
  }

  if (organization.contact && organization.contact[0]) {
    process.env.TRACE && console.log("organization.contact", organization.contact);

    organization.contact.forEach(function(contact){

      console.log("contact", contact);


      if (contact.name && contact.name.resourceType) {
        process.env.TRACE && console.log("organization.contact.name", contact.name);
        delete contact.name.resourceType;
      }

      if (contact.telecom && contact.telecom[0]) {
        contact.telecom.forEach(function(telecom){
          delete telecom.resourceType;
        });
      }


      if (contact.address && contact.address.resourceType) {
        delete contact.address.resourceType;
      }
    });
  }

  console.log("Organizations.prepForBundle()", organization);

  return organization;
};

// /**
//  * @summary The displayed name of the organization.
//  * @memberOf Organization
//  * @name displayName
//  * @version 1.2.3
//  * @returns {Boolean}
//  * @example
//  * ```js
//  * ```
//  */

// Organization.prototype.displayName = function () {
//   if (this.name && this.name[0]) {
//     return this.name[0].text;
//   }
// };
