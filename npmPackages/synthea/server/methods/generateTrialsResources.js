// /Volumes/SonicMagic/Code/honeycomb-public-release/packages/synthea/server/methods/generateTrialsResources.js

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { get } from 'lodash';

const log = (Meteor.Logger ? Meteor.Logger.for('generateTrialsResources') : console);

// Get the collections from global namespace
let Patients;
let ResearchSubjects;
let ResearchStudies;

Meteor.startup(async function() {
  // Access collections from global namespace
  Patients = global.Collections ? global.Collections.Patients : null;
  ResearchSubjects = global.Collections ? global.Collections.ResearchSubjects : null;
  ResearchStudies = global.Collections ? global.Collections.ResearchStudies : null;
});

// Sample research study templates
const STUDY_TEMPLATES = [
  {
    title: 'Cardiovascular Disease Prevention Study',
    description: 'A randomized controlled trial investigating the effectiveness of lifestyle interventions in preventing cardiovascular disease',
    phase: 'phase-3',
    primaryOutcome: 'Reduction in cardiovascular events',
    category: 'interventional',
    focus: ['cardiovascular', 'prevention', 'lifestyle']
  },
  {
    title: 'Diabetes Management Trial',
    description: 'Evaluation of a new continuous glucose monitoring system combined with AI-powered insulin dosing recommendations',
    phase: 'phase-2',
    primaryOutcome: 'Improvement in HbA1c levels',
    category: 'interventional',
    focus: ['diabetes', 'glucose-monitoring', 'ai-healthcare']
  },
  {
    title: 'Mental Health Digital Intervention Study',
    description: 'Assessment of mobile app-based cognitive behavioral therapy for depression and anxiety',
    phase: 'not-applicable',
    primaryOutcome: 'Reduction in PHQ-9 and GAD-7 scores',
    category: 'behavioral',
    focus: ['mental-health', 'digital-health', 'cbt']
  },
  {
    title: 'Post-COVID Recovery Observational Study',
    description: 'Long-term follow-up of patients recovering from COVID-19 to identify persistent symptoms and recovery patterns',
    phase: 'not-applicable',
    primaryOutcome: 'Documentation of long-COVID symptoms',
    category: 'observational',
    focus: ['covid-19', 'long-covid', 'recovery']
  },
  {
    title: 'Oncology Immunotherapy Trial',
    description: 'Phase II trial of novel checkpoint inhibitor combination therapy for advanced melanoma',
    phase: 'phase-2',
    primaryOutcome: 'Objective response rate',
    category: 'interventional',
    focus: ['oncology', 'immunotherapy', 'melanoma']
  },
  {
    title: 'Pediatric Asthma Control Study',
    description: 'Effectiveness of personalized action plans and smart inhaler technology in pediatric asthma management',
    phase: 'phase-3',
    primaryOutcome: 'Reduction in emergency department visits',
    category: 'interventional',
    focus: ['pediatrics', 'asthma', 'respiratory']
  },
  {
    title: 'Alzheimer Disease Biomarker Study',
    description: 'Longitudinal study of blood-based biomarkers for early detection of Alzheimer disease',
    phase: 'not-applicable',
    primaryOutcome: 'Biomarker correlation with cognitive decline',
    category: 'observational',
    focus: ['neurology', 'alzheimers', 'biomarkers']
  },
  {
    title: 'Telehealth Effectiveness in Rural Healthcare',
    description: 'Comparative effectiveness study of telehealth versus in-person care for chronic disease management in rural populations',
    phase: 'not-applicable',
    primaryOutcome: 'Healthcare utilization and patient satisfaction',
    category: 'observational',
    focus: ['telehealth', 'rural-health', 'chronic-disease']
  }
];

// ServerMethods registry (rpc migration). Body moved into the define()
// handler; the `if (!this.userId) throw` guard is deleted in favor of the
// requireAuth default (true). phi:true — reads Patient records and creates
// ResearchSubject records referencing them. Canonical name is already the
// dotted 'synthea.generateTrialsResources' (no rename → no aliases). Uses the
// global Meteor.ServerMethods per the npmPackages exemplar.
Meteor.ServerMethods.define('synthea.generateTrialsResources', {
  description: 'Generate synthetic ResearchStudy records and convert existing patients into ResearchSubjects',
  phi: true
}, async function(params, context) {
    console.log('Starting generation of trials resources...');

    // Ensure collections are available
    if (!Patients || !ResearchSubjects || !ResearchStudies) {
      throw new Meteor.Error('collections-not-ready', 'Required collections are not available');
    }
    
    try {
      // Step 1: Get all patients
      const patients = await Patients.find({}, { 
        limit: 1000,
        fields: { 
          _id: 1, 
          id: 1, 
          name: 1, 
          gender: 1, 
          birthDate: 1,
          'address': 1,
          'identifier': 1
        } 
      }).fetchAsync();
      
      console.log(`Found ${patients.length} patients to convert to research subjects`); // phi-audit: ok
      
      if (patients.length === 0) {
        throw new Meteor.Error('no-patients', 'No patients found in the database');
      }
      
      // Step 2: Create ResearchStudy records
      const studyIds = [];
      const createdStudies = [];
      
      for (const template of STUDY_TEMPLATES) {
        const studyId = Random.id();
        const now = new Date();
        
        const researchStudy = {
          _id: studyId,
          id: studyId,
          resourceType: 'ResearchStudy',
          status: 'active',
          title: template.title,
          description: template.description,
          phase: {
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/research-study-phase',
              code: template.phase,
              display: template.phase.replace('-', ' ').toUpperCase()
            }]
          },
          category: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/research-study-category',
              code: template.category,
              display: template.category.charAt(0).toUpperCase() + template.category.slice(1)
            }]
          }],
          focus: template.focus.map(f => ({
            coding: [{
              system: 'http://example.org/research-focus',
              code: f,
              display: f.replace('-', ' ').charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')
            }]
          })),
          objective: [{
            name: 'Primary Outcome',
            type: {
              coding: [{
                system: 'http://terminology.hl7.org/CodeSystem/research-study-objective-type',
                code: 'primary',
                display: 'Primary'
              }]
            },
            description: template.primaryOutcome
          }],
          enrollment: [],
          period: {
            start: new Date(now.getFullYear(), Math.floor(Math.random() * 12), 1).toISOString(),
            end: new Date(now.getFullYear() + 2 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 12), 28).toISOString()
          },
          sponsor: {
            reference: 'Organization/example-research-org',
            display: 'Clinical Research Organization'
          },
          principalInvestigator: {
            reference: 'Practitioner/example-pi',
            display: 'Dr. Research Principal'
          },
          site: [{
            reference: 'Location/example-site',
            display: 'Research Medical Center'
          }],
          meta: {
            lastUpdated: now
          }
        };
        
        await ResearchStudies.insertAsync(researchStudy);
        studyIds.push(studyId);
        createdStudies.push(researchStudy);
        console.log(`Created ResearchStudy: ${template.title}`);
      }
      
      // Step 3: Convert patients to ResearchSubjects and randomly assign to studies
      let subjectCount = 0;
      const subjectsPerStudy = Math.ceil(patients.length / studyIds.length);
      
      for (let i = 0; i < patients.length; i++) {
        const patient = patients[i];
        const patientId = patient._id || patient.id;
        
        // Check if this patient is already a research subject
        const existingSubject = await ResearchSubjects.findOneAsync({
          'individual.reference': `Patient/${patientId}`
        });
        
        if (existingSubject) {
          log.debug('Patient is already a research subject, skipping', { patientId });
          continue;
        }
        
        // Randomly assign to a study (with some distribution)
        const studyIndex = Math.floor(i / subjectsPerStudy);
        const assignedStudyId = studyIds[Math.min(studyIndex, studyIds.length - 1)];
        const assignedStudy = createdStudies[Math.min(studyIndex, studyIds.length - 1)];
        
        // Random enrollment status
        const statuses = ['candidate', 'eligible', 'follow-up', 'ineligible', 'not-registered', 
                         'off-study', 'on-study', 'on-study-intervention', 'on-study-observation', 
                         'pending-on-study', 'potential-candidate', 'screening', 'withdrawn'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        const researchSubject = {
          _id: Random.id(),
          id: Random.id(),
          resourceType: 'ResearchSubject',
          status: randomStatus,
          study: {
            reference: `ResearchStudy/${assignedStudyId}`,
            display: assignedStudy.title
          },
          individual: {
            reference: `Patient/${patientId}`,
            display: patient.name && patient.name[0] 
              ? `${get(patient, 'name[0].family', '')}, ${get(patient, 'name[0].given[0]', '')}`.trim()
              : `Patient ${patientId}`
          },
          period: {
            start: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
          },
          assignedArm: Math.random() > 0.5 ? 'treatment' : 'control',
          actualArm: Math.random() > 0.5 ? 'treatment' : 'control',
          consent: {
            reference: `Consent/example-${Random.id()}`,
            display: 'Research Study Consent'
          },
          meta: {
            lastUpdated: new Date()
          }
        };
        
        // Add end date for some statuses
        if (['ineligible', 'off-study', 'withdrawn'].includes(randomStatus)) {
          researchSubject.period.end = new Date().toISOString();
        }
        
        await ResearchSubjects.insertAsync(researchSubject);
        subjectCount++;
        
        // Update the study's enrollment reference
        await ResearchStudies.updateAsync(
          { _id: assignedStudyId },
          { 
            $push: { 
              enrollment: {
                reference: `ResearchSubject/${researchSubject._id}`,
                display: researchSubject.individual.display
              }
            }
          }
        );
      }
      
      console.log(`Successfully created ${subjectCount} ResearchSubjects and ${studyIds.length} ResearchStudies`);
      
      return {
        success: true,
        message: `Generated ${studyIds.length} research studies and ${subjectCount} research subjects`,
        studies: studyIds.length,
        subjects: subjectCount
      };
      
    } catch (error) {
      console.error('Error generating trials resources:', error);
      throw new Meteor.Error('generation-failed', `Failed to generate trials resources: ${error.message}`);
    }
});