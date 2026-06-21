// packages/pacio-core/lib/utilities/VehicleConfigResolver.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

/**
 * Derive dashboard configuration from a FHIR Device (CrewedVehicle) record.
 * Falls back to Meteor.settings.public.pacio when no vehicle is provided.
 *
 * @param {Object|null} vehicle - A FHIR Device document, or null
 * @returns {{ facilityName: string, facilityAddress: string, maxBeds: number, vehicleFhirId: string, dashboardPhoto: string }}
 */
export function resolveVehicleConfig(vehicle) {
  if (!vehicle) {
    return {
      facilityName: get(Meteor, 'settings.public.pacio.facilityName', "Rainbow's End Medical Home"),
      facilityAddress: get(Meteor, 'settings.public.pacio.facilityAddress', '789 Healing Way, Springfield, IL 62704'),
      maxBeds: get(Meteor, 'settings.public.pacio.maxBeds', 16),
      vehicleFhirId: '',
      dashboardPhoto: get(Meteor, 'settings.public.pacio.dashboardPhoto', '')
    };
  }

  // Extract vehicle name from deviceName array
  const vehicleName = get(vehicle, 'deviceName.0.name', '') ||
    get(vehicle, 'deviceName[0].name', '');

  // Extract mission type display as "address" (e.g., "Artemis II Mission - Lunar Orbit")
  const missionTypeDisplay = get(vehicle, 'extension.missionTypeDisplay', '');

  // Extract crew capacity from extension, then fall back to property[] array
  let crewCapacity = get(vehicle, 'extension.crewCapacity', '');
  if (!crewCapacity) {
    const properties = get(vehicle, 'property', []);
    if (Array.isArray(properties)) {
      const crewProp = properties.find(function(prop) {
        return get(prop, 'type.text') === 'crewCapacityNominal';
      });
      if (crewProp) {
        crewCapacity = get(crewProp, 'valueQuantity.0.value',
          get(crewProp, 'valueQuantity.value', ''));
      }
    }
  }

  const maxBeds = parseInt(crewCapacity, 10) ||
    get(Meteor, 'settings.public.pacio.maxBeds', 16);

  return {
    facilityName: vehicleName || get(Meteor, 'settings.public.pacio.facilityName', "Rainbow's End Medical Home"),
    facilityAddress: missionTypeDisplay || get(Meteor, 'settings.public.pacio.facilityAddress', '789 Healing Way, Springfield, IL 62704'),
    maxBeds: maxBeds,
    vehicleFhirId: get(vehicle, 'id', ''),
    dashboardPhoto: get(Meteor, 'settings.public.pacio.dashboardPhoto', '')
  };
}
