// npmPackages/implantable-devices/lib/services.js
//
// Static config for the /add-a-device "App or data export" branch: consumer
// health services whose exports (or future live feeds) can register a device.

export const SERVICES = [
  {
    id: 'apple',
    name: 'Apple Health',
    sub: 'Export .zip from the Health app',
    device: 'Apple Watch',
    streams: ['Heart rate', 'Steps & activity', 'Sleep', 'Blood oxygen', 'ECG'],
    exportHint: 'Health app → profile picture → Export All Health Data produces a .zip.'
  },
  {
    id: 'fitbit',
    name: 'Fitbit / Google',
    sub: 'Google Takeout export',
    device: 'Fitbit tracker',
    streams: ['Heart rate', 'Steps & activity', 'Sleep'],
    exportHint: 'Request a Fitbit data archive via Google Takeout.'
  },
  {
    id: 'dexcom',
    name: 'Dexcom',
    sub: 'Clarity CSV export',
    device: 'Dexcom CGM',
    streams: ['Glucose', 'Alerts'],
    exportHint: 'Dexcom Clarity → Export produces a CSV of glucose readings.'
  },
  {
    id: 'withings',
    name: 'Withings',
    sub: 'Health Mate data export',
    device: 'Withings scale',
    streams: ['Weight', 'Body composition'],
    exportHint: 'Health Mate → Settings → Download my data emails a .zip.'
  },
  {
    id: 'garmin',
    name: 'Garmin',
    sub: 'Garmin Connect export',
    device: 'Garmin watch',
    streams: ['Heart rate', 'Steps & activity', 'Sleep', 'GPS & workouts'],
    exportHint: 'Garmin Connect → Account → Data Management → Export Your Data emails a .zip.'
  },
  {
    id: 'other',
    name: 'Other',
    sub: 'Any app or device export',
    device: '',
    streams: [],
    exportHint: 'Most health apps offer a data export under settings or privacy.'
  }
];

export function findService(serviceId) {
  return SERVICES.find(function(service) { return service.id === serviceId; }) || null;
}
