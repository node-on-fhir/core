// tests/nightwatch/honeycomb/enable_autopublish/crud.documentreferences.js

const testUtils = require('./shared-test-utils');

describe('DocumentReferences CRUD Operations', function() {
  const timestamp = Date.now();
  const testDocumentReference = {
    status: 'current',
    type: `Clinical Note ${timestamp}`,
    typeCode: '34133-9',
    typeDisplay: 'Summary of episode note',
    description: `Test document reference ${timestamp}`,
    created: new Date().toISOString(),
    contentType: 'application/pdf',
    contentUrl: `http://example.com/documents/${timestamp}.pdf`,
    contentTitle: `Test Document ${timestamp}`,
    contentSize: 123456,
    patientName: 'John Doe',
    notes: `Test document reference created at ${timestamp}`
  };

  const updatedDocumentReference = {
    status: 'superseded',
    type: `Updated Clinical Note ${timestamp}`,
    description: `Updated test document reference ${timestamp}`,
    notes: `Test document reference updated at ${timestamp}`
  };

  before(browser => {
    console.log('Starting DocumentReferences CRUD test suite...');
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000);
  });

  beforeEach(browser => {
    browser.pause(500);
  });

  it('01. Setup test environment', browser => {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000)
      .pause(2000)
      .execute(function(ts) {
        window.testTimestamp = ts;
      }, [timestamp]);

    // Check if we're logged in
    browser.execute(function() {
      return {
        isLoggedIn: typeof Meteor !== 'undefined' && !!Meteor.userId(),
        userId: Meteor.userId ? Meteor.userId() : null,
        username: Meteor.user ? (Meteor.user() ? Meteor.user().username : null) : null
      };
    }, [], function(result) {
      console.log('Initial login state:', result.value);
      
      if (!result.value.isLoggedIn) {
        console.log('Not logged in, attempting programmatic login...');
        
        browser.executeAsync(function(done) {
          if (typeof Meteor !== 'undefined') {
            Meteor.call('test.createTestUser', {
              username: 'janedoe',
              email: 'janedoe@test.org',
              password: 'janedoe123'
            }, function(err, userId) {
              if (err) {
                console.error('Failed to create test user:', err);
                done({ userCreated: false, error: err.message });
              } else {
                console.log('Test user ready, userId:', userId);
                Meteor.loginWithPassword('janedoe', 'janedoe123', function(loginErr) {
                  if (loginErr) {
                    console.error('Login failed:', loginErr);
                    done({ userCreated: true, loginSuccess: false, error: loginErr.message });
                  } else {
                    console.log('Login successful');
                    done({ 
                      userCreated: true,
                      loginSuccess: true, 
                      userId: Meteor.userId(), 
                      username: Meteor.user() ? Meteor.user().username : null 
                    });
                  }
                });
              }
            });
          } else {
            done({ userCreated: false, loginSuccess: false, error: 'Meteor not available' });
          }
        }, [], function(result) {
          if (result.value.loginSuccess) {
            browser.assert.ok(true, 'Successfully created test user and logged in');
            console.log('Logged in as:', result.value.username, 'userId:', result.value.userId);
            
            // Create a test patient
            testUtils.createTestPatient(browser, {
              name: 'John Doe',
              family: 'Doe',
              given: 'John',
              identifier: 'test-patient-' + timestamp
            }, function(result) {
              if (result.error) {
                console.error('Failed to create test patient:', result.error);
                browser.assert.fail('Failed to create test patient: ' + result.error);
              } else {
                console.log('Test patient created with ID:', result.result);
                browser.assert.ok(true, 'Successfully created test patient');
                
                // Set the patient in Session
                browser.execute(function(patientId) {
                  if (typeof Session !== 'undefined' && typeof Patients !== 'undefined') {
                    const patient = Patients.findOne({_id: patientId});
                    if (patient) {
                      Session.set('selectedPatientId', patientId);
                      Session.set('selectedPatient', patient);
                      console.log('Set selected patient in Session:', patientId);
                    }
                  }
                }, [result.result]);
              }
            });
          } else {
            browser.assert.fail('Setup failed: ' + result.value.error);
          }
        });
        
        browser.pause(1000);
      } else {
        browser.assert.ok(true, 'Already logged in (autologin enabled)');
        console.log('Already logged in as:', result.value.username, 'userId:', result.value.userId);
        
        // Create a test patient even if already logged in
        testUtils.createTestPatient(browser, {
          name: 'John Doe',
          family: 'Doe',
          given: 'John',
          identifier: 'test-patient-' + timestamp
        }, function(result) {
          if (result.error) {
            console.error('Failed to create test patient:', result.error);
            browser.assert.fail('Failed to create test patient: ' + result.error);
          } else {
            console.log('Test patient created with ID:', result.result);
            browser.assert.ok(true, 'Successfully created test patient');
            
            // Set the patient in Session
            browser.execute(function(patientId) {
              if (typeof Session !== 'undefined' && typeof Patients !== 'undefined') {
                const patient = Patients.findOne({_id: patientId});
                if (patient) {
                  Session.set('selectedPatientId', patientId);
                  Session.set('selectedPatient', patient);
                  console.log('Set selected patient in Session:', patientId);
                }
              }
            }, [result.result]);
          }
        });
      }
      
      // Clean up any existing test data
      browser.executeAsync(function(done) {
        if (typeof DocumentReferences !== 'undefined') {
          const testDocuments = DocumentReferences.find({ 
            $or: [
              { 'type.text': { $regex: '.*Clinical Note.*' } },
              { 'description': { $regex: 'Test document reference.*' } },
              { 'content.0.attachment.title': { $regex: 'Test Document.*' } }
            ]
          }).fetch();
          testDocuments.forEach(function(doc) {
            DocumentReferences.remove({ _id: doc._id });
          });
          console.log('Cleared', testDocuments.length, 'test document references');
        }
        done();
      });
      
      browser.pause(2000);
      
      // Re-establish patient context
      browser.execute(function(testIdentifier) {
        console.log('Looking for patient with identifier:', testIdentifier);
        
        if (typeof Session !== 'undefined' && typeof Patients !== 'undefined') {
          const allPatients = Patients.find({}).fetch();
          console.log('Total patients in collection:', allPatients.length);
          
          let patient = Patients.findOne({
            'identifier.value': testIdentifier
          });
          
          if (!patient) {
            console.log('Patient not found by identifier, trying by name...');
            patient = Patients.findOne({
              $or: [
                { 'name.0.text': { $regex: 'John.*Doe' } },
                { 'name.0.family': 'Doe' },
                { 'name.0.given.0': 'John' }
              ]
            });
          }
          
          if (!patient && allPatients.length > 0) {
            console.log('Patient not found by name, using most recent patient');
            patient = Patients.findOne({}, { sort: { _id: -1 } });
          }
          
          if (patient) {
            console.log('Found patient:', patient._id, patient.name?.[0]?.text);
            Session.set('selectedPatientId', patient._id);
            Session.set('selectedPatient', patient);
            return { success: true, patientId: patient._id, patientName: patient.name?.[0]?.text };
          } else {
            console.error('Could not find any patient');
            return { success: false, error: 'No patients found in collection' };
          }
        }
        return { success: false, error: 'Session or Patients not available' };
      }, ['test-patient-' + timestamp], function(result) {
        console.log('Patient selection check:', result.value);
        if (result.value.success) {
          browser.assert.ok(true, `Patient selected: ${result.value.patientName}`);
        } else {
          console.error('Failed to set selected patient:', result.value.error);
        }
      });
    });
  });

  it('02. Verify document references list page loads', browser => {
    browser
      .url('http://localhost:3000/document-references')
      .waitForElementVisible('#documentReferencesPage', 5000)
      .pause(2000)
      .execute(function() {
        const hasTable = document.querySelector('#documentReferencesTable') !== null;
        const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                            document.querySelector('.no-data-available') !== null ||
                            document.querySelector('[id*="no-data"]') !== null ||
                            (document.querySelector('#documentReferencesPage') && 
                             document.querySelector('#documentReferencesPage').textContent.includes('No Data Available'));
        return {
          hasTable: hasTable,
          hasNoDataCard: hasNoDataCard,
          hasEitherElement: hasTable || hasNoDataCard
        };
      }, [], function(result) {
        browser.assert.equal(result.value.hasEitherElement, true, 'Either document references table or no-data message is present');
      })
      .saveScreenshot('tests/nightwatch/screenshots/document-references/02-document-references-list.png');
  });

  it('03. Navigate to new document reference form', browser => {
    browser
      .waitForElementVisible('#documentReferencesPage', 5000)
      .pause(500);

    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Add Document Reference') || 
              button.textContent.includes('Add Your First Document Reference')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Add Document Reference button');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#documentReferenceDetailPage', 5000)
      .assert.elementPresent('#statusSelect')
      .assert.elementPresent('#typeInput')
      .assert.elementPresent('#typeDisplayInput')
      .assert.elementPresent('#descriptionInput')
      .assert.elementPresent('#createdInput')
      .assert.elementPresent('#contentTypeInput')
      .assert.elementPresent('#contentUrlInput')
      .assert.elementPresent('#contentTitleInput')
      .assert.elementPresent('#contentSizeInput')
      .assert.elementPresent('#subjectDisplay')
      .assert.elementPresent('#notesTextarea')
      .pause(1000)
      .execute(function() {
        const subjectField = document.querySelector('#subjectDisplay');
        return {
          subjectValue: subjectField ? subjectField.value : null,
          sessionPatientId: typeof Session !== 'undefined' ? Session.get('selectedPatientId') : null,
          sessionPatient: typeof Session !== 'undefined' ? Session.get('selectedPatient') : null
        };
      }, [], function(result) {
        console.log('Form initialization check:', result.value);
      })
      .saveScreenshot('tests/nightwatch/screenshots/document-references/03-new-document-reference-form.png');
  });

  it('04. Create new document reference', browser => {
    browser
      .waitForElementVisible('#documentReferenceDetailPage', 5000)
      .pause(500);

    // Check if we're on the new document reference page
    browser.assert.urlContains('/document-references/new');

    // Check subject field and populate if empty
    browser.execute(function() {
      const subjectField = document.querySelector('#subjectDisplay');
      let subjectFieldValue = subjectField ? subjectField.value : '';
      
      if (subjectField && !subjectFieldValue && typeof Session !== 'undefined') {
        const selectedPatient = Session.get('selectedPatient');
        if (selectedPatient) {
          let patientName = '';
          if (selectedPatient.name) {
            if (typeof selectedPatient.name === 'string') {
              patientName = selectedPatient.name;
            } else if (Array.isArray(selectedPatient.name) && selectedPatient.name[0]) {
              patientName = selectedPatient.name[0].text || 
                          `${selectedPatient.name[0].given?.join(' ') || ''} ${selectedPatient.name[0].family || ''}`.trim();
            }
          }
          
          if (patientName) {
            subjectField.value = patientName;
            subjectField.dispatchEvent(new Event('input', { bubbles: true }));
            subjectField.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('Manually set subject field to:', patientName);
            subjectFieldValue = patientName;
          }
        }
      }
      
      return {
        subjectFieldValue: subjectFieldValue,
        subjectFieldId: subjectField ? subjectField.id : 'field not found',
        wasEmpty: !subjectFieldValue
      };
    }, [], function(result) {
      console.log('Subject field check:', result.value);
    });

    // Check if form is in edit mode
    browser.execute(function() {
      const typeField = document.querySelector('#typeInput');
      if (typeField && typeField.disabled) {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Edit')) {
            button.click();
            return 'clicked_edit';
          }
        }
      }
      return 'already_editable';
    }, [], function(result) {
      console.log('Edit mode check:', result.value);
    });

    // Fill form fields
    browser
      .pause(500)
      .clearValue('#typeInput')
      .setValue('#typeInput', testDocumentReference.type)
      .clearValue('#typeDisplayInput')
      .setValue('#typeDisplayInput', testDocumentReference.typeDisplay)
      .clearValue('#descriptionInput')
      .setValue('#descriptionInput', testDocumentReference.description)
      .clearValue('#createdInput')
      .setValue('#createdInput', testDocumentReference.created.split('T')[0])
      .clearValue('#contentTypeInput')
      .setValue('#contentTypeInput', testDocumentReference.contentType)
      .clearValue('#contentUrlInput')
      .setValue('#contentUrlInput', testDocumentReference.contentUrl)
      .clearValue('#contentTitleInput')
      .setValue('#contentTitleInput', testDocumentReference.contentTitle)
      .clearValue('#contentSizeInput')
      .setValue('#contentSizeInput', testDocumentReference.contentSize.toString())
      .clearValue('#notesTextarea')
      .setValue('#notesTextarea', testDocumentReference.notes)
      .pause(500);

    // Also use execute method as fallback
    browser.execute(function(doc) {
      function setFieldValue(selector, value) {
        const field = document.querySelector(selector);
        if (field) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype, 
            'value'
          ).set;
          nativeInputValueSetter.call(field, value);
          
          const inputEvent = new Event('input', { bubbles: true });
          field.dispatchEvent(inputEvent);
          
          const changeEvent = new Event('change', { bubbles: true });
          field.dispatchEvent(changeEvent);
          
          console.log(`Set ${selector} to:`, value);
          return true;
        } else if (selector.includes('Textarea')) {
          const textarea = document.querySelector(selector);
          if (textarea) {
            const nativeTextareaValueSetter = Object.getOwnPropertyDescriptor(
              window.HTMLTextAreaElement.prototype, 
              'value'
            ).set;
            nativeTextareaValueSetter.call(textarea, value);
            
            const inputEvent = new Event('input', { bubbles: true });
            textarea.dispatchEvent(inputEvent);
            
            const changeEvent = new Event('change', { bubbles: true });
            textarea.dispatchEvent(changeEvent);
            
            console.log(`Set ${selector} to:`, value);
            return true;
          }
        }
        console.warn(`Field ${selector} not found`);
        return false;
      }
      
      const results = {};
      
      // Ensure subject display is set
      const subjectField = document.querySelector('#subjectDisplay');
      if (subjectField && !subjectField.value) {
        const selectedPatient = Session.get('selectedPatient');
        if (selectedPatient && selectedPatient.name) {
          let patientName = '';
          if (typeof selectedPatient.name === 'string') {
            patientName = selectedPatient.name;
          } else if (Array.isArray(selectedPatient.name) && selectedPatient.name[0]) {
            patientName = selectedPatient.name[0].text || 
                        `${selectedPatient.name[0].given?.join(' ') || ''} ${selectedPatient.name[0].family || ''}`.trim();
          }
          if (patientName) {
            results.subjectDisplay = setFieldValue('#subjectDisplay', patientName);
          }
        }
      }
      
      results.type = setFieldValue('#typeInput', doc.type);
      results.typeDisplay = setFieldValue('#typeDisplayInput', doc.typeDisplay);
      results.description = setFieldValue('#descriptionInput', doc.description);
      results.contentType = setFieldValue('#contentTypeInput', doc.contentType);
      results.contentUrl = setFieldValue('#contentUrlInput', doc.contentUrl);
      results.contentTitle = setFieldValue('#contentTitleInput', doc.contentTitle);
      results.notes = setFieldValue('#notesTextarea', doc.notes);
      
      return { filled: true, results: results };
    }, [testDocumentReference], function(result) {
      console.log('Form fields filled:', result.value);
    });

    // Handle Material-UI Select components
    browser.execute(function(status) {
      console.log('Trying to set status to:', status);
      const statusSelect = document.querySelector('#statusSelect');
      if (statusSelect) {
        console.log('Found statusSelect, current value:', statusSelect.value);
        statusSelect.click();
        setTimeout(() => {
          const options = document.querySelectorAll('li[role="option"]');
          console.log('Found', options.length, 'options');
          let found = false;
          for (let option of options) {
            console.log('Option:', option.getAttribute('data-value'), option.textContent);
            if (option.getAttribute('data-value') === status || 
                option.textContent.toLowerCase().includes(status)) {
              console.log('Clicking option:', option.textContent);
              option.click();
              found = true;
              break;
            }
          }
          if (!found) {
            console.error('Could not find option for status:', status);
          }
        }, 300);
      } else {
        console.error('statusSelect not found!');
      }
    }, [testDocumentReference.status]);

    browser
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/document-references/04-filled-document-reference-form.png');

    // Log form values before save
    browser.execute(function() {
      const subjectField = document.querySelector('#subjectDisplay');
      const typeField = document.querySelector('#typeInput');
      const descriptionField = document.querySelector('#descriptionInput');
      const contentTitleField = document.querySelector('#contentTitleInput');
      
      console.log('=== Form values before save ===');
      console.log('Subject display:', subjectField ? subjectField.value : 'not found');
      console.log('Type:', typeField ? typeField.value : 'not found');
      console.log('Description:', descriptionField ? descriptionField.value : 'not found');
      console.log('Content title:', contentTitleField ? contentTitleField.value : 'not found');
      
      const statusSelect = document.querySelector('#statusSelect');
      console.log('Status value:', statusSelect ? statusSelect.value : 'not found');
      
      // Also check what's actually in the database
      if (typeof DocumentReferences !== 'undefined' && window.testTimestamp) {
        const savedDocs = DocumentReferences.find().fetch();
        const testDoc = savedDocs.find(d => d.type && 
          d.type.text && 
          d.type.text.includes(window.testTimestamp));
        if (testDoc) {
          console.log('Found test document in database:', testDoc);
        } else {
          console.log('Test document not found in database');
        }
      }
      
      if (typeof Session !== 'undefined') {
        const selectedPatientId = Session.get('selectedPatientId');
        const selectedPatient = Session.get('selectedPatient');
        console.log('Session selectedPatientId:', selectedPatientId);
        console.log('Session selectedPatient:', selectedPatient);
      }
      
      return { logged: true };
    });

    // Save the document reference
    browser
      .execute(function() {
        window.consoleErrors = [];
        const originalError = console.error;
        console.error = function() {
          window.consoleErrors.push(Array.from(arguments).join(' '));
          originalError.apply(console, arguments);
        };
        
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Save')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Save button');
      });

    browser
      .pause(2000);
    
    // Check if we're back on the document references list page
    browser.execute(function() {
      const currentUrl = window.location.pathname;
      const hasTable = document.querySelector('#documentReferencesTable') !== null;
      const hasDocumentsPage = document.querySelector('#documentReferencesPage') !== null;
      const hasDetailPage = document.querySelector('#documentReferenceDetailPage') !== null;
      
      const errorElements = document.querySelectorAll('[color="error"], .error, [class*="error"], [class*="Error"]');
      let errorText = '';
      errorElements.forEach(el => {
        if (el.textContent) errorText += el.textContent + ' ';
      });
      
      const consoleErrors = window.consoleErrors || [];
      
      return {
        url: currentUrl,
        hasTable: hasTable,
        hasDocumentsPage: hasDocumentsPage,
        hasDetailPage: hasDetailPage,
        hasError: errorText.length > 0,
        errorText: errorText.trim(),
        consoleErrors: consoleErrors,
        userId: Meteor.userId ? Meteor.userId() : 'No Meteor.userId',
        isLoggedIn: Meteor.userId ? !!Meteor.userId() : false
      };
    }, [], function(result) {
      console.log('Post-save state:', result.value);
      if (result.value.hasError) {
        browser.assert.fail(`Save failed with error: ${result.value.errorText}`);
      }
      if (!result.value.isLoggedIn) {
        browser.assert.fail('User is not logged in after save attempt');
      }
      if (result.value.url === '/document-references/new') {
        console.log('Still on new document reference page - save may have failed silently');
      }
    });
    
    browser
      .waitForElementVisible('#documentReferencesPage', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/document-references/05-document-reference-saved.png');
  });

  it('05. Verify new document reference appears in list', browser => {
    browser
      .waitForElementVisible('#documentReferencesPage', 5000)
      .pause(1000);
    
    // Search for our specific test document since there may be many Synthea documents
    browser
      .waitForElementVisible('#documentReferenceSearchInput', 5000)
      .clearValue('#documentReferenceSearchInput')
      .setValue('#documentReferenceSearchInput', testDocumentReference.type.substring(0, 20))
      .pause(1000);
    
    browser.execute(function() {
      const hasTable = document.querySelector('#documentReferencesTable') !== null;
      const hasNoDataCard = document.querySelector('.no-data-card') !== null;
      const pageText = document.querySelector('#documentReferencesPage')?.textContent || '';
      
      let totalDocuments = 0;
      let selectedPatientId = null;
      let selectedPatient = null;
      
      if (typeof DocumentReferences !== 'undefined') {
        totalDocuments = DocumentReferences.find({}).count();
        console.log('Total document references in database:', totalDocuments);
        
        const testDoc = DocumentReferences.findOne({
          'type.text': { $regex: 'Clinical Note.*' }
        });
        console.log('Found test document:', testDoc);
        
        if (testDoc) {
          console.log('Test document subject:', JSON.stringify(testDoc.subject, null, 2));
          console.log('Test document subject reference:', testDoc.subject?.reference);
          console.log('Test document subject display:', testDoc.subject?.display);
        }
      }
      
      if (typeof Session !== 'undefined') {
        selectedPatientId = Session.get('selectedPatientId');
        selectedPatient = Session.get('selectedPatient');
        console.log('Selected patient in Session:', selectedPatientId, selectedPatient?.name);
      }
      
      return {
        hasTable: hasTable,
        hasNoDataCard: hasNoDataCard,
        hasNoData: pageText.includes('No Data Available'),
        totalDocuments: totalDocuments,
        hasSelectedPatient: !!selectedPatientId,
        selectedPatientId: selectedPatientId
      };
    }, [], function(result) {
      console.log('Page state:', result.value);
      
      if (result.value.totalDocuments > 0 && (result.value.hasNoData || result.value.hasNoDataCard)) {
        browser.assert.fail(`Documents exist (${result.value.totalDocuments}) but are filtered out - patient reference may not be set correctly`);
      } else if (result.value.hasNoData || result.value.hasNoDataCard) {
        browser.assert.fail('No documents found - save operation may have failed');
      }
    });
    
    browser.execute(function() {
      const table = document.querySelector('#documentReferencesTable');
      if (!table) return { hasTable: false };
      
      const rows = table.querySelectorAll('tbody tr');
      return {
        hasTable: true,
        rowCount: rows.length,
        firstRowText: rows.length > 0 ? rows[0].textContent : ''
      };
    }, [], function(result) {
      console.log('Table check:', result.value);
      if (result.value.hasTable && result.value.rowCount > 0) {
        browser.assert.ok(true, `Found ${result.value.rowCount} document reference(s) in table`);
      } else {
        browser.assert.fail('No document references table found or table is empty');
      }
    });
    
    browser
      .saveScreenshot('tests/nightwatch/screenshots/document-references/06-document-reference-in-list.png');
  });

  it('06. View document reference details', browser => {
    browser
      .waitForElementVisible('#documentReferencesPage', 5000)
      .pause(1000);

    // Search for our specific document
    browser
      .waitForElementVisible('#documentReferenceSearchInput', 5000)
      .clearValue('#documentReferenceSearchInput')
      .setValue('#documentReferenceSearchInput', testDocumentReference.type.substring(0, 20))
      .pause(1000);

    // Now click on the document row
    browser
      .waitForElementVisible('#documentReferencesTable', 5000)
      .execute(function(timestamp) {
        const rows = document.querySelectorAll('#documentReferencesTable tbody tr');
        console.log('Found', rows.length, 'rows in document references table');
        
        // Look for our test document
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (row.textContent.includes(timestamp)) {
            console.log('Clicking row', i, 'with text:', row.textContent);
            row.click();
            return { clicked: true, rowText: row.textContent, rowIndex: i };
          }
        }
        
        // If not found, click the first row
        if (rows.length > 0) {
          rows[0].click();
          return { clicked: true, rowText: rows[0].textContent, rowIndex: 0 };
        }
        
        return { clicked: false, error: 'No rows found' };
      }, [timestamp.toString()], function(result) {
        console.log('Click result:', result.value);
        browser.assert.equal(result.value.clicked, true, 'Found and clicked document reference row');
      });

    browser
      .pause(1000)
      .waitForElementVisible('#documentReferenceDetailPage', 5000)
      .assert.valueContains('#typeInput', testDocumentReference.type)
      .assert.valueContains('#descriptionInput', testDocumentReference.description)
      .assert.valueContains('#contentTitleInput', testDocumentReference.contentTitle)
      .execute(function() {
        const statusInput = document.querySelector('#statusSelect');
        
        // Get the value from Material-UI Select which uses hidden input
        const getMUISelectValue = (selectId) => {
          const select = document.querySelector(selectId);
          if (!select) return null;
          
          // For MUI Select, the actual value is in a hidden input
          const hiddenInput = select.querySelector('input[type="hidden"]');
          if (hiddenInput) return hiddenInput.value;
          
          // Fallback to direct value
          return select.value;
        };
        
        // Also try to get the displayed text for Material-UI Select
        const getSelectDisplay = (selectId) => {
          const select = document.querySelector(selectId);
          if (!select) return null;
          
          // Look for the displayed value in various MUI structures
          const displayDiv = select.parentElement?.querySelector('[role="button"]');
          if (displayDiv) return displayDiv.textContent;
          
          // Alternative: look for the selected option text
          const selectedValue = getMUISelectValue(selectId);
          const options = document.querySelectorAll(`${selectId} option`);
          for (let opt of options) {
            if (opt.value === selectedValue) return opt.textContent;
          }
          
          return null;
        };
        
        return {
          status: getMUISelectValue('#statusSelect'),
          notes: document.querySelector('#notesTextarea').value,
          statusDisplay: getSelectDisplay('#statusSelect') || 
                        document.querySelector('[aria-labelledby*="status"]')?.textContent || 
                        document.querySelector('#statusSelect')?.parentElement?.textContent
        };
      }, [], function(result) {
        console.log('View document reference details - form values:', result.value);
        console.log('Expected status:', testDocumentReference.status);
        console.log('Actual status value:', result.value.status);
        console.log('Status display:', result.value.statusDisplay);
        
        const statusOk = result.value.status === testDocumentReference.status || 
                       (result.value.statusDisplay && result.value.statusDisplay.includes('Current'));
        
        browser.assert.ok(statusOk, 'Status matches');
        browser.assert.ok(result.value.notes.includes(testDocumentReference.notes), 'Notes contain expected text');
      })
      .saveScreenshot('tests/nightwatch/screenshots/document-references/07-view-document-reference-details.png');
    
    // Navigate back to document references list
    browser
      .url('http://localhost:3000/document-references')
      .waitForElementVisible('#documentReferencesPage', 5000);
  });

  it('07. Update existing document reference', browser => {
    browser
      .waitForElementVisible('#documentReferencesTable', 5000)
      .pause(1000);

    // Search for our specific test document first
    browser
      .waitForElementVisible('#documentReferenceSearchInput', 5000)
      .clearValue('#documentReferenceSearchInput')
      .setValue('#documentReferenceSearchInput', testDocumentReference.type.substring(0, 20))
      .pause(1000);

    // Now click on the document to edit
    browser
      .execute(function(timestamp) {
        const rows = document.querySelectorAll('#documentReferencesTable tbody tr');
        console.log('Looking for document with timestamp:', timestamp);
        console.log('Found', rows.length, 'rows in table');
        
        for (let i = 0; i < rows.length; i++) {
          console.log('Row', i, ':', rows[i].textContent.substring(0, 100));
          if (rows[i].textContent.includes(timestamp)) {
            console.log('Found test document in row', i);
            rows[i].click();
            return { success: true, found: true, rowIndex: i };
          }
        }
        
        console.error('Test document not found in table! Table only contains Synthea documents.');
        return { success: false, found: false, error: 'Test document not in table' };
      }, [timestamp.toString()], function(result) {
        if (!result.value.found) {
          browser.assert.fail('Test document not found in table - cannot update. Only Synthea documents are visible.');
        }
      });

    browser
      .pause(1000)
      .waitForElementVisible('#documentReferenceDetailPage', 5000)
      .pause(500);

    // Enter edit mode
    browser
      .execute(function() {
        const lockButton = document.querySelector('button svg[data-testid="LockIcon"]')?.parentElement;
        if (lockButton) {
          lockButton.click();
          return true;
        }
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Edit')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Edit/Lock button to enter edit mode');
      })
      .pause(500);

    // Update document details
    browser
      .click('#typeInput')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#typeInput', updatedDocumentReference.type)
      .click('#descriptionInput')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#descriptionInput', updatedDocumentReference.description)
      .click('#statusSelect')
      .pause(300)
      .execute(function(value) {
        const menuItems = document.querySelectorAll('[role="option"]');
        for (let item of menuItems) {
          if (item.textContent.toLowerCase().includes(value.toLowerCase()) || 
              item.getAttribute('data-value') === value) {
            item.click();
            return true;
          }
        }
        return false;
      }, [updatedDocumentReference.status], function(result) {
        browser.assert.equal(result.value, true, 'Selected status');
      })
      .click('#notesTextarea')
      .keys([browser.Keys.COMMAND, 'a'])
      .keys(browser.Keys.BACK_SPACE)
      .pause(100)
      .setValue('#notesTextarea', updatedDocumentReference.notes)
      .pause(500)
      .saveScreenshot('tests/nightwatch/screenshots/document-references/08-updated-document-reference-form.png');

    // Save the updated document
    browser
      .execute(function() {
        const buttons = document.querySelectorAll('button');
        for (let button of buttons) {
          if (button.textContent.includes('Save')) {
            button.click();
            return true;
          }
        }
        return false;
      }, [], function(result) {
        browser.assert.equal(result.value, true, 'Clicked Save button');
      });

    browser
      .pause(2000)
      .url('http://localhost:3000/document-references')
      .waitForElementVisible('#documentReferencesTable', 5000)
      .saveScreenshot('tests/nightwatch/screenshots/document-references/09-document-reference-updated.png');
  });

  it('08. Verify updated document reference in list', browser => {
    browser
      .waitForElementVisible('#documentReferencesTable', 5000)
      .waitForElementVisible('#documentReferenceSearchInput', 5000)
      .clearValue('#documentReferenceSearchInput')
      .setValue('#documentReferenceSearchInput', updatedDocumentReference.type.substring(0, 20))
      .pause(1000)
      .execute(function(expectedType) {
        const table = document.querySelector('#documentReferencesTable');
        const rows = table ? table.querySelectorAll('tbody tr') : [];
        const documentTypes = [];
        
        for (let row of rows) {
          const cells = row.querySelectorAll('td');
          for (let cell of cells) {
            if (cell.textContent.includes('Note')) {
              documentTypes.push(cell.textContent);
            }
          }
        }
        
        return {
          rowCount: rows.length,
          documentTypes: documentTypes,
          tableText: table ? table.textContent : 'Table not found',
          foundExpected: table ? table.textContent.includes(expectedType) : false
        };
      }, [updatedDocumentReference.type], function(result) {
        console.log('Table debug info:', result.value);
        browser.assert.ok(result.value.foundExpected, 
          `Updated document '${updatedDocumentReference.type}' should be in table. Found documents: ${result.value.documentTypes.join(', ')}`);
      })
      .saveScreenshot('tests/nightwatch/screenshots/document-references/10-updated-document-reference-in-list.png');
  });

  it('09. Delete document reference', browser => {
    browser
      .waitForElementVisible('#documentReferencesPage', 5000)
      .pause(1000);

    browser.execute(function() {
      const hasTable = document.querySelector('#documentReferencesTable') !== null;
      const hasNoData = document.querySelector('.no-data-card') !== null ||
                       document.querySelector('#documentReferencesPage').textContent.includes('No Data Available');
      return { hasTable: hasTable, hasNoData: hasNoData };
    }, [], function(result) {
      if (result.value.hasTable) {
        browser
          .execute(function(timestamp) {
            const rows = document.querySelectorAll('#documentReferencesTable tbody tr');
            for (let row of rows) {
              if (row.textContent.includes(timestamp)) {
                row.click();
                return true;
              }
            }
            return false;
          }, [timestamp.toString()], function(result) {
            browser.assert.equal(result.value, true, 'Found and clicked document reference row');
          });

        browser
          .pause(1000)
          .waitForElementVisible('#documentReferenceDetailPage', 5000);

        // Enter edit mode
        browser
          .execute(function() {
            const lockButton = document.querySelector('button svg[data-testid="LockIcon"]')?.parentElement;
            if (lockButton) {
              lockButton.click();
              return true;
            }
            const buttons = document.querySelectorAll('button');
            for (let button of buttons) {
              if (button.textContent.includes('Edit')) {
                button.click();
                return true;
              }
            }
            return false;
          }, [], function(result) {
            browser.assert.equal(result.value, true, 'Clicked Edit/Lock button to enter edit mode');
          })
          .pause(500);

        // Click Delete button
        browser
          .execute(function() {
            const buttons = document.querySelectorAll('button');
            for (let button of buttons) {
              if (button.textContent.includes('Delete')) {
                window.__deleteButtonFound = true;
                button.click();
                return true;
              }
            }
            return false;
          })
          .pause(100)
          .acceptAlert()
          .pause(500);

        browser
          .pause(2000)
          .waitForElementVisible('#documentReferencesPage', 5000)
          .execute(function() {
            const hasTable = document.querySelector('#documentReferencesTable') !== null;
            const hasNoDataCard = document.querySelector('.no-data-card') !== null ||
                                document.querySelector('.no-data-available') !== null ||
                                document.querySelector('[id*="no-data"]') !== null ||
                                (document.querySelector('#documentReferencesPage') && 
                                 document.querySelector('#documentReferencesPage').textContent.includes('No Data Available'));
            return {
              hasTable: hasTable,
              hasNoDataCard: hasNoDataCard,
              hasEitherElement: hasTable || hasNoDataCard
            };
          }, [], function(result) {
            browser.assert.equal(result.value.hasEitherElement, true, 'Either document references table or no-data message is present after deletion');
          });
      } else if (result.value.hasNoData) {
        browser.assert.ok(true, 'No document references to delete - No Data Available state is correct');
      }
    });
    
    browser.saveScreenshot('tests/nightwatch/screenshots/document-references/11-document-reference-deleted.png');
  });

  it('10. Verify document reference removed from list', browser => {
    browser
      .waitForElementVisible('#documentReferencesPage', 5000)
      .pause(1000)
      .execute(function(timestamp) {
        const table = document.querySelector('#documentReferencesTable');
        if (table) {
          const rows = document.querySelectorAll('#documentReferencesTable tbody tr');
          for (let row of rows) {
            if (row.textContent.includes(timestamp)) {
              return { found: true, hasTable: true };
            }
          }
          return { found: false, hasTable: true };
        } else {
          const hasNoData = document.querySelector('.no-data-card') !== null ||
                           document.querySelector('#documentReferencesPage').textContent.includes('No Data Available');
          return { found: false, hasTable: false, hasNoData: hasNoData };
        }
      }, [timestamp.toString()], function(result) {
        if (result.value.hasTable) {
          browser.assert.equal(result.value.found, false, 'Document reference no longer in list');
        } else {
          browser.assert.equal(result.value.hasNoData, true, 'No data available shown (document reference was deleted)');
        }
      })
      .saveScreenshot('tests/nightwatch/screenshots/document-references/12-document-reference-not-in-list.png');
  });

  after(browser => {
    // Clean up test data
    browser.executeAsync(function(done) {
      if (typeof DocumentReferences !== 'undefined') {
        DocumentReferences.find({ 
          $or: [
            { 'type.text': { $regex: '.*Clinical Note.*' } },
            { 'description': { $regex: 'Test document reference.*' } },
            { 'content.0.attachment.title': { $regex: 'Test Document.*' } }
          ]
        }).fetch().forEach(function(doc) {
          DocumentReferences.remove({ _id: doc._id });
        });
        done();
      } else {
        done();
      }
    });

    browser.end();
  });
});