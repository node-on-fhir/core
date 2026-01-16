import { Mongo } from 'meteor/mongo';

export const authCodesCollection = new Meteor.Collection('OAuth2AuthCodes');

authCodesCollection.allow({
    insert: function (userId, doc) {
      return Meteor.isServer && userId && userId === doc.userId;
    },
    update: function (userId, doc, fieldNames, modifier) {
      return false;
    },
    remove: function (userId, doc) {
      return userId && userId === doc.userId;
    }
  });