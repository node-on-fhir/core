// imports/lib/schemas/SimpleSchemas/ServerConfiguration.js

import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

export let ServerConfiguration = new Mongo.Collection('ServerConfiguration');

let ServerConfigurationSchema = new SimpleSchema({
  "configType": {
    type: String
  },
  "data": {
    type: Object,
    optional: true,
    blackbox: true
  },
  "updatedAt": {
    type: Date,
    optional: true
  },
  "updatedBy": {
    type: String,
    optional: true
  }
});

// ServerConfiguration.attachSchema(ServerConfigurationSchema);

export default { ServerConfiguration, ServerConfigurationSchema };
