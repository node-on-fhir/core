// /Volumes/SonicMagic/Code/honeycomb-public-release/imports/startup/client/collections.js

import { Meteor } from 'meteor/meteor';

// Import all collections
import { ActivityDefinitions } from '/imports/lib/schemas/SimpleSchemas/ActivityDefinitions';
import { AllergyIntolerances } from '/imports/lib/schemas/SimpleSchemas/AllergyIntolerances';
import { Appointments } from '/imports/lib/schemas/SimpleSchemas/Appointments';
import { ArtifactAssessments } from '/imports/lib/schemas/SimpleSchemas/ArtifactAssessments';
import { AuditEvents } from '/imports/lib/schemas/SimpleSchemas/AuditEvents';
import { Bundles } from '/imports/lib/schemas/SimpleSchemas/Bundles';
import { CarePlans } from '/imports/lib/schemas/SimpleSchemas/CarePlans';
import { CareTeams } from '/imports/lib/schemas/SimpleSchemas/CareTeams';
import { Claims } from '/imports/lib/schemas/SimpleSchemas/Claims';
import { CodeSystems } from '/imports/lib/schemas/SimpleSchemas/CodeSystems';
import { Communications } from '/imports/lib/schemas/SimpleSchemas/Communications';
import { CommunicationRequests } from '/imports/lib/schemas/SimpleSchemas/CommunicationRequests';
import { Compositions } from '/imports/lib/schemas/SimpleSchemas/Compositions';
import { Conditions } from '/imports/lib/schemas/SimpleSchemas/Conditions';
import { Consents } from '/imports/lib/schemas/SimpleSchemas/Consents';
import { Devices } from '/imports/lib/schemas/SimpleSchemas/Devices';
import { DiagnosticReports } from '/imports/lib/schemas/SimpleSchemas/DiagnosticReports';
import { DocumentReferences } from '/imports/lib/schemas/SimpleSchemas/DocumentReferences';
import { Encounters } from '/imports/lib/schemas/SimpleSchemas/Encounters';
import { Endpoints } from '/imports/lib/schemas/SimpleSchemas/Endpoints';
import { Evidences } from '/imports/lib/schemas/SimpleSchemas/Evidences';
import { ExplanationOfBenefits } from '/imports/lib/schemas/SimpleSchemas/ExplanationOfBenefits';
import { Goals } from '/imports/lib/schemas/SimpleSchemas/Goals';
import { GuidanceResponses } from '/imports/lib/schemas/SimpleSchemas/GuidanceResponses';
import { Immunizations } from '/imports/lib/schemas/SimpleSchemas/Immunizations';
import { ImagingStudies } from '/imports/lib/schemas/SimpleSchemas/ImagingStudies';
import { Libraries } from '/imports/lib/schemas/SimpleSchemas/Libraries';
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
import { NutritionOrders } from '/imports/lib/schemas/SimpleSchemas/NutritionOrders';
import { OperationOutcomes } from '/imports/lib/schemas/SimpleSchemas/OperationOutcomes';
import { Organizations } from '/imports/lib/schemas/SimpleSchemas/Organizations';
import { Observations } from '/imports/lib/schemas/SimpleSchemas/Observations';
import { Patients } from '/imports/lib/schemas/SimpleSchemas/Patients';
import { PlanDefinitions } from '/imports/lib/schemas/SimpleSchemas/PlanDefinitions';
import { Practitioners } from '/imports/lib/schemas/SimpleSchemas/Practitioners';
import { Procedures } from '/imports/lib/schemas/SimpleSchemas/Procedures';
import { Questionnaires } from '/imports/lib/schemas/SimpleSchemas/Questionnaires';
import { QuestionnaireResponses } from '/imports/lib/schemas/SimpleSchemas/QuestionnaireResponses';
import { ResearchStudies } from '/imports/lib/schemas/SimpleSchemas/ResearchStudies';
import { ResearchSubjects } from '/imports/lib/schemas/SimpleSchemas/ResearchSubjects';
import { Schedules } from '/imports/lib/schemas/SimpleSchemas/Schedules';
import { ServiceRequests } from '/imports/lib/schemas/SimpleSchemas/ServiceRequests';
import { Tasks } from '/imports/lib/schemas/SimpleSchemas/Tasks';
import { ValueSets } from '/imports/lib/schemas/SimpleSchemas/ValueSets';

// Initialize Meteor.Collections on the client
if (Meteor.isClient) {
  Meteor.Collections = {
    ActivityDefinitions,
    AllergyIntolerances,
    Appointments,
    ArtifactAssessments,
    AuditEvents,
    Bundles,
    CarePlans,
    CareTeams,
    Claims,
    CodeSystems,
    Conditions,
    Consents,
    Communications,
    CommunicationRequests,
    Compositions,
    Devices,
    DiagnosticReports,
    DocumentReferences,
    Encounters,
    Endpoints,
    Evidences,
    ExplanationOfBenefits,
    Goals,
    GuidanceResponses,
    Immunizations,
    ImagingStudies,
    Libraries,
    Lists,
    Locations,
    Medications,
    MedicationAdministrations,
    MedicationRequests,
    MedicationStatements,
    MessageHeaders,
    Measures,
    MeasureReports,
    Medias,
    NutritionOrders,
    OperationOutcomes,
    Organizations,
    Observations,
    Patients,
    PlanDefinitions,
    Practitioners,
    Procedures,
    Questionnaires,
    QuestionnaireResponses,
    ResearchStudies,
    ResearchSubjects,
    Schedules,
    ServiceRequests,
    Tasks,
    ValueSets
  };

  // Also make them available globally for console access
  window.ActivityDefinitions = ActivityDefinitions;
  window.AllergyIntolerances = AllergyIntolerances;
  window.Appointments = Appointments;
  window.ArtifactAssessments = ArtifactAssessments;
  window.AuditEvents = AuditEvents;
  window.Bundles = Bundles;
  window.CarePlans = CarePlans;
  window.CareTeams = CareTeams;
  window.Claims = Claims;
  window.CodeSystems = CodeSystems;
  window.Conditions = Conditions;
  window.Consents = Consents;
  window.Communications = Communications;
  window.CommunicationRequests = CommunicationRequests;
  window.Compositions = Compositions;
  window.Devices = Devices;
  window.DiagnosticReports = DiagnosticReports;
  window.DocumentReferences = DocumentReferences;
  window.Encounters = Encounters;
  window.Endpoints = Endpoints;
  window.Evidences = Evidences;
  window.ExplanationOfBenefits = ExplanationOfBenefits;
  window.Goals = Goals;
  window.GuidanceResponses = GuidanceResponses;
  window.Immunizations = Immunizations;
  window.ImagingStudies = ImagingStudies;
  window.Libraries = Libraries;
  window.Lists = Lists;
  window.Locations = Locations;
  window.Medications = Medications;
  window.MedicationAdministrations = MedicationAdministrations;
  window.MedicationRequests = MedicationRequests;
  window.MedicationStatements = MedicationStatements;
  window.MessageHeaders = MessageHeaders;
  window.Measures = Measures;
  window.MeasureReports = MeasureReports;
  window.Medias = Medias;
  window.NutritionOrders = NutritionOrders;
  window.OperationOutcomes = OperationOutcomes;
  window.Organizations = Organizations;
  window.Observations = Observations;
  window.Patients = Patients;
  window.PlanDefinitions = PlanDefinitions;
  window.Practitioners = Practitioners;
  window.Procedures = Procedures;
  window.Questionnaires = Questionnaires;
  window.QuestionnaireResponses = QuestionnaireResponses;
  window.ResearchStudies = ResearchStudies;
  window.ResearchSubjects = ResearchSubjects;
  window.Schedules = Schedules;
  window.ServiceRequests = ServiceRequests;
  window.Tasks = Tasks;
  window.ValueSets = ValueSets;

  console.log('Client collections initialized');
}