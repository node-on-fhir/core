// packages/order-catalog/server/index.js

import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Import server methods
import './methods.js';
import './umls-methods.js';

// =============================================================================
// SERVER STARTUP
// =============================================================================

Meteor.startup(async function() {
  console.log('===========================================');
  console.log('OrderCatalog: Server Startup');
  console.log('===========================================');
  
  // Check if package is enabled
  const packageEnabled = get(Meteor, 'settings.public.modules.orderCatalog.enabled', true);
  if (!packageEnabled) {
    console.log('OrderCatalog: Package disabled in settings');
    return;
  }
  
  console.log('OrderCatalog: CPOE system initialized');
  console.log('OrderCatalog: ONC Certification - §170.315(a)(1) Medications');
  console.log('OrderCatalog: ONC Certification - §170.315(a)(2) Laboratory');
  console.log('OrderCatalog: ONC Certification - §170.315(a)(4) Drug Interactions');
  
  // Check if required collections are available
  try {
    if (typeof global.Collections !== 'undefined') {
      const ServiceRequests = global.Collections?.ServiceRequests;
      const MedicationRequests = global.Collections?.MedicationRequests;
      
      if (ServiceRequests && typeof ServiceRequests.countAsync === 'function') {
        const labOrderCount = await ServiceRequests.countAsync();
        console.log(`OrderCatalog: Found ${labOrderCount} lab orders in database`);
      }
      
      if (MedicationRequests && typeof MedicationRequests.countAsync === 'function') {
        const medOrderCount = await MedicationRequests.countAsync();
        console.log(`OrderCatalog: Found ${medOrderCount} medication orders in database`);
      }
    } else {
      console.log('OrderCatalog: Global collections not initialized yet');
    }
  } catch (error) {
    console.log('OrderCatalog: Collections check:', error.message);
  }
  
  console.log('OrderCatalog: Server startup complete');
});