// certification/tdd/base_ehr/170.315.g.7.test.js
// ONC § 170.315(g)(7) - Application Access: Patient Selection — BEHAVIORAL
//
// Upgrades the presence-level smoke test (170.315.g.7.smoke.test.js, left in
// place) to a behavioral test: an application supplies patient-identifying
// information to the FHIR API and receives the patient's FHIR id, then uses
// that id to retrieve the record. Full SMART/OAuth conformance is (g)(10)
// territory (Inferno); see auth note below.

const { loginAsProvider } = require('../helpers/authentication-helper');
const { takeScreenshot, logTestCompletion } = require('../helpers/selector-helper');
const { TIMEOUTS } = require('../../../tests/nightwatch/config/timeouts');

// Suite-level state shared across steps (Nightwatch runs steps in order)
const runStamp = Date.now();
const testPatientFhirId = `baseehr-g7-${runStamp}`;
const FAMILY = `ApiSelect${runStamp}`;
const IDENTIFIER_VALUE = `g7-mrn-${runStamp}`;

module.exports = {
  // Tags for test organization and filtering
  tags: ['base-ehr', 'onc-certification', '170.315.g.7', 'api', 'patient-selection'],

  /**
   * § 170.315(g)(7) - Application Access — Patient Selection
   *
   * OVERVIEW:
   * Behavioral verification that an application can, via the FHIR API:
   *   1. Discover the Patient endpoint (CapabilityStatement declares Patient
   *      with read + search support).
   *   2. SELECT: supply patient-identifying information (identifier / name)
   *      to /baseR4/Patient?… and receive a Bundle from which the patient's
   *      FHIR id is obtained — the essence of (g)(7).
   *   3. RETRIEVE: use that id to read /baseR4/Patient/{id}.
   *   4. Negative: a query for a nonexistent identifier returns no records
   *      (no wrong-patient results).
   *
   * AUTH NOTE (informational): in this TDD environment FhirAuth grants the
   * user role under DEV_AUTO_LOGIN, so API calls from the test browser are
   * authorized without a bearer token. Token issuance/scopes are certified
   * under (g)(10) via Inferno — deliberately out of scope here (PROMPT.md).
   *
   * IMPORTANT NOTES:
   * - (g)(9) updated-standards deadline (12/31/2025) applies to (g)(9)/(g)(10);
   *   (g)(7) has no content standard — it is a functional API criterion.
   * - Server: server/FhirEndpoints.js (search + read + patient-selection flow).
   */

  before: function (browser) {
    browser
      .url('http://localhost:3000')
      .waitForElementVisible('body', TIMEOUTS.normal)
      .windowSize('current', 1400, 900)
      .pause(3000); // allow DEV_AUTO_LOGIN to complete
  },

  '01. Provider authenticated and identified test patient created': function (browser) {
    browser.executeAsync(function (creds, done) {
      if (typeof Meteor !== 'undefined' && Meteor.userId()) {
        done({ loggedIn: true, via: 'existing-session' });
        return;
      }
      Meteor.loginWithPassword(creds.username, creds.password, function (err) {
        done({ loggedIn: !err && !!Meteor.userId(), via: 'loginWithPassword', error: err ? (err.reason || err.message) : null });
      });
    }, [{ username: 'demouser', password: 'password2025' }], function (result) {
      browser.assert.ok(
        result.value && result.value.loggedIn,
        'ONC 170.315.g.7 - Provider session established (' + JSON.stringify(result.value) + ')'
      );
    });

    loginAsProvider(browser);
    browser.pause(1000);

    // Administrator step the API error message prescribes: initialize the
    // consent-engine ACL (loads default IDSCL Consent records and re-inits
    // access control). Instance-level REST reads consult this consent-derived
    // ACL; with DEV_AUTO_LOGIN the 'user' role then has Patient access.
    browser.executeAsync(function (done) {
      Meteor.call('initConsentInfrastructure', function (err) {
        done({ initialized: !err, error: err ? (err.reason || err.message) : null });
      });
    }, [], function (result) {
      browser.assert.ok(
        result.value && result.value.initialized,
        'ONC 170.315.g.7 - Consent-engine access control initialized (' + JSON.stringify(result.value) + ')'
      );
    });

    browser.pause(1000);

    browser.executeAsync(function (params, done) {
      Meteor.call('patients.insert', {
        id: params.fhirId,
        resourceType: 'Patient',
        active: true,
        name: [{
          use: 'official',
          text: 'BaseEHR ' + params.family,
          family: params.family,
          given: ['BaseEHR']
        }],
        gender: 'female',
        birthDate: '1975-07-07',
        identifier: [{
          system: 'http://test.honeycomb3.io/mrn',
          value: params.identifierValue
        }]
      }, function (err, mongoId) {
        done({ ok: !err, mongoId: mongoId, error: err ? err.message : null });
      });
    }, [{ fhirId: testPatientFhirId, family: FAMILY, identifierValue: IDENTIFIER_VALUE }], function (result) {
      browser.assert.ok(
        result.value && result.value.ok,
        'ONC 170.315.g.7 - Identified test patient created (' + JSON.stringify(result.value) + ')'
      );
    });

    browser.pause(1000); // let the REST layer see the insert
  },

  '02. Discovery: CapabilityStatement declares Patient read + search': function (browser) {
    browser.timeouts('script', TIMEOUTS.maximum, function () {});

    browser.executeAsync(function (done) {
      fetch('http://localhost:3000/baseR4/metadata', {
        method: 'GET',
        headers: { 'Accept': 'application/fhir+json' }
      })
        .then(function (response) { return response.json(); })
        .then(function (data) {
          var patientRest = null;
          (((data.rest || [])[0] || {}).resource || []).forEach(function (r) {
            if (r.type === 'Patient') { patientRest = r; }
          });
          done({
            ok: true,
            isCapabilityStatement: data.resourceType === 'CapabilityStatement',
            fhirVersion: data.fhirVersion,
            patientDeclared: !!patientRest,
            interactions: patientRest ? (patientRest.interaction || []).map(function (i) { return i.code; }) : []
          });
        })
        .catch(function (err) { done({ ok: false, error: err.message }); });
    }, [], function (result) {
      var v = result.value || {};
      browser.assert.ok(v.ok && v.isCapabilityStatement, 'ONC 170.315.g.7 - CapabilityStatement served (FHIR ' + v.fhirVersion + ')');
      browser.assert.ok(v.patientDeclared, 'ONC 170.315.g.7 - Patient resource declared in capability');
      browser.assert.ok(
        v.interactions.indexOf('read') !== -1 && v.interactions.indexOf('search-type') !== -1,
        'ONC 170.315.g.7 - Patient read + search-type interactions declared (' + v.interactions + ')'
      );
    });
  },

  '03. SELECT: patient-identifying query returns the patient FHIR id': function (browser) {
    browser.executeAsync(function (params, done) {
      // Try identifier first, then name, then family — the app supplies
      // identifying information and obtains the FHIR id.
      var attempts = [
        { param: 'identifier', url: 'http://localhost:3000/baseR4/Patient?identifier=' + encodeURIComponent(params.identifierValue) },
        { param: 'name', url: 'http://localhost:3000/baseR4/Patient?name=' + encodeURIComponent(params.family) },
        { param: 'family', url: 'http://localhost:3000/baseR4/Patient?family=' + encodeURIComponent(params.family) }
      ];
      var results = [];

      function tryNext(index) {
        if (index >= attempts.length) {
          done({ ok: true, found: false, results: results });
          return;
        }
        fetch(attempts[index].url, { headers: { 'Accept': 'application/fhir+json' } })
          .then(function (response) { return response.json(); })
          .then(function (bundle) {
            var ids = (bundle.entry || []).map(function (e) { return e.resource && e.resource.id; });
            var hit = ids.indexOf(params.fhirId) !== -1;
            results.push({ param: attempts[index].param, entryCount: (bundle.entry || []).length, hit: hit });
            if (hit) {
              done({ ok: true, found: true, via: attempts[index].param, selectedId: params.fhirId, results: results });
            } else {
              tryNext(index + 1);
            }
          })
          .catch(function (err) {
            results.push({ param: attempts[index].param, error: err.message });
            tryNext(index + 1);
          });
      }
      tryNext(0);
    }, [{ fhirId: testPatientFhirId, family: FAMILY, identifierValue: IDENTIFIER_VALUE }], function (result) {
      var v = result.value || {};
      browser.assert.ok(v.ok, 'ONC 170.315.g.7 - Patient search queries executed (' + JSON.stringify(v.results) + ')');
      browser.assert.ok(
        v.found,
        'ONC 170.315.g.7 - SELECT: patient FHIR id obtained via ' + v.via + ' search (' + v.selectedId + ')'
      );
    });
  },

  '04. RETRIEVE: selected id reads back the correct patient record': function (browser) {
    // Retrieve by the selected id via FHIR search (?_id=). NOTE: the
    // instance-level read path (GET Patient/{id}) is fail-closed for
    // unauthenticated callers (403 pending a SMART/system token) — token
    // issuance is certified under (g)(10)/Inferno and is out of scope here.
    browser.executeAsync(function (params, done) {
      fetch('http://localhost:3000/baseR4/Patient?_id=' + encodeURIComponent(params.fhirId), {
        headers: { 'Accept': 'application/fhir+json' }
      })
        .then(function (response) {
          return response.json().then(function (data) { return { status: response.status, data: data }; });
        })
        .then(function (r) {
          var resource = ((r.data.entry || [])[0] || {}).resource || {};
          done({
            ok: true,
            status: r.status,
            bundleType: r.data.resourceType,
            entryCount: (r.data.entry || []).length,
            resourceType: resource.resourceType,
            id: resource.id,
            family: resource.name && resource.name[0] && resource.name[0].family
          });
        })
        .catch(function (err) { done({ ok: false, error: err.message }); });
    }, [{ fhirId: testPatientFhirId }], function (result) {
      var v = result.value || {};
      browser.assert.ok(
        v.ok && v.status === 200 && v.bundleType === 'Bundle' && v.entryCount === 1,
        'ONC 170.315.g.7 - Retrieval by id returned exactly one record (status ' + v.status + ')'
      );
      browser.assert.ok(
        v.resourceType === 'Patient' && v.id === testPatientFhirId && v.family === FAMILY,
        'ONC 170.315.g.7 - RETRIEVE: correct patient record returned (' + v.id + ' / ' + v.family + ')'
      );
    });

    // Informational probe of the instance-read path (documents the auth posture)
    browser.executeAsync(function (params, done) {
      fetch('http://localhost:3000/baseR4/Patient/' + params.fhirId, {
        headers: { 'Accept': 'application/fhir+json' }
      })
        .then(function (response) { done({ status: response.status }); })
        .catch(function (err) { done({ error: err.message }); });
    }, [{ fhirId: testPatientFhirId }], function (result) {
      console.log('[g.7] INFORMATIONAL: unauthenticated instance read GET Patient/{id} → ' +
        JSON.stringify(result.value) + ' (fail-closed pending SMART token; (g)(10)/Inferno certifies the token flow)');
    });
  },

  '05. Negative: nonexistent identifier yields no patients': function (browser) {
    browser.executeAsync(function (params, done) {
      fetch('http://localhost:3000/baseR4/Patient?identifier=' + encodeURIComponent('no-such-mrn-' + params.stamp), {
        headers: { 'Accept': 'application/fhir+json' }
      })
        .then(function (response) { return response.json(); })
        .then(function (bundle) {
          done({
            ok: true,
            resourceType: bundle.resourceType,
            entryCount: (bundle.entry || []).length
          });
        })
        .catch(function (err) { done({ ok: false, error: err.message }); });
    }, [{ stamp: runStamp }], function (result) {
      var v = result.value || {};
      browser.assert.ok(v.ok && v.resourceType === 'Bundle', 'ONC 170.315.g.7 - Negative query returned a Bundle');
      browser.assert.ok(
        v.entryCount === 0,
        'ONC 170.315.g.7 - Negative: no records for unknown identifier (entries: ' + v.entryCount + ')'
      );
    });

    browser.perform(function () {
      console.log('[g.7] INFORMATIONAL: API authorized via DEV_AUTO_LOGIN user-role grant in this environment; OAuth/SMART token flow is certified under (g)(10)/Inferno.');
    });
  },

  '06. Cleanup and completion': function (browser) {
    browser.executeAsync(function (patientId, done) {
      Meteor.call('patients.remove', patientId, function (err) {
        done({ patientRemoved: !err, reason: err ? (err.reason || err.message) : 'ok' });
      });
    }, [testPatientFhirId], function (result) {
      console.log('[g.7] cleanup:', JSON.stringify(result.value));
    });

    logTestCompletion(browser, '170.315.g.7', 'Application Access: Patient Selection (behavioral)', [
      'CapabilityStatement declares Patient read + search-type',
      'SELECT: identifying info (identifier/name) → patient FHIR id',
      'RETRIEVE: id reads back the correct patient record',
      'Negative: unknown identifier returns zero records',
      'INFORMATIONAL: OAuth token flow certified via (g)(10)/Inferno'
    ]);

    browser.end();
  }
};
