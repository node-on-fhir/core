// /imports/api/imagingStudies/methods.js

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { ImagingStudies } from '/imports/lib/schemas/SimpleSchemas/ImagingStudies';

// ImagingStudy resources are patient-scoped (subject reference) — PHI-flagged.
// Legacy non-dotted names (createImagingStudy, updateImagingStudy,
// removeImagingStudy) are preserved as aliases.

Meteor.ServerMethods.define('imagingStudies.create', {
  description: 'Create a FHIR ImagingStudy resource',
  aliases: ['createImagingStudy'],
  phi: true,
  schemaObject: { type: 'object' }
}, async function(params, context){
  const imagingStudyData = params;

  context.log.debug('imagingStudies.create called', { data: imagingStudyData });

  // Ensure we have data
  if (!imagingStudyData || Object.keys(imagingStudyData).length === 0) {
    throw new Meteor.Error('invalid-data', 'No data provided for imaging study creation');
  }

  // Prepare the imaging study object
  let newImagingStudy = {
    resourceType: 'ImagingStudy',
    id: Random.id(),
    status: imagingStudyData.status || 'available',
    meta: {
      versionId: '1',
      lastUpdated: new Date()
    }
  };

  // Set the subject (patient reference)
  if (imagingStudyData.subject) {
    newImagingStudy.subject = imagingStudyData.subject;
  } else if (imagingStudyData.patientId) {
    newImagingStudy.subject = {
      reference: `Patient/${imagingStudyData.patientId}`,
      display: imagingStudyData.patientDisplay || ''
    };
  }

  // Set description
  if (imagingStudyData.description) {
    newImagingStudy.description = imagingStudyData.description;
  }

  // Set started date
  if (imagingStudyData.started) {
    newImagingStudy.started = imagingStudyData.started;
  }

  // Set modality (as array of Coding)
  context.log.debug('Modality data received', { modality: imagingStudyData.modality, display: imagingStudyData.modalityDisplay });
  if (imagingStudyData.modality) {
    if (typeof imagingStudyData.modality === 'string') {
      newImagingStudy.modality = [{
        system: 'http://dicom.nema.org/resources/ontology/DCM',
        code: imagingStudyData.modality,
        display: imagingStudyData.modalityDisplay || imagingStudyData.modality
      }];
    } else if (Array.isArray(imagingStudyData.modality)) {
      newImagingStudy.modality = imagingStudyData.modality;
    }
  }

  // Set procedure code
  if (imagingStudyData.procedureCode) {
    if (typeof imagingStudyData.procedureCode === 'string') {
      newImagingStudy.procedureCode = [{
        coding: [{
          system: 'http://loinc.org',
          code: imagingStudyData.procedureCode,
          display: imagingStudyData.procedureCodeDisplay || imagingStudyData.procedureCode
        }],
        text: imagingStudyData.procedureCodeDisplay || imagingStudyData.procedureCode
      }];
    } else if (Array.isArray(imagingStudyData.procedureCode)) {
      newImagingStudy.procedureCode = imagingStudyData.procedureCode;
    }
  }

  // Set referrer
  if (imagingStudyData.referrer) {
    newImagingStudy.referrer = imagingStudyData.referrer;
  } else if (imagingStudyData.referrerId) {
    newImagingStudy.referrer = {
      reference: `Practitioner/${imagingStudyData.referrerId}`,
      display: imagingStudyData.referrerDisplay || ''
    };
  }

  // Set encounter
  if (imagingStudyData.encounter) {
    newImagingStudy.encounter = imagingStudyData.encounter;
  } else if (imagingStudyData.encounterId) {
    newImagingStudy.encounter = {
      reference: `Encounter/${imagingStudyData.encounterId}`,
      display: imagingStudyData.encounterDisplay || ''
    };
  }

  // Set number of series and instances
  if (imagingStudyData.numberOfSeries) {
    newImagingStudy.numberOfSeries = parseInt(imagingStudyData.numberOfSeries);
  }
  if (imagingStudyData.numberOfInstances) {
    newImagingStudy.numberOfInstances = parseInt(imagingStudyData.numberOfInstances);
  }

  // Set location
  if (imagingStudyData.location) {
    newImagingStudy.location = imagingStudyData.location;
  } else if (imagingStudyData.locationId) {
    newImagingStudy.location = {
      reference: `Location/${imagingStudyData.locationId}`,
      display: imagingStudyData.locationDisplay || ''
    };
  }

  // Set reason code
  if (imagingStudyData.reasonCode) {
    newImagingStudy.reasonCode = [{
      coding: [{
        system: 'http://snomed.info/sct',
        code: imagingStudyData.reasonCode,
        display: imagingStudyData.reasonCodeDisplay || imagingStudyData.reasonCode
      }],
      text: imagingStudyData.reasonCodeDisplay || imagingStudyData.reasonCode
    }];
  }

  // Set interpreter
  if (imagingStudyData.interpreter) {
    newImagingStudy.interpreter = [{
      reference: imagingStudyData.interpreterReference || `Practitioner/${Random.id()}`,
      display: imagingStudyData.interpreter
    }];
  }

  // Set endpoint
  if (imagingStudyData.endpoint) {
    newImagingStudy.endpoint = [{
      reference: `Endpoint/${Random.id()}`,
      display: imagingStudyData.endpoint
    }];
  }

  // Set notes
  if (imagingStudyData.notes) {
    newImagingStudy.note = [{
      text: imagingStudyData.notes,
      time: new Date()
    }];
  }

  // Handle series if provided
  if (imagingStudyData.series && Array.isArray(imagingStudyData.series)) {
    newImagingStudy.series = imagingStudyData.series;
  }

  // Set MongoDB _id to match FHIR id for consistency
  newImagingStudy._id = newImagingStudy.id;

  context.log.info('Inserting new imaging study', { _id: newImagingStudy._id });

  try {
    const insertedId = await ImagingStudies.insertAsync(newImagingStudy);
    context.log.info('ImagingStudy created successfully', { insertedId: insertedId });
    return insertedId;
  } catch (error) {
    context.log.error('Error creating imaging study', { message: error.message });
    throw new Meteor.Error('insert-failed', error.message);
  }
});

Meteor.ServerMethods.define('imagingStudies.update', {
  description: 'Update an existing FHIR ImagingStudy resource',
  aliases: ['updateImagingStudy'],
  phi: true,
  positionalParams: ['imagingStudyId', 'updateData'],
  schemaObject: {
    type: 'object',
    properties: {
      imagingStudyId: { type: 'string' },
      updateData: { type: 'object' }
    },
    required: ['imagingStudyId', 'updateData']
  }
}, async function(params, context){
  const _id = params.imagingStudyId;
  const updateData = params.updateData;

  context.log.debug('imagingStudies.update called', { _id: _id });

  // Find the existing imaging study
  const existingStudy = await ImagingStudies.findOneAsync({ _id });
  if (!existingStudy) {
    throw new Meteor.Error('not-found', 'Imaging study not found');
  }

  // Build update object, preserving FHIR structure
  let updateObj = {
    ...existingStudy,
    meta: {
      ...existingStudy.meta,
      versionId: String(parseInt(existingStudy.meta?.versionId || '1') + 1),
      lastUpdated: new Date()
    }
  };

  // Update status
  if (updateData.status) {
    updateObj.status = updateData.status;
  }

  // Update description
  if (updateData.description !== undefined) {
    updateObj.description = updateData.description;
  }

  // Update started date
  if (updateData.started !== undefined) {
    updateObj.started = updateData.started;
  }

  // Update subject
  if (updateData.subject) {
    updateObj.subject = updateData.subject;
  } else if (updateData.patientId) {
    updateObj.subject = {
      reference: `Patient/${updateData.patientId}`,
      display: updateData.patientDisplay || ''
    };
  }

  // Update modality
  if (updateData.modality) {
    if (typeof updateData.modality === 'string') {
      updateObj.modality = [{
        system: 'http://dicom.nema.org/resources/ontology/DCM',
        code: updateData.modality,
        display: updateData.modalityDisplay || updateData.modality
      }];
    } else if (Array.isArray(updateData.modality)) {
      updateObj.modality = updateData.modality;
    }
  }

  // Update procedure code
  if (updateData.procedureCode) {
    if (typeof updateData.procedureCode === 'string') {
      updateObj.procedureCode = [{
        coding: [{
          system: 'http://loinc.org',
          code: updateData.procedureCode,
          display: updateData.procedureCodeDisplay || updateData.procedureCode
        }],
        text: updateData.procedureCodeDisplay || updateData.procedureCode
      }];
    } else if (Array.isArray(updateData.procedureCode)) {
      updateObj.procedureCode = updateData.procedureCode;
    }
  }

  // Update referrer
  if (updateData.referrer) {
    updateObj.referrer = updateData.referrer;
  } else if (updateData.referrerId) {
    updateObj.referrer = {
      reference: `Practitioner/${updateData.referrerId}`,
      display: updateData.referrerDisplay || ''
    };
  }

  // Update encounter
  if (updateData.encounter) {
    updateObj.encounter = updateData.encounter;
  } else if (updateData.encounterId) {
    updateObj.encounter = {
      reference: `Encounter/${updateData.encounterId}`,
      display: updateData.encounterDisplay || ''
    };
  }

  // Update numbers
  if (updateData.numberOfSeries !== undefined) {
    updateObj.numberOfSeries = parseInt(updateData.numberOfSeries);
  }
  if (updateData.numberOfInstances !== undefined) {
    updateObj.numberOfInstances = parseInt(updateData.numberOfInstances);
  }

  // Update location
  if (updateData.location) {
    updateObj.location = updateData.location;
  } else if (updateData.locationId) {
    updateObj.location = {
      reference: `Location/${updateData.locationId}`,
      display: updateData.locationDisplay || ''
    };
  }

  context.log.info('Updating imaging study', { _id: _id });

  try {
    const result = await ImagingStudies.updateAsync(
      { _id },
      { $set: updateObj }
    );
    context.log.info('ImagingStudy updated successfully', { result: result });
    return result;
  } catch (error) {
    context.log.error('Error updating imaging study', { message: error.message });
    throw new Meteor.Error('update-failed', error.message);
  }
});

Meteor.ServerMethods.define('imagingStudies.addGridfsFile', {
  description: 'Link an uploaded GridFS file to an ImagingStudy as a new series instance',
  phi: true,
  positionalParams: ['imagingStudyId', 'gridfsFileId'],
  schemaObject: {
    type: 'object',
    properties: {
      imagingStudyId: { type: 'string' },
      gridfsFileId: { type: 'string' }
    },
    required: ['imagingStudyId', 'gridfsFileId']
  }
}, async function(params, context){
  const imagingStudyId = params.imagingStudyId;
  const gridfsFileId = params.gridfsFileId;

  context.log.info('addGridfsFile called', { studyId: imagingStudyId, fileId: gridfsFileId });

  const study = await ImagingStudies.findOneAsync({ _id: imagingStudyId });
  if (!study) {
    throw new Meteor.Error('not-found', 'ImagingStudy not found');
  }

  // Build the new instance entry
  const newInstance = {
    uid: Random.id(),
    sopClass: { system: 'urn:ietf:rfc:3986', code: 'urn:oid:1.2.840.10008.5.1.4.1.1.2' },
    extension: [{ url: 'gridfsFileId', valueString: gridfsFileId }]
  };

  // Append to first series (create one if none exist)
  const series = study.series || [];
  if (series.length === 0) {
    series.push({
      uid: Random.id(),
      modality: { system: 'http://dicom.nema.org/resources/ontology/DCM', code: 'OT', display: 'Other' },
      numberOfInstances: 1,
      instance: [newInstance]
    });
  } else {
    series[0].instance = series[0].instance || [];
    series[0].instance.push(newInstance);
    series[0].numberOfInstances = series[0].instance.length;
  }

  const totalInstances = series.reduce(function(sum, s) {
    return sum + (s.instance ? s.instance.length : 0);
  }, 0);

  context.log.info('Updating study with linked file', { totalInstances: totalInstances });

  await ImagingStudies.updateAsync(
    { _id: imagingStudyId },
    { $set: { series: series, numberOfInstances: totalInstances } }
  );

  return imagingStudyId;
});

Meteor.ServerMethods.define('imagingStudies.remove', {
  description: 'Delete a FHIR ImagingStudy resource by id',
  aliases: ['removeImagingStudy'],
  phi: true,
  positionalParams: ['imagingStudyId'],
  schemaObject: {
    type: 'object',
    properties: { imagingStudyId: { type: 'string' } },
    required: ['imagingStudyId']
  }
}, async function(params, context){
  const _id = params.imagingStudyId;

  context.log.info('Removing imaging study', { _id: _id });

  try {
    const result = await ImagingStudies.removeAsync({ _id });
    context.log.info('ImagingStudy removed successfully', { result: result });
    return result;
  } catch (error) {
    context.log.error('Error removing imaging study', { message: error.message });
    throw new Meteor.Error('remove-failed', error.message);
  }
});
