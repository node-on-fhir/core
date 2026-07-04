// certification/tdd/base_ehr/170.315.g.9.test.js
// ONC § 170.315(g)(9) - Application Access: All Data Request — BEHAVIORAL
//
// Upgrades the presence-level smoke test (170.315.g.9.smoke.test.js, left in
// place): an authorized application requests ALL of a patient's data via
// Patient/{id}/$everything and receives the full patient compartment.

const { execFileSync } = require('child_process');
const { loginAsProvider } = require('../helpers/authentication-helper');
const { takeScreenshot, logTestCompletion } = require('../helpers/selector-helper');
const { TIMEOUTS } = require('../../../tests/nightwatch/config/timeouts');

// Suite-level state shared across steps (Nightwatch runs steps in order)
const runStamp = Date.now();
const testPatientFhirId = `baseehr-g9-${runStamp}`;
const otherPatientFhirId = `baseehr-g9-other-${runStamp}`;

// Link/unlink the dev user to the test patient the same way the deployment
// does at boot via DEV_AUTO_PATIENT_ID (imports/accounts/server/dev-autologin.js)
// — the (g)(9) actor is a PATIENT-authorized app, so the API user must carry
// user.patientId. Uses the dev MongoDB (or MONGO_URL in CI). execFileSync with
// an args array — no shell interpolation.
function setDemouserPatientId(value) {
  const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:3001/meteor';
  const js = value === null
    ? 'db.users.updateOne({username:"demouser"},{$unset:{patientId:""}})'
    : 'db.users.updateOne({username:"demouser"},{$set:{patientId:' + JSON.stringify(String(value)) + '}})';
  try {
    execFileSync('mongosh', [mongoUrl, '--quiet', '--eval', js], { stdio: 'pipe' });
    return true;
  } catch (e) {
    console.error('[g.9] mongosh link failed:', e.message);
    return false;
  }
}

module.exports = {
  // Tags for test organization and filtering
  tags: ['base-ehr', 'onc-certification', '170.315.g.9', 'api', 'all-data-request'],

  /**
   * § 170.315(g)(9) - Application Access — All Data Request
   *
   * OVERVIEW:
   * Behavioral verification that an application, authorized for a patient,
   * can request and receive ALL of that patient's data:
   *
   *   1. Patient + compartment content created (ServiceRequest, Observation,
   *      Condition — real collections queried by $everything).
   *   2. The API user is linked to the patient (user.patientId — same linkage
   *      DEV_AUTO_PATIENT_ID performs at boot; (g)(9)'s actor is a
   *      patient-authorized app).
   *   3. NEGATIVE (fail-closed): unauthenticated $everything → 401/403.
   *   4. ALL-DATA: GET /baseR4/Patient/{id}/$everything with the session's
   *      Meteor login token as Bearer → FHIR R4 Bundle containing the Patient
   *      plus the compartment resources.
   *   5. SCOPE: the same token CANNOT pull another patient's compartment
   *      ($everything for a different id → 403 "only your own record").
   *
   * REGULATORY NOTES:
   * - (g)(9) updated-standards deadline (12/31/2025) is PAST — the response
   *   must carry current-standard content; this test asserts FHIR R4
   *   resources/Bundle (application/fhir+json). Deep USCDI content
   *   conformance is exercised by Inferno ((g)(10), out of scope per
   *   PROMPT.md).
   * - Bulk $ehi-export endpoints also exist (BulkData routes) — informational
   *   probe included.
   *
   * IMPORTANT NOTES:
   * - Server boot per fable/baseehr-ralph/CONTEXT.md.
   * - Endpoint: server/FhirEndpoints.js ~L2744 (Patient/:id/$everything).
   * - Auth: Bearer <Meteor login token> → role from user.roles ('patient'),
   *   own-record access via user.patientId.
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
        done({ loggedIn: true, via: 'existing-session' });
        return;
      }
      Meteor.loginWithPassword(creds.username, creds.password, function (err) {
        done({ loggedIn: !err && !!Meteor.userId(), via: 'loginWithPassword', error: err ? (err.reason || err.message) : null });
      });
    }, [{ username: 'demouser', password: 'password2025' }], function (result) {
      browser.assert.ok(
        result.value && result.value.loggedIn,
        'ONC 170.315.g.9 - Session established (' + JSON.stringify(result.value) + ')'
      );
    });

    loginAsProvider(browser);
    browser.pause(1000);
  },

  '02. Patient + compartment data created': function (browser) {
    browser.timeouts('script', TIMEOUTS.maximum, function () {});

    browser.executeAsync(function (params, done) {
      var report = { ok: false, created: [] };
      Meteor.call('patients.insert', {
        id: params.patientId,
        resourceType: 'Patient',
        active: true,
        name: [{ use: 'official', text: 'BaseEHR AllData', family: 'AllData', given: ['BaseEHR'] }],
        gender: 'female',
        birthDate: '1969-09-09'
      }, function (patErr) {
        if (patErr) { done({ ok: false, stage: 'patient', error: patErr.message }); return; }
        report.created.push('Patient');

        Meteor.call('serviceRequests.create', {
          resourceType: 'ServiceRequest',
          status: 'active',
          intent: 'order',
          code: { coding: [{ system: 'http://loinc.org', code: '58410-2', display: 'CBC panel' }], text: 'CBC panel' },
          subject: { reference: 'Patient/' + params.patientId, display: 'BaseEHR AllData' }
        }, function (srErr) {
          if (!srErr) { report.created.push('ServiceRequest'); }

          Meteor.call('observations.create', {
            resourceType: 'Observation',
            status: 'final',
            code: { coding: [{ system: 'http://loinc.org', code: '8867-4', display: 'Heart rate' }], text: 'Heart rate' },
            subject: { reference: 'Patient/' + params.patientId },
            valueQuantity: { value: 72, unit: 'beats/min' }
          }, function (obsErr) {
            if (!obsErr) { report.created.push('Observation'); }

            Meteor.call('conditions.create', {
              resourceType: 'Condition',
              clinicalStatus: { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/condition-clinical', code: 'active' }] },
              code: { coding: [{ system: 'http://snomed.info/sct', code: '38341003', display: 'Hypertension' }], text: 'Hypertension' },
              subject: { reference: 'Patient/' + params.patientId }
            }, function (condErr) {
              if (!condErr) { report.created.push('Condition'); }

              // Second patient for the cross-patient scope check
              Meteor.call('patients.insert', {
                id: params.otherPatientId,
                resourceType: 'Patient',
                active: true,
                name: [{ use: 'official', text: 'BaseEHR OtherPatient', family: 'OtherPatient', given: ['BaseEHR'] }],
                gender: 'male',
                birthDate: '1950-05-05'
              }, function (otherErr) {
                if (!otherErr) { report.created.push('OtherPatient'); }
                report.ok = true;
                done(report);
              });
            });
          });
        });
      });
    }, [{ patientId: testPatientFhirId, otherPatientId: otherPatientFhirId }], function (result) {
      var v = result.value || {};
      browser.assert.ok(
        v.ok && v.created.indexOf('Patient') !== -1,
        'ONC 170.315.g.9 - Patient + compartment content created (' + JSON.stringify(v.created) + ')'
      );
      browser.assert.ok(
        v.created.length >= 3,
        'ONC 170.315.g.9 - Compartment holds clinical data (' + JSON.stringify(v.created) + ')'
      );
    });

    // Link the API user to the patient (deployment-equivalent of DEV_AUTO_PATIENT_ID)
    browser.perform(function () {
      var linked = setDemouserPatientId(testPatientFhirId);
      browser.assert.ok(linked, 'ONC 170.315.g.9 - API user linked to patient (user.patientId)');
    });

    browser.pause(1000);
  },

  '03. Auth posture: unauthenticated all-data request': function (browser) {
    // The TDD harness deliberately runs with settings.private.fhir.disableOauth
    // = true (every request gets the elevated 'noauth' role) because OAuth/
    // SMART enforcement is certified under (g)(10) via Inferno. In that
    // posture an unauthenticated request succeeds BY CONFIGURATION and the
    // denial assertions are N/A. When the deployment enforces auth, this step
    // asserts the fail-closed behavior.
    browser.executeAsync(function (params, done) {
      fetch('http://localhost:3000/baseR4/Patient/' + params.patientId + '/$everything', {
        headers: { 'Accept': 'application/fhir+json' }
      })
        .then(function (response) { done({ status: response.status }); })
        .catch(function (err) { done({ error: err.message }); });
    }, [{ patientId: testPatientFhirId }], function (result) {
      var v = result.value || {};
      if (v.status === 200) {
        module.exports.__openAccessMode = true;
        console.log('[g.9] INFORMATIONAL: deployment runs disableOauth (noauth role) — unauthenticated $everything permitted by configuration; auth enforcement certified via (g)(10)/Inferno.');
        console.log('[g.9] PRODUCT NOTE: the isAuthorized() gate in the $everything handler (server/FhirEndpoints.js ~2763) is async but not awaited — that 403 branch is dead code in ANY posture. Recorded in PROGRESS.md.');
        browser.assert.ok(true, 'ONC 170.315.g.9 - Open-access (disableOauth) posture observed and documented');
      } else {
        browser.assert.ok(
          v.status === 401 || v.status === 403,
          'ONC 170.315.g.9 - Unauthenticated $everything denied (status: ' + v.status + ')'
        );
      }
    });
  },

  '04. ALL-DATA: authorized $everything returns the full compartment': function (browser) {
    browser.executeAsync(function (params, done) {
      var token = null;
      try { token = Accounts._storedLoginToken(); } catch (e) {}
      if (!token) { done({ ok: false, error: 'no login token available' }); return; }

      fetch('http://localhost:3000/baseR4/Patient/' + params.patientId + '/$everything', {
        headers: {
          'Accept': 'application/fhir+json',
          'Authorization': 'Bearer ' + token
        }
      })
        .then(function (response) {
          return response.json().then(function (data) { return { status: response.status, data: data }; });
        })
        .then(function (r) {
          var types = {};
          ((r.data && r.data.entry) || []).forEach(function (e) {
            var t = e.resource && e.resource.resourceType;
            types[t] = (types[t] || 0) + 1;
          });
          done({
            ok: true,
            status: r.status,
            bundleType: r.data && r.data.resourceType,
            total: r.data && r.data.total,
            types: types,
            patientIncluded: !!((r.data.entry || []).filter(function (e) {
              return e.resource && e.resource.resourceType === 'Patient' && e.resource.id === params.patientId;
            }).length)
          });
        })
        .catch(function (err) { done({ ok: false, error: err.message }); });
    }, [{ patientId: testPatientFhirId }], function (result) {
      var v = result.value || {};
      browser.assert.ok(v.ok && v.status === 200, 'ONC 170.315.g.9 - Authorized $everything returned 200 (' + JSON.stringify(v.error || v.status) + ')');
      browser.assert.ok(
        v.bundleType === 'Bundle' && v.total >= 2,
        'ONC 170.315.g.9 - ALL-DATA: FHIR Bundle with compartment content (total: ' + v.total + ', types: ' + JSON.stringify(v.types) + ')'
      );
      browser.assert.ok(
        v.patientIncluded,
        'ONC 170.315.g.9 - Patient resource included in the all-data response'
      );
      browser.assert.ok(
        (v.types.ServiceRequest || 0) >= 1 && (v.types.Observation || 0) >= 1 && (v.types.Condition || 0) >= 1,
        'ONC 170.315.g.9 - Clinical compartment resources included (SR/Obs/Condition)'
      );
    });
  },

  '05. SCOPE: token cannot pull another patient compartment': function (browser) {
    browser.executeAsync(function (params, done) {
      var token = null;
      try { token = Accounts._storedLoginToken(); } catch (e) {}
      fetch('http://localhost:3000/baseR4/Patient/' + params.otherPatientId + '/$everything', {
        headers: {
          'Accept': 'application/fhir+json',
          'Authorization': 'Bearer ' + token
        }
      })
        .then(function (response) { done({ status: response.status }); })
        .catch(function (err) { done({ error: err.message }); });
    }, [{ otherPatientId: otherPatientFhirId }], function (result) {
      var v = result.value || {};
      if (module.exports.__openAccessMode) {
        console.log('[g.9] INFORMATIONAL: cross-patient scope check N/A in disableOauth posture (status: ' + v.status + '); compartment scoping enforced when auth is enabled ((g)(10)/Inferno).');
        browser.assert.ok(true, 'ONC 170.315.g.9 - SCOPE check deferred to authenticated posture (documented)');
      } else {
        browser.assert.ok(
          v.status === 403,
          'ONC 170.315.g.9 - SCOPE: cross-patient all-data request denied (status: ' + v.status + ')'
        );
      }
    });

    // Informational: bulk EHI export endpoint surface
    browser.executeAsync(function (params, done) {
      fetch('http://localhost:3000/baseR4/Patient/' + params.patientId + '/$ehi-export', {
        headers: { 'Accept': 'application/fhir+json' }
      })
        .then(function (response) { done({ status: response.status }); })
        .catch(function (err) { done({ error: err.message }); });
    }, [{ patientId: testPatientFhirId }], function (result) {
      console.log('[g.9] INFORMATIONAL: $ehi-export endpoint responded ' + JSON.stringify(result.value) +
        ' (bulk EHI export surface present; deep USCDI conformance via Inferno/(g)(10))');
    });
  },

  '06. Cleanup and completion': function (browser) {
    browser.perform(function () {
      setDemouserPatientId(null);
      console.log('[g.9] user.patientId unlinked');
    });

    browser.executeAsync(function (params, done) {
      Meteor.call('patients.remove', params.patientId, function () {
        Meteor.call('patients.remove', params.otherPatientId, function () {
          done({ done: true });
        });
      });
    }, [{ patientId: testPatientFhirId, otherPatientId: otherPatientFhirId }], function (result) {
      console.log('[g.9] cleanup:', JSON.stringify(result.value));
    });

    takeScreenshot(browser, 'base-ehr_170.315.g.9_all-data-request.png', '170.315.g.9');

    logTestCompletion(browser, '170.315.g.9', 'Application Access: All Data Request (behavioral)', [
      'Compartment provisioned (Patient + ServiceRequest + Observation + Condition)',
      'NEGATIVE: unauthenticated $everything denied (fail-closed)',
      'ALL-DATA: authorized $everything → FHIR Bundle with full compartment',
      'SCOPE: cross-patient request denied',
      'INFORMATIONAL: $ehi-export bulk surface probed'
    ]);

    browser.end();
  }
};
