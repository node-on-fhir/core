# Meteor v3 Async Patterns

## Core Principle

**Meteor v3 requires async operations on the server side.** All database operations must use async methods.

## Server-Side Async Methods

### ❌ WRONG: Synchronous Methods (Meteor v2)
```javascript
// Server-side code - NO LONGER WORKS in Meteor v3
const record = Observations.findOne({ _id: id });
const result = Observations.insert(data);
const updated = Observations.update({ _id: id }, { $set: data });
const removed = Observations.remove({ _id: id });
const count = Observations.find({}).count();
```

### ✅ CORRECT: Async Methods (Meteor v3)
```javascript
// Server-side code - Meteor v3
const record = await Observations.findOneAsync({ _id: id });
const result = await Observations.insertAsync(data);
const updated = await Observations.updateAsync({ _id: id }, { $set: data });
const removed = await Observations.removeAsync({ _id: id });
const count = await Observations.find({}).countAsync();
const records = await Observations.find({}).fetchAsync();
```

## Meteor Methods Pattern

```javascript
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Observations } from '/imports/lib/schemas/SimpleSchemas/Observations';
import { get } from 'lodash';
import { Random } from 'meteor/random';

Meteor.methods({
  'observations.insert': async function(observationData) {
    check(observationData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    const cleanObservation = {
      resourceType: 'Observation',
      id: Random.id(),
      status: get(observationData, 'status', 'final'),
      code: get(observationData, 'code', {}),
      subject: get(observationData, 'subject', {})
    };

    cleanObservation._id = cleanObservation.id;

    console.log('[observations.insert] Inserting:', cleanObservation._id);
    const result = await Observations.insertAsync(cleanObservation);
    return result;
  },

  'observations.update': async function(observationId, observationData) {
    check(observationId, String);
    check(observationData, Object);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    const existing = await Observations.findOneAsync({ _id: observationId });
    if (!existing) {
      throw new Meteor.Error('not-found');
    }

    const updates = {
      status: get(observationData, 'status', existing.status),
      code: get(observationData, 'code', existing.code)
    };

    console.log('[observations.update] Updating:', observationId);
    const result = await Observations.updateAsync(
      { _id: observationId },
      { $set: updates }
    );
    return result;
  },

  'observations.remove': async function(observationId) {
    check(observationId, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }

    console.log('[observations.remove] Removing:', observationId);
    const result = await Observations.removeAsync({ _id: observationId });
    return result;
  },

  'observations.findOne': async function(observationId) {
    check(observationId, String);

    const observation = await Observations.findOneAsync({ _id: observationId });
    return observation;
  }
});
```

## Publications Pattern

```javascript
import { Meteor } from 'meteor/meteor';
import { Observations } from '/imports/lib/schemas/SimpleSchemas/Observations';

Meteor.publish('autopublish.Observations', function(query, options) {
  // Build query with patient filter
  let mongoQuery = {};

  if (query.patient) {
    mongoQuery['subject.reference'] = `Patient/${query.patient}`;
  }

  if (query.category) {
    mongoQuery['category.coding.code'] = query.category;
  }

  // Return cursor (publications are reactive)
  return Observations.find(mongoQuery, options);
});
```

**Note**: Publications return cursors, not data. The cursor methods (`.find()`) are still synchronous, but data fetching happens reactively.

## Client-Side (Still Synchronous)

```javascript
// Client-side code - Synchronous methods still work
const observation = Observations.findOne({ _id: id });
const observations = Observations.find({}).fetch();
const count = Observations.find({}).count();
```

**Why**: Client-side Minimongo is synchronous by design.

## Calling Methods from Client

### Callback Style
```javascript
Meteor.call('observations.insert', observationData, function(error, result) {
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success:', result);
  }
});
```

### Async/Await Style (Recommended)
```javascript
async function handleSave() {
  try {
    const result = await Meteor.callAsync('observations.insert', observationData);
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Async Method List

### Collection Methods
```javascript
// Insert
await Collection.insertAsync(doc)

// Update
await Collection.updateAsync(selector, modifier)

// Remove
await Collection.removeAsync(selector)

// Find One
await Collection.findOneAsync(selector)

// Fetch
await Collection.find(selector).fetchAsync()

// Count
await Collection.find(selector).countAsync()
```

### User Methods
```javascript
// Find user
await Meteor.users.findOneAsync({ _id: userId })

// Update user
await Meteor.users.updateAsync({ _id: userId }, { $set: updates })
```

## Function Syntax (Preferred)

Use `function() {}` syntax instead of arrow functions for Meteor methods:

### ✅ CORRECT: function() Syntax
```javascript
Meteor.methods({
  'observations.insert': async function(data) {
    // 'this' context available (this.userId, this.connection)
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
  }
});
```

### ❌ WRONG: Arrow Function
```javascript
Meteor.methods({
  'observations.insert': async (data) => {
    // 'this' context NOT available!
    if (!this.userId) { // Error: 'this' is undefined
      throw new Meteor.Error('not-authorized');
    }
  }
});
```

**Why**: Meteor binds `this` context to methods, which includes `this.userId`, `this.connection`, etc. Arrow functions don't bind `this`.

## Automatic Checking

Use the hook to detect synchronous methods on server:

`.claude/hooks/post-tool-use-async.md` - Detects `.findOne(`, `.insert(`, `.update(`, `.remove(` without `Async`

## Migration Checklist

When migrating Meteor v2 → v3:

1. ✅ Add `async` to all Meteor method functions
2. ✅ Replace `.findOne()` with `await .findOneAsync()`
3. ✅ Replace `.insert()` with `await .insertAsync()`
4. ✅ Replace `.update()` with `await .updateAsync()`
5. ✅ Replace `.remove()` with `await .removeAsync()`
6. ✅ Replace `.count()` with `await .countAsync()`
7. ✅ Replace `.fetch()` with `await .fetchAsync()`
8. ✅ Use `function() {}` syntax (not arrow functions)
9. ✅ Add error handling with try/catch
10. ✅ Update method calls to use `Meteor.callAsync()`

## Related

- Hook: `.claude/hooks/post-tool-use-async.md` - Automatic detection
- Rule: `rules/meteor/collections.md` - Collection patterns
- Meteor v3 docs: https://docs.meteor.com/changelog.html
