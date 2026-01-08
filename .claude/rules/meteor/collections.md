# Meteor Collection Patterns

## Collection Definition

```javascript
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// Create collection
export const Observations = new Mongo.Collection('Observations');

// Define schema
const ObservationSchema = new SimpleSchema({
  resourceType: {
    type: String,
    defaultValue: 'Observation'
  },
  id: {
    type: String,
    optional: true
  },
  _id: {
    type: String,
    optional: true
  },
  status: {
    type: String,
    allowedValues: ['registered', 'preliminary', 'final', 'amended']
  },
  code: {
    type: Object,
    optional: true,
    blackbox: true  // Don't validate nested structure
  },
  subject: {
    type: Object,
    optional: true,
    blackbox: true
  }
});

// Attach schema to collection
Observations.attachSchema(ObservationSchema);
```

## Collection Registration

Collections must be registered in **3 places**:

### 1. Server-Side (`server/main.js`)
```javascript
import { Observations } from '/imports/lib/schemas/SimpleSchemas/Observations';

// Add to Meteor.Collections
Meteor.Collections = {
  Patients: Patients,
  Observations: Observations,
  Conditions: Conditions,
  // ... all collections
};

// Add to global.Collections (for FHIR server)
global.Collections = {
  Patients: Patients,
  Observations: Observations,
  Conditions: Conditions,
  // ... all collections
};
```

### 2. Client-Side (`imports/startup/client/collections.js`)
```javascript
import { Observations } from '/imports/lib/schemas/SimpleSchemas/Observations';

Meteor.Collections = {
  Patients: Patients,
  Observations: Observations,
  Conditions: Conditions,
  // ... all collections
};
```

### 3. Autopublish (`server/publications/autopublish.js`)
```javascript
import { Observations } from '/imports/lib/schemas/SimpleSchemas/Observations';

const collectionsMap = {
  'Patients': Patients,
  'Observations': Observations,
  'Conditions': Conditions,
  // ... all collections
};
```

## Query Patterns

### Find One
```javascript
// Server (async)
const observation = await Observations.findOneAsync({ _id: id });

// Client (sync)
const observation = Observations.findOne({ _id: id });
```

### Find Many
```javascript
// Server (async)
const observations = await Observations.find({ status: 'final' }).fetchAsync();

// Client (sync)
const observations = Observations.find({ status: 'final' }).fetch();
```

### Count
```javascript
// Server (async)
const count = await Observations.find({ status: 'final' }).countAsync();

// Client (sync)
const count = Observations.find({ status: 'final' }).count();
```

## Reactive Data (Client)

### useTracker Hook
```javascript
import { useTracker } from 'meteor/react-meteor-data';
import { Observations } from '/imports/lib/schemas/SimpleSchemas/Observations';

function ObservationsPage() {
  const { observations, isReady } = useTracker(() => {
    // Subscribe to data
    const handle = Meteor.subscribe('autopublish.Observations', {
      patient: Session.get('selectedPatientId')
    }, {});

    // Query local collection (reactive)
    return {
      observations: Observations.find({}).fetch(),
      isReady: handle.ready()
    };
  }, []);

  if (!isReady) {
    return <CircularProgress />;
  }

  return <ObservationsTable data={observations} />;
}
```

## Indexes

Define indexes for performance:

```javascript
// server/main.js
Meteor.startup(function() {
  // Single field index
  Observations.createIndexAsync({ 'subject.reference': 1 });

  // Compound index
  Observations.createIndexAsync({
    'subject.reference': 1,
    'category.coding.code': 1,
    'effectiveDateTime': -1
  });

  // Unique index
  Patients.createIndexAsync({ 'id': 1 }, { unique: true });
});
```

## Collection Helpers

Add helper methods to documents:

```javascript
Observations.helpers({
  // Get formatted display
  getDisplay() {
    return get(this, 'code.text', get(this, 'code.coding.0.display', 'Unknown'));
  },

  // Get patient reference
  getPatientId() {
    const ref = get(this, 'subject.reference', '');
    return ref.replace('Patient/', '');
  },

  // Check if final
  isFinal() {
    return this.status === 'final';
  }
});

// Usage
const observation = Observations.findOne({ _id: id });
console.log(observation.getDisplay()); // Uses helper method
```

## Collection Hooks (Legacy Pattern)

**Note**: Collection hooks are legacy. Prefer Meteor methods for validation.

```javascript
import { CollectionHooks } from 'meteor/matb33:collection-hooks';

// Before insert
Observations.before.insert(function(userId, doc) {
  // Add timestamps
  doc.createdAt = new Date();
  doc.createdBy = userId;
});

// Before update
Observations.before.update(function(userId, doc, fieldNames, modifier) {
  // Add updated timestamp
  modifier.$set = modifier.$set || {};
  modifier.$set.updatedAt = new Date();
  modifier.$set.updatedBy = userId;
});

// After remove
Observations.after.remove(function(userId, doc) {
  console.log('Removed observation:', doc._id);
});
```

## Common Patterns

### Check if Collection Exists
```javascript
// Check if collection is available (client-side)
if (Meteor.Collections && Meteor.Collections.Observations) {
  const observations = Observations.find({}).fetch();
}
```

### Global Collection Access
```javascript
// Access collection by string name
const collectionName = 'Observations';
const collection = Meteor.Collections[collectionName];

if (collection) {
  const records = collection.find({}).fetch();
}
```

### Dynamic Collection Queries
```javascript
function getRecordById(collectionName, recordId) {
  const collection = Meteor.Collections[collectionName];

  if (!collection) {
    throw new Meteor.Error('collection-not-found', `Collection ${collectionName} not found`);
  }

  return collection.findOne({ _id: recordId });
}

// Usage
const patient = getRecordById('Patients', '123');
const observation = getRecordById('Observations', '456');
```

## Deny/Allow Rules (Legacy)

**Note**: Deny/Allow rules are legacy. Use Meteor methods instead.

```javascript
// Legacy pattern (don't use)
Observations.allow({
  insert: function(userId, doc) {
    return !!userId; // Allow if logged in
  },
  update: function(userId, doc) {
    return !!userId;
  },
  remove: function(userId, doc) {
    return !!userId;
  }
});

// Modern pattern (use this)
Meteor.methods({
  'observations.insert': async function(data) {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    // ... insert logic
  }
});
```

## Related

- Rule: `rules/meteor/v3-async.md` - Async methods
- Rule: `rules/fhir/resource-implementation.md` - Complete resource setup
- Command: `/create-crud-microservice` - Automated collection generation
- Meteor Collections docs: https://docs.meteor.com/api/collections.html
