import { Observations } from '/imports/lib/schemas/SimpleSchemas/Observations';
import { check, Match } from 'meteor/check';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

export const createObservation = new ValidatedMethod({
  name: 'observations.insert',
  validate: null, // Temporarily disable validation to see if that's the issue
  run(observationData) {

    console.log("createObservation", observationData);

    // Use the actual observation data passed in, not a hardcoded object
    const newObservation = observationData;

    // Convert date strings to Date objects if needed
    if (newObservation.effectiveDateTime && typeof newObservation.effectiveDateTime === 'string') {
      newObservation.effectiveDateTime = new Date(newObservation.effectiveDateTime);
    }
    if (newObservation.issued && typeof newObservation.issued === 'string') {
      newObservation.issued = new Date(newObservation.issued);
    }

    // Add a created timestamp if not present
    if (!newObservation.issued) {
      newObservation.issued = new Date();
    }

    // if (process.env.NODE_ENV === "test") {
    //   observationData.test = true;
    // } else {
    //   observationData.test = false;
    // }

    try {
      const result = Observations.insert(newObservation);
      console.log("Observation inserted successfully, id:", result);
      return result;
    } catch (error) {
      console.error("Error inserting observation:", error);
      throw new Meteor.Error('insert-failed', `Failed to insert observation: ${error.message}`);
    }
  }
});

export const updateObservation = new ValidatedMethod({
  name: 'observations.update',
  validate({ _id }) {
    check(_id, Match.Optional(String));
  },
  run({ _id, fooUpdate }) {

    // we're going to map the foo data onto a FHIR Observation resource
    let updatedObservation = {
      resourceType: 'Observation',
      status: 'final',
      category: {
        text: ''
      },
      effectiveDateTime: new Date(),
      subject: {
        display: '',
        reference: ''
      },
      performer: {
        display: '',
        reference: ''
      },
      device: {
        display: '',
        reference: ''
      },
      valueQuantity: {
        value: '',
        unit: '%',
        system: 'http://unitsofmeasure.org'
      }
    };
    Observations.update(_id, { $set: updatedObservation });
  }
});

export const removeObservation = new ValidatedMethod({
  name: 'observations.remove',
  validate({ _id }) {
    check(_id, String);
  },
  run({ _id }) {
    Observations.remove(_id);
  }
});
