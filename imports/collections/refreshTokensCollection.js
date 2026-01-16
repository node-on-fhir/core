import { Mongo } from 'meteor/mongo';

export const refreshTokensCollection = new Meteor.Collection('OAuth2RefreshTokens');

refreshTokensCollection.allow({
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