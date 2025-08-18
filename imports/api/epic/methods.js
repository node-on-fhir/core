// /imports/api/epic/methods.js
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { fetch } from 'meteor/fetch';

Meteor.methods({
  'epic.exchangeBackendToken': async function(args) {
    check(args, {
      tokenEndpoint: String,
      formData: String
    });

    try {
      console.log('Exchanging JWT for access token at:', args.tokenEndpoint);
      
      const response = await fetch(args.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: args.formData
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Token exchange failed:', data);
        throw new Meteor.Error('token-exchange-failed', 
          `Token exchange failed: ${data.error_description || data.error || response.statusText}`
        );
      }

      console.log('Token exchange successful');
      return data;
    } catch (error) {
      console.error('Backend token exchange error:', error);
      throw new Meteor.Error('backend-auth-error', error.message);
    }
  },

  'epic.makeFhirRequest': async function(args) {
    check(args, {
      url: String,
      accessToken: String
    });

    try {
      console.log('Making FHIR request to:', args.url);
      
      const response = await fetch(args.url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${args.accessToken}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('FHIR request failed:', data);
        throw new Meteor.Error('fhir-request-failed', 
          `FHIR request failed: ${data.issue?.[0]?.diagnostics || response.statusText}`
        );
      }

      console.log('FHIR request successful');
      return data;
    } catch (error) {
      console.error('FHIR request error:', error);
      throw new Meteor.Error('fhir-error', error.message);
    }
  }
});