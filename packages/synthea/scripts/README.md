# Synthea Data ObjectID Conversion Scripts

## Problem
When Synthea data is imported into MongoDB using native import tools, the `_id` fields are created as MongoDB ObjectID objects rather than strings. This causes issues with Meteor's data layer, which expects string IDs for FHIR resources.

## Solution
These scripts convert ObjectID `_id` fields to their string representation at the database level, avoiding the need for complex application-level transformations.

## Scripts

### convert-objectids-safer.js (Recommended)
A safer version that creates backups and supports dry-run mode.

**Features:**
- Dry-run mode for testing
- Automatic backup creation
- Batch processing to handle large collections
- Detailed progress reporting
- Error handling and recovery

**Usage:**
```bash
# Dry run (no changes made)
mongo honeycomb convert-objectids-safer.js

# Live run with backups
# Edit the script and set DRY_RUN = false
mongo honeycomb convert-objectids-safer.js

# Live run without backups  
# Edit the script and set CREATE_BACKUP = false
mongo honeycomb convert-objectids-safer.js
```

### convert-objectids-to-strings.js
A simpler version without backup functionality.

**Usage:**
```bash
mongo honeycomb convert-objectids-to-strings.js
```

## Collections Processed
Both scripts process all Synthea-generated FHIR collections:
- AllergyIntolerances
- CarePlans
- CareTeams
- Claims
- CodeSystems
- Conditions
- Devices
- DiagnosticReports
- DocumentReferences
- Encounters
- ExplanationOfBenefits
- ImagingStudies
- Immunizations
- Locations
- MedicationAdministrations
- MedicationRequests
- Medications
- Observations
- Organizations
- Patients
- Practitioners
- Procedures
- Provenances
- SupplyDeliveries

## Adding More Collections
To process additional collections, edit the `collections` array at the top of either script:

```javascript
const collections = [
  'Patients',
  'Practitioners',
  // Add more collection names here
  'NewCollectionName'
];
```

## Verification
After running the conversion, verify that documents have string IDs:

```javascript
// In mongo shell
db.Patients.findOne()
// Should show _id as a string, not ObjectId("...")
```

## Rollback
If using the safer script with backups enabled, you can restore from backup:

```javascript
// In mongo shell
// Find your backup collection (includes timestamp)
show collections

// Restore from backup
db.Patients.drop()
db.Patients_backup_2025-01-20T10-30-00.000Z.aggregate([
  { $match: {} },
  { $out: "Patients" }
])
```

## Performance Considerations
- The scripts process documents in batches to avoid memory issues
- For very large collections (>1M documents), consider running during off-peak hours
- Monitor database performance during conversion

## Alternative Approaches
If database-level conversion is not feasible, consider:
1. Using `getIdString()` method in UI components
2. Creating a Meteor method wrapper that normalizes IDs
3. Using a custom publication that transforms IDs





