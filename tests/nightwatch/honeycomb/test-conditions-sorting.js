// tests/nightwatch/honeycomb/test-conditions-sorting.js

describe('Conditions Table Sorting Test', function() {
  before(browser => {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', 5000);
  });

  it('Test conditions sorting order', browser => {
    // First, create some test conditions with different dates
    browser
      .execute(function() {
        // Ensure we're logged in
        if (!Meteor.userId()) {
          Meteor.loginWithPassword('janedoe', 'janedoe123');
        }
        
        // Clear existing conditions
        if (typeof Conditions !== 'undefined') {
          Conditions.remove({});
          
          // Create test conditions with different dates
          const testConditions = [
            {
              resourceType: 'Condition',
              code: { 
                coding: [{ code: '195967001', display: 'Asthma - Test 1' }],
                text: 'Asthma - Test 1'
              },
              subject: { display: 'John Doe', reference: 'Patient/123' },
              asserter: { display: 'Dr. Smith - First', reference: 'Practitioner/456' },
              clinicalStatus: { coding: [{ code: 'active' }] },
              verificationStatus: { coding: [{ code: 'confirmed' }] },
              onsetDateTime: new Date('2023-01-01'),
              meta: { lastUpdated: new Date('2023-01-01') }
            },
            {
              resourceType: 'Condition',
              code: { 
                coding: [{ code: '195967001', display: 'Asthma - Test 2' }],
                text: 'Asthma - Test 2'
              },
              subject: { display: 'John Doe', reference: 'Patient/123' },
              asserter: { display: 'Dr. Johnson - Second', reference: 'Practitioner/789' },
              clinicalStatus: { coding: [{ code: 'active' }] },
              verificationStatus: { coding: [{ code: 'confirmed' }] },
              onsetDateTime: new Date('2023-06-01'),
              meta: { lastUpdated: new Date('2023-06-01') }
            },
            {
              resourceType: 'Condition',
              code: { 
                coding: [{ code: '195967001', display: 'Asthma - Test 3' }],
                text: 'Asthma - Test 3'
              },
              subject: { display: 'John Doe', reference: 'Patient/123' },
              asserter: { display: 'Dr. Williams - Third', reference: 'Practitioner/321' },
              clinicalStatus: { coding: [{ code: 'active' }] },
              verificationStatus: { coding: [{ code: 'confirmed' }] },
              onsetDateTime: new Date('2023-12-01'),
              meta: { lastUpdated: new Date('2023-12-01') }
            }
          ];
          
          testConditions.forEach(condition => {
            Conditions.insert(condition);
          });
          
          return true;
        }
        return false;
      }, [], function(result) {
        console.log('Test conditions created:', result.value);
      })
      .pause(2000); // Wait for reactivity

    // Navigate to conditions page
    browser
      .url('http://localhost:3000/conditions')
      .waitForElementVisible('#conditionsPage', 5000)
      .pause(1000)
      .saveScreenshot('tests/nightwatch/screenshots/conditions/sorting-initial.png');

    // Check default order (should be descending - newest first)
    browser.execute(function() {
      const table = document.querySelector('#conditionsTable');
      if (!table) return { hasTable: false };
      
      const rows = table.querySelectorAll('tbody tr');
      const asserters = [];
      rows.forEach(row => {
        const asserterCell = row.querySelector('td:nth-child(7)'); // Adjust based on actual column position
        if (asserterCell) {
          asserters.push(asserterCell.textContent.trim());
        }
      });
      
      return {
        hasTable: true,
        rowCount: rows.length,
        asserters: asserters,
        firstAsserter: asserters[0] || null,
        lastAsserter: asserters[asserters.length - 1] || null
      };
    }, [], function(result) {
      console.log('Default order check:', result.value);
      browser.assert.equal(result.value.hasTable, true, 'Conditions table is present');
      browser.assert.equal(result.value.rowCount, 3, 'Three conditions are displayed');
      // In descending order, the third (newest) condition should appear first
      browser.assert.ok(
        result.value.firstAsserter && result.value.firstAsserter.includes('Third'),
        'Newest condition (Third) appears first in descending order'
      );
    });

    // Click ascending order button
    browser
      .click('button[value="ascending"]')
      .pause(1000)
      .saveScreenshot('tests/nightwatch/screenshots/conditions/sorting-ascending.png');

    // Check ascending order (oldest first)
    browser.execute(function() {
      const table = document.querySelector('#conditionsTable');
      if (!table) return { hasTable: false };
      
      const rows = table.querySelectorAll('tbody tr');
      const asserters = [];
      rows.forEach(row => {
        const asserterCell = row.querySelector('td:nth-child(7)'); // Adjust based on actual column position
        if (asserterCell) {
          asserters.push(asserterCell.textContent.trim());
        }
      });
      
      return {
        hasTable: true,
        rowCount: rows.length,
        asserters: asserters,
        firstAsserter: asserters[0] || null,
        lastAsserter: asserters[asserters.length - 1] || null
      };
    }, [], function(result) {
      console.log('Ascending order check:', result.value);
      browser.assert.equal(result.value.rowCount, 3, 'Three conditions are still displayed');
      // In ascending order, the first (oldest) condition should appear first
      browser.assert.ok(
        result.value.firstAsserter && result.value.firstAsserter.includes('First'),
        'Oldest condition (First) appears first in ascending order'
      );
    });

    // Click descending order button again
    browser
      .click('button[value="descending"]')
      .pause(1000)
      .saveScreenshot('tests/nightwatch/screenshots/conditions/sorting-descending.png');

    // Verify it's back to descending order
    browser.execute(function() {
      const table = document.querySelector('#conditionsTable');
      if (!table) return { hasTable: false };
      
      const rows = table.querySelectorAll('tbody tr');
      const asserters = [];
      rows.forEach(row => {
        const asserterCell = row.querySelector('td:nth-child(7)'); // Adjust based on actual column position
        if (asserterCell) {
          asserters.push(asserterCell.textContent.trim());
        }
      });
      
      return {
        hasTable: true,
        rowCount: rows.length,
        asserters: asserters,
        firstAsserter: asserters[0] || null
      };
    }, [], function(result) {
      console.log('Back to descending order:', result.value);
      browser.assert.ok(
        result.value.firstAsserter && result.value.firstAsserter.includes('Third'),
        'Newest condition (Third) appears first again in descending order'
      );
    });
  });

  after(browser => {
    browser.end();
  });
});