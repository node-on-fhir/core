// /server/verify-methods.js

import { Meteor } from 'meteor/meteor';

// This file can be imported temporarily in server/main.js to verify methods
Meteor.startup(async function() {
  // Wait a bit to ensure all methods are loaded
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('\n========================================');
  console.log('VERIFYING QUESTIONNAIRE METHODS');
  console.log('========================================\n');
  
  const allMethods = Meteor.server.method_handlers || {};
  const methodNames = Object.keys(allMethods);
  
  console.log(`Total Meteor methods registered: ${methodNames.length}\n`);
  
  // Check for our specific questionnaire methods
  const questionnaireMethods = [
    'questionnaires.create',
    'questionnaires.update',
    'questionnaires.remove',
    'questionnaires.get',
    'questionnaireResponses.create',
    'questionnaireResponses.update',
    'questionnaireResponses.remove',
    'questionnaireResponses.get'
  ];
  
  console.log('Questionnaire Methods Status:');
  console.log('----------------------------');
  
  let allFound = true;
  questionnaireMethods.forEach(methodName => {
    const exists = !!allMethods[methodName];
    const status = exists ? '✓' : '✗';
    const statusText = exists ? 'REGISTERED' : 'NOT FOUND';
    console.log(`${status} ${methodName.padEnd(35)} [${statusText}]`);
    if (!exists) allFound = false;
  });
  
  console.log('\n----------------------------');
  console.log(`Result: ${allFound ? 'ALL METHODS REGISTERED ✓' : 'SOME METHODS MISSING ✗'}`);
  console.log('----------------------------\n');
  
  // Show a sample of other registered methods for comparison
  console.log('Sample of other registered methods:');
  const sampleMethods = methodNames
    .filter(name => !name.includes('questionnaire'))
    .slice(0, 10);
    
  sampleMethods.forEach(method => {
    console.log(`  - ${method}`);
  });
  
  console.log('\n========================================\n');
});