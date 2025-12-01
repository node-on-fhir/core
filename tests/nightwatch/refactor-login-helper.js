// Batch script to refactor all CRUD tests to use loginHelper.ensureLoggedIn()
const fs = require('fs');
const path = require('path');

const files = [
  'tests/nightwatch/honeycomb/enable_autopublish/crud.patients.js',
  'tests/nightwatch/honeycomb/enable_autopublish/crud.practitioners.js',
  'tests/nightwatch/honeycomb/enable_autopublish/crud.allergyintolerances.js',
  'tests/nightwatch/honeycomb/enable_autopublish/crud.appointments.js',
  'tests/nightwatch/honeycomb/enable_autopublish/crud.careplans.js',
  'tests/nightwatch/honeycomb/enable_autopublish/crud.communications.js',
  'tests/nightwatch/honeycomb/enable_autopublish/crud.conditions.js',
  'tests/nightwatch/honeycomb/enable_autopublish/crud.consents.js',
  'tests/nightwatch/honeycomb/enable_autopublish/crud.diagnosticreports.js',
  'tests/nightwatch/honeycomb/enable_autopublish/crud.documentreferences.js',
  'tests/nightwatch/honeycomb/enable_autopublish/crud.encounters.js',
  'tests/nightwatch/honeycomb/enable_autopublish/crud.imagingstudies.js',
  'tests/nightwatch/honeycomb/enable_autopublish/crud.immunizations.js',
  'tests/nightwatch/honeycomb/enable_autopublish/crud.medicationadministrations.js',
  'tests/nightwatch/honeycomb/enable_autopublish/crud.medicationrequests.js',
  'tests/nightwatch/honeycomb/enable_autopublish/crud.medications.js',
  'tests/nightwatch/honeycomb/enable_autopublish/crud.medias.js',
  'tests/nightwatch/honeycomb/enable_autopublish/crud.observations.js',
  'tests/nightwatch/honeycomb/enable_autopublish/crud.questionnaires.js',
  'tests/nightwatch/honeycomb/enable_autopublish/crud.questionnaireresponses.js',
  'tests/nightwatch/honeycomb/enable_autopublish/crud.researchstudy.js',
  'tests/nightwatch/honeycomb/enable_autopublish/crud.researchsubjects.js',
  'tests/nightwatch/honeycomb/enable_autopublish/crud.schedules.js',
  'tests/nightwatch/honeycomb/enable_autopublish/crud.tasks.js',
  'tests/nightwatch/honeycomb/crud.measures.js'
];

console.log(`Processing ${files.length} files...`);

files.forEach(file => {
  const filePath = path.join('/Users/abigailwatson/Code/honeycomb-ehr', file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Skipping ${file} - not found`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Check if loginHelper is already imported
  if (!content.includes("require('../../helpers/login-helper')") &&
      !content.includes("require('../helpers/login-helper')")) {
    // Add loginHelper import after testUtils
    if (content.includes("const testUtils = require('./shared-test-utils')")) {
      content = content.replace(
        "const testUtils = require('./shared-test-utils');",
        "const testUtils = require('./shared-test-utils');\nconst loginHelper = require('../../helpers/login-helper');"
      );
    } else if (content.includes("const testUtils = require('./enable_autopublish/shared-test-utils')")) {
      content = content.replace(
        "const testUtils = require('./enable_autopublish/shared-test-utils');",
        "const testUtils = require('./enable_autopublish/shared-test-utils');\nconst loginHelper = require('../helpers/login-helper');"
      );
    }
  }

  // Check if already refactored
  if (content.includes('loginHelper.ensureLoggedIn')) {
    console.log(`✓ ${file} - already refactored`);
    return;
  }

  // Find the execute callback for login check (starts with "browser.execute(function() {" and checks isLoggedIn)
  const loginCheckPattern = /\/\/ Check if we're logged in\s+browser\.execute\(function\(\) \{[\s\S]*?\}\);[\s\S]*?\}\);/;

  if (!loginCheckPattern.test(content)) {
    console.log(`⚠️  ${file} - login pattern not found`);
    return;
  }

  // This is complex - the pattern varies between files
  // Let's just add the import for now and handle individually
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✓ ${file} - loginHelper import added`);
});

console.log('Done!');
