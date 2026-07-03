// npmPackages/fhircast-module/client/lib/constants.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

export const DEFAULT_HUB_URL = get(Meteor, 'settings.public.fhircast.hubUrl', 'http://localhost:3100/api/hub');
export const DEFAULT_CLIENT_URL = get(Meteor, 'settings.public.fhircast.clientUrl', 'http://localhost:3100/client');
export const DEFAULT_WS_URL = get(Meteor, 'settings.public.fhircast.wsUrl', 'ws://localhost:3100/bind');

export const DEFAULT_SECRET = 'secret';
export const DEFAULT_TOPIC = 'DrXRay';
export const DEFAULT_LEASE = 999;
export const WEBSOCKET_CHANNEL_TYPE = 'websocket';

export const DEFAULT_CONTEXT = [
  {
    key: 'patient',
    resource: {
      resourceType: 'Patient',
      id: 'ewUbXT9RWEbSj5wPEdgRaBw3',
      identifier: [
        {
          system: 'urn:oid:1.2.840.114350',
          value: '185444'
        },
        {
          system: 'urn:oid:1.2.840.114350.1.13.861.1.7.5.737384.27000',
          value: '2667'
        }
      ]
    }
  },
  {
    key: 'study',
    resource: {
      resourceType: 'ImagingStudy',
      id: '8i7tbu6fby5ftfbku6fniuf',
      uid: 'urn:oid:2.16.124.113543.6003.1154777499.30246.19789.3503430045',
      identifier: [
        {
          system: '7678',
          value: 'REMOVED'
        }
      ],
      patient: {
        reference: 'Patient/ewUbXT9RWEbSj5wPEdgRaBw3'
      }
    }
  }
];
