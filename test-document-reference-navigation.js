// test-document-reference-navigation.js
// Quick test to verify document reference navigation fix

const fs = require('fs');
const path = require('path');

// Read the DocumentReferencesPage.jsx file
const filePath = path.join(__dirname, 'imports/ui-fhir/documentReferences/DocumentReferencesPage.jsx');
const content = fs.readFileSync(filePath, 'utf8');

// Check if the navigation path is correct
const navigationPattern = /navigate\(['"]\/document-references\/['"]\s*\+\s*documentReferenceId\)/;
const incorrectPattern = /navigate\(['"]\/documentReferences\/['"]\s*\+\s*documentReferenceId\)/;

if (navigationPattern.test(content)) {
  console.log('✅ Navigation path is correct: /document-references/');
  console.log('The fix has been applied successfully.');
} else if (incorrectPattern.test(content)) {
  console.log('❌ Navigation path is incorrect: /documentReferences/');
  console.log('The fix needs to be applied.');
} else {
  console.log('⚠️  Could not find navigation pattern in the file.');
}

// Also check if the unused rowClick function was removed
const tableFilePath = path.join(__dirname, 'imports/ui-fhir/documentReferences/DocumentReferencesTable.jsx');
const tableContent = fs.readFileSync(tableFilePath, 'utf8');

if (tableContent.includes('function rowClick(id){')) {
  console.log('⚠️  Unused rowClick function still exists in DocumentReferencesTable.jsx');
} else {
  console.log('✅ Unused rowClick function has been removed from DocumentReferencesTable.jsx');
}