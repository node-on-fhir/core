// /imports/api/imagingStudies/methods.js

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { ImagingStudies } from '/imports/lib/schemas/SimpleSchemas/ImagingStudies';

Meteor.methods({
  'createImagingStudy': async function(imagingStudyData) {
    console.log('createImagingStudy method called with:', JSON.stringify(imagingStudyData, null, 2));
    console.log('Arguments received:', arguments.length, 'args');
    console.log('Full arguments:', JSON.stringify(Array.from(arguments), null, 2));
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to create an imaging study');
    }

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
    console.log('Modality data received:', imagingStudyData.modality, 'Display:', imagingStudyData.modalityDisplay);
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

    console.log('Inserting new imaging study:', newImagingStudy);

    try {
      const insertedId = await ImagingStudies.insertAsync(newImagingStudy);
      console.log('ImagingStudy created successfully with ID:', insertedId);
      return insertedId;
    } catch (error) {
      console.error('Error creating imaging study:', error);
      throw new Meteor.Error('insert-failed', error.message);
    }
  },

  'updateImagingStudy': async function(_id, updateData) {
    console.log('updateImagingStudy method called with ID:', _id, 'and data:', updateData);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to update an imaging study');
    }

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

    console.log('Updating imaging study with:', updateObj);

    try {
      const result = await ImagingStudies.updateAsync(
        { _id },
        { $set: updateObj }
      );
      console.log('ImagingStudy updated successfully:', result);
      return result;
    } catch (error) {
      console.error('Error updating imaging study:', error);
      throw new Meteor.Error('update-failed', error.message);
    }
  },

  'removeImagingStudy': async function(_id) {
    console.log('removeImagingStudy method called with ID:', _id);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'You must be logged in to delete an imaging study');
    }

    try {
      const result = await ImagingStudies.removeAsync({ _id });
      console.log('ImagingStudy removed successfully:', result);
      return result;
    } catch (error) {
      console.error('Error removing imaging study:', error);
      throw new Meteor.Error('remove-failed', error.message);
    }
  }
});