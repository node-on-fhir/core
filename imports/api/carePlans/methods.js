// /imports/api/carePlans/methods.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import moment from 'moment';

// Import to ensure schema is loaded, but we'll use the global collection
import '/imports/lib/schemas/SimpleSchemas/CarePlans';

// Import the CarePlans collection
import { CarePlans } from '/imports/lib/schemas/SimpleSchemas/CarePlans';

// Get the correct CarePlans collection reference
function getCarePlans() {
  return CarePlans;
}

Meteor.ServerMethods.define('carePlans.create', {
  description: 'Create a new CarePlan resource for a patient',
  aliases: ['createCarePlan'],
  phi: true,
  schemaObject: { type: 'object' }   // arbitrary FHIR CarePlan shape
}, async function(params, context){
  const carePlanData = params;

  // Add metadata
  const carePlan = {
    ...carePlanData,
    resourceType: 'CarePlan',
    meta: {
      lastUpdated: new Date(),
      versionId: '1'
    }
  };

  // Insert and return the new care plan
  const CarePlans = getCarePlans();
  const carePlanId = await CarePlans.insertAsync(carePlan);

  // Log for HIPAA compliance
  context.log.info('CarePlan created', {
    userId: context.userId,
    carePlanId: carePlanId,
    timestamp: new Date()
  });

  return carePlanId;
});

Meteor.ServerMethods.define('carePlans.update', {
  description: 'Update an existing CarePlan resource by id',
  aliases: ['updateCarePlan'],
  phi: true,
  positionalParams: ['carePlanId', 'carePlanData'],
  schemaObject: {
    type: 'object',
    properties: {
      carePlanId: { type: 'string' },
      carePlanData: { type: 'object' }
    },
    required: ['carePlanId', 'carePlanData']
  }
}, async function(params, context){
  const carePlanId = params.carePlanId;
  const carePlanData = params.carePlanData;

  const CarePlans = getCarePlans();

  // Check if care plan exists
  const existingCarePlan = await CarePlans.findOneAsync({ _id: carePlanId });
  if (!existingCarePlan) {
    throw new Meteor.Error('not-found', 'Care plan not found');
  }

  // Update metadata
  const updatedCarePlan = {
    ...carePlanData,
    _id: carePlanId,
    resourceType: 'CarePlan',
    meta: {
      ...get(carePlanData, 'meta', {}),
      lastUpdated: new Date(),
      versionId: String(parseInt(get(existingCarePlan, 'meta.versionId', '0')) + 1)
    }
  };

  // Update the care plan
  const result = await CarePlans.updateAsync(
    { _id: carePlanId },
    { $set: updatedCarePlan }
  );

  // Log for HIPAA compliance
  context.log.info('CarePlan updated', {
    userId: context.userId,
    carePlanId: carePlanId,
    timestamp: new Date()
  });

  return result;
});

Meteor.ServerMethods.define('carePlans.remove', {
  description: 'Delete a CarePlan resource by id',
  aliases: ['removeCarePlan'],
  phi: true,
  positionalParams: ['carePlanId'],
  schemaObject: {
    type: 'object',
    properties: {
      carePlanId: { type: 'string' }
    },
    required: ['carePlanId']
  }
}, async function(params, context){
  const carePlanId = params.carePlanId;

  const CarePlans = getCarePlans();

  // Check if care plan exists
  const existingCarePlan = await CarePlans.findOneAsync({ _id: carePlanId });
  if (!existingCarePlan) {
    throw new Meteor.Error('not-found', 'Care plan not found');
  }

  // Remove the care plan
  const result = await CarePlans.removeAsync({ _id: carePlanId });

  // Log for HIPAA compliance
  context.log.info('CarePlan deleted', {
    userId: context.userId,
    carePlanId: carePlanId,
    timestamp: new Date()
  });

  return result;
});
