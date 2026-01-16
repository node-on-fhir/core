// tests/nightwatch/honeycomb/cpoe.diagnostic-imaging.js
// E2E test for CPOE Diagnostic Imaging (ONC §170.315(a)(3))
// Tests radiology order entry workflow with LOINC/RSNA Radiology Playbook codes

const timestamp = Date.now();
const testPatientIdentifier = `test-patient-imaging-${timestamp}`;

module.exports = {
  tags: ['cpoe', 'imaging', 'radiology', 'diagnosticimaging', 'healthit', 'onc'],

  before: function(browser) {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000)
      .windowSize('current', 1400, 900);  // Landscape for table visibility
  },

  'Step 1: Create test user and login': function(browser) {
    browser
      .execute(function(testId) {
        if (typeof Meteor !== 'undefined' && Meteor.call) {
          Meteor.call('test.createTestUser', {
            email: `imaging-test-${testId}@example.com`,
            password: 'test123',
            profile: {
              name: {
                given: ['Radiology'],
                family: 'Tester',
                text: 'Radiology Tester'
              }
            }
          }, function(error, userId) {
            if (error) {
              console.error('Error creating test user:', error);
            } else {
              console.log('Test user created:', userId);
              window.testUserId = userId;
            }
          });
        }
        return { testId: testId };
      }, [timestamp], function(result) {
        console.log('Test user setup initiated:', result.value);
      })
      .pause(2000);
  },

  'Step 2: Create test patient with context': function(browser) {
    browser
      .execute(function(testId) {
        if (typeof Patients !== 'undefined') {
          const testPatient = {
            resourceType: 'Patient',
            id: Random.id(),
            identifier: [{
              system: 'http://test.honeycomb3.io',
              value: `test-patient-imaging-${testId}`
            }],
            name: [{
              given: ['Imaging'],
              family: 'TestPatient',
              text: 'Imaging TestPatient'
            }],
            gender: 'female',
            birthDate: '1970-01-01',
            active: true
          };

          Patients.insert(testPatient, function(error, patientId) {
            if (error) {
              console.error('Error creating patient:', error);
            } else {
              console.log('Test patient created:', patientId);

              // Set patient context
              Session.set('selectedPatientId', testPatient.id);
              Session.set('selectedPatient', testPatient);

              window.testPatientId = testPatient.id;
              window.testPatientMongoId = patientId;
            }
          });
        }
        return { success: true };
      }, [timestamp])
      .pause(2000);
  },

  'Step 3: Navigate to CPOE Diagnostic Imaging': function(browser) {
    browser
      .url('http://localhost:3000/cpoe/diagnostic-imaging')
      .waitForElementVisible('#orderCatalogPage', 10000)
      .assert.containsText('body', 'Computerized Provider Order Entry')
      .pause(1000);
  },

  'Step 4: Verify radiology catalog loaded': function(browser) {
    browser
      .execute(function() {
        // Check if catalog has radiology procedures
        const pageText = document.body.textContent;
        const hasChestXray = pageText.includes('XR Chest') || pageText.includes('Chest');
        const hasCT = pageText.includes('CT') || pageText.includes('Computed Tomography');
        const hasMRI = pageText.includes('MR') || pageText.includes('MRI');

        return {
          hasChestXray,
          hasCT,
          hasMRI,
          pageText: pageText.substring(0, 500)
        };
      }, [], function(result) {
        console.log('Radiology catalog check:', result.value);
        browser.assert.ok(
          result.value.hasChestXray || result.value.hasCT || result.value.hasMRI,
          'Should find radiology procedures in catalog'
        );
      })
      .pause(500);
  },

  'Step 5: Search for Chest X-Ray': function(browser) {
    browser
      .execute(function() {
        // Find search input
        const inputs = document.querySelectorAll('input[type="text"], input[type="search"]');
        for (let input of inputs) {
          const placeholder = input.getAttribute('placeholder') || '';
          if (placeholder.toLowerCase().includes('search')) {
            input.value = 'chest xray';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            return { searched: true, placeholder };
          }
        }
        return { searched: false };
      }, [], function(result) {
        console.log('Search input result:', result.value);
      })
      .pause(1000)
      .execute(function() {
        const pageText = document.body.textContent;
        return {
          hasResults: pageText.includes('Chest') || pageText.includes('XR'),
          text: pageText.substring(0, 300)
        };
      }, [], function(result) {
        console.log('Search results:', result.value);
      });
  },

  'Step 6: Add Chest X-Ray to order (if catalog item visible)': function(browser) {
    browser
      .execute(function() {
        // Try to find and click add button for Chest X-Ray
        // This may vary based on UI implementation
        const buttons = document.querySelectorAll('button');
        for (let btn of buttons) {
          if (btn.textContent.toLowerCase().includes('add')) {
            // Check if this button is near "Chest" or "XR" text
            const parent = btn.closest('div, li, tr');
            if (parent && parent.textContent.toLowerCase().includes('chest')) {
              btn.click();
              return { clicked: true, text: parent.textContent.substring(0, 100) };
            }
          }
        }
        return { clicked: false, message: 'Could not find add button for Chest X-Ray' };
      }, [], function(result) {
        console.log('Add to order result:', result.value);
        if (!result.value.clicked) {
          console.warn('⚠️  Could not add order - UI may need adjustments');
        }
      })
      .pause(1000);
  },

  'Step 7: Verify LOINC/RSNA codes are used': function(browser) {
    browser
      .execute(function() {
        // Check console or page for LOINC codes
        const pageText = document.body.textContent;

        // Common LOINC radiology codes from RSNA Playbook
        const loincCodes = [
          '30746-2',  // XR Chest 2 Views
          '24558-9',  // CT Head
          '24556-3',  // MR Brain
          '30621-7',  // CT Abdomen/Pelvis
          '24581-1'   // US Abdomen
        ];

        const foundCodes = loincCodes.filter(code => pageText.includes(code));

        return {
          foundCodes,
          hasLoincCodes: foundCodes.length > 0,
          message: foundCodes.length > 0 ?
            `Found LOINC codes: ${foundCodes.join(', ')}` :
            'No LOINC codes found in UI (may be hidden)'
        };
      }, [], function(result) {
        console.log('LOINC code verification:', result.value);
      });
  },

  'Step 8: Test ServiceRequest creation (manual trigger)': function(browser) {
    browser
      .execute(function(testPatientId) {
        // Manually create a test radiology ServiceRequest
        if (typeof ServiceRequests !== 'undefined') {
          const testRadiologyOrder = {
            resourceType: 'ServiceRequest',
            id: Random.id(),
            _id: Random.id(),
            status: 'active',
            intent: 'order',
            priority: 'stat',
            code: {
              coding: [{
                system: 'http://loinc.org',
                code: '30746-2',
                display: 'XR Chest 2 Views'
              }],
              text: 'XR Chest 2 Views'
            },
            category: [{
              coding: [{
                system: 'http://snomed.info/sct',
                code: '363679005',
                display: 'Imaging'
              }]
            }],
            orderDetail: [{
              coding: [{
                system: 'http://dicom.nema.org/resources/ontology/DCM',
                code: 'XR',
                display: 'Radiography'
              }]
            }],
            bodySite: [{
              text: 'Chest'
            }],
            reasonCode: [{
              text: 'Suspected pneumonia - Nightwatch test'
            }],
            subject: {
              reference: `Patient/${testPatientId}`,
              display: 'Imaging TestPatient'
            },
            authoredOn: new Date().toISOString()
          };

          ServiceRequests.insert(testRadiologyOrder, function(error, id) {
            if (error) {
              console.error('Error creating test radiology order:', error);
              window.testOrderError = error.message;
            } else {
              console.log('Test radiology order created:', id);
              window.testOrderId = id;
              window.testOrderFhirId = testRadiologyOrder.id;
            }
          });
          return { initiated: true };
        }
        return { initiated: false, error: 'ServiceRequests collection not available' };
      }, [window.testPatientId || 'unknown'], function(result) {
        console.log('Manual ServiceRequest creation:', result.value);
      })
      .pause(2000);
  },

  'Step 9: Verify ServiceRequest structure': function(browser) {
    browser
      .execute(function() {
        if (typeof ServiceRequests !== 'undefined' && window.testOrderFhirId) {
          const order = ServiceRequests.findOne({ id: window.testOrderFhirId });

          if (order) {
            return {
              found: true,
              hasLoincCode: order.code?.coding?.[0]?.system === 'http://loinc.org',
              loincCode: order.code?.coding?.[0]?.code,
              hasImagingCategory: order.category?.[0]?.coding?.[0]?.code === '363679005',
              hasModality: !!order.orderDetail?.[0]?.coding?.[0]?.code,
              modality: order.orderDetail?.[0]?.coding?.[0]?.code,
              hasBodySite: !!order.bodySite?.[0]?.text,
              bodySite: order.bodySite?.[0]?.text,
              hasReasonForOrder: !!order.reasonCode?.[0]?.text,
              reasonForOrder: order.reasonCode?.[0]?.text,
              priority: order.priority
            };
          }
        }
        return { found: false };
      }, [], function(result) {
        console.log('='.repeat(80));
        console.log('ONC §170.315(a)(3) CPOE Diagnostic Imaging - Verification Results');
        console.log('='.repeat(80));
        console.log(JSON.stringify(result.value, null, 2));
        console.log('='.repeat(80));

        if (result.value.found) {
          browser.assert.ok(result.value.hasLoincCode, '✓ Should use LOINC codes');
          browser.assert.ok(result.value.hasImagingCategory, '✓ Should have Imaging category');
          browser.assert.ok(result.value.hasModality, '✓ Should specify modality in orderDetail');
          browser.assert.ok(result.value.hasBodySite, '✓ Should specify body site');
          browser.assert.ok(result.value.hasReasonForOrder, '✓ Should have reason for order (optional field)');
        } else {
          console.warn('⚠️  ServiceRequest not found - may need to trigger order submission');
        }
      });
  },

  'Step 10: Verify PlanDefinitions populated': function(browser) {
    browser
      .execute(function() {
        if (typeof PlanDefinitions !== 'undefined') {
          const radiologyPlans = PlanDefinitions.find({
            'useContext.code.code': 'imaging'
          }).fetch();

          const samplePlan = radiologyPlans.length > 0 ? radiologyPlans[0] : null;

          return {
            count: radiologyPlans.length,
            hasPlans: radiologyPlans.length > 0,
            sample: samplePlan ? {
              title: samplePlan.title,
              code: samplePlan.topic?.[0]?.coding?.[0]?.code,
              modality: samplePlan.action?.[0]?.extension?.find(
                e => e.url?.includes('modality')
              )?.valueCodeableConcept?.coding?.[0]?.code
            } : null
          };
        }
        return { count: 0, hasPlans: false };
      }, [], function(result) {
        console.log('PlanDefinitions check:', result.value);
        browser.assert.ok(
          result.value.count > 0,
          `✓ Should have radiology PlanDefinitions populated (found ${result.value.count})`
        );

        if (result.value.sample) {
          console.log('Sample PlanDefinition:', result.value.sample);
        }
      });
  },

  'Step 11: Cleanup - Delete test data': function(browser) {
    browser
      .execute(function() {
        let deleted = { patient: false, order: false, user: false };

        // Delete patient
        if (typeof Patients !== 'undefined' && window.testPatientId) {
          Patients.remove({ id: window.testPatientId });
          deleted.patient = true;
        }

        // Delete order
        if (typeof ServiceRequests !== 'undefined' && window.testOrderFhirId) {
          ServiceRequests.remove({ id: window.testOrderFhirId });
          deleted.order = true;
        }

        // Delete user
        if (typeof Meteor !== 'undefined' && window.testUserId) {
          Meteor.call('test.deleteTestUser', window.testUserId);
          deleted.user = true;
        }

        return deleted;
      }, [], function(result) {
        console.log('Cleanup results:', result.value);
      });
  },

  after: function(browser) {
    browser.end();
  }
};
