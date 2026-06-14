
import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';


import moment from 'moment';
import { get } from 'lodash';


if(Meteor.isClient){
  ImportCursor = new Mongo.Collection('ImportCursor', {connection: null});
  ExportCursor = new Mongo.Collection('ExportCursor', {connection: null});
  HealthKitImport = new Mongo.Collection('HealthKitImport', {connection: null});
}


