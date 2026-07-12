import { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

export function useResolvedReferenceRange({ loinc, patient, observation }) {
  const [resolved, setResolved] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(function () {
    let alive = true;
    setLoading(true);
    Meteor.callAsync('referenceRanges.resolve', {
      loinc,
      patientId: get(patient, '_id'),
      observationId: get(observation, '_id')
    }).then(function (r) { if (alive) { setResolved(r); setLoading(false); } })
      .catch(function () { if (alive) { setResolved(null); setLoading(false); } });
    return function () { alive = false; };
  }, [loinc, get(patient, '_id'), get(observation, '_id')]);
  return { resolved, loading };
}
