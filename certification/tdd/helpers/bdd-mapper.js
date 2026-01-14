// certification/tdd/helpers/bdd-mapper.js
// Maps BDD scenarios (Given/When/Then) to Nightwatch test patterns

/**
 * Maps BDD "Given" statements to Nightwatch setup commands
 * @param {string} given - BDD Given statement
 * @returns {Object} - Nightwatch command configuration
 */
export function mapGiven(given) {
  const patterns = {
    // Authentication patterns
    'I am authenticated as a provider': {
      action: 'loginAsProvider',
      helper: 'authentication-helper'
    },
    'I am authenticated as a patient': {
      action: 'loginAsPatient',
      helper: 'authentication-helper'
    },
    'I am authenticated as a system administrator': {
      action: 'loginAsAdmin',
      helper: 'authentication-helper'
    },

    // Navigation patterns
    'I am on': {
      action: 'url',
      extract: /I am on (.+)/,
      type: 'navigation'
    },

    // Data state patterns
    'a patient record is selected': {
      action: 'selectPatient',
      type: 'data-setup'
    },
    'the patient has': {
      action: 'createTestData',
      extract: /the patient has (.+)/,
      type: 'data-setup'
    }
  };

  // Find matching pattern
  for (let pattern in patterns) {
    if (given.toLowerCase().includes(pattern.toLowerCase())) {
      const config = patterns[pattern];

      // Extract dynamic values if pattern has regex
      if (config.extract) {
        const match = given.match(config.extract);
        if (match && match[1]) {
          config.value = match[1].trim();
        }
      }

      return config;
    }
  }

  // Default fallback
  return {
    action: 'custom',
    statement: given,
    type: 'manual'
  };
}

/**
 * Maps BDD "When" statements to Nightwatch actions
 * @param {string} when - BDD When statement
 * @returns {Object} - Nightwatch command configuration
 */
export function mapWhen(when) {
  const patterns = {
    // Navigation patterns
    'I navigate to': {
      action: 'url',
      extract: /I navigate to (.+)/,
      type: 'navigation'
    },
    'I access': {
      action: 'url',
      extract: /I access (.+)/,
      type: 'navigation'
    },

    // Click patterns
    'I click': {
      action: 'click',
      extract: /I click (?:the )?(.+)/,
      type: 'interaction'
    },
    'I select': {
      action: 'click',
      extract: /I select (?:the )?(.+)/,
      type: 'interaction'
    },

    // Input patterns
    'I enter': {
      action: 'setValue',
      extract: /I enter "([^"]+)" into (?:the )?(.+)/,
      type: 'input'
    },
    'I type': {
      action: 'setValue',
      extract: /I type "([^"]+)" into (?:the )?(.+)/,
      type: 'input'
    },

    // Form submission patterns
    'I submit': {
      action: 'click',
      element: 'submit button',
      type: 'interaction'
    },
    'I save': {
      action: 'click',
      element: 'save button',
      type: 'interaction'
    },

    // CDS patterns
    'clinical decision support is triggered': {
      action: 'checkElement',
      selector: '[data-testid="cds-alert"]',
      type: 'verification'
    }
  };

  // Find matching pattern
  for (let pattern in patterns) {
    if (when.toLowerCase().includes(pattern.toLowerCase())) {
      const config = patterns[pattern];

      // Extract dynamic values if pattern has regex
      if (config.extract) {
        const match = when.match(config.extract);
        if (match) {
          if (match.length === 2) {
            config.value = match[1].trim();
          } else if (match.length === 3) {
            config.value = match[1].trim();
            config.element = match[2].trim();
          }
        }
      }

      return config;
    }
  }

  // Default fallback
  return {
    action: 'custom',
    statement: when,
    type: 'manual'
  };
}

/**
 * Maps BDD "Then" statements to Nightwatch assertions
 * @param {string} then - BDD Then statement
 * @returns {Object} - Nightwatch assertion configuration
 */
export function mapThen(then) {
  const patterns = {
    // Element visibility patterns
    'the system shall display': {
      action: 'waitForElementVisible',
      extract: /the system shall display (?:the )?(.+)/,
      type: 'assertion'
    },
    'I shall see': {
      action: 'waitForElementVisible',
      extract: /I shall see (?:the )?(.+)/,
      type: 'assertion'
    },

    // Element presence patterns
    'the system shall enable': {
      action: 'assertElementExists',
      extract: /the system shall enable (.+)/,
      type: 'assertion'
    },

    // Text content patterns
    'the page shall contain': {
      action: 'textContains',
      extract: /the page shall contain "([^"]+)"/,
      type: 'assertion'
    },

    // Not patterns
    'shall not': {
      action: 'assertNotVisible',
      extract: /shall not (.+)/,
      type: 'negative-assertion'
    },

    // Intervention patterns
    'interventions shall be provided': {
      action: 'assertElementExists',
      selector: '[data-testid="cds-intervention-card"]',
      type: 'assertion'
    },

    // Configuration patterns
    'configuration shall be based on user role': {
      action: 'assertElementExists',
      selector: '[data-testid="cds-configuration-panel"]',
      type: 'assertion'
    },

    // Source attribution patterns
    'source attributes shall be accessible': {
      action: 'assertElementExists',
      selector: '[data-testid="cds-source-attributes"]',
      type: 'assertion'
    }
  };

  // Find matching pattern
  for (let pattern in patterns) {
    if (then.toLowerCase().includes(pattern.toLowerCase())) {
      const config = patterns[pattern];

      // Extract dynamic values if pattern has regex
      if (config.extract) {
        const match = then.match(config.extract);
        if (match && match[1]) {
          config.value = match[1].trim();
        }
      }

      return config;
    }
  }

  // Default fallback
  return {
    action: 'custom',
    statement: then,
    type: 'manual'
  };
}

/**
 * Converts a full BDD scenario to Nightwatch test structure
 * @param {Object} scenario - BDD scenario object
 * @param {string} scenario.name - Scenario name
 * @param {string} scenario.given - Given statement
 * @param {string} scenario.when - When statement
 * @param {string} scenario.then - Then statement
 * @returns {Object} - Nightwatch test configuration
 */
export function scenarioToTest(scenario) {
  return {
    name: scenario.name,
    setup: mapGiven(scenario.given),
    action: mapWhen(scenario.when),
    assertion: mapThen(scenario.then)
  };
}

/**
 * Generates a Nightwatch test function from a BDD scenario
 * @param {Object} scenario - BDD scenario
 * @returns {string} - JavaScript code for test function
 */
export function generateTestCode(scenario) {
  const mapped = scenarioToTest(scenario);

  let code = `
// ${scenario.name}
'${scenario.name}': function(browser) {
  browser
    .url('http://localhost:3000')
    .waitForElementVisible('body', 5000);

  // Setup: ${scenario.given}
`;

  // Add setup code
  if (mapped.setup.action === 'loginAsProvider') {
    code += `  loginAsProvider(browser);
`;
  } else if (mapped.setup.action === 'loginAsPatient') {
    code += `  loginAsPatient(browser);
`;
  }

  // Add action code
  code += `
  // Action: ${scenario.when}
`;

  if (mapped.action.type === 'navigation') {
    code += `  browser.url('http://localhost:3000${mapped.action.value}');
`;
  } else if (mapped.action.type === 'interaction') {
    code += `  // TODO: Implement interaction for: ${mapped.action.value}
`;
  }

  // Add assertion code
  code += `
  // Assertion: ${scenario.then}
`;

  if (mapped.assertion.action === 'assertElementExists') {
    code += `  assertElementExists(browser, '${mapped.assertion.selector}', '${scenario.then}');
`;
  } else {
    code += `  // TODO: Implement assertion for: ${mapped.assertion.value}
`;
  }

  code += `
  browser.end();
}`;

  return code;
}

/**
 * Element name to selector converter
 * @param {string} elementName - Human-readable element name
 * @returns {string} - CSS selector or data-testid
 */
export function elementNameToSelector(elementName) {
  const selectorMap = {
    // CPOE elements
    'medication order form': '[data-testid="medication-order-form"]',
    'laboratory order form': '[data-testid="laboratory-order-form"]',
    'imaging order form': '[data-testid="imaging-order-form"]',
    'reason for order field': '[data-testid="order-reason-field"]',

    // Demographics elements
    'patient demographics': '[data-testid="patient-demographics-page"]',
    'first name field': '[data-testid="patient-firstname-field"]',
    'last name field': '[data-testid="patient-lastname-field"]',
    'date of birth': '[data-testid="patient-birthdate-field"]',
    'race field': '[data-testid="patient-race-select"]',
    'ethnicity field': '[data-testid="patient-ethnicity-select"]',
    'gender identity field': '[data-testid="patient-gender-identity-select"]',
    'sexual orientation field': '[data-testid="patient-sexual-orientation-select"]',
    'pronouns field': '[data-testid="patient-pronouns-field"]',

    // CDS elements
    'cds interventions': '[data-testid="cds-interventions-list"]',
    'cds configuration': '[data-testid="cds-configuration-panel"]',
    'infobutton': '[data-testid="infobutton"]',
    'source attributes': '[data-testid="cds-source-attributes"]',
    'bibliography': '[data-testid="cds-bibliography"]',

    // VDT elements
    'patient data view': '[data-testid="patient-data-view-page"]',
    'download button': '[data-testid="download-data-button"]',
    'transmit button': '[data-testid="transmit-data-button"]',
    'activity log': '[data-testid="activity-log"]',

    // Buttons
    'save button': 'button:contains("Save")',
    'submit button': 'button[type="submit"]',
    'cancel button': 'button:contains("Cancel")',
    'delete button': 'button:contains("Delete")'
  };

  const normalized = elementName.toLowerCase().trim();
  return selectorMap[normalized] || `[data-testid="${normalized.replace(/ /g, '-')}"]`;
}

// Export default object for CommonJS compatibility
module.exports = {
  mapGiven,
  mapWhen,
  mapThen,
  scenarioToTest,
  generateTestCode,
  elementNameToSelector
};
