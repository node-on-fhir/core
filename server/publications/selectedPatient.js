// server/publications/selectedPatient.js
//
// Patient-scoped publications. Unlike autopublish.* (which requires
// autopublishSubscriptions=true and passes the full query from the client),
// these publications are ALWAYS registered and accept only a patientId
// string. The server builds the query via FhirUtilities.addPatientFilterToQuery().
//
// Role-based resolution:
//   - PHR / patient role  → forces user.patientId (ignores client param)
//   - Practitioner / admin → uses client-supplied patientId

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

import { FhirUtilities } from '/imports/lib/FhirUtilities';

// ── Collection imports (same set as autopublish.js) ──────────────────────

import { ActivityDefinitions } from '/imports/lib/schemas/SimpleSchemas/ActivityDefinitions';
import { AllergyIntolerances } from '/imports/lib/schemas/SimpleSchemas/AllergyIntolerances';
import { Appointments } from '/imports/lib/schemas/SimpleSchemas/Appointments';
import { AuditEvents } from '/imports/lib/schemas/SimpleSchemas/AuditEvents';
import { BodyStructures } from '/imports/lib/schemas/SimpleSchemas/BodyStructures';
import { Bundles } from '/imports/lib/schemas/SimpleSchemas/Bundles';
import { ClinicalImpressions } from '/imports/lib/schemas/SimpleSchemas/ClinicalImpressions';
import { CarePlans } from '/imports/lib/schemas/SimpleSchemas/CarePlans';
import { CareTeams } from '/imports/lib/schemas/SimpleSchemas/CareTeams';
import { Communications } from '/imports/lib/schemas/SimpleSchemas/Communications';
import { Compositions } from '/imports/lib/schemas/SimpleSchemas/Compositions';
import { Conditions } from '/imports/lib/schemas/SimpleSchemas/Conditions';
import { Consents } from '/imports/lib/schemas/SimpleSchemas/Consents';
import { Devices } from '/imports/lib/schemas/SimpleSchemas/Devices';
import { DiagnosticReports } from '/imports/lib/schemas/SimpleSchemas/DiagnosticReports';
import { DocumentReferences } from '/imports/lib/schemas/SimpleSchemas/DocumentReferences';
import { Encounters } from '/imports/lib/schemas/SimpleSchemas/Encounters';
import { ExplanationOfBenefits } from '/imports/lib/schemas/SimpleSchemas/ExplanationOfBenefits';
import { Goals } from '/imports/lib/schemas/SimpleSchemas/Goals';
import { Immunizations } from '/imports/lib/schemas/SimpleSchemas/Immunizations';
import { ImagingStudies } from '/imports/lib/schemas/SimpleSchemas/ImagingStudies';
import { Lists } from '/imports/lib/schemas/SimpleSchemas/Lists';
import { Locations } from '/imports/lib/schemas/SimpleSchemas/Locations';
import { Medications } from '/imports/lib/schemas/SimpleSchemas/Medications';
import { MedicationAdministrations } from '/imports/lib/schemas/SimpleSchemas/MedicationAdministrations';
import { MedicationRequests } from '/imports/lib/schemas/SimpleSchemas/MedicationRequests';
import { MedicationStatements } from '/imports/lib/schemas/SimpleSchemas/MedicationStatements';
import { Measures } from '/imports/lib/schemas/SimpleSchemas/Measures';
import { MeasureReports } from '/imports/lib/schemas/SimpleSchemas/MeasureReports';
import { Medias } from '/imports/lib/schemas/SimpleSchemas/Medias';
import { MessageHeaders } from '/imports/lib/schemas/SimpleSchemas/MessageHeaders';
import { NutritionIntakes } from '/imports/lib/schemas/SimpleSchemas/NutritionIntakes';
import { NutritionOrders } from '/imports/lib/schemas/SimpleSchemas/NutritionOrders';
import { Observations } from '/imports/lib/schemas/SimpleSchemas/Observations';
import { Organizations } from '/imports/lib/schemas/SimpleSchemas/Organizations';
import { PlanDefinitions } from '/imports/lib/schemas/SimpleSchemas/PlanDefinitions';
import { Practitioners } from '/imports/lib/schemas/SimpleSchemas/Practitioners';
import { PractitionerRoles } from '/imports/lib/schemas/SimpleSchemas/PractitionerRoles';
import { Procedures } from '/imports/lib/schemas/SimpleSchemas/Procedures';
import { Questionnaires } from '/imports/lib/schemas/SimpleSchemas/Questionnaires';
import { QuestionnaireResponses } from '/imports/lib/schemas/SimpleSchemas/QuestionnaireResponses';
import { ResearchStudies } from '/imports/lib/schemas/SimpleSchemas/ResearchStudies';
import { ResearchSubjects } from '/imports/lib/schemas/SimpleSchemas/ResearchSubjects';
import { RiskAssessments } from '/imports/lib/schemas/SimpleSchemas/RiskAssessments';
import { Schedules } from '/imports/lib/schemas/SimpleSchemas/Schedules';
import { ServiceRequests } from '/imports/lib/schemas/SimpleSchemas/ServiceRequests';
import { SupplyDeliveries } from '/imports/lib/schemas/SimpleSchemas/SupplyDeliveries';
import { SupplyRequests } from '/imports/lib/schemas/SimpleSchemas/SupplyRequests';
import { Tasks } from '/imports/lib/schemas/SimpleSchemas/Tasks';
import { FamilyMemberHistories } from '/imports/lib/schemas/SimpleSchemas/FamilyMemberHistories';

// ── Collections map ──────────────────────────────────────────────────────

const collectionsMap = {
  'ActivityDefinitions': ActivityDefinitions,
  'AllergyIntolerances': AllergyIntolerances,
  'Appointments': Appointments,
  'AuditEvents': AuditEvents,
  'BodyStructures': BodyStructures,
  'Bundles': Bundles,
  'CarePlans': CarePlans,
  'CareTeams': CareTeams,
  'ClinicalImpressions': ClinicalImpressions,
  'Communications': Communications,
  'Compositions': Compositions,
  'Conditions': Conditions,
  'Consents': Consents,
  'Devices': Devices,
  'DiagnosticReports': DiagnosticReports,
  'DocumentReferences': DocumentReferences,
  'Encounters': Encounters,
  'ExplanationOfBenefits': ExplanationOfBenefits,
  'FamilyMemberHistories': FamilyMemberHistories,
  'Goals': Goals,
  'Immunizations': Immunizations,
  'ImagingStudies': ImagingStudies,
  'Lists': Lists,
  'Locations': Locations,
  'Medications': Medications,
  'MedicationAdministrations': MedicationAdministrations,
  'MedicationRequests': MedicationRequests,
  'MedicationStatements': MedicationStatements,
  'Measures': Measures,
  'MeasureReports': MeasureReports,
  'Medias': Medias,
  'MessageHeaders': MessageHeaders,
  'NutritionIntakes': NutritionIntakes,
  'NutritionOrders': NutritionOrders,
  'Observations': Observations,
  'Organizations': Organizations,
  'PlanDefinitions': PlanDefinitions,
  'Practitioners': Practitioners,
  'PractitionerRoles': PractitionerRoles,
  'Procedures': Procedures,
  'Questionnaires': Questionnaires,
  'QuestionnaireResponses': QuestionnaireResponses,
  'ResearchStudies': ResearchStudies,
  'ResearchSubjects': ResearchSubjects,
  'RiskAssessments': RiskAssessments,
  'Schedules': Schedules,
  'ServiceRequests': ServiceRequests,
  'SupplyDeliveries': SupplyDeliveries,
  'SupplyRequests': SupplyRequests,
  'Tasks': Tasks
};

// Resources that use non-standard patient reference paths.
// FhirUtilities.addPatientFilterToQuery already covers patient.reference
// and subject.reference, but some resources need additional transforms.
const SPECIAL_REFERENCE_RESOURCES = {
  'Appointments': 'participant.actor.reference',
  'Schedules': 'actor.0.reference'
};

// ── Helper: role precedence (same as patients.js and FhirAuth.js) ────────

function getAuthorizedRole(userRoles) {
  const authorizedRoles = ['healthcare practitioner', 'healthcare provider', 'patient'];
  if (Array.isArray(userRoles)) {
    for (const role of authorizedRoles) {
      if (userRoles.includes(role)) {
        return role;
      }
    }
  }
  return 'patient'; // default if no authorized role found
}

// ── Helper: resolve patientId based on user role ─────────────────────────

async function resolvePatientId(userId, clientPatientId) {
  if (!userId) return null;

  const user = await Meteor.users.findOneAsync({ _id: userId });
  if (!user) return null;

  // Use getAuthorizedRole pattern (same precedence as patients.js and FhirAuth.js)
  const authorizedRole = getAuthorizedRole(get(user, 'roles', []));

  // PHR / patient-only role: always use the user's own patientId
  if (authorizedRole === 'patient') {
    const userPatientId = get(user, 'profile.patientId');
    if (userPatientId) {
      return userPatientId;
    }
    // Patient user without linked patientId — cannot publish
    console.warn('[selectedPatient] Patient-role user has no profile.patientId:', userId);
    return null;
  }

  // Practitioner / admin: trust client-supplied patientId
  if (clientPatientId) {
    return clientPatientId;
  }

  return null;
}

// ── Build patient query with special-case transforms ─────────────────────

function buildPatientQuery(collectionName, resolvedPatientId) {
  const query = FhirUtilities.addPatientFilterToQuery(resolvedPatientId);

  // Special-case: Appointments use participant.actor.reference
  if (collectionName === 'Appointments' && query.$or) {
    const extraConditions = [];
    query.$or.forEach(function(condition) {
      if (condition['patient.reference']) {
        extraConditions.push({ 'participant.actor.reference': condition['patient.reference'] });
      } else if (condition['subject.reference']) {
        extraConditions.push({ 'participant.actor.reference': condition['subject.reference'] });
      }
    });
    if (extraConditions.length > 0) {
      query.$or = query.$or.concat(extraConditions);
    }
  }

  // Special-case: Schedules use actor.0.reference
  if (collectionName === 'Schedules' && query.$or) {
    const extraConditions = [];
    query.$or.forEach(function(condition) {
      if (condition['patient.reference']) {
        extraConditions.push({ 'actor.0.reference': condition['patient.reference'] });
      } else if (condition['subject.reference']) {
        extraConditions.push({ 'actor.0.reference': condition['subject.reference'] });
      }
    });
    if (extraConditions.length > 0) {
      query.$or = query.$or.concat(extraConditions);
    }
  }

  return query;
}

// ── Register publications ────────────────────────────────────────────────

const subscriptionLimit = get(Meteor, 'settings.public.defaults.subscriptionLimit', 1000);

console.log('[selectedPatient] Registering patient-scoped publications for', Object.keys(collectionsMap).length, 'collections');

Object.keys(collectionsMap).forEach(function(collectionName) {
  const collection = collectionsMap[collectionName];

  if (collection && collection._collection) {
    const publicationName = `selectedPatient.${collectionName}`;

    Meteor.publish(publicationName, async function(clientPatientId, options) {
      // Auth check
      if (!this.userId) {
        return this.ready();
      }

      // Sanitize options
      options = options || {};
      options.limit = Math.min(options.limit || subscriptionLimit, subscriptionLimit);

      if (!options.sort) {
        options.sort = { '_id': -1 };
      }

      // Resolve patient ID (role-based)
      const resolvedPatientId = await resolvePatientId(this.userId, clientPatientId);
      if (!resolvedPatientId) {
        // Approved clinician/admin roles can browse all records when no patient is selected
        const BROWSE_ALL_ROLES = ['sysadmin', 'healthcare provider', 'healthcare practitioner'];
        const user = await Meteor.users.findOneAsync({ _id: this.userId });
        const userRoles = get(user, 'roles', []);
        const canBrowseAll = Array.isArray(userRoles) && userRoles.some(function(r) { return BROWSE_ALL_ROLES.includes(r); });

        if (canBrowseAll) {
          console.log(`[selectedPatient.${collectionName}] Clinician/admin browsing all records (no patient selected)`);
          return collection.find({}, options);
        }
        return this.ready();
      }

      // Build patient-scoped query
      const query = buildPatientQuery(collectionName, resolvedPatientId);
      console.log(`[selectedPatient.${collectionName}] Publishing for patient: ${resolvedPatientId} (limit: ${options.limit})`);
      return collection.find(query, options);
    });
  }
});

console.log('[selectedPatient] All patient-scoped publications registered');
