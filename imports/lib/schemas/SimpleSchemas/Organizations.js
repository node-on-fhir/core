// imports/lib/schemas/SimpleSchemas/Organizations.js
// Collection definition for Organization resources.
// SimpleSchema definitions removed 2026-07 (JSON Schema migration):
// validation now lives in imports/lib/FhirValidator.js against
// imports/lib/schemas/R4B/JsonSchema/Organization.json.
import BaseModel from '../../BaseModel';
import { createFhirCollection } from '/imports/lib/ValidatedCollection';

// create the object using our BaseModel
let Organization = BaseModel.extend();

export const Organizations = createFhirCollection('Organization', 'Organizations');

//Assign a collection so the object knows how to perform CRUD operations
Organization.prototype._collection = Organizations;

//Add the transform to the collection
Organizations._transform = function (document) {
  return new Organization(document);
};

export default { Organization, Organizations };



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
