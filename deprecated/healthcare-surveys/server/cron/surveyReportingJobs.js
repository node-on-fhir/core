// packages/healthcare-surveys/server/cron/surveyReportingJobs.js

import { Meteor } from 'meteor/meteor';
import { SyncedCron } from 'meteor/quave:synced-cron';
import { get } from 'lodash';
import moment from 'moment';

// Import collections and methods
import { HcsComposition } from '../../lib/schemas/HcsComposition';
import { HealthcareSurveysReportingBundle } from '../../lib/schemas/HealthcareSurveysReportingBundle';

// Check if SyncedCron is enabled
const isCronEnabled = function() {
  // Check in order of priority:
  // 1. Environment variable
  if (process.env.ENABLE_SYNCED_CRON === 'true') return true;
  if (process.env.ENABLE_SYNCED_CRON === 'false') return false;
  
  // 2. Test environment check
  if (process.env.TEST_RUN === 'true') return false;
  
  // 3. Meteor settings
  if (get(Meteor.settings, 'private.enableCronAutomation') === true) return true;
  if (get(Meteor.settings, 'private.enableTaskManager') === true) return true;
  
  // Default to disabled
  return false;
};

if (isCronEnabled()) {
  // Configure SyncedCron
  SyncedCron.options = {
    log: true,
    collectionName: 'healthcareSurveysCronHistory',
    utc: false,
    collectionTTL: 172800 // 2 days in seconds
  };
  
  // Daily report generation job
  SyncedCron.add({
    name: 'Generate daily healthcare survey reports',
    schedule: function(parser) {
      // Run daily at 2 AM
      return parser.text('at 2:00 am');
    },
    job: async function() {
      console.log('Starting daily healthcare survey report generation...');
      
      try {
        // Get yesterday's date range
        const startDate = moment().subtract(1, 'day').startOf('day').toDate();
        const endDate = moment().subtract(1, 'day').endOf('day').toDate();
        
        // Find compositions created yesterday
        const compositions = await HcsComposition.findAsync({
          date: {
            $gte: startDate.toISOString(),
            $lte: endDate.toISOString()
          },
          status: 'final'
        }).fetch();
        
        console.log(`Found ${compositions.length} compositions to process`);
        
        let processed = 0;
        let errors = 0;
        
        for (const composition of compositions) {
          try {
            // Check if already reported
            const existingReport = await HealthcareSurveysReportingBundle.findOneAsync({
              'entry.resource._id': composition._id
            });
            
            if (!existingReport) {
              // Create a reporting bundle
              // This is a simplified version - in production you'd call the actual methods
              console.log(`Processing composition ${composition._id}`);
              processed++;
            }
          } catch (error) {
            console.error(`Error processing composition ${composition._id}:`, error);
            errors++;
          }
        }
        
        console.log(`Daily report generation completed. Processed: ${processed}, Errors: ${errors}`);
        return { processed, errors, total: compositions.length };
      } catch (error) {
        console.error('Error in daily report generation:', error);
        throw error;
      }
    }
  });
  
  // Weekly summary job
  SyncedCron.add({
    name: 'Generate weekly healthcare survey summary',
    schedule: function(parser) {
      // Run weekly on Mondays at 3 AM
      return parser.text('at 3:00 am on Monday');
    },
    job: async function() {
      console.log('Starting weekly healthcare survey summary...');
      
      try {
        const startDate = moment().subtract(1, 'week').startOf('week').toDate();
        const endDate = moment().subtract(1, 'week').endOf('week').toDate();
        
        // Count compositions by type
        const stats = {
          total: 0,
          byEncounterType: {},
          byStatus: {}
        };
        
        const compositions = await HcsComposition.findAsync({
          date: {
            $gte: startDate.toISOString(),
            $lte: endDate.toISOString()
          }
        }).fetch();
        
        stats.total = compositions.length;
        
        compositions.forEach(comp => {
          const status = get(comp, 'status', 'unknown');
          stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
        });
        
        console.log('Weekly summary:', stats);
        
        // TODO: Send summary report via email or store in database
        
        return stats;
      } catch (error) {
        console.error('Error in weekly summary generation:', error);
        throw error;
      }
    }
  });
  
  // Cleanup old data job
  SyncedCron.add({
    name: 'Cleanup old healthcare survey data',
    schedule: function(parser) {
      // Run daily at 4 AM
      return parser.text('at 4:00 am');
    },
    job: async function() {
      console.log('Starting healthcare survey data cleanup...');
      
      try {
        const retentionDays = get(Meteor.settings, 'private.surveyDataRetentionDays', 90);
        const cutoffDate = moment().subtract(retentionDays, 'days').toDate();
        
        // Count items to be removed
        const bundlesToRemove = await HealthcareSurveysReportingBundle.countAsync({
          _id: { $lt: cutoffDate }
        });
        
        if (bundlesToRemove > 0) {
          console.log(`Removing ${bundlesToRemove} old reporting bundles`);
          
          await HealthcareSurveysReportingBundle.removeAsync({
            _id: { $lt: cutoffDate }
          });
        }
        
        console.log('Data cleanup completed');
        return { removed: bundlesToRemove };
      } catch (error) {
        console.error('Error in data cleanup:', error);
        throw error;
      }
    }
  });
  
  // Start SyncedCron
  Meteor.startup(function() {
    console.log('Starting Healthcare Surveys cron jobs...');
    SyncedCron.start();
  });
} else {
  console.log('Healthcare Surveys cron jobs are disabled');
}