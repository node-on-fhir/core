
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { fetch } from 'meteor/fetch';
import { get, has } from 'lodash';

import forge from 'node-forge';

let pki = forge.pki;
import jwt from 'jsonwebtoken';

import ndjsonParser from 'ndjson-parse';

import { FhirUtilities } from '/imports/FhirUtilities';
import { AllergyIntolerances } from '/imports/lib/schemas/SimpleSchemas/AllergyIntolerances';
import { Bundles } from '/imports/lib/schemas/SimpleSchemas/Bundles';
import { CarePlans } from '/imports/lib/schemas/SimpleSchemas/CarePlans';
import { CodeSystems } from '/imports/lib/schemas/SimpleSchemas/CodeSystems';
import { Conditions } from '/imports/lib/schemas/SimpleSchemas/Conditions';
import { Communications } from '/imports/lib/schemas/SimpleSchemas/Communications';
import { CommunicationRequests } from '/imports/lib/schemas/SimpleSchemas/CommunicationRequests';
import { Devices } from '/imports/lib/schemas/SimpleSchemas/Devices';
import { Encounters } from '/imports/lib/schemas/SimpleSchemas/Encounters';
import { Endpoints } from '/imports/lib/schemas/SimpleSchemas/Endpoints';
import { Immunizations } from '/imports/lib/schemas/SimpleSchemas/Immunizations';
import { Lists } from '/imports/lib/schemas/SimpleSchemas/Lists';
import { Locations } from '/imports/lib/schemas/SimpleSchemas/Locations';
import { Medications } from '/imports/lib/schemas/SimpleSchemas/Medications';
import { MedicationOrders } from '/imports/lib/schemas/SimpleSchemas/MedicationOrders';
import { MedicationStatements } from '/imports/lib/schemas/SimpleSchemas/MedicationStatements';
import { MessageHeaders } from '/imports/lib/schemas/SimpleSchemas/MessageHeaders';
import { Measures } from '/imports/lib/schemas/SimpleSchemas/Measures';
import { MeasureReports } from '/imports/lib/schemas/SimpleSchemas/MeasureReports';
import { Organizations } from '/imports/lib/schemas/SimpleSchemas/Organizations';
import { Observations } from '/imports/lib/schemas/SimpleSchemas/Observations';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';
import { Practitioners } from '/imports/lib/schemas/SimpleSchemas/Practitioners';
import { Procedures } from '/imports/lib/schemas/SimpleSchemas/Procedures';
import { Questionnaires } from '/imports/lib/schemas/SimpleSchemas/Questionnaires';
import { QuestionnaireResponses } from '/imports/lib/schemas/SimpleSchemas/QuestionnaireResponses';
import { SearchParameters } from '/imports/lib/schemas/SimpleSchemas/SearchParameters';
import { StructureDefinitions } from '/imports/lib/schemas/SimpleSchemas/StructureDefinitions';
import { ValueSets } from '/imports/lib/schemas/SimpleSchemas/ValueSets';
import { Tasks } from '/imports/lib/schemas/SimpleSchemas/Tasks';
import { UsCoreMethods } from '../lib/UsCoreMethods';

const log = (Meteor.Logger ? Meteor.Logger.for('methods') : console);

//---------------------------------------------------------------------------
// Collections

// this is a little hacky, but it works to access our collections.
// we use to use Mongo.Collection.get(collectionName), but in Meteor 1.3, it was deprecated
// we then started using window[collectionName], but that only works on the client
// so we now take the window and 

let Collections = {};

if(Meteor.isClient){
  Collections = window;
}
if(Meteor.isServer){
  Collections.AllergyIntolerances = AllergyIntolerances;
  Collections.Bundles = Bundles;
  Collections.CarePlans = CarePlans;
  Collections.Conditions = Conditions;
  Collections.Communications = Communications;
  Collections.CommunicationRequests = CommunicationRequests;
  // CommunicationResponses dropped — no such collection in the host app (not a FHIR resource)
  Collections.Devices = Devices;
  Collections.Encounters = Encounters;
  Collections.Immunizations = Immunizations;
  Collections.Lists = Lists;
  Collections.Locations = Locations;
  Collections.Medications = Medications;
  Collections.MedicationOrders = MedicationOrders;
  Collections.MedicationStatements = MedicationStatements;
  Collections.MessageHeaders = MessageHeaders;
  Collections.Measures = Measures;
  Collections.MeasureReports = MeasureReports;
  Collections.Organizations = Organizations;
  Collections.Observations = Observations;
  Collections.Patients = Patients;
  Collections.Practitioners = Practitioners;
  Collections.Procedures = Procedures;
  Collections.Questionnaires = Questionnaires;
  Collections.QuestionnaireResponses = QuestionnaireResponses;
  Collections.Tasks = Tasks;
}


//--------------------------------------------------------------------------------
// Meteor Methods


// Provider-directory (mitre:national-directory) defines many UDAP / FHIR-infra
// methods that the host app now provides on its own (vault-server +
// hl7-fhir-data-infrastructure were absorbed into core). Registering a duplicate
// method name throws "A method named 'X' is already defined" at startup. So we
// collect the method definitions and register only the names the app does NOT
// already provide (e.g. generateCertificate, initSearchParameters,
// sendSoftwareStatement are skipped — the core versions win).
const __pdMethods = {
    initUsCore: async function(){
        console.log("Initializing US Core...");
        await UsCoreMethods.initializeValueSets();
    },
    generateCertificate: async function(){
        console.log("Generate certificate...")

        let privateKeyPem = get(Meteor, 'settings.private.x509.privateKey');
        let publicKeyPem = get(Meteor, 'settings.private.x509.publicKey');

        let privateKey = pki.privateKeyFromPem(privateKeyPem)
        let publicKey = pki.publicKeyFromPem(publicKeyPem)

        var certificatePem = "";

        if(privateKey){
            console.log('privateKey', privateKey)
            console.log('publicKey', publicKey)

            let cert = pki.createCertificate();

            cert.publicKey = publicKey;
            cert.serialNumber = '01';
            cert.validity.notBefore = new Date();
            cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

            var attrs = [{
                name: 'commonName',
                value: 'mitre.org'
                }, {
                name: 'countryName',
                value: 'US'
                }, {
                shortName: 'ST',
                value: 'Illinois'
                }, {
                name: 'localityName',
                value: 'Chicago'
                }, {
                name: 'organizationName',
                value: 'MITRE'
                }, {
                shortName: 'OU',
                value: 'MITRE'
            }];
            // cert.setSubject(attrs);
            cert.setIssuer(attrs);
            cert.sign(privateKey);

            console.log('cert', cert);

            certificatePem = pki.certificateToPem(cert);
            console.log('certificatePem', certificatePem)
        }

        return certificatePem;
    },
    generateAndSignJwt: async function(jwtPayload){
        console.log("Signing certificate...")
        console.log('jwtPayload', jwtPayload);

        let result = {};

        let privateKeyPem = get(Meteor, 'settings.private.x509.privateKey');
        console.log('privateKeyPem')   
        console.log(privateKeyPem)            

        jwt.sign(jwtPayload, privateKeyPem.trim(), {
            algorithm: 'RS256',
        }, function(error, token){
            if(error){
                console.error('error', error)
            }
            if(token){
                console.log('token', token)
                result.token = token;
            }
        });

        return result;
    },
    // hasServerKeys moved to core (imports/api/serverConfiguration/methods.js):
    // the Keys & Certs panel depends on it, and defining it only here left that
    // panel dead whenever provider-directory wasn't loaded. Load order matters —
    // the workflow server-loader runs BEFORE core method files, so a copy here
    // would register first and make core's Meteor.methods() throw on collision.
    syncLantern: async function(){
        console.log("Scanning lantern file...");

        let fileContents = await Assets.getTextAsync('data/lantern/lantern_out.ndjson');
        console.log('data/lantern/lantern_out.ndjson')
        console.log(fileContents);

        const parsedNdjson = ndjsonParser(fileContents);

        if(Array.isArray(parsedNdjson)){
            for(const fhirResource of parsedNdjson){
                // console.log(get(fhirResource, 'resourceType'));
                if(get(fhirResource, 'resourceType') === "Endpoint"){
                    if(!has(fhirResource, 'id')){
                        fhirResource.id = Random.id();
                      }
                    await Endpoints.insertAsync(fhirResource)
                }
            }
        }
        console.log('Upload completed!')
        console.log("Endpoints count: " + await Endpoints.find().countAsync())
        
    },
    syncProviderDirectory: async function(){
        console.log("Scanning provider directory file...")

        let fileContents = await Assets.getTextAsync('data/nppes/parsed-npi-records-100k.ndjson');
        console.log('data/nppes/parsed-npi-records-100k.ndjson')
        console.log(fileContents);

        const parsedNdjson = ndjsonParser(fileContents);

        if(Array.isArray(parsedNdjson)){
            for(const fhirResource of parsedNdjson){
                //console.log(get(fhirResource, 'resourceType'));
                if(get(fhirResource, 'resourceType') === "Organization"){
                    if(!await Organizations.findOneAsync({"name": get(fhirResource, "name")})){
                        await Organizations.insertAsync(fhirResource)
                    }
                } else if(get(fhirResource, 'resourceType') === "Practitioner"){
                    let name = get(fhirResource, 'name[0].text');
                    //console.log(name);
                    if(!await Practitioners.findOneAsync({"name.0.text": name})){
                        await Practitioners.insertAsync(fhirResource, {filter: false, validate: false})
                    }

                }
            }
        }
    },
    syncUpstreamDirectory: async function(options){
        console.log("Syncing upstream directory....");

        let directoryUrl = get(Meteor, 'settings.public.interfaces.upstreamDirectory.channel.endpoint');


        let responseUrl = Meteor.absoluteUrl() + 'baseR4/Subscription';
        console.log("responseUrl", responseUrl);


        let subscriptionQuery = {};
        console.log('subscriptionQuery', subscriptionQuery);

        let payload = {
            "resourceType" : "Subscription",
            "id" : Random.id(),
            "status" : "active",
            "reason" : "Back-end subscription to updates in the Organization collection for the HL7 connectathon federated directory demo.",
            "criteria" : JSON.stringify(subscriptionQuery),
            "channel" : {
              "type" : "rest-hook",
              "endpoint" : responseUrl
            }
        };

        console.log('payload', payload);

        let subscriptionUrl = directoryUrl + '/Subscription/' + get(payload, 'id');
        console.log("subscriptionUrl", subscriptionUrl);


        try {
            const response = await fetch(subscriptionUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            console.log('result', result);
        } catch (error) {
            console.error('error', error);
        }        
    },
    initCodeSystems: async function(){
        console.log("Initializing code systems....");

        if(get(Meteor, 'settings.allowInitOfData')){
            let accessibility = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/CodeSystem-accessibility.json'));
            let consent = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/CodeSystem-consent.json'));
            let credentialstatus = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/CodeSystem-credentialstatus.json'));
            let digitalcertificate = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/CodeSystem-digitalcertificate.json'));
            let ehrcharacteristics = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/CodeSystem-ehrcharacteristics.json'));
            let healthcareServiceCharacteristic = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/CodeSystem-healthcareservice-characteristic.json'));
            let healthcareServiceEligibility = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/CodeSystem-healthcareservice-eligibility.json'));
            let insuranceplan = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/CodeSystem-insuranceplan.json'));
            let languageproficiency = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/CodeSystem-languageproficiency.json'));
            let networkType = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/CodeSystem-network-type.json'));
            let organizationDemographics = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/CodeSystem-organizationdemographics.json'));
            let payerCharacteristics = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/CodeSystem-payercharacteristics.json'));
            let primarySource = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/CodeSystem-primarysource.json'));
            let usecase = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/CodeSystem-usecase.json'));
            let validation = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/CodeSystem-validation.json'));
            
            let codeSystemsArray = [
                accessibility,
                consent,
                credentialstatus,
                digitalcertificate,
                ehrcharacteristics,
                healthcareServiceCharacteristic,
                healthcareServiceEligibility,
                insuranceplan,
                languageproficiency,
                networkType,
                organizationDemographics,
                payerCharacteristics,
                primarySource,
                usecase,
                validation
            ];
    
            for(const codeSystem of codeSystemsArray){
                if(get(codeSystem, 'resourceType') === "CodeSystem"){
                    if(!await CodeSystems.findOneAsync({id: get(codeSystem, 'id')})){
                        await CodeSystems.insertAsync(codeSystem)
                    }
                }
            }
        }
    },
    initSearchParameters: async function(){
        console.log("Init search parameters....");

        let careteamCategory = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-careteam-category.json'));
        let careteamEndpoint = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-careteam-endpoint.json'));
        let careteamIdentifierAssigner = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-careteam-identifier-assigner.json'));
        let careteamIdentifier = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-careteam-identifier.json'));
        let careteamLocation = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-careteam-location.json'));
        let careteamName = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-careteam-name.json'));
        let careteamOrganization = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-careteam-organization.json'));
        let careteamParticipant = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-careteam-participant.json'));
        let careteamService = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-careteam-service.json'));
        let careteamStatus = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-careteam-status.json'));
        let careteamIntermediary = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-careteam-via-intermediary.json'));
        
        let endpointConnectionType = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-endpoint-connection-type.json'));
        let endpointIdentifierAssigner = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-endpoint-identifier-assigner.json'));
        let endpointIdentifier = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-endpoint-identifier.json'));
        let endpointMimeType = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-endpoint-mime-type.json'));
        let endpointOrganization = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-endpoint-organization.json'));
        let endpointPayloadType = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-endpoint-payload-type.json'));
        let endpointStatus = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-endpoint-status.json'));
        let endpointUsecaseStandard = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-endpoint-usecase-standard.json'));
        let endpointUsecaseType = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-endpoint-usecase-type.json'));
        let endpointViaIntermediary = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-endpoint-via-intermediary.json'));

        let healthcareServiceCharacteristic = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-healthcareservice-characteristic.json'));
        let healthcareServiceCoverageArea = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-healthcareservice-coverage-area.json'));
        let healthcareServiceEligibility = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-healthcareservice-eligibility.json'));
        let healthcareServiceEndpoint = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-healthcareservice-endpoint.json'));
        let healthcareServiceIdentifierAssigner = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-healthcareservice-identifier-assigner.json'));
        let healthcareServiceIdentifier = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-healthcareservice-identifier.json'));
        let healthcareServiceLocation = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-healthcareservice-location.json'));
        let healthcareServiceName = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-healthcareservice-name.json'));
        let healthcareServiceNewPatientNetwork = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-healthcareservice-new-patient-network.json'));
        let healthcareServiceOrganization = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-healthcareservice-new-patient.json'));
        let healthcareServiceServiceCategory = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-healthcareservice-organization.json'));
        let healthcareServiceServiceType = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-healthcareservice-service-category.json'));
        let healthcareServiceSpecialty = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-healthcareservice-service-type.json'));
        let healthcareServiceViaIntermediary = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-healthcareservice-specialty.json'));
        
        let insurancePlanAdministeredBy = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-insuranceplan-administered-by.json'));
        let insurancePlanCoverageArea = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-insuranceplan-coverage-area.json'));
        let insurancePlanCoverageBenefitType = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-insuranceplan-coverage-benefit-type.json'));
        let insurancePlanCoverageLimitValue = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-insuranceplan-coverage-limit-value.json'));
        let insurancePlanCoverageNetwork = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-insuranceplan-coverage-network.json'));
        let insurancePlanCoverageType = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-insuranceplan-coverage-type.json'));
        let insurancePlanEndpoint = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-insuranceplan-endpoint.json'));
        let insurancePlanGeneralCostGroupSize = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-insuranceplan-general-cost-groupsize.json'));
        let insurancePlanGeneralCostType = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-insuranceplan-general-cost-type.json'));
        let insurancePlanGeneralCostValue = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-insuranceplan-general-cost-value.json'));
        let insurancePlanIdentifier = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-insuranceplan-identifier.json'));
        let insurancePlanName = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-insuranceplan-name.json'));
        let insurancePlanNetwork = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-insuranceplan-network.json'));
        let insurancePlanOwnedBy = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-insuranceplan-owned-by.json'));
        let insurancePlanPlanCoverageArea = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-insuranceplan-plan-coverage-area.json'));
        let insurancePlanPlanIdentifier = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-insuranceplan-plan-identifier.json'));
        let insurancePlanPlanNetwork = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-insuranceplan-plan-network.json'));
        let insurancePlanPlanType = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-insuranceplan-plan-type.json'));
        let insurancePlanSpecificCostBenefitType = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-insuranceplan-specific-cost-benefit-type.json'));
        let insurancePlanSpecificCostCategory = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-insuranceplan-specific-cost-category.json'));
        let insurancePlanSpecificCostCostType = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-insuranceplan-specific-cost-cost-type.json'));
        let insurancePlanSpecificCostCostValue = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-insuranceplan-specific-cost-value.json'));
        let insurancePlanStatus = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-insuranceplan-status.json'));
        let insurancePlanType = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-insuranceplan-type.json'));

        let locationAccessibility = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-location-accessibility.json'));
        let locationAddress = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-location-address.json'));
        let locationContains = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-location-contains.json'));
        let locationEndpoint = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-location-endpoint.json'));
        let locationIdentifierAssigner = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-location-identifier-assigner.json'));
        let locationIdentifier = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-location-identifier.json'));
        let locationNewPatientNetwork = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-location-new-patient-network.json'));
        let locationNewPatient = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-location-new-patient.json'));
        let locationOrganization = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-location-organization.json'));
        let locationPartOf = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-location-partof.json'));
        let locationStatus = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-location-status.json'));
        let locationType = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-location-type.json'));
        let locationViaIntermediary = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-location-via-intermediary.json'));

        let organizationAddressCity = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-organization-address-city.json'));
        let organizationAddressCountry = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-organization-address-country.json'));
        let organizationAddressPostalCode = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-organization-address-postalcode.json'));
        let organizationAddressState = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-organization-address-state.json'));
        let organizationAddress = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-organization-address.json'));
        let organizationCoverageArea = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-organization-coverage-area.json'));
        let organizationEndpoint = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-organization-endpoint.json'));
        let organizationIdentifierAssigner = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-organization-identifier-assigner.json'));
        let organizationIdentifier = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-organization-identifier.json'));
        let organizationName = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-organization-name.json'));
        let organizationPartOf = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-organization-partof.json'));
        let organizationQualificationCode = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-organization-qualification-code.json'));
        let organizationQualificaitonIssuer = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-organization-qualification-issuer.json'));
        let organizationQualificationStatus = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-organization-qualification-status.json'));
        let organizationQualificationWhereValidCode = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-organization-qualification-wherevalid-code.json'));
        let organizationQualificationWhereValidLocation = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-organization-qualification-wherevalid-location.json'));
        let organizationType = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-organization-type.json'));
        let organizationViaIntermediary = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-organization-via-intermediary.json'));

        let organizationAffiliationEndpoint = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-organizationaffiliation-endpoint.json'));
        let organizationAffiliationIdentifierAssigner = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-organizationaffiliation-identifier-assigner.json'));
        let organizationAffiliationIdentifier = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-organizationaffiliation-identifier.json'));
        let organizationAffiliationLocation = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-organizationaffiliation-location.json'));
        let organizationAffiliationNetwork = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-organizationaffiliation-network.json'));
        let organizationAffiliationParticipatingOrganization = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-organizationaffiliation-participating-organization.json'));
        let organizationAffiliationPrimaryOrganization = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-organizationaffiliation-primary-organization.json'));
        let organizationAffiliationRole = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-organizationaffiliation-role.json'));
        let organizationAffiliationService = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-organizationaffiliation-service.json'));
        let organizationAffiliationSpecialty = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-organizationaffiliation-specialty.json'));
        let organizationAffiliationViaIntermediary = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-organizationaffiliation-via-intermediary.json'));

        let practitionerEndpoint = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-practitioner-endpoint.json'));
        let practitionerFamilyName = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-practitioner-family-name.json'));
        let practitionerGivenName = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-practitioner-given-name.json'));
        let practitionerIdentifierAssigner = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-practitioner-identifier-assigner.json'));
        let practitionerIdentifier = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-practitioner-identifier.json'));
        let practitionerName = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-practitioner-name.json'));
        let practitionerPhonetic = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-practitioner-phonetic.json'));
        let practitionerQualificationCode = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-practitioner-qualification-code.json'));
        let practitionerQualificationIssuer = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-practitioner-qualification-issuer.json'));
        let practitionerQualificationPeriod = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-practitioner-qualification-period.json'));
        let practitionerQualificaitonStatus = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-practitioner-qualification-status.json'));
        let practitionerQualificationWhereValidCode = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-practitioner-qualification-wherevalid-code.json'));
        let practitionerQualificationWhereValidLocation = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-practitioner-qualification-wherevalid-location.json'));
        let practitionerViaIntermediary = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-practitioner-via-intermediary.json'));

        let practitionerRoleEndpoint = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-practitionerrole-endpoint.json'));
        let practitionerRoleIdentifierAssigner = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-practitionerrole-identifier-assigner.json'));
        let practitionerRoleIdentifier = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-practitionerrole-identifier.json'));
        let practitionerRoleLocation = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-practitionerrole-location.json'));
        let practitionerRoleNetwork = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-practitionerrole-network.json'));
        let practitionerRoleNewPatientNetwork = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-practitionerrole-new-patient-network.json'));
        let practitionerRoleNewPatient = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-practitionerrole-new-patient.json'));
        let practitionerRoleOrganization = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-practitionerrole-organization.json'));
        let practitionerRolePractitioner = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-practitionerrole-practitioner.json'));
        let practitionerRoleQualificationCode = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-practitionerrole-qualification-code.json'));
        let practitionerRoleQualificationIssuer = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-practitionerrole-qualification-issuer.json'));
        let practitionerRoleQualificationStatus = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-practitionerrole-qualification-status.json'));
        let practitionerRoleQualificationWhereValidCode = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-practitionerrole-qualification-wherevalid-code.json'));
        let practitionerRoleQualificationWhereValidLocation = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-practitionerrole-qualification-wherevalid-location.json'));
        let practitionerRoleRole = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-practitionerrole-role.json'));
        let practitionerRoleService = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-practitionerrole-service.json'));
        let practitionerRoleSpecialty = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-practitionerrole-specialty.json'));
        let practitionerRoleViaIntermediary = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-practitionerrole-via-intermediary.json'));
        
        let verificationResultAttestationMethod = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-verificationresult-attestation-method.json'));
        let verificationResultAttestationOnBehalfOf = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-verificationresult-attestation-onbehalfof.json'));
        let verificationResultWho = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-verificationresult-attestation-who.json'));
        let verificationResultPrimarySourceDate = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-verificationresult-primarysource-date.json'));
        let verificationResultPrimarySourceType = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-verificationresult-primarysource-type.json'));
        let verificationResultPrimarySourceWho = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-verificationresult-primarysource-who.json'));
        let verificationResultStatus = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-verificationresult-status-date.json'));
        let verificationResultTarget = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-verificationresult-target.json'));
        let verificationResultValidationStatus = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-verificationresult-validation-status.json'));
        let verificationResultValidatorOrganization = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/SearchParameter-verificationresult-validator-organization.json'));
        
        let searchParametersArray = [
            careteamCategory,
            careteamEndpoint,
            careteamIdentifierAssigner,
            careteamIdentifier,
            careteamLocation,
            careteamName,
            careteamOrganization,
            careteamParticipant,
            careteamService,
            careteamStatus,
            careteamIntermediary,
        
            endpointConnectionType,
            endpointIdentifierAssigner,
            endpointIdentifier,
            endpointMimeType,
            endpointOrganization,
            endpointPayloadType,
            endpointStatus,
            endpointUsecaseStandard,
            endpointUsecaseType,
            endpointViaIntermediary,

            healthcareServiceCharacteristic,
            healthcareServiceCoverageArea,
            healthcareServiceEligibility,
            healthcareServiceEndpoint,
            healthcareServiceIdentifierAssigner,
            healthcareServiceIdentifier,
            healthcareServiceLocation,
            healthcareServiceName,
            healthcareServiceNewPatientNetwork,
            healthcareServiceOrganization,
            healthcareServiceServiceCategory,
            healthcareServiceServiceType,
            healthcareServiceSpecialty,
            healthcareServiceViaIntermediary,
        
            insurancePlanAdministeredBy,
            insurancePlanCoverageArea,
            insurancePlanCoverageBenefitType,
            insurancePlanCoverageLimitValue,
            insurancePlanCoverageNetwork,
            insurancePlanCoverageType,
            insurancePlanEndpoint,
            insurancePlanGeneralCostGroupSize,
            insurancePlanGeneralCostType,
            insurancePlanGeneralCostValue,
            insurancePlanIdentifier,
            insurancePlanName,
            insurancePlanNetwork,
            insurancePlanOwnedBy,
            insurancePlanPlanCoverageArea,
            insurancePlanPlanIdentifier,
            insurancePlanPlanNetwork,
            insurancePlanPlanType,
            insurancePlanSpecificCostBenefitType,
            insurancePlanSpecificCostCategory,
            insurancePlanSpecificCostCostType,
            insurancePlanSpecificCostCostValue,
            insurancePlanStatus,
            insurancePlanType,

            locationAccessibility,
            locationAddress,
            locationContains,
            locationEndpoint,
            locationIdentifierAssigner,
            locationIdentifier,
            locationNewPatientNetwork,
            locationNewPatient,
            locationOrganization,
            locationPartOf,
            locationStatus,
            locationType,
            locationViaIntermediary,

            organizationAddressCity,
            organizationAddressCountry,
            organizationAddressPostalCode,
            organizationAddressState,
            organizationAddress,
            organizationCoverageArea,
            organizationEndpoint,
            organizationIdentifierAssigner,
            organizationIdentifier,
            organizationName,
            organizationPartOf,
            organizationQualificationCode,
            organizationQualificaitonIssuer,
            organizationQualificationStatus,
            organizationQualificationWhereValidCode,
            organizationQualificationWhereValidLocation,
            organizationType,
            organizationViaIntermediary,

            organizationAffiliationEndpoint,
            organizationAffiliationIdentifierAssigner,
            organizationAffiliationIdentifier,
            organizationAffiliationLocation,
            organizationAffiliationNetwork,
            organizationAffiliationParticipatingOrganization,
            organizationAffiliationPrimaryOrganization,
            organizationAffiliationRole,
            organizationAffiliationService,
            organizationAffiliationSpecialty,
            organizationAffiliationViaIntermediary,

            practitionerEndpoint,
            practitionerFamilyName,
            practitionerGivenName,
            practitionerIdentifierAssigner,
            practitionerIdentifier,
            practitionerName,
            practitionerPhonetic,
            practitionerQualificationCode,
            practitionerQualificationIssuer,
            practitionerQualificationPeriod,
            practitionerQualificaitonStatus,
            practitionerQualificationWhereValidCode,
            practitionerQualificationWhereValidLocation,
            practitionerViaIntermediary,

            practitionerRoleEndpoint,
            practitionerRoleIdentifierAssigner,
            practitionerRoleIdentifier,
            practitionerRoleLocation,
            practitionerRoleNetwork,
            practitionerRoleNewPatientNetwork,
            practitionerRoleNewPatient,
            practitionerRoleOrganization,
            practitionerRolePractitioner,
            practitionerRoleQualificationCode,
            practitionerRoleQualificationIssuer,
            practitionerRoleQualificationStatus,
            practitionerRoleQualificationWhereValidCode,
            practitionerRoleQualificationWhereValidLocation,
            practitionerRoleRole,
            practitionerRoleService,
            practitionerRoleSpecialty,
            practitionerRoleViaIntermediary,
        
            verificationResultAttestationMethod,
            verificationResultAttestationOnBehalfOf,
            verificationResultWho,
            verificationResultPrimarySourceDate,
            verificationResultPrimarySourceType,
            verificationResultPrimarySourceWho,
            verificationResultStatus,
            verificationResultTarget,
            verificationResultValidationStatus,
            verificationResultValidatorOrganization        
        ]


        for(const searchParameter of searchParametersArray){
            if(get(searchParameter, 'resourceType') === "SearchParameter"){
                if(!await SearchParameters.findOneAsync({id: get(searchParameter, 'id')})){
                    await SearchParameters.insertAsync(searchParameter, {filter: false, validate: false})
                }
            }
        }
    },
    initStructureDefinitions: async function(){
        console.log("Init structure definitions....");

        let structureDefinitionAccessibility = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-accessibility.json'));
        let structureDefinitionCareTeamAlias = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-careteam-alias.json'));
        let structureDefinitionCommunicationProficiency = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-communication-proficiency.json'));
        let structureDefinitionContactPointAvailableTime = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-contactpoint-availabletime.json'));
        let structureDefinitionContactPointViaIntermediary = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-contactpoint-viaintermediary.json'));
        let structureDefinitionDigitalCertificate = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-digitalcertificate.json'));
        let structureDefinitionEhr = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-ehr.json'));
        let structureDefinitionEndpointRank = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-endpoint-rank.json'));
        let structureDefinitionEndpointReference = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-endpoint-reference.json'));
        let structureDefinitionEndpointUseCase = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-endpoint-usecase.json'));
        let structureDefinitionHealthcareServiceReference = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-healthcareservice-reference.json'));
        let structureDefinitionIdentifierStatus = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-identifier-status.json'));
        let structureDefinitionInsurancePlanReference = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-insuranceplan-reference.json'));
        let structureDefinitionLocationReference = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-location-reference.json'));
        let structureDefinitionNetworkReference = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-network-reference.json'));
        let structureDefinitionNewPatientProfile = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-newpatientprofile.json'));
        let structureDefinitionNewPatients = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-newpatients.json'));
        let structureDefinitionOrgAliasPeriod = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-org-alias-period.json'));
        let structureDefinitionOrgAliasType = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-org-alias-type.json'));
        let structureDefinitionOrgDescription = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-org-description.json'));
        let structureDefinitionPractitionerQualification = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-practitioner-qualification.json'));
        let structureDefinitionQualification = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-qualification.json'));
        let structureDefinitionUsageRestriction = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-usage-restriction.json'));
        let structureDefinitionVhdirCareTeam = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-vhdir-careteam.json'));
        let structureDefinitionVhdirEndpoint = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-vhdir-endpoint.json'));
        let structureDefinitionVhdirHealthcareService = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-vhdir-healthcareservice.json'));
        let structureDefinitionVhdirInsurancePlan = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-vhdir-insuranceplan.json'));
        let structureDefinitionVhdirLocation = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-vhdir-location.json'));
        let structureDefinitionVhdirNetwork = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-vhdir-network.json'));
        let structureDefinitionVhdirOrganization = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-vhdir-organization.json'));
        let structureDefinitionVhdirOrganizationAffiliation = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-vhdir-organizationaffiliation.json'));
        let structureDefinitionVhdirPractitioner = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-vhdir-practitioner.json'));
        let structureDefinitionVhdirPractitionerRole = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-vhdir-practitionerrole.json'));
        let structureDefinitionVhdirRestriction = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-vhdir-restriction.json'));
        let structureDefinitionVhdirValidation = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/StructureDefinition-vhdir-validation.json'));

        let structureDefinitionsArray = [
            structureDefinitionAccessibility,
            structureDefinitionCareTeamAlias,
            structureDefinitionCommunicationProficiency,
            structureDefinitionContactPointAvailableTime,
            structureDefinitionContactPointViaIntermediary,
            structureDefinitionDigitalCertificate,
            structureDefinitionEhr,
            structureDefinitionEndpointRank,
            structureDefinitionEndpointReference,
            structureDefinitionEndpointUseCase,
            structureDefinitionHealthcareServiceReference,
            structureDefinitionIdentifierStatus,
            structureDefinitionInsurancePlanReference,
            structureDefinitionLocationReference,
            structureDefinitionNetworkReference,
            structureDefinitionNewPatientProfile,
            structureDefinitionNewPatients,
            structureDefinitionOrgAliasPeriod,
            structureDefinitionOrgAliasType,
            structureDefinitionOrgDescription,
            structureDefinitionPractitionerQualification,
            structureDefinitionQualification,
            structureDefinitionUsageRestriction,
            structureDefinitionVhdirCareTeam,
            structureDefinitionVhdirEndpoint,
            structureDefinitionVhdirHealthcareService,
            structureDefinitionVhdirInsurancePlan,
            structureDefinitionVhdirLocation,
            structureDefinitionVhdirNetwork,
            structureDefinitionVhdirOrganization,
            structureDefinitionVhdirOrganizationAffiliation,
            structureDefinitionVhdirPractitioner,
            structureDefinitionVhdirPractitionerRole,
            structureDefinitionVhdirRestriction,
            structureDefinitionVhdirValidation
        ];        

        for(const structureDefinition of structureDefinitionsArray){
            if(get(structureDefinition, 'resourceType') === "StructureDefinition"){
                if(!await StructureDefinitions.findOneAsync({id: get(structureDefinition, 'id')})){
                    await StructureDefinitions.insertAsync(structureDefinition)
                }
            }
        }
    },
    initValueSets: async function(){
        console.log("Init value sets....");

        let valueSetAccessibility = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-accessibility.json'));
        let valueSetAliasType = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-aliastype.json'));
        let valueSetAttestationMethod = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-attestationmethod.json'));
        let valueSetBenefitType = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-benefit-type.json'));
        let valueSetCertificationEdition = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-certificationedition.json'));
        let valueSetConsent = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-consent.json'));
        let valueSetCoverageType = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-coverage-type.json'));
        let valueSetDigitalCertificateStandard = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-digitalcertificatestandard.json'));
        let valueSetDigitalCertificateTrustFramework = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-digitalcertificatetrustframework.json'));
        let valueSetDigitalCertificateType = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-digitalcertificatetype.json'));
        let valueSetDigitalCertificateUse = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-digitalcertificateuse.json'));
        let valueSetExternalValidationType = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-externalvalidationtype.json'));
        let valueSetFailureAction = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-failureaction.json'));
        let valueSetHealthcareServiceCharacteristic = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-healthcareservice-characteristic.json'));
        let valueSetHealthcareServiceEligibility = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-healthcareservice-eligibility.json'));
        let valueSetIdentifierType = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-identifier-type.json'));
        let valueSetIdentifierStatus = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-identifierstatus.json'));
        let valueSetInsurancePlanType = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-insuranceplan-type.json'));
        let valueSetInsurancePlanBenefitCostType = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-insuranceplanbenefitcosttype.json'));
        let valueSetInsurancePlanBenefitType = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-insuranceplanbenefittype.json'));
        let valueSetInsurancePlanCostCategory = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-insuranceplancostcategory.json'));
        let valueSetInsurancePlanCostQualifier = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-insuranceplancostqualifier.json'));
        let valueSetInsurancePlanCostType = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-insuranceplancosttype.json'));
        let valueSetInsurancePlanGroupSize = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-insuranceplangroupsize.json'));
        let valueSetLanguageProficiency = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-languageproficiency.json'));
        let valueSetLimitUnit = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-limit-unit.json'));
        let valueSetNetworkType = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-network-type.json'));
        let valueSetPatientAccess = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-patientaccess.json'));
        let valueSetPlanType = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-plan-type.json'));
        let valueSetPrimarySourceFailureAction = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-primarysourcefailureaction.json'));
        let valueSetPrimarySourcePush = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-primarysourcepush.json'));
        let valueSetPrimarySourcePushType = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-primarysourcepushtype.json'));
        let valueSetPrimarySourceType = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-primarysourcetype.json'));
        let valueSetPrimarySourceValidationProcess = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-primarysourcevalidationprocess.json'));
        let valueSetPrimarySourceValidationStatus = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-primarysourcevalidationstatus.json'));
        let valueSetQualificationStatus = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-qualificationstatus.json'));
        let valueSetUseCaseType = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-usecasetype.json'));
        let valueSetValidationNeed = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-validationneed.json'));
        let valueSetValidationProcess = JSON.parse(await Assets.getTextAsync('data/vhdir-definitions/ValueSet-validationprocess.json'));

        let valueSetsArray = [
            valueSetAccessibility,
            valueSetAliasType,
            valueSetAttestationMethod,
            valueSetBenefitType,
            valueSetCertificationEdition,
            valueSetConsent,
            valueSetCoverageType,
            valueSetDigitalCertificateStandard,
            valueSetDigitalCertificateTrustFramework,
            valueSetDigitalCertificateType,
            valueSetDigitalCertificateUse,
            valueSetExternalValidationType,
            valueSetFailureAction,
            valueSetHealthcareServiceCharacteristic,
            valueSetHealthcareServiceEligibility,
            valueSetIdentifierType,
            valueSetIdentifierStatus,
            valueSetInsurancePlanType,
            valueSetInsurancePlanBenefitCostType,
            valueSetInsurancePlanBenefitType,
            valueSetInsurancePlanCostCategory,
            valueSetInsurancePlanCostQualifier,
            valueSetInsurancePlanCostType,
            valueSetInsurancePlanGroupSize,
            valueSetLanguageProficiency,
            valueSetLimitUnit,
            valueSetNetworkType,
            valueSetPatientAccess,
            valueSetPlanType,
            valueSetPrimarySourceFailureAction,
            valueSetPrimarySourcePush,
            valueSetPrimarySourcePushType,
            valueSetPrimarySourceType,
            valueSetPrimarySourceValidationProcess,
            valueSetPrimarySourceValidationStatus,
            valueSetQualificationStatus,
            valueSetUseCaseType,
            valueSetValidationNeed,
            valueSetValidationProcess    
        ];
        
        for(const valueSet of valueSetsArray){
            if(get(valueSet, 'resourceType') === "ValueSet"){
                if(!await ValueSets.findOneAsync({id: get(valueSet, 'id')})){
                    await ValueSets.insertAsync(valueSet, {filter: false, validate: false})
                }
            }
        }
    },
    fetchValueSetFromNlm: async function(options){
        console.log('fetchValueSetFromNlm', options);

        let valueSetId = "2.16.840.1.114222.4.11.1066";
        let methodResult = null;

        let nlmApiKey = get(Meteor, 'settings.private.nationalLibraryOfMedicine.apiKey', '')

        const response = await fetch("https://cts.nlm.nih.gov/fhir/ValueSet/" + valueSetId + "/$expand", {
            headers: {
                'Authorization': "apikey:" + nlmApiKey
            }
        });
        return await response.json();

        // return methodResult;
    },
    fetchWellKnownUdap: async function(wellKnownUdapUrl){
        console.log('fetchWellKnownUdap', wellKnownUdapUrl);

        const response = await fetch(wellKnownUdapUrl);
        return await response.json();
    },
    sendSoftwareStatement: async function(options){
        console.log('fetchWellKnownUdap', options);

        const response = await fetch(options.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(options.data)
        });
        return await response.json();
    },
    fetchDefaultDirectoryQuery: async function(){

        let upstreamDirectory = get(Meteor, 'settings.public.interfaces.upstreamDirectory.channel.endpoint', '');
        let defaultDirectoryQuery = get(Meteor, 'settings.public.interfaces.upstreamDirectory.channel.path', '');

        
        async function fetchData(upstreamDirectory, path){
            try {
                const response = await fetch(upstreamDirectory + path + "&_count=10000");
                const parsedContent = await response.json();
                
                if(parsedContent){
                    log.debug('fetchDefaultDirectoryQuery Bundle total', { total: get(parsedContent, 'total') });
                    if(Array.isArray(parsedContent.entry)){
                        log.debug('fetchDefaultDirectoryQuery Bundle entry count', { count: parsedContent.entry.length });
    
                        if(get(parsedContent, 'resourceType') === "Bundle"){
                            console.log('Received a Bundle to proxy insert.') // phi-audit: ok
                            if(Array.isArray(parsedContent.entry)){
                                // looping through each of the Bundle entries
                                for(const proxyInsertEntry of parsedContent.entry){
                                    if(get(proxyInsertEntry, 'resource')){
                                        // we are running this, assuming that PubSub is in place and synchronizing data cursors
                                        log.debug('ProxyInsert received request', { resourceType: get(proxyInsertEntry, 'resource.resourceType') })
                            
                                        let response = false;
                                        // console.log('Collections', Collections)
                                        
                                        // console.log('FhirUtilities.pluralizeResourceName: ' + FhirUtilities.pluralizeResourceName(get(proxyInsertEntry, 'resource.resourceType')))
                                        // the cursor appears to exist
                                        if(typeof Collections[FhirUtilities.pluralizeResourceName(get(proxyInsertEntry, 'resource.resourceType'))] === "object"){
                            
                                            // there doesnt seem to be a pre-existing record
                                            if(!await Collections[FhirUtilities.pluralizeResourceName(get(proxyInsertEntry, 'resource.resourceType'))].findOneAsync({_id: proxyInsertEntry.resource._id})){
                                                console.log('Couldnt find record.  Inserting.')
                            
                                                // lets try to insert the record
                                                try {
                                                    response = await Collections[FhirUtilities.pluralizeResourceName(get(proxyInsertEntry, 'resource.resourceType'))].insertAsync(proxyInsertEntry.resource, {validate: false, filter: false});
                                                } catch(error) {
                                                    log.error('ProxyInsert insert error', { error: error?.message })
                                                }
                                            } else {
                                                console.log('Found a pre-existing copy of the record.  Thats weird and probably shouldnt be happening.');
                                            }
                                        } else {
                                            console.log('Cursor doesnt appear to exist');
                                        }
                                    } else {
                                        console.log('Received a request for a proxy insert, but no FHIR resource was attached to the received parameters object!'); // phi-audit: ok
                                    }
                                }
                            } else {
                                console.log("Bundle does not seem to have an array of entries.") // phi-audit: ok
                            }
                        } else {
                            // just a single resource, no need to loop through anything
                    
                            if(typeof Collections[FhirUtilities.pluralizeResourceName(get(parsedContent, 'resource.resourceType'))] === "object"){
                    
                                // there doesnt seem to be a pre-existing record
                                if(!await Collections[FhirUtilities.pluralizeResourceName(get(parsedContent, 'resource.resourceType'))].findOneAsync({_id: parsedContent.resource._id})){
                                    log.debug('Inserting record', { resourceType: FhirUtilities.pluralizeResourceName(get(parsedContent, 'resource.resourceType')) })
                        
                                    // lets try to insert the record
                                    try {
                                        await Collections[FhirUtilities.pluralizeResourceName(get(parsedContent, 'resource.resourceType'))].insertAsync(parsedContent.resource, {validate: false, filter: false});
                                    } catch(error) {
                                        log.error('ProxyInsert insert error (single resource)', { error: error?.message })
                                    }
                                } else {
                                    console.log('Found a pre-existing copy of the record.  Thats weird and probably shouldnt be happening.');
                                }
                            } else {
                                console.log('Cursor doesnt appear to exist');
                            }
                        }  
                    }  
                }
            } catch(error) {
                console.error('error', error)
            }
        }


        console.log('------------------------------------------');
        console.log('Fetch Default Query');
        console.log('');
        console.log('FHIR Server Base: ', upstreamDirectory);    
        console.log('Default Query:    ', defaultDirectoryQuery);
        console.log('');

        let paths = get(Meteor, 'settings.public.interfaces.upstreamDirectory.channel.paths');
        if(Array.isArray(paths)){
            for(const path of paths){
                await fetchData(upstreamDirectory, path);
            }
        } else {
            await fetchData(upstreamDirectory, defaultDirectoryQuery);
        }
    }
};

// Register only methods the app hasn't already defined (avoid collisions with the
// core UDAP / search-parameter / vault-server methods).
const __existingHandlers = (Meteor.server && Meteor.server.method_handlers) || {};
const __toRegister = {};
Object.keys(__pdMethods).forEach(function(name){
  if (__existingHandlers[name]) {
    console.log('[provider-directory] skipping already-defined method:', name);
  } else {
    __toRegister[name] = __pdMethods[name];
  }
});
Meteor.methods(__toRegister);