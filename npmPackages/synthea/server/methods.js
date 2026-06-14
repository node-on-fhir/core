// /packages/synthea/server/methods.js
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { Mongo } from 'meteor/mongo';
import { get } from 'lodash';

// Import the trials generation method
import './methods/generateTrialsResources';

// Track conversion state
let conversionState = {
  isRunning: false,
  shouldStop: false,
  currentCollection: null,
  progress: 0
};

// Function to convert a single document's ObjectID to string
function convertDocument(doc) {
  if (typeof doc._id === 'string') {
    return doc;
  }
  
  if (doc._id && doc._id.toString) {
    const newDoc = Object.assign({}, doc);
    newDoc._id = doc._id.toString();
    return newDoc;
  }
  
  return doc;
}

// Function to check if a collection has ObjectIDs
async function checkCollectionForObjectIds(collectionName) {
  try {
    // Always access collections directly from MongoDB
    const db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
    
    // Try different collection name formats (some might be lowercase)
    let rawCollection;
    try {
      rawCollection = db.collection(collectionName);
      // Test if collection exists by trying to count
      await rawCollection.countDocuments({}, { limit: 1 });
    } catch (e) {
      // Try lowercase version
      try {
        rawCollection = db.collection(collectionName.toLowerCase());
        await rawCollection.countDocuments({}, { limit: 1 });
      } catch (e2) {
        console.log(`Collection ${collectionName} not found`);
        return 0;
      }
    }
    
    // Check if any documents have ObjectID type
    const count = await rawCollection.countDocuments({ 
      _id: { $type: 'objectId' } 
    });
    
    return count;
  } catch (error) {
    console.error(`Error checking collection ${collectionName}:`, error);
    return 0;
  }
}

// Function to convert ObjectIDs in a collection
async function convertCollectionObjectIds(collectionName, options = {}) {
  const { dryRun = false, createBackup = true } = options;
  const result = {
    collection: collectionName,
    processed: 0,
    converted: 0,
    errors: 0,
    backup: null
  };

  try {
    // Get the raw MongoDB collection
    const db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
    
    // Try to find the collection with different case variations
    let rawCollection;
    let actualCollectionName = collectionName;
    
    try {
      rawCollection = db.collection(collectionName);
      // Test if collection exists
      await rawCollection.countDocuments({}, { limit: 1 });
    } catch (e) {
      // Try lowercase version
      try {
        actualCollectionName = collectionName.toLowerCase();
        rawCollection = db.collection(actualCollectionName);
        await rawCollection.countDocuments({}, { limit: 1 });
      } catch (e2) {
        result.error = `Collection ${collectionName} not found`;
        return result;
      }
    }
    
    // Count documents with ObjectID
    const objectIdCount = await rawCollection.countDocuments({ 
      _id: { $type: 'objectId' } 
    });
    
    if (objectIdCount === 0) {
      result.message = 'No ObjectID documents found';
      return result;
    }

    // Create backup if requested
    if (createBackup && !dryRun) {
      const backupName = `${actualCollectionName}_backup_${new Date().toISOString().replace(/[:.]/g, '-')}`;
      try {
        await rawCollection.aggregate([
          { $match: {} },
          { $out: backupName }
        ]).toArray();
        result.backup = backupName;
      } catch (backupError) {
        console.error(`Error creating backup for ${collectionName}:`, backupError);
        // Continue with conversion even if backup fails
        result.backupError = backupError.message;
      }
    }

    // Process in batches
    const batchSize = 100;
    let processedInBatch = 0;
    
    while (processedInBatch < objectIdCount && !conversionState.shouldStop) {
      // Find documents with ObjectID
      const cursor = rawCollection.find({ 
        _id: { $type: 'objectId' } 
      }).limit(batchSize);
      
      const batch = await cursor.toArray();
      
      if (batch.length === 0) break;
      
      for (const doc of batch) {
        if (conversionState.shouldStop) break;
        
        try {
          result.processed++;
          processedInBatch++;
          
          // Convert the document
          const stringId = doc._id.toString();
          
          if (!dryRun) {
            // Create new document with string ID
            const newDoc = Object.assign({}, doc);
            newDoc._id = stringId;
            
            // Delete old document and insert new one
            await rawCollection.deleteOne({ _id: doc._id });
            await rawCollection.insertOne(newDoc);
          }
          
          result.converted++;
          
          // Update progress
          const progress = (processedInBatch / objectIdCount) * 100;
          conversionState.progress = progress;
          
          // Progress tracking could be implemented via a status collection
          // that the client could poll or subscribe to
          
        } catch (error) {
          result.errors++;
          console.error(`Error converting document ${doc._id}:`, error);
        }
      }
    }
    
  } catch (error) {
    result.error = error.message;
    console.error(`Error processing collection ${collectionName}:`, error);
  }
  
  return result;
}

Meteor.methods({
  'synthea.convertObjectIds': async function(options) {
    check(options, {
      collections: [String],
      dryRun: Match.Optional(Boolean),
      createBackup: Match.Optional(Boolean)
    });

    // Security check: Ensure database utilities are enabled
    if (!get(Meteor, 'settings.private.enableSyntheaDbUtils', false)) {
      throw new Meteor.Error('forbidden', 
        'Synthea database utilities are disabled. Set ENABLE_SYNTHEA_DB_UTILS=true to enable.');
    }

    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }

    if (conversionState.isRunning) {
      throw new Meteor.Error('already-running', 'Conversion is already in progress');
    }

    const { collections, dryRun = false, createBackup = true } = options;
    const results = {};
    
    conversionState.isRunning = true;
    conversionState.shouldStop = false;
    conversionState.progress = 0;

    try {
      let completedCollections = 0;
      
      for (const collectionName of collections) {
        if (conversionState.shouldStop) {
          break;
        }
        
        conversionState.currentCollection = collectionName;
        
        // Check if collection has ObjectIDs
        const objectIdCount = await checkCollectionForObjectIds(collectionName);
        
        if (objectIdCount > 0) {
          console.log(`Processing ${collectionName}: ${objectIdCount} documents with ObjectIDs`);
          
          // Convert the collection
          const result = await convertCollectionObjectIds(collectionName, {
            dryRun,
            createBackup
          });
          
          results[collectionName] = result;
        } else {
          results[collectionName] = {
            collection: collectionName,
            processed: 0,
            converted: 0,
            errors: 0,
            message: 'No ObjectID documents found'
          };
        }
        
        completedCollections++;
        const overallProgress = (completedCollections / collections.length) * 100;
        
        // Note: Real-time updates would need to be implemented via
        // publications/subscriptions or a polling mechanism from the client
      }
      
      return {
        success: true,
        results: results,
        stopped: conversionState.shouldStop
      };
      
    } catch (error) {
      console.error('Error in ObjectID conversion:', error);
      throw new Meteor.Error('conversion-error', error.message);
    } finally {
      conversionState.isRunning = false;
      conversionState.currentCollection = null;
      conversionState.progress = 0;
      
      // Cleanup complete
    }
  },

  'synthea.stopObjectIdConversion': function() {
    // Security check: Ensure database utilities are enabled
    if (!get(Meteor, 'settings.private.enableSyntheaDbUtils', false)) {
      throw new Meteor.Error('forbidden', 
        'Synthea database utilities are disabled. Set ENABLE_SYNTHEA_DB_UTILS=true to enable.');
    }

    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }

    conversionState.shouldStop = true;
    return { success: true };
  },

  'synthea.checkObjectIdStatus': async function(collections) {
    check(collections, [String]);

    // Security check: Ensure database utilities are enabled
    if (!get(Meteor, 'settings.private.enableSyntheaDbUtils', false)) {
      throw new Meteor.Error('forbidden', 
        'Synthea database utilities are disabled. Set ENABLE_SYNTHEA_DB_UTILS=true to enable.');
    }

    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }

    const status = {};
    
    for (const collectionName of collections) {
      try {
        const count = await checkCollectionForObjectIds(collectionName);
        status[collectionName] = {
          hasObjectIds: count > 0,
          count: count
        };
      } catch (error) {
        status[collectionName] = {
          error: error.message
        };
      }
    }
    
    return status;
  }
});