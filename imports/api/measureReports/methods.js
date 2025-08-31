// /imports/api/measureReports/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import { get, has, set, cloneDeep } from 'lodash';

import { MeasureReports } from '/imports/lib/schemas/SimpleSchemas/MeasureReports';

Meteor.methods({
  createMeasureReport: async function(measureReportData) {
    console.log('Creating measure report...', measureReportData);
    check(measureReportData, Object);

    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in to create measure reports');
    }

    // Build the FHIR-compliant measure report object
    let cleanMeasureReport = {
      resourceType: 'MeasureReport',
      _id: Random.id(),
      meta: {
        versionId: '1',
        lastUpdated: new Date()
      }
    };

    // Set the id to match _id for consistency
    cleanMeasureReport.id = cleanMeasureReport._id;

    // Identifier
    if (measureReportData.identifier) {
      cleanMeasureReport.identifier = [{
        use: 'official',
        value: measureReportData.identifier
      }];
    }

    // Required fields
    cleanMeasureReport.status = measureReportData.status || 'complete';
    cleanMeasureReport.type = measureReportData.type || 'individual';

    // Period (required)
    // Convert date strings to Date objects for proper storage
    let periodStart = measureReportData.periodStart || new Date().toISOString().split('T')[0];
    let periodEnd = measureReportData.periodEnd || new Date().toISOString().split('T')[0];
    
    // Ensure we have valid Date objects
    if (typeof periodStart === 'string') {
      periodStart = new Date(periodStart);
    }
    if (typeof periodEnd === 'string') {
      periodEnd = new Date(periodEnd);
    }
    
    cleanMeasureReport.period = {
      start: periodStart,
      end: periodEnd
    };

    // Measure reference
    if (measureReportData.measure || measureReportData.measureReference) {
      cleanMeasureReport.measure = measureReportData.measure || measureReportData.measureReference;
    }

    // Subject
    if (measureReportData.subjectDisplay || measureReportData.subjectReference) {
      cleanMeasureReport.subject = {
        reference: measureReportData.subjectReference || '',
        display: measureReportData.subjectDisplay || ''
      };
    }

    // Date
    if (measureReportData.date) {
      cleanMeasureReport.date = new Date(measureReportData.date);
    } else {
      cleanMeasureReport.date = new Date();
    }

    // Reporter
    if (measureReportData.reporterDisplay || measureReportData.reporterReference) {
      cleanMeasureReport.reporter = {
        reference: measureReportData.reporterReference || '',
        display: measureReportData.reporterDisplay || ''
      };
    }

    // Improvement notation
    if (measureReportData.improvementNotation) {
      cleanMeasureReport.improvementNotation = {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/measure-improvement-notation',
          code: measureReportData.improvementNotation,
          display: measureReportData.improvementNotation
        }],
        text: measureReportData.improvementNotation
      };
    }

    // Group data
    if (measureReportData.groupCode || measureReportData.populationCode || measureReportData.measureScoreValue) {
      cleanMeasureReport.group = [{
        id: Random.id()
      }];

      // Group code
      if (measureReportData.groupCode || measureReportData.groupDescription) {
        cleanMeasureReport.group[0].code = {
          coding: [{
            system: 'http://example.org/fhir/group-code',
            code: measureReportData.groupCode || 'initial-population',
            display: measureReportData.groupDescription || measureReportData.groupCode || 'Initial Population'
          }],
          text: measureReportData.groupDescription || measureReportData.groupCode || 'Initial Population'
        };
      }

      // Population
      if (measureReportData.populationCode || measureReportData.populationCount) {
        cleanMeasureReport.group[0].population = [{
          id: Random.id(),
          code: {
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/measure-population',
              code: measureReportData.populationCode || 'initial-population',
              display: measureReportData.populationCode || 'Initial Population'
            }],
            text: measureReportData.populationCode || 'Initial Population'
          },
          count: parseInt(measureReportData.populationCount) || 0
        }];
      }

      // Measure score
      if (measureReportData.measureScoreValue !== undefined) {
        cleanMeasureReport.group[0].measureScore = {
          value: parseFloat(measureReportData.measureScoreValue) || 0,
          unit: '%',
          system: 'http://unitsofmeasure.org',
          code: '%'
        };
      }

      // Stratifier
      if (measureReportData.stratifierCode || measureReportData.stratifierValue) {
        cleanMeasureReport.group[0].stratifier = [{
          id: Random.id(),
          code: [{
            coding: [{
              system: 'http://example.org/fhir/stratifier-code',
              code: measureReportData.stratifierCode || 'age-group',
              display: measureReportData.stratifierCode || 'Age Group'
            }],
            text: measureReportData.stratifierCode || 'Age Group'
          }],
          stratum: [{
            id: Random.id(),
            value: {
              coding: [{
                system: 'http://example.org/fhir/stratifier-value',
                code: measureReportData.stratifierValue || 'unknown',
                display: measureReportData.stratifierValue || 'Unknown'
              }],
              text: measureReportData.stratifierValue || 'Unknown'
            }
          }]
        }];
      }
    }

    // Validate and insert
    console.log('Clean measure report:', cleanMeasureReport);
    
    try {
      const measureReportId = await MeasureReports.insertAsync(cleanMeasureReport);
      console.log('Measure report created:', measureReportId);
      return measureReportId;
    } catch (error) {
      console.error('Error creating measure report:', error);
      throw new Meteor.Error('insert-failed', 'Failed to create measure report: ' + error.message);
    }
  },

  updateMeasureReport: async function(measureReportId, measureReportData) {
    console.log('Updating measure report:', measureReportId, measureReportData);
    check(measureReportId, String);
    check(measureReportData, Object);

    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in to update measure reports');
    }

    const existingReport = await MeasureReports.findOneAsync({_id: measureReportId});
    if (!existingReport) {
      throw new Meteor.Error('not-found', 'Measure report not found');
    }

    // Clone existing report and update fields
    let updatedReport = cloneDeep(existingReport);

    // Update meta
    if (!updatedReport.meta) {
      updatedReport.meta = {};
    }
    updatedReport.meta.lastUpdated = new Date();
    updatedReport.meta.versionId = String(parseInt(get(updatedReport, 'meta.versionId', '0')) + 1);

    // Update identifier
    if (measureReportData.identifier) {
      updatedReport.identifier = [{
        use: 'official',
        value: measureReportData.identifier
      }];
    }

    // Update required fields
    if (measureReportData.status) {
      updatedReport.status = measureReportData.status;
    }
    if (measureReportData.type) {
      updatedReport.type = measureReportData.type;
    }

    // Update period
    if (measureReportData.periodStart || measureReportData.periodEnd) {
      let periodStart = measureReportData.periodStart || get(updatedReport, 'period.start');
      let periodEnd = measureReportData.periodEnd || get(updatedReport, 'period.end');
      
      // Ensure we have valid Date objects
      if (typeof periodStart === 'string') {
        periodStart = new Date(periodStart);
      }
      if (typeof periodEnd === 'string') {
        periodEnd = new Date(periodEnd);
      }
      
      updatedReport.period = {
        start: periodStart,
        end: periodEnd
      };
    }

    // Update measure
    if (measureReportData.measure || measureReportData.measureReference) {
      updatedReport.measure = measureReportData.measure || measureReportData.measureReference;
    }

    // Update subject
    if (measureReportData.subjectDisplay !== undefined || measureReportData.subjectReference !== undefined) {
      updatedReport.subject = {
        reference: measureReportData.subjectReference || get(updatedReport, 'subject.reference', ''),
        display: measureReportData.subjectDisplay || get(updatedReport, 'subject.display', '')
      };
    }

    // Update date
    if (measureReportData.date) {
      updatedReport.date = new Date(measureReportData.date);
    }

    // Update reporter
    if (measureReportData.reporterDisplay !== undefined || measureReportData.reporterReference !== undefined) {
      updatedReport.reporter = {
        reference: measureReportData.reporterReference || get(updatedReport, 'reporter.reference', ''),
        display: measureReportData.reporterDisplay || get(updatedReport, 'reporter.display', '')
      };
    }

    // Update improvement notation
    if (measureReportData.improvementNotation !== undefined) {
      if (measureReportData.improvementNotation) {
        updatedReport.improvementNotation = {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/measure-improvement-notation',
            code: measureReportData.improvementNotation,
            display: measureReportData.improvementNotation
          }],
          text: measureReportData.improvementNotation
        };
      } else {
        delete updatedReport.improvementNotation;
      }
    }

    // Update group data
    if (!updatedReport.group) {
      updatedReport.group = [{}];
    }

    // Update group code
    if (measureReportData.groupCode !== undefined || measureReportData.groupDescription !== undefined) {
      updatedReport.group[0].code = {
        coding: [{
          system: 'http://example.org/fhir/group-code',
          code: measureReportData.groupCode || get(updatedReport, 'group[0].code.coding[0].code', 'initial-population'),
          display: measureReportData.groupDescription || measureReportData.groupCode || get(updatedReport, 'group[0].code.text', 'Initial Population')
        }],
        text: measureReportData.groupDescription || measureReportData.groupCode || get(updatedReport, 'group[0].code.text', 'Initial Population')
      };
    }

    // Update population
    if (measureReportData.populationCode !== undefined || measureReportData.populationCount !== undefined) {
      if (!updatedReport.group[0].population) {
        updatedReport.group[0].population = [{}];
      }
      
      if (measureReportData.populationCode !== undefined) {
        updatedReport.group[0].population[0].code = {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/measure-population',
            code: measureReportData.populationCode || 'initial-population',
            display: measureReportData.populationCode || 'Initial Population'
          }],
          text: measureReportData.populationCode || 'Initial Population'
        };
      }
      
      if (measureReportData.populationCount !== undefined) {
        updatedReport.group[0].population[0].count = parseInt(measureReportData.populationCount) || 0;
      }
    }

    // Update measure score
    if (measureReportData.measureScoreValue !== undefined) {
      updatedReport.group[0].measureScore = {
        value: parseFloat(measureReportData.measureScoreValue) || 0,
        unit: '%',
        system: 'http://unitsofmeasure.org',
        code: '%'
      };
    }

    // Update stratifier
    if (measureReportData.stratifierCode !== undefined || measureReportData.stratifierValue !== undefined) {
      if (!updatedReport.group[0].stratifier) {
        updatedReport.group[0].stratifier = [{}];
      }
      
      if (measureReportData.stratifierCode !== undefined) {
        updatedReport.group[0].stratifier[0].code = [{
          coding: [{
            system: 'http://example.org/fhir/stratifier-code',
            code: measureReportData.stratifierCode || 'age-group',
            display: measureReportData.stratifierCode || 'Age Group'
          }],
          text: measureReportData.stratifierCode || 'Age Group'
        }];
      }
      
      if (measureReportData.stratifierValue !== undefined) {
        if (!updatedReport.group[0].stratifier[0].stratum) {
          updatedReport.group[0].stratifier[0].stratum = [{}];
        }
        updatedReport.group[0].stratifier[0].stratum[0].value = {
          coding: [{
            system: 'http://example.org/fhir/stratifier-value',
            code: measureReportData.stratifierValue || 'unknown',
            display: measureReportData.stratifierValue || 'Unknown'
          }],
          text: measureReportData.stratifierValue || 'Unknown'
        };
      }
    }

    try {
      const updateCount = await MeasureReports.updateAsync(
        { _id: measureReportId },
        { $set: updatedReport }
      );
      console.log('Measure report updated:', updateCount);
      return updateCount;
    } catch (error) {
      console.error('Error updating measure report:', error);
      throw new Meteor.Error('update-failed', 'Failed to update measure report: ' + error.message);
    }
  },

  removeMeasureReport: async function(measureReportId) {
    console.log('Removing measure report:', measureReportId);
    check(measureReportId, String);

    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in to remove measure reports');
    }

    try {
      const removeCount = await MeasureReports.removeAsync({ _id: measureReportId });
      console.log('Measure report removed:', removeCount);
      return removeCount;
    } catch (error) {
      console.error('Error removing measure report:', error);
      throw new Meteor.Error('remove-failed', 'Failed to remove measure report: ' + error.message);
    }
  }
});