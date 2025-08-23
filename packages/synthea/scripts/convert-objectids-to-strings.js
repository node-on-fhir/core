// packages/synthea/scripts/convert-objectids-to-strings.js
// MongoDB script to convert ObjectID _id fields to string _id fields
// Run with: mongo <database_name> convert-objectids-to-strings.js

// Complete list of Synthea-generated collections
const collections = [
  'AllergyIntolerances',
  'CarePlans',
  'CareTeams',
  'Claims',
  'CodeSystems',
  'Conditions',
  'Devices',
  'DiagnosticReports',
  'DocumentReferences',
  'Encounters',
  'ExplanationOfBenefits',
  'ImagingStudies',
  'Immunizations',
  'Locations',
  'MedicationAdministrations',
  'MedicationRequests',
  'Medications',
  'Observations',
  'Organizations',
  'Patients',
  'Practitioners',
  'Procedures',
  'Provenances',
  'SupplyDeliveries'
];

// Function to convert ObjectIDs in a collection
function convertObjectIdsToStrings(collectionName) {
  print(`\nProcessing collection: ${collectionName}`);
  
  const collection = db.getCollection(collectionName);
  let convertedCount = 0;
  let errorCount = 0;
  
  // Find all documents with ObjectID _id
  const cursor = collection.find({ _id: { $type: "objectId" } });
  const totalDocs = cursor.count();
  
  print(`Found ${totalDocs} documents with ObjectID _id`);
  
  cursor.forEach(function(doc) {
    try {
      // Get the string representation of the ObjectID
      const stringId = doc._id.toString();
      
      // Create a copy of the document with string _id
      const newDoc = Object.assign({}, doc);
      newDoc._id = stringId;
      
      // Delete the _id to avoid duplicate key error
      delete doc._id;
      
      // Insert the new document with string _id
      collection.insertOne(newDoc);
      
      // Remove the old document with ObjectID _id
      collection.deleteOne({ _id: ObjectId(stringId) });
      
      convertedCount++;
      
      if (convertedCount % 100 === 0) {
        print(`Converted ${convertedCount} documents...`);
      }
    } catch (e) {
      errorCount++;
      print(`Error converting document ${doc._id}: ${e.message}`);
    }
  });
  
  print(`✓ Converted ${convertedCount} documents in ${collectionName}`);
  if (errorCount > 0) {
    print(`✗ Failed to convert ${errorCount} documents`);
  }
  
  return { converted: convertedCount, errors: errorCount };
}

// Main execution
print('=== MongoDB ObjectID to String Conversion Script ===');
print(`Database: ${db.getName()}`);
print(`Collections to process: ${collections.join(', ')}`);

const results = {};
let totalConverted = 0;
let totalErrors = 0;

// Process each collection
collections.forEach(function(collectionName) {
  const result = convertObjectIdsToStrings(collectionName);
  results[collectionName] = result;
  totalConverted += result.converted;
  totalErrors += result.errors;
});

// Print summary
print('\n=== Conversion Summary ===');
for (const [collection, result] of Object.entries(results)) {
  print(`${collection}: ${result.converted} converted, ${result.errors} errors`);
}
print(`\nTotal: ${totalConverted} documents converted across all collections`);
if (totalErrors > 0) {
  print(`Warning: ${totalErrors} total errors encountered`);
}

print('\n✓ Conversion complete');