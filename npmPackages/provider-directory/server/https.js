// npmPackages/provider-directory/server/https.js
//
// REST endpoints for the provider directory (stats + UDAP/FAST certificate
// signing). Migrated from `simple:json-routes` (JsonRoutes.add) — which is not
// available outside Atmosphere — to the app's own REST mechanism,
// WebApp.handlers (the same surface server/FhirEndpoints.js uses). bodyParser.json()
// is already registered on WebApp.handlers app-wide (FhirEndpoints.js), so
// req.body is pre-parsed for JSON POSTs. DB calls converted to Meteor v3 async.

import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { Organizations } from '/imports/lib/schemas/SimpleSchemas/Organizations';
import { Practitioners } from '/imports/lib/schemas/SimpleSchemas/Practitioners';
import { Endpoints } from '/imports/lib/schemas/SimpleSchemas/Endpoints';
import { HealthcareServices } from '/imports/lib/schemas/SimpleSchemas/HealthcareServices';
import { InsurancePlans } from '/imports/lib/schemas/SimpleSchemas/InsurancePlans';
import { Networks } from '/imports/lib/schemas/SimpleSchemas/Networks';
import { Locations } from '/imports/lib/schemas/SimpleSchemas/Locations';
import { OrganizationAffiliations } from '/imports/lib/schemas/SimpleSchemas/OrganizationAffiliations';
import { PractitionerRoles } from '/imports/lib/schemas/SimpleSchemas/PractitionerRoles';
import { UdapCertificates } from '/imports/lib/schemas/SimpleSchemas/UdapCertificates';

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(payload));
}

// GET /provider-directory/stats — collection counts
WebApp.handlers.use('/provider-directory/stats', async function (req, res, next) {
  if (req.method !== 'GET') { return next(); }
  console.log('GET /provider-directory/stats');

  const returnPayload = {
    code: 200,
    data: {
      collections: {
        organizations: await Organizations.find().countAsync(),
        practitioners: await Practitioners.find().countAsync(),
        endpoints: await Endpoints.find().countAsync(),
        networks: await Networks.find().countAsync(),
        insurancePlans: await InsurancePlans.find().countAsync(),
        healthcareServices: await HealthcareServices.find().countAsync(),
        locations: await Locations.find().countAsync(),
        organizationAffiliations: await OrganizationAffiliations.find().countAsync(),
        practitionerRoles: await PractitionerRoles.find().countAsync()
      }
    }
  };

  sendJson(res, 200, returnPayload);
});

// POST /provider-directory/generateAndSignJwt — sign a UDAP software statement
WebApp.handlers.use('/provider-directory/generateAndSignJwt', async function (req, res, next) {
  if (req.method !== 'POST') { return next(); }
  console.log('POST /provider-directory/generateAndSignJwt');

  try {
    const signResult = await Meteor.callAsync('generateAndSignJwt', req.body || {});
    sendJson(res, 200, { code: 200, data: signResult });
  } catch (error) {
    console.error('[provider-directory] generateAndSignJwt error:', error);
    sendJson(res, 500, { code: 500, error: error.message });
  }
});

// POST /provider-directory/newCertificate — store a UDAP certificate
WebApp.handlers.use('/provider-directory/newCertificate', async function (req, res, next) {
  if (req.method !== 'POST') { return next(); }
  console.log('POST /provider-directory/newCertificate');

  const body = req.body || {};
  const existing = await UdapCertificates.findOneAsync({ certificate: body.certificate });
  if (!existing) {
    await UdapCertificates.insertAsync(body);
  }

  sendJson(res, 200, { code: 200 });
});
