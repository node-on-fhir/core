
import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';

import moment from 'moment';
import { get } from 'lodash';

import SimpleSchema from 'simpl-schema';
import { BaseSchema, DomainResourceSchema } from 'meteor/clinical:hl7-resource-datatypes';

import {OAuthClients} from './schemas-extra/OAuthClients';
import {UdapCertificates} from './schemas-extra/UdapCertificates';


import { AllergyIntolerances } from './schemas/SimpleSchemas/AllergyIntolerances';
import { AuditEvents } from './schemas/SimpleSchemas/AuditEvents';
import { Bundles } from './schemas/SimpleSchemas/Bundles';
import { CarePlans } from './schemas/SimpleSchemas/CarePlans';
import { CareTeams } from './schemas/SimpleSchemas/CareTeams';
import { CodeSystems } from './schemas/SimpleSchemas/CodeSystems';
import { Communications } from './schemas/SimpleSchemas/Communications';
import { CommunicationRequests } from './schemas/SimpleSchemas/CommunicationRequests';
import { Compositions } from './schemas/SimpleSchemas/Compositions';
import { Consents } from './schemas/SimpleSchemas/Consents';
import { Conditions } from './schemas/SimpleSchemas/Conditions';
import { Devices } from './schemas/SimpleSchemas/Devices';
import { DiagnosticReports } from './schemas/SimpleSchemas/DiagnosticReports';
import { DocumentReferences } from './schemas/SimpleSchemas/DocumentReferences';
import { Encounters } from './schemas/SimpleSchemas/Encounters';
import { Endpoints } from './schemas/SimpleSchemas/Endpoints';
import { Goals } from './schemas/SimpleSchemas/Goals';
import { Groups } from './schemas/SimpleSchemas/Groups';
import { HealthcareServices } from './schemas/SimpleSchemas/HealthcareServices';
import { Immunizations } from './schemas/SimpleSchemas/Immunizations';
import { InsurancePlans } from './schemas/SimpleSchemas/InsurancePlans';
import { Lists } from './schemas/SimpleSchemas/Lists';
import { Locations } from './schemas/SimpleSchemas/Locations';
import { Medications } from './schemas/SimpleSchemas/Medications';
import { MedicationOrders } from './schemas/SimpleSchemas/MedicationOrders';
import { Measures } from './schemas/SimpleSchemas/Measures';
import { MeasureReports } from './schemas/SimpleSchemas/MeasureReports';
import { NutritionOrders } from './schemas/SimpleSchemas/NutritionOrders';
import { NutritionIntakes } from './schemas/SimpleSchemas/NutritionIntakes';
import { Networks } from './schemas/SimpleSchemas/Networks';
import { Observations } from './schemas/SimpleSchemas/Observations';
import { OrganizationAffiliations } from './schemas/SimpleSchemas/OrganizationAffiliations';
import { Organizations } from './schemas/SimpleSchemas/Organizations';
import { Patients } from './schemas/SimpleSchemas/Patients';
import { Practitioners } from './schemas/SimpleSchemas/Practitioners';
import { PractitionerRoles } from './schemas/SimpleSchemas/PractitionerRoles';
import { Procedures } from './schemas/SimpleSchemas/Procedures';
import { Provenances } from './schemas/SimpleSchemas/Provenances';
import { Questionnaires } from './schemas/SimpleSchemas/Questionnaires';
import { QuestionnaireResponses } from './schemas/SimpleSchemas/QuestionnaireResponses';
import { NutritionOrders } from './schemas/SimpleSchemas/NutritionOrders';
import { Restrictions } from './schemas/SimpleSchemas/Restrictions';
import { RelatedPersons } from './schemas/SimpleSchemas/RelatedPersons';
import { RiskAssessments } from './schemas/SimpleSchemas/RiskAssessments';
import { SearchParameters } from './schemas/SimpleSchemas/SearchParameters';
import { ServiceRequests } from './schemas/SimpleSchemas/ServiceRequests';
import { StructureDefinitions } from './schemas/SimpleSchemas/StructureDefinitions';
import { Subscriptions } from './schemas/SimpleSchemas/Subscriptions';
import { Tasks } from './schemas/SimpleSchemas/Tasks';
import { ValueSets } from './schemas/SimpleSchemas/ValueSets';


let collectionNames = [
        "AllergyIntolerances",
        "AuditEvents",
        "Bundles",
        "CodeSystems",
        "Conditions",
        "Consents",
        "Communications",
        "CommunicationRequests",
        "CarePlans",
        "CareTeams",
        "Devices",
        "DocumentReferences",
        "Encounters",
        "Endpoints",
        "HealthcareServices",
        "Immunizations",
        "InsurancePlans",
        "Locations",
        "Medications",
        "Measure",
        "MeasureReports",
        "Networks",
        "NutritionOrders",
        "OAuthClients",
        "Observations",
        "Organizations",
        "OrganizationAffiliations",
        "Patients",
        "Practitioners",
        "PractitionerRoles",
        "Procedures",
        "Provenances",
        "Questionnaires",
        "QuestionnaireResponses",
        "Restrictions",
        "SearchParameters",
        "StructureDefinitions",
        "Subscriptions",
        "Tasks",
        "ValueSets",
        "UdapCertificates"
    ];

let Collections = {
    AllergyIntolerances: AllergyIntolerances,
    AuditEvents: AuditEvents,
    Bundles: Bundles,
    CodeSystems: CodeSystems,
    Conditions: Conditions,
    Consents: Consents,
    Communications: Communications,
    CommunicationRequests: CommunicationRequests,
    CarePlans: CarePlans,
    CareTeams: CareTeams,
    Devices: Devices,
    DocumentReferences: DocumentReferences,
    Encounters: Encounters,
    Endpoints: Endpoints,
    HealthcareServices: HealthcareServices,
    Immunizations: Immunizations,
    InsurancePlans: InsurancePlans,
    Locations: Locations,
    Medications: Medications,
    Measures: Measures,
    MeasureReports: MeasureReports,
    Networks: Networks,
    NutritionOrders: NutritionOrders,
    OAuthClients: OAuthClients,
    Observations: Observations,
    Organizations: Organizations,
    OrganizationAffiliations: OrganizationAffiliations,
    Patients: Patients,
    Practitioners: Practitioners,
    PractitionerRoles: PractitionerRoles,
    Procedures: Procedures,
    Provenances: Provenances,
    Questionnaires: Questionnaires,
    QuestionnaireResponses: QuestionnaireResponses,
    Restrictions: Restrictions,
    SearchParameters: SearchParameters,
    StructureDefinitions: StructureDefinitions,
    Subscriptions: Subscriptions,
    Tasks: Tasks,
    ValueSets: ValueSets,
    UdapCertificates: UdapCertificates
};


Object.keys(Collections).forEach(function(collectionName){
    if(Collections[collectionName]){
        Collections[collectionName].allow({
            insert(userId, doc) {
                // // The user must be logged in and the document must be owned by the user.
                // return userId && doc.owner === userId;
    
                // // The user must be logged in.
                return userId;
            },
        
            update(userId, doc, fields, modifier) {
                // // Can only change your own documents.
                // return doc.owner === userId;
    
                // Must be logged in
                return userId;
            },
        
            remove(userId, doc) {
                // // Can only remove your own documents.
                // return doc.owner === userId;
    
                // Must be logged in
                return userId;
            },
        
            fetch: ['owner']
        });
        
        Collections[collectionName].deny({
            update(userId, doc, fields, modifier) {
                // // Can't change owners.
                // return _.contains(fields, 'owner');
    
                // Must be logged in
                return userId;
            },
        
            remove(userId, doc) {
                // Can't remove locked documents.
                return doc.locked;
            },
    
            fetch: ['locked'] // No need to fetch `owner`
        });    
    }    
});


