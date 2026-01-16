#!/usr/bin/env meteor
// test-clinical-documents-package.js
// Test script to verify clinical:clinical-documents package loads correctly

console.log("Testing clinical:clinical-documents package...");

// Test importing from the package
if (typeof ClinicalDocuments !== 'undefined') {
  console.log("✓ ClinicalDocuments is defined");
} else {
  console.error("✗ ClinicalDocuments is not defined");
}

if (typeof DocumentRevisions !== 'undefined') {
  console.log("✓ DocumentRevisions is defined");
} else {
  console.error("✗ DocumentRevisions is not defined");
}

if (typeof ClinicalDocumentBundleSchema !== 'undefined') {
  console.log("✓ ClinicalDocumentBundleSchema is defined");
} else {
  console.error("✗ ClinicalDocumentBundleSchema is not defined");
}

if (typeof ClinicalDocumentCompositionSchema !== 'undefined') {
  console.log("✓ ClinicalDocumentCompositionSchema is defined");
} else {
  console.error("✗ ClinicalDocumentCompositionSchema is not defined");
}

if (typeof DocumentRevisionSchema !== 'undefined') {
  console.log("✓ DocumentRevisionSchema is defined");
} else {
  console.error("✗ DocumentRevisionSchema is not defined");
}

console.log("\nPackage test completed.");
process.exit(0);