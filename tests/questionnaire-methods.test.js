// /tests/questionnaire-methods.test.js

import { Meteor } from 'meteor/meteor';

// Simple test to verify if Meteor methods are registered
console.log('========================================');
console.log('Checking Meteor Methods Registration');
console.log('========================================');

// Get all registered methods
const allMethods = Meteor.server.method_handlers || {};
const methodNames = Object.keys(allMethods);

console.log(`Total methods registered: ${methodNames.length}`);
console.log('');

// Check for questionnaire-related methods
console.log('Questionnaire Methods:');
const questionnaireMethods = methodNames.filter(name => 
  name.toLowerCase().includes('questionnaire')
);

if (questionnaireMethods.length > 0) {
  questionnaireMethods.forEach(method => {
    console.log(`  ✓ ${method}`);
  });
} else {
  console.log('  ✗ No questionnaire methods found!');
}

console.log('');

// Check for our specific methods
console.log('Checking specific methods:');
const expectedMethods = [
  'questionnaires.create',
  'questionnaires.update',
  'questionnaires.remove',
  'questionnaires.get',
  'questionnaireResponses.create',
  'questionnaireResponses.update',
  'questionnaireResponses.remove',
  'questionnaireResponses.get'
];

expectedMethods.forEach(methodName => {
  if (allMethods[methodName]) {
    console.log(`  ✓ ${methodName} - registered`);
  } else {
    console.log(`  ✗ ${methodName} - NOT FOUND`);
  }
});

console.log('');

// List all methods containing 'create', 'update', 'remove', 'get' to see the pattern
console.log('Other CRUD methods (for comparison):');
const crudMethods = methodNames.filter(name => 
  name.includes('.create') || 
  name.includes('.update') || 
  name.includes('.remove') || 
  name.includes('.get')
).slice(0, 20); // Show first 20 for brevity

crudMethods.forEach(method => {
  console.log(`  - ${method}`);
});

console.log('');
console.log('========================================');

// Export a function to run this test programmatically
export function verifyQuestionnaireMethods() {
  const allMethods = Meteor.server.method_handlers || {};
  const expectedMethods = [
    'questionnaires.create',
    'questionnaires.update',
    'questionnaires.remove',
    'questionnaires.get',
    'questionnaireResponses.create',
    'questionnaireResponses.update',
    'questionnaireResponses.remove',
    'questionnaireResponses.get'
  ];
  
  const results = {};
  let allFound = true;
  
  expectedMethods.forEach(methodName => {
    const exists = !!allMethods[methodName];
    results[methodName] = exists;
    if (!exists) allFound = false;
  });
  
  return {
    allFound,
    results,
    totalMethods: Object.keys(allMethods).length,
    questionnaireMethods: Object.keys(allMethods).filter(name => 
      name.toLowerCase().includes('questionnaire')
    )
  };
}