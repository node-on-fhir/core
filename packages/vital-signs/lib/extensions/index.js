// packages/vital-signs/lib/extensions/index.js
export { AssociatedSituationExtension } from './AssociatedSituation';
export { BodyPositionExtension } from './BodyPosition';
export { ExerciseAssociationExtension } from './ExerciseAssociation';
export { MeasurementDeviceExtension } from './MeasurementDevice';
export { MeasurementSettingExtension } from './MeasurementSetting';
export { SleepStatusExtension } from './SleepStatus';

// Extension URLs
export const ExtensionUrls = {
  associatedSituation: 'http://hl7.org/fhir/us/vitals/StructureDefinition/AssociatedSituationExt',
  bodyPosition: 'http://hl7.org/fhir/us/vitals/StructureDefinition/BodyPositionExt',
  exerciseAssociation: 'http://hl7.org/fhir/us/vitals/StructureDefinition/ExerciseAssociationExt',
  measurementDevice: 'http://hl7.org/fhir/us/vitals/StructureDefinition/MeasurementDeviceExt',
  measurementSetting: 'http://hl7.org/fhir/us/vitals/StructureDefinition/MeasurementSettingExt',
  sleepStatus: 'http://hl7.org/fhir/us/vitals/StructureDefinition/SleepStatusExt'
};