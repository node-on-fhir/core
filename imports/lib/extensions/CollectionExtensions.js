// imports/lib/extensions/CollectionExtensions.js
// Core replacement for Mongo.Collection.prototype.drop from clinical:extended-api.
// Converted to Meteor v3 async (original used sync _collection.remove({})).
// Plain CJS, zero Meteor imports -- wired at server startup (Task 4).
function installCollectionExtensions(MongoNs) {
  MongoNs.Collection.prototype.drop = async function() {
    return this.removeAsync({});
  };
  return MongoNs;
}

module.exports = { installCollectionExtensions };
