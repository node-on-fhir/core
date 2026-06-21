// packages/synthea/scripts/convert-objectids-safer.js
// Safer MongoDB script to convert ObjectID _id fields to string _id fields
// This version creates backup collections and allows rollback
// Run with: mongo <database_name> convert-objectids-safer.js

// Configuration
const DRY_RUN = false; // Set to true to test without making changes
const CREATE_BACKUP = true; // Set to false to skip backup creation

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

// Function to backup a collection
function backupCollection(collectionName) {
  const backupName = `${collectionName}_backup_${new Date().toISOString().replace(/:/g, '-')}`;
  print(`Creating backup: ${backupName}`);
  
  db.getCollection(collectionName).aggregate([
    { $match: {} },
    { $out: backupName }
  ]);
  
  return backupName;
}

// Function to convert a single document
function convertDocument(doc) {
  // If _id is already a string, return as-is
  if (typeof doc._id === 'string') {
    return doc;
  }
  
  // If _id is an ObjectID, convert to string
  if (doc._id && doc._id.toString) {
    const newDoc = Object.assign({}, doc);
    newDoc._id = doc._id.toString();
    return newDoc;
  }
  
  // Otherwise, return as-is
  return doc;
}

// Function to convert ObjectIDs in a collection (safer method)
function convertObjectIdsInPlace(collectionName) {
  print(`\nProcessing collection: ${collectionName}`);
  
  const collection = db.getCollection(collectionName);
  let processedCount = 0;
  let convertedCount = 0;
  let errorCount = 0;
  
  // Count documents with ObjectID _id
  const objectIdCount = collection.count({ _id: { $type: "objectId" } });
  print(`Found ${objectIdCount} documents with ObjectID _id`);
  
  if (objectIdCount === 0) {
    print(`No ObjectID documents to convert in ${collectionName}`);
    return { processed: 0, converted: 0, errors: 0 };
  }
  
  // Create a backup if requested
  let backupName = null;
  if (CREATE_BACKUP && !DRY_RUN) {
    backupName = backupCollection(collectionName);
  }
  
  // Process in batches to avoid memory issues
  const batchSize = 100;
  let hasMore = true;
  
  while (hasMore) {
    const batch = collection.find({ _id: { $type: "objectId" } }).limit(batchSize).toArray();
    
    if (batch.length === 0) {
      hasMore = false;
      continue;
    }
    
    batch.forEach(function(doc) {
      try {
        processedCount++;
        
        // Convert the document
        const newDoc = convertDocument(doc);
        
        if (newDoc._id !== doc._id) {
          if (!DRY_RUN) {
            // Remove old document
            collection.deleteOne({ _id: doc._id });
            
            // Insert new document with string _id
            collection.insertOne(newDoc);
          }
          
          convertedCount++;
          
          if (convertedCount % 100 === 0) {
            print(`Converted ${convertedCount}/${objectIdCount} documents...`);
          }
        }
      } catch (e) {
        errorCount++;
        print(`Error converting document ${doc._id}: ${e.message}`);
      }
    });
  }
  
  print(`✓ Processed ${processedCount} documents in ${collectionName}`);
  print(`  - Converted: ${convertedCount}`);
  if (errorCount > 0) {
    print(`  - Errors: ${errorCount}`);
  }
  if (backupName) {
    print(`  - Backup saved to: ${backupName}`);
  }
  
  return { processed: processedCount, converted: convertedCount, errors: errorCount, backup: backupName };
}

// Main execution
print('=== MongoDB ObjectID to String Conversion Script (Safe Version) ===');
print(`Database: ${db.getName()}`);
print(`Mode: ${DRY_RUN ? 'DRY RUN (no changes will be made)' : 'LIVE (changes will be made)'}`);
print(`Backup: ${CREATE_BACKUP ? 'ENABLED' : 'DISABLED'}`);
print(`Collections to process: ${collections.join(', ')}`);
print('');

const results = {};
let totalProcessed = 0;
let totalConverted = 0;
let totalErrors = 0;

// Process each collection
collections.forEach(function(collectionName) {
  const result = convertObjectIdsInPlace(collectionName);
  results[collectionName] = result;
  totalProcessed += result.processed;
  totalConverted += result.converted;
  totalErrors += result.errors;
});

// Print summary
print('\n=== Conversion Summary ===');
for (const [collection, result] of Object.entries(results)) {
  print(`${collection}:`);
  print(`  - Processed: ${result.processed}`);
  print(`  - Converted: ${result.converted}`);
  if (result.errors > 0) {
    print(`  - Errors: ${result.errors}`);
  }
  if (result.backup) {
    print(`  - Backup: ${result.backup}`);
  }
}

print(`\nTotal:`);
print(`  - Documents processed: ${totalProcessed}`);
print(`  - Documents converted: ${totalConverted}`);
if (totalErrors > 0) {
  print(`  - Total errors: ${totalErrors}`);
}

if (DRY_RUN) {
  print('\n⚠️  This was a DRY RUN - no changes were made');
  print('Set DRY_RUN = false to perform actual conversion');
}

print('\n✓ Script complete');