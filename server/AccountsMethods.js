import { Meteor } from 'meteor/meteor';
import { get, set } from 'lodash';

Meteor.methods({
  // These methods are commented out as they depend on accountsServer which is not globally available
  // They would need to be refactored to work with the current architecture
  
  // 'jsaccounts/validateLogout': function (accessToken) {
  //   const connection = this.connection;
  //   this.setUserId(null);
  // },
  
  // 'jsaccounts/validateLogin': function (accessToken) {
  //   const connection = this.connection;
  //   const meteorContext = this;
  //   // Implementation would need accountsServer
  //   return true;
  // },
  
  'users.updateTerminology': async function(terminology) {
    // Check if user is logged in
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to update terminology');
    }

    // Validate the terminology structure
    if (!terminology || typeof terminology !== 'object') {
      throw new Meteor.Error('invalid-data', 'Invalid terminology data');
    }

    // Ensure arrays for each terminology type
    const sanitizedTerminology = {
      snomed: Array.isArray(terminology.snomed) ? terminology.snomed : [],
      loinc: Array.isArray(terminology.loinc) ? terminology.loinc : [],
      icd10: Array.isArray(terminology.icd10) ? terminology.icd10 : []
    };

    // Update the user's profile with the terminology using Meteor v3 async API
    await Meteor.users.updateAsync(this.userId, {
      $set: {
        'profile.terminology': sanitizedTerminology
      }
    });

    console.log(`Updated terminology for user ${this.userId}: ${sanitizedTerminology.snomed.length} SNOMED, ${sanitizedTerminology.loinc.length} LOINC, ${sanitizedTerminology.icd10.length} ICD-10 codes`);
    
    return true;
  }
});  
