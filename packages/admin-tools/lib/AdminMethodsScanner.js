// packages/admin-tools/lib/AdminMethodsScanner.js

import { Meteor } from 'meteor/meteor';

/**
 * Scans all loaded Meteor packages for CollectionAdminMethods exports.
 * Follows the same pattern as DynamicRoutes, SidebarWorkflows, etc.
 *
 * @returns {Array} Array of collection admin configurations
 *
 * Example returned structure:
 * [{
 *   collection: 'Patients',
 *   packageName: 'clinical:hl7-fhir-data-infrastructure',
 *   methods: [{
 *     name: 'initialize',
 *     label: 'Initialize',
 *     description: 'Seed with sample data',
 *     methodName: 'patients.initialize',
 *     confirmRequired: true,
 *     dangerous: false
 *   }]
 * }]
 */
function scanCollectionAdminMethods() {
  const collectionMethods = [];

  if (typeof Package === 'undefined') {
    console.warn('[AdminMethodsScanner] Package global not available');
    return collectionMethods;
  }

  Object.keys(Package).forEach(function(packageName) {
    if (Package[packageName].CollectionAdminMethods) {
      Package[packageName].CollectionAdminMethods.forEach(function(config) {
        collectionMethods.push({
          ...config,
          packageName: packageName
        });
      });
    }
  });

  console.log('[AdminMethodsScanner] Found ' + collectionMethods.length + ' collection admin configs');
  return collectionMethods;
}

/**
 * Gets admin methods for a specific collection
 *
 * @param {String} collectionName - Name of the collection
 * @returns {Object|null} Collection admin config or null if not found
 */
function getCollectionAdminMethods(collectionName) {
  const allMethods = scanCollectionAdminMethods();
  return allMethods.find(function(config) {
    return config.collection === collectionName;
  }) || null;
}

/**
 * Gets all unique collection names that have admin methods
 *
 * @returns {Array} Array of collection names
 */
function getCollectionsWithAdminMethods() {
  const allMethods = scanCollectionAdminMethods();
  return allMethods.map(function(config) {
    return config.collection;
  });
}

/**
 * Merges scanned admin methods with collection stats
 *
 * @param {Array} collectionStats - Array of {name, count, isFhir} from server
 * @returns {Array} Enhanced stats with adminMethods property
 */
function mergeWithCollectionStats(collectionStats) {
  const adminMethods = scanCollectionAdminMethods();

  return collectionStats.map(function(stat) {
    const adminConfig = adminMethods.find(function(config) {
      return config.collection === stat.name;
    });

    return {
      ...stat,
      adminMethods: adminConfig ? adminConfig.methods : [],
      packageName: adminConfig ? adminConfig.packageName : null
    };
  });
}

export {
  scanCollectionAdminMethods,
  getCollectionAdminMethods,
  getCollectionsWithAdminMethods,
  mergeWithCollectionStats
};
