// server/SyntheaMethods.js
//
// rpc migration: canonical dotted names under 'synthea.*' with the legacy
// bare names as aliases (ServerConfigurationPage still calls the legacy
// names positionally). All three methods are settings-gated synthetic-data
// utilities: pre-migration they had NO auth guard — the
// settings.public.enableSyntheaDbUtils gate is the guard (settings-gated
// feature pattern), so requireAuth stays false and the gate is preserved
// first in each handler. Flagged in the migration report.

import { Meteor } from 'meteor/meteor';
import ServerMethods from '/imports/lib/ServerMethods.js';
import { Random } from 'meteor/random';
import { get } from 'lodash';

const log = (Meteor.Logger ? Meteor.Logger.for('SyntheaMethods') : console);

import { ResearchStudies } from '../imports/lib/schemas/SimpleSchemas/ResearchStudies';
import { ResearchSubjects } from '../imports/lib/schemas/SimpleSchemas/ResearchSubjects';
import { Patients } from '../imports/lib/schemas/SimpleSchemas/Patients';

ServerMethods.define('synthea.generateResearchStudies', {
  description: 'Generate synthetic ResearchStudy records for testing (settings-gated by enableSyntheaDbUtils)',
  aliases: ['generateResearchStudies'],
  // Public by PRE-MIGRATION design: guarded only by the
  // settings.public.enableSyntheaDbUtils feature gate (checked first below).
  requireAuth: false,
  positionalParams: ['count'],
  schemaObject: {
    type: 'object',
    properties: { count: { type: 'number' } }
  }
}, async function(params, context) {
  const count = get(params, 'count', 5);
  log.info('Generating Research Studies...', { count });

  if (!Meteor.settings.public.enableSyntheaDbUtils) {
    throw new Meteor.Error('not-enabled', 'Synthea DB Utils are not enabled');
  }

  const studies = [];
  const studyTitles = [
    'COVID-19 Vaccine Efficacy Study',
    'Diabetes Management Intervention Trial',
    'Hypertension Drug Comparative Effectiveness',
    'Mental Health Digital Intervention Study',
    'Post-Acute Care Transition Study',
    'Nutrition and Weight Management Trial',
    'Chronic Pain Management Study',
    'Telemedicine Effectiveness Study',
    'Medication Adherence Intervention',
    'Falls Prevention in Elderly Study'
  ];

  const phases = ['n-a', 'early-phase-1', 'phase-1', 'phase-1-phase-2', 'phase-2', 'phase-2-phase-3', 'phase-3', 'phase-4'];
  const statuses = ['active', 'administratively-completed', 'approved', 'closed-to-accrual', 'closed-to-accrual-and-intervention', 'completed', 'enrolling-by-invitation', 'not-yet-recruiting', 'recruiting'];

  for (let i = 0; i < count; i++) {
    const studyId = Random.id();
    const study = {
      _id: studyId,
      id: studyId,
      resourceType: 'ResearchStudy',
      status: statuses[Math.floor(Math.random() * statuses.length)],
      phase: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/research-study-phase',
          code: phases[Math.floor(Math.random() * phases.length)]
        }]
      },
      title: studyTitles[i % studyTitles.length],
      description: `This is a synthetic research study for ${studyTitles[i % studyTitles.length]}. Generated for testing purposes.`,
      period: {
        start: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date(Date.now() + Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      enrollment: [{
        reference: `Group/${Random.id()}`,
        display: 'Study Enrollment Group'
      }],
      principalInvestigator: {
        reference: `Practitioner/${Random.id()}`,
        display: `Dr. ${['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][Math.floor(Math.random() * 5)]}`
      }
    };

    const insertedId = await ResearchStudies.insertAsync(study);
    studies.push(insertedId);
    log.info('Created Research Study', { title: study.title });
  }

  return {
    success: true,
    message: `Generated ${count} Research Studies`,
    ids: studies
  };
});

ServerMethods.define('synthea.generateResearchSubjects', {
  description: 'Generate synthetic ResearchSubject records linked to existing patients (settings-gated by enableSyntheaDbUtils)',
  aliases: ['generateResearchSubjects'],
  // Public by PRE-MIGRATION design: guarded only by the
  // settings.public.enableSyntheaDbUtils feature gate (checked first below).
  requireAuth: false,
  phi: true,   // reads Patient records and creates subject records referencing them
  positionalParams: ['count'],
  schemaObject: {
    type: 'object',
    properties: { count: { type: 'number' } }
  }
}, async function(params, context) {
  const count = get(params, 'count', 10);
  log.info('Generating Research Subjects...', { count });

  if (!Meteor.settings.public.enableSyntheaDbUtils) {
    throw new Meteor.Error('not-enabled', 'Synthea DB Utils are not enabled');
  }

  const subjects = [];
  const statuses = ['candidate', 'eligible', 'follow-up', 'ineligible', 'not-registered', 'off-study', 'on-study', 'on-study-intervention', 'on-study-observation', 'pending-on-study', 'potential-candidate', 'screening', 'withdrawn'];

  // Get existing patients and studies
  const patients = await Patients.find({}, { limit: count }).fetchAsync();
  const studies = await ResearchStudies.find({}, { limit: Math.max(5, count / 2) }).fetchAsync();

  if (patients.length === 0) {
    throw new Meteor.Error('no-patients', 'No patients found. Please generate patients first.');
  }

  if (studies.length === 0) {
    // Generate some studies first (legacy alias — call-site rewrite is Loop 2)
    await Meteor.callAsync('generateResearchStudies', 5);
    const newStudies = await ResearchStudies.find({}, { limit: 5 }).fetchAsync();
    studies.push(...newStudies);
  }

  for (let i = 0; i < Math.min(count, patients.length); i++) {
    const subjectId = Random.id();
    const patient = patients[i];
    const study = studies[Math.floor(Math.random() * studies.length)];

    const subject = {
      _id: subjectId,
      id: subjectId,
      resourceType: 'ResearchSubject',
      status: statuses[Math.floor(Math.random() * statuses.length)],
      study: {
        reference: `ResearchStudy/${study._id || study.id}`,
        display: study.title || 'Research Study'
      },
      individual: {
        reference: `Patient/${patient._id || patient.id}`,
        display: patient.name && patient.name[0]
          ? `${get(patient, 'name[0].given[0]', '')} ${get(patient, 'name[0].family', '')}`
          : 'Patient'
      },
      period: {
        start: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      assignedArm: ['Arm A', 'Arm B', 'Control', 'Treatment'][Math.floor(Math.random() * 4)],
      actualArm: ['Arm A', 'Arm B', 'Control', 'Treatment'][Math.floor(Math.random() * 4)]
    };

    // Add consent if study is active
    if (study.status === 'active' || study.status === 'recruiting') {
      subject.consent = [{
        reference: `Consent/${Random.id()}`
      }];
    }

    const insertedId = await ResearchSubjects.insertAsync(subject);
    subjects.push(insertedId);
    log.phi('Created Research Subject for patient:', { individual: subject.individual }, { action: 'create' });
  }

  return {
    success: true,
    message: `Generated ${subjects.length} Research Subjects`,
    ids: subjects
  };
});

ServerMethods.define('synthea.clearResearchData', {
  description: 'Remove all ResearchStudy and ResearchSubject records (settings-gated by enableSyntheaDbUtils)',
  aliases: ['clearResearchData'],
  // Public by PRE-MIGRATION design: guarded only by the
  // settings.public.enableSyntheaDbUtils feature gate (checked first below).
  requireAuth: false,
  phi: true   // removes patient-linked ResearchSubject records
}, async function(params, context) {
  log.info('Clearing Research Data...');

  if (!Meteor.settings.public.enableSyntheaDbUtils) {
    throw new Meteor.Error('not-enabled', 'Synthea DB Utils are not enabled');
  }

  const studiesRemoved = await ResearchStudies.removeAsync({});
  const subjectsRemoved = await ResearchSubjects.removeAsync({});

  return {
    success: true,
    message: `Removed ${studiesRemoved} Research Studies and ${subjectsRemoved} Research Subjects`
  };
});
