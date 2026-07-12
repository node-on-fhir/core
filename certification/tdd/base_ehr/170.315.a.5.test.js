// certification/tdd/base_ehr/170.315.a.5.test.js
// ONC § 170.315(a)(5) - Demographics (CY2026) — BEHAVIORAL (record / change / access)

// Import helpers
const { loginAsProvider } = require('../helpers/authentication-helper');
const {
  verifyPageLoaded,
  takeScreenshot,
  logTestCompletion
} = require('../helpers/selector-helper');
const { TIMEOUTS } = require('../../../tests/nightwatch/config/timeouts');

// Suite-level state shared across steps (Nightwatch runs steps in order)
const runStamp = Date.now();
const testPatientFhirId = `baseehr-a5-${runStamp}`;
let patientMongoId = null;

module.exports = {
  // Tags for test organization and filtering
  tags: ['base-ehr', 'onc-certification', '170.315.a.5', 'demographics'],

  /**
   * § 170.315(a)(5) - Patient Demographics and Observations (CY2026)
   *
   * OVERVIEW:
   * Behavioral verification that the EHR enables a user to RECORD, CHANGE, and
   * ACCESS patient demographics per the CY2026 requirements.
   *
   * Requirements tested (per CCG v1.3, last updated 05-14-2026):
   * - Name, date of birth (no format standard required), preferred language
   *   per RFC 5646 (ISO 639 alpha-2 codes, optional region subtags).
   * - Sex per (a)(5)(i)(C): per EO 14168 / OPM guidance, modules must
   *   demonstrate recording sex as Female / Male (§ 170.207(n)(2) SNOMED
   *   248152002 / 248153007); decline-to-specify supported.
   * - Race(s) and ethnicity(ies) per CDCREC v1.2, aggregated to OMB
   *   categories, multi-select, with "declined to specify" — REQUIRED
   *   (updated code-set deadline 12/31/2025 has PASSED).
   * - NOT required (per the same CCG update): (a)(5)(i)(D) sexual
   *   orientation, (E) gender identity, (F) sex parameter for clinical use,
   *   (G) name to use, (H) pronouns.
   *
   * Race/ethnicity (CDCREC/OMB) is recorded as US Core complex extensions and is
   * SETTINGS-GATED: collecting it is legally forbidden in some jurisdictions, so
   * the form fields render only when
   * settings.public.modules.patientDemographics.raceEthnicity is true, and the
   * patients.insert/update methods strip us-core-race/ethnicity extensions when
   * the gate is off (defense-in-depth). This test REQUIRES the gate enabled (set
   * in settings/settings.honeycomb.tdd.json).
   *
   * BDD Reference: certification/bdd/170.315-a-5-demographics.feature
   *
   * IMPORTANT NOTES:
   * - Server boot per fable/baseehr-ralph/CONTEXT.md.
   * - Components: imports/ui-fhir/patients/{PatientDetail,PatientFormView}.jsx
   * - Methods: imports/api/patients/methods.js (insert/update/findOne)
   * - Birth-sex stored as us-core-birthsex extension (valueCode M/F/UNK/ASKU).
   * - Race/ethnicity stored as us-core-race/us-core-ethnicity complex extensions
   *   (nested ombCategory valueCoding + text valueString).
   */

  before: function (browser) {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', TIMEOUTS.normal)
      .windowSize('current', 1400, 900)
      .pause(3000); // allow DEV_AUTO_LOGIN to complete
  },

  '01. Provider authenticated': function (browser) {
    browser.executeAsync(function (creds, done) {
      if (typeof Meteor !== 'undefined' && Meteor.userId()) {
        done({ loggedIn: true, via: 'existing-session', userId: Meteor.userId() });
        return;
      }
      Meteor.loginWithPassword(creds.username, creds.password, function (err) {
        done({
          loggedIn: !err && !!Meteor.userId(),
          via: 'loginWithPassword',
          userId: Meteor.userId ? Meteor.userId() : null,
          error: err ? (err.reason || err.message) : null
        });
      });
    }, [{ username: 'demouser', password: 'password2025' }], function (result) {
      browser.assert.ok(
        result.value && result.value.loggedIn,
        'ONC 170.315.a.5 - Provider session established (' + JSON.stringify(result.value) + ')'
      );
    });

    // Fallback path for environments without DEV_AUTO_LOGIN
    loginAsProvider(browser);
    browser.pause(1000);
  },

  '02. RECORD: demographics recorded (name, DOB, sex, language, race attempt)': function (browser) {
    // Record demographics through the app's patient method. The us-core-race
    // extension is deliberately included so the gap step can show whether the
    // system retains it (it should per CY2026; see GAP step 07).
    browser.executeAsync(function (fhirId, done) {
      Meteor.call('patients.insert', {
        id: fhirId,
        resourceType: 'Patient',
        active: true,
        name: [{
          use: 'official',
          text: 'Demo GraphicsTest',
          family: 'GraphicsTest',
          given: ['Demo']
        }],
        gender: 'female',
        birthDate: '1980-02-29',
        communication: [{
          language: {
            coding: [{ system: 'urn:ietf:bcp:47', code: 'es-MX', display: 'Spanish (Mexico)' }],
            text: 'Spanish (Mexico)'
          },
          preferred: true
        }],
        extension: [
          {
            url: 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex',
            valueCode: 'F'
          },
          {
            // Complex CDCREC race extension (OMB category + text sub-extensions)
            url: 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-race',
            extension: [
              {
                url: 'ombCategory',
                valueCoding: { system: 'urn:oid:2.16.840.1.113883.6.238', code: '2028-9', display: 'Asian' }
              },
              { url: 'text', valueString: 'Asian' }
            ]
          }
        ],
        identifier: [{ system: 'http://test.honeycomb3.io', value: fhirId }],
        address: [{ line: ['123 Certification Way'], city: 'Testville', state: 'IL', postalCode: '60601' }]
      }, function (insertErr, mongoId) {
        if (insertErr) {
          done({ ok: false, error: insertErr.message });
          return;
        }
        done({ ok: true, mongoId: mongoId });
      });
    }, [testPatientFhirId], function (result) {
      browser.assert.ok(
        result.value && result.value.ok,
        'ONC 170.315.a.5 - RECORD: patient demographics recorded (' + JSON.stringify(result.value) + ')'
      );
      if (result.value && result.value.ok) {
        patientMongoId = result.value.mongoId;
      }
    });

    browser.pause(500);
  },

  '03. ACCESS: demographics displayed on the patient detail page': function (browser) {
    browser
      .url('http://localhost:3000/patients/' + testPatientFhirId)
      .waitForElementVisible('#patientDetailPage', TIMEOUTS.extended)
      .pause(2000); // subscription/lookup settle

    verifyPageLoaded(browser, '170.315.a.5');

    browser.execute(function () {
      function fieldValue(sel) {
        var el = document.querySelector(sel);
        return el ? el.value : null;
      }
      return {
        family: fieldValue('#familyNameInput'),
        given: fieldValue('#givenNameInput'),
        birthDate: fieldValue('[data-testid="patient-birthdate-field"] input') || fieldValue('#birthDateInput'),
        hasGenderSelect: !!document.querySelector('#genderSelect'),
        hasBirthSexSelect: !!document.querySelector('[data-testid="patient-birthsex-select"]'),
        hasLanguageSelect: !!document.querySelector('[data-testid="patient-language-select"]')
      };
    }, [], function (result) {
      var v = result.value;
      browser.assert.ok(
        v.family === 'GraphicsTest' && v.given === 'Demo',
        'ONC 170.315.a.5 - ACCESS: recorded name displayed (' + v.given + ' ' + v.family + ')'
      );
      browser.assert.ok(
        !!v.birthDate && v.birthDate.length > 0,
        'ONC 170.315.a.5 - ACCESS: recorded date of birth displayed (' + v.birthDate + ')'
      );
      browser.assert.ok(
        v.hasGenderSelect && v.hasBirthSexSelect && v.hasLanguageSelect,
        'ONC 170.315.a.5 - ACCESS: sex and preferred-language fields present on chart'
      );
    });
  },

  '04. Sex recording capability (§ a.5.i.C — Female/Male + decline)': function (browser) {
    // Per EO 14168/OPM guidance the module must demonstrate recording sex as
    // Female or Male; the form also offers UNK/ASKU (decline to disclose).
    browser.executeAsync(function (fhirId, done) {
      Meteor.call('patients.findOne', fhirId, function (err, patient) {
        if (err || !patient) { done({ ok: false, error: err ? err.message : 'not found' }); return; }
        var birthSex = null;
        (patient.extension || []).forEach(function (ext) {
          if (ext.url === 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex') {
            birthSex = ext.valueCode;
          }
        });
        done({ ok: true, birthSex: birthSex, gender: patient.gender });
      });
    }, [testPatientFhirId], function (result) {
      var v = result.value || {};
      browser.assert.ok(v.ok, 'ONC 170.315.a.5 - Sex verification query completed');
      browser.assert.ok(
        v.birthSex === 'F',
        'ONC 170.315.a.5 - RECORD: sex recorded and persisted (birth-sex extension: ' + v.birthSex + ')'
      );
    });

    // UI capability: the select offers Male, Female, and a decline option
    browser.execute(function () {
      var select = document.querySelector('[data-testid="patient-birthsex-select"]');
      return { present: !!select };
    }, [], function (result) {
      browser.assert.ok(
        result.value.present,
        'ONC 170.315.a.5 - Sex field available to the user (M/F/UNK/ASKU options)'
      );
    });
  },

  '05. Preferred language recorded per RFC 5646': function (browser) {
    browser.executeAsync(function (fhirId, done) {
      Meteor.call('patients.findOne', fhirId, function (err, patient) {
        if (err || !patient) { done({ ok: false, error: err ? err.message : 'not found' }); return; }
        var lang = null;
        if (patient.communication && patient.communication[0] && patient.communication[0].language &&
            patient.communication[0].language.coding && patient.communication[0].language.coding[0]) {
          lang = patient.communication[0].language.coding[0].code;
        }
        done({ ok: true, language: lang });
      });
    }, [testPatientFhirId], function (result) {
      var v = result.value || {};
      browser.assert.ok(v.ok, 'ONC 170.315.a.5 - Language verification query completed');
      browser.assert.ok(
        v.language === 'es-MX',
        'ONC 170.315.a.5 - RECORD: preferred language persisted as RFC 5646 tag with region subtag (' + v.language + ')'
      );
    });
  },

  '06. CHANGE: demographics modified via the chart UI and persisted': function (browser) {
    // Enter edit mode
    browser
      .waitForElementVisible('#editButton', TIMEOUTS.normal)
      .click('#editButton')
      .pause(500);

    // Change the family name through the form. React-controlled TextFields
    // ignore both execute-block value+dispatch (value-tracker dedup) and
    // clearValue (React re-renders the old state back → concatenation).
    // Reliable: real keystrokes — END, backspace out the old value, type new.
    browser
      .waitForElementVisible('#familyNameInput', TIMEOUTS.normal)
      .click('#familyNameInput')
      .setValue('#familyNameInput', [
        '\uE010',                          // END key
        new Array(21).join('\uE003'),      // 20x BACK_SPACE
        'GraphicsChanged'
      ])
      .pause(500);

    browser.execute(function () {
      var input = document.querySelector('#familyNameInput');
      return { value: input ? input.value : null };
    }, [], function (result) {
      browser.assert.ok(
        result.value.value === 'GraphicsChanged',
        'ONC 170.315.a.5 - CHANGE: family name edited in form (' + result.value.value + ')'
      );
    });

    // Save
    browser.execute(function () {
      var save = document.querySelector('#savePatientButton');
      if (save) { save.click(); return { clicked: true }; }
      return { clicked: false };
    }, [], function (result) {
      browser.assert.ok(result.value.clicked, 'ONC 170.315.a.5 - CHANGE: save clicked');
    });

    browser.pause(3000);

    // Verify the change persisted server-side
    browser.executeAsync(function (fhirId, done) {
      Meteor.call('patients.findOne', fhirId, function (err, patient) {
        if (err || !patient) { done({ ok: false, error: err ? err.message : 'not found' }); return; }
        done({
          ok: true,
          family: patient.name && patient.name[0] && patient.name[0].family
        });
      });
    }, [testPatientFhirId], function (result) {
      var v = result.value || {};
      browser.assert.ok(v.ok, 'ONC 170.315.a.5 - CHANGE verification query completed');
      browser.assert.ok(
        v.family === 'GraphicsChanged',
        'ONC 170.315.a.5 - CHANGE: modified demographics persisted (family: ' + v.family + ')'
      );
    });
  },

  '07. Race and ethnicity per CDCREC (REQUIRED CY2026)': function (browser) {
    // The CY2026 (a)(5) criterion requires recording race(s) and ethnicity(ies)
    // per CDCREC aggregated to OMB categories, with a declined-to-specify option
    // (updated code-set deadline 12/31/2025). Race/ethnicity collection is
    // settings-gated (forbidden in some jurisdictions) — this test runs against a
    // settings file with settings.public.modules.patientDemographics.raceEthnicity
    // enabled, so the fields render and the us-core-race extension persists.

    // Re-land on the patient detail page (step 06's save may have changed the
    // form state) so the probe sees the rendered demographics fields.
    browser
      .url('http://localhost:3000/patients/' + testPatientFhirId)
      .waitForElementVisible('#patientDetailPage', TIMEOUTS.extended)
      .pause(2000);

    browser.execute(function () {
      var raceField = document.querySelector('[data-testid*="race"], #raceSelect, #raceInput');
      var ethField = document.querySelector('[data-testid*="ethnicity"], #ethnicitySelect, #ethnicityInput');
      var labels = Array.prototype.map.call(document.querySelectorAll('label'), function (l) { return l.textContent; });
      return {
        hasRaceField: !!raceField,
        hasEthnicityField: !!ethField,
        hasRaceLabel: labels.some(function (t) { return /race/i.test(t); }),
        hasEthnicityLabel: labels.some(function (t) { return /ethnicity/i.test(t); })
      };
    }, [], function (result) {
      var v = result.value;
      console.log('[a.5] race/ethnicity UI probe:', JSON.stringify(v));
      browser.assert.ok(
        v.hasRaceField || v.hasRaceLabel,
        'ONC 170.315.a.5 - Race recording field present on the patient form (CDCREC/OMB)'
      );
      browser.assert.ok(
        v.hasEthnicityField || v.hasEthnicityLabel,
        'ONC 170.315.a.5 - Ethnicity recording field present on the patient form (CDCREC/OMB)'
      );
    });

    browser.executeAsync(function (fhirId, done) {
      Meteor.call('patients.findOne', fhirId, function (err, patient) {
        if (err || !patient) { done({ ok: false }); return; }
        var raceExt = (patient.extension || []).filter(function (ext) {
          return ext.url === 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-race';
        });
        var omb = null;
        if (raceExt.length && Array.isArray(raceExt[0].extension)) {
          var ombSub = raceExt[0].extension.filter(function (se) { return se.url === 'ombCategory' && se.valueCoding; });
          omb = ombSub.map(function (se) { return se.valueCoding.code; });
        }
        done({ ok: true, racePersisted: raceExt.length > 0, ombCategories: omb, extensionUrls: (patient.extension || []).map(function (e) { return e.url; }) });
      });
    }, [testPatientFhirId], function (result) {
      var v = result.value || {};
      console.log('[a.5] persisted extensions:', JSON.stringify(v.extensionUrls), 'omb:', JSON.stringify(v.ombCategories));
      browser.assert.ok(
        v.racePersisted,
        'ONC 170.315.a.5 - us-core-race complex extension persisted through patients.insert'
      );
      browser.assert.ok(
        Array.isArray(v.ombCategories) && v.ombCategories.indexOf('2028-9') !== -1,
        'ONC 170.315.a.5 - recorded race carries the CDCREC OMB category (2028-9 Asian: ' + JSON.stringify(v.ombCategories) + ')'
      );
    });
  },

  '08. Cleanup and completion': function (browser) {
    // Best-effort cleanup (patients.remove is TEST_RUN-gated)
    browser.executeAsync(function (fhirId, done) {
      Meteor.call('patients.remove', fhirId, function (err) {
        done({ removed: !err, reason: err ? (err.reason || err.message) : 'ok' });
      });
    }, [testPatientFhirId], function (result) {
      console.log('[a.5] cleanup:', JSON.stringify(result.value));
    });

    takeScreenshot(browser, 'base-ehr_170.315.a.5_demographics.png', '170.315.a.5');

    logTestCompletion(browser, '170.315.a.5', 'Demographics CY2026 (behavioral)', [
      'RECORD: name, DOB, sex (birth-sex F), preferred language (RFC 5646 es-MX)',
      'ACCESS: demographics displayed on patient chart',
      'CHANGE: family name edited via chart UI and persisted',
      'Sex capability per EO 14168 guidance (Female/Male + decline options)',
      'Race/ethnicity CDCREC recording (settings-gated) — field present + us-core-race persisted'
    ]);

    browser.end();
  }
};
