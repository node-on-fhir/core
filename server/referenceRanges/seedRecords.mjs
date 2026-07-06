// server/referenceRanges/seedRecords.mjs
// Pure: seed record -> Mongo doc with stable _id. No Meteor.

export function toSeedDocs(seedArray) {
  return (seedArray || []).map(function (record) {
    return { ...record, _id: record.id };
  });
}
