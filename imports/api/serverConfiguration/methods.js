// imports/api/serverConfiguration/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { get, set } from 'lodash';

import { ServerConfiguration } from '/imports/lib/schemas/SimpleSchemas/ServerConfiguration';

Meteor.methods({
  'serverConfiguration.saveX509Keys': async function(){
    if(!this.userId){
      throw new Meteor.Error('not-authorized', 'User must be logged in to save keys');
    }

    let x509 = get(Meteor, 'settings.private.x509');
    if(!x509){
      throw new Meteor.Error('no-keys', 'No x509 keys found in Meteor.settings.private.x509');
    }

    let data = {};
    if(get(x509, 'privateKey')){
      data.privateKey = x509.privateKey;
    }
    if(get(x509, 'publicKey')){
      data.publicKey = x509.publicKey;
    }
    if(get(x509, 'publicCertPem')){
      data.publicCertPem = x509.publicCertPem;
    }

    if(Object.keys(data).length === 0){
      throw new Meteor.Error('no-keys', 'No x509 keys found to save');
    }

    console.log('[serverConfiguration.saveX509Keys] Saving x509 keys to database');

    let existing = await ServerConfiguration.findOneAsync({ configType: 'x509' });
    if(existing){
      await ServerConfiguration.updateAsync(
        { _id: existing._id },
        { $set: {
          data: data,
          updatedAt: new Date(),
          updatedBy: this.userId
        }}
      );
      console.log('[serverConfiguration.saveX509Keys] Updated existing record:', existing._id);
    } else {
      let insertResult = await ServerConfiguration.insertAsync({
        configType: 'x509',
        data: data,
        updatedAt: new Date(),
        updatedBy: this.userId
      });
      console.log('[serverConfiguration.saveX509Keys] Inserted new record:', insertResult);
    }

    return { success: true, keysStored: Object.keys(data) };
  },

  'serverConfiguration.loadX509Keys': async function(){
    let storedConfig = await ServerConfiguration.findOneAsync({ configType: 'x509' });
    if(!storedConfig || !storedConfig.data){
      console.log('[serverConfiguration.loadX509Keys] No stored x509 keys found');
      return { loaded: false };
    }

    let loaded = [];

    if(get(storedConfig, 'data.privateKey') && !get(Meteor, 'settings.private.x509.privateKey')){
      set(Meteor, 'settings.private.x509.privateKey', storedConfig.data.privateKey);
      loaded.push('privateKey');
    }
    if(get(storedConfig, 'data.publicKey') && !get(Meteor, 'settings.private.x509.publicKey')){
      set(Meteor, 'settings.private.x509.publicKey', storedConfig.data.publicKey);
      loaded.push('publicKey');
    }
    if(get(storedConfig, 'data.publicCertPem') && !get(Meteor, 'settings.private.x509.publicCertPem')){
      set(Meteor, 'settings.private.x509.publicCertPem', storedConfig.data.publicCertPem);
      loaded.push('publicCertPem');
    }

    if(loaded.length > 0){
      console.log('[serverConfiguration.loadX509Keys] Loaded keys from database:', loaded.join(', '));
    } else {
      console.log('[serverConfiguration.loadX509Keys] Keys already present in settings, skipping DB load');
    }

    return { loaded: loaded.length > 0, keys: loaded };
  },

  'serverConfiguration.hasStoredKeys': async function(){
    let storedConfig = await ServerConfiguration.findOneAsync({ configType: 'x509' });
    if(!storedConfig || !storedConfig.data){
      return { stored: false };
    }

    return {
      stored: true,
      keys: Object.keys(storedConfig.data),
      updatedAt: storedConfig.updatedAt
    };
  }
});
