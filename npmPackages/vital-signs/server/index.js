// /packages/vital-signs/server/index.js

// Import all server-side methods
import './methods/createVitalSign';
import './methods/updateVitalSign';
import './methods/deleteVitalSign';

// Import all server-side publications
import './publications/vitalSigns';

console.log('[VitalSigns] Server methods and publications loaded');