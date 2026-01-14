// certification/tdd/base_ehr/170.315.e.1.test.js
// § 170.315(e)(1) - View, Download, and Transmit to 3rd Party
//
// OVERVIEW:
// This test verifies that patients can VIEW, DOWNLOAD, and TRANSMIT their own health
// information through a patient portal or similar interface. This is a key patient
// engagement and data access requirement that empowers patients to control their
// health data and share it with third parties of their choosing.
//
// The three core capabilities tested are:
//
// 1. VIEW - Patients can view their health information in a human-readable format
//    online. The system must display all available USCDI data categories in a way
//    that patients can understand without specialized medical training.
//
// 2. DOWNLOAD - Patients can download their health information in a machine-readable
//    format (typically C-CDA or FHIR JSON) that can be imported into other systems
//    or personal health records. The download must include all requested data.
//
// 3. TRANSMIT - Patients can transmit their health information to third parties via
//    email or other electronic means. The system must support both encrypted transmission
//    (secure by default) and unencrypted transmission (with patient consent after
//    appropriate risk warnings).
//
// Additionally, the system must maintain an activity log showing what data was viewed,
// downloaded, or transmitted, when these actions occurred, and to whom data was sent.
// This audit trail helps patients track access to their information.
//
// This test verifies the user interface elements exist for these three capabilities
// and that USCDI data categories are accessible. It does not test the actual file
// formats or transmission protocols in detail - those would be validated during
// formal certification testing.

module.exports = {
  tags: ['base-ehr', 'onc-certification', '170.315.e.1', 'vdt', 'patient-access'],

  'View Download Transmit - 170.315(e)(1)': function (browser) {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000);

    // Check if user is logged in, if not, create test patient and login
    browser.execute(function() {
      return {
        isLoggedIn: typeof Meteor !== 'undefined' && !!Meteor.userId(),
        userId: Meteor.userId ? Meteor.userId() : null
      };
    }, [], function(result) {
      if (!result.value.isLoggedIn) {
        browser.executeAsync(function(done) {
          Meteor.call('test.createTestPatient', {
            username: 'testpatient',
            email: 'patient@test.org',
            password: 'patient123'
          }, function(err, userId) {
            if (!err) {
              Meteor.loginWithPassword('testpatient', 'patient123', function(loginErr) {
                done({ loginSuccess: !loginErr, userId: Meteor.userId() });
              });
            } else {
              done({ loginSuccess: false, error: err });
            }
          });
        }, [], function() {
          console.log('✅ Test patient logged in for ONC 170.315(e)(1)');
        });
      }
    });

    // Navigate to patient portal / VDT page
    browser
      .url('http://localhost:3000/patient-data')
      .waitForElementVisible('body', 3000)
      .pause(1000);

    // Test 1: Verify VIEW capability - display health information in human-readable format
    browser.elements('css selector', '[data-testid="patient-data"], .patient-data-view, #patientDataView, .health-record', function(result) {
      if (result.value && result.value.length > 0) {
        browser.assert.ok(true, 'ONC 170.315(e)(1) - VIEW capability: Patient data display found');
      } else {
        browser.assert.ok(false, 'ONC 170.315(e)(1) - No patient data view found');
      }
    });

    // Test 2: Verify USCDI data is viewable
    browser.execute(function() {
      // Check for presence of key USCDI data elements
      const uscdiElements = {
        demographics: !!document.querySelector('[data-testid="demographics"], .demographics-section'),
        problems: !!document.querySelector('[data-testid="problems"], .problem-list, .conditions'),
        medications: !!document.querySelector('[data-testid="medications"], .medication-list'),
        allergies: !!document.querySelector('[data-testid="allergies"], .allergy-list'),
        labResults: !!document.querySelector('[data-testid="lab-results"], .laboratory-results'),
        vitals: !!document.querySelector('[data-testid="vitals"], .vital-signs'),
        procedures: !!document.querySelector('[data-testid="procedures"], .procedure-list'),
        immunizations: !!document.querySelector('[data-testid="immunizations"], .immunization-list')
      };

      const elementCount = Object.values(uscdiElements).filter(Boolean).length;

      return {
        uscdiElements: uscdiElements,
        elementCount: elementCount,
        hasUSCDIData: elementCount >= 4 // Need several USCDI categories
      };
    }, [], function(result) {
      browser.assert.ok(
        result.value.hasUSCDIData,
        'ONC 170.315(e)(1) - USCDI data viewable (' + result.value.elementCount + ' categories found)'
      );
    });

    // Test 3: Verify DOWNLOAD capability exists
    browser.elements('css selector', '[data-testid="download"], .download-button, #downloadData, button:contains("Download")', function(result) {
      if (result.value && result.value.length > 0) {
        browser.assert.ok(true, 'ONC 170.315(e)(1) - DOWNLOAD capability found');
      } else {
        // Check for download icon or link
        browser.execute(function() {
          const downloadElements = Array.from(document.querySelectorAll('button, a, [role="button"]'))
            .filter(el => {
              const text = el.textContent.toLowerCase();
              const title = (el.getAttribute('title') || '').toLowerCase();
              return text.includes('download') || title.includes('download') ||
                     el.classList.contains('download') || el.id.includes('download');
            });
          return { hasDownload: downloadElements.length > 0 };
        }, [], function(downloadResult) {
          browser.assert.ok(
            downloadResult.value.hasDownload,
            'ONC 170.315(e)(1) - DOWNLOAD capability exists'
          );
        });
      }
    });

    // Test 4: Verify TRANSMIT capability exists
    browser.elements('css selector', '[data-testid="transmit"], .transmit-button, #transmitData, [data-testid="share"], .share-button', function(result) {
      if (result.value && result.value.length > 0) {
        browser.assert.ok(true, 'ONC 170.315(e)(1) - TRANSMIT capability found');
      } else {
        // Check for transmit/share/send buttons
        browser.execute(function() {
          const transmitElements = Array.from(document.querySelectorAll('button, a, [role="button"]'))
            .filter(el => {
              const text = el.textContent.toLowerCase();
              const title = (el.getAttribute('title') || '').toLowerCase();
              return text.includes('transmit') || text.includes('share') || text.includes('send') ||
                     title.includes('transmit') || title.includes('share') ||
                     el.classList.contains('transmit') || el.classList.contains('share');
            });
          return { hasTransmit: transmitElements.length > 0 };
        }, [], function(transmitResult) {
          browser.assert.ok(
            transmitResult.value.hasTransmit,
            'ONC 170.315(e)(1) - TRANSMIT capability exists'
          );
        });
      }
    });

    // Test 5: Verify activity log / audit trail capability
    browser.execute(function() {
      // Look for activity log, audit trail, or access history
      const hasActivityLog = document.querySelector('[data-testid="activity-log"], .activity-log, #activityLog, .access-history, [data-testid="audit-trail"]');

      return {
        hasActivityLog: !!hasActivityLog
      };
    }, [], function(result) {
      if (result.value.hasActivityLog) {
        browser.assert.ok(true, 'ONC 170.315(e)(1) - Activity log capability found');
      } else {
        // Try navigating to activity log page
        browser
          .url('http://localhost:3000/activity-log')
          .waitForElementVisible('body', 2000)
          .pause(500);

        browser.execute(function() {
          return {
            hasActivityPage: !document.body.textContent.includes('404') &&
                           !document.body.textContent.includes('Page not found')
          };
        }, [], function(activityResult) {
          browser.assert.ok(
            activityResult.value.hasActivityPage,
            'ONC 170.315(e)(1) - Activity log page exists'
          );
        });

        // Navigate back to patient data page
        browser
          .url('http://localhost:3000/patient-data')
          .waitForElementVisible('body', 2000);
      }
    });

    // Test 6: Verify machine-readable format capability (C-CDA or FHIR)
    browser.execute(function() {
      // Check if download supports machine-readable formats
      const hasCCDA = document.body.textContent.includes('C-CDA') ||
                     document.body.textContent.includes('CCDA') ||
                     document.body.textContent.includes('CCD');
      const hasFHIR = document.body.textContent.includes('FHIR') ||
                     document.body.textContent.includes('JSON');

      return {
        hasCCDA: hasCCDA,
        hasFHIR: hasFHIR,
        hasMachineReadable: hasCCDA || hasFHIR
      };
    }, [], function(result) {
      browser.assert.ok(
        result.value.hasMachineReadable,
        'ONC 170.315(e)(1) - Machine-readable format supported (C-CDA: ' +
        result.value.hasCCDA + ', FHIR: ' + result.value.hasFHIR + ')'
      );
    });

    // Test 7: Verify encryption / security options for transmission
    browser.execute(function() {
      // Look for encryption indicators or secure transmission options
      const hasEncryption = document.body.textContent.toLowerCase().includes('encrypt') ||
                          document.body.textContent.toLowerCase().includes('secure') ||
                          document.body.textContent.toLowerCase().includes('direct');

      return {
        hasEncryptionSupport: hasEncryption
      };
    }, [], function(result) {
      browser.assert.ok(
        result.value.hasEncryptionSupport,
        'ONC 170.315(e)(1) - Encryption/secure transmission support indicated'
      );
    });

    // Check that we're not on an error page
    browser.assert.not.textContains('body', '404');
    browser.assert.not.textContains('body', 'Page not found');

    // Log success
    browser.perform(function() {
      console.log('✅ ONC 170.315(e)(1) - View, Download, Transmit test completed');
      console.log('📋 Verified:');
      console.log('   - VIEW: Human-readable health information display');
      console.log('   - VIEW: USCDI data categories accessible');
      console.log('   - DOWNLOAD: Download capability exists');
      console.log('   - DOWNLOAD: Machine-readable format support (C-CDA/FHIR)');
      console.log('   - TRANSMIT: Transmit to 3rd party capability');
      console.log('   - TRANSMIT: Encryption/secure transmission support');
      console.log('   - AUDIT: Activity log/audit trail capability');
    });

    browser
      .saveScreenshot('tests/screenshots/base-ehr_170.315.e.1_vdt.png')
      .perform(function() {
        console.log('📸 Screenshot saved for ONC 170.315(e)(1)');
      })
      .end();
  }
};
