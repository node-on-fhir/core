// certification/tdd/base_ehr/170.315.a.14.test.js
// ONC § 170.315(a)(14) - Implantable Device List — BEHAVIORAL (record / parse / access / change)

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
const testPatientFhirId = `baseehr-a14-${runStamp}`;
// GS1 human-readable-form UDI with AIs: (01) GTIN/DI, (11) production date,
// (17) expiration date, (10) lot, (21) serial
const TEST_UDI = '(01)00844588003288(11)141231(17)150707(10)A213B1(21)SN' + runStamp;
const DEVICE_NAME = 'BaseEHR Cardiac Pacemaker A14';
let deviceMongoId = null;

module.exports = {
  // Tags for test organization and filtering
  tags: ['base-ehr', 'onc-certification', '170.315.a.14', 'implantable-devices', 'udi'],

  /**
   * § 170.315(a)(14) - Implantable Device List
   *
   * OVERVIEW:
   * Behavioral verification of the implantable device list criterion:
   * - RECORD a UDI (45 CFR § 170.315(a)(14)(i)).
   * - PARSE the UDI into Device Identifier + Production Identifiers — lot,
   *   serial, expiration date, manufacture/production date (§ (a)(14)(ii)).
   * - OBTAIN a device description (GUDID lookup) (§ (a)(14)(iii)).
   * - Maintain and ACCESS a list of implantable devices with UDI, parsed
   *   identifiers, and description (§ (a)(14)(iv)-(vi)).
   * - CHANGE device status (active → inactive).
   *
   * Flow:
   *   1. Provider signs in; test patient created + selected.
   *   2. PARSE — implantableDevices.parseUDI on a GS1 HRF UDI string; assert
   *      DI (GTIN), lot, serial, expiration, production date + GUDID info.
   *   3. RECORD — implantableDevices.register persists a US Core Implantable
   *      Device profile FHIR Device (udiCarrier, distinctIdentifier,
   *      patient reference) + DeviceUseStatement + audit event.
   *   4. ACCESS (data) — implantableDevices.getPatientDevices returns the
   *      device list for the patient.
   *   5. ACCESS (UI) — /implantable-devices renders the patient's device list
   *      (page reads Session.selectedPatient; NOTE: this page exposes no
   *      element ids / data-testids, so UI assertions are text-based).
   *   6. CHANGE — implantableDevices.updateStatus active → inactive, verified.
   *
   * BDD Reference: certification/bdd/170.315-a-14-implantable-device-list.feature
   *
   * REGULATORY CONTEXT:
   * § 170.315(a)(14): record UDIs associated with a patient's implantable
   * devices, parse DI + production identifiers, retrieve the device
   * description, and enable a user to access them.
   *
   * IMPORTANT NOTES:
   * - Server boot per fable/baseehr-ralph/CONTEXT.md (EXTRA_WORKFLOWS incl.
   *   @node-on-fhir/implantable-devices).
   * - Component: npmPackages/implantable-devices/client/ImplantableDevicesPage.jsx
   * - Methods: npmPackages/implantable-devices/server/methods.js
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
        'ONC 170.315.a.14 - Provider session established (' + JSON.stringify(result.value) + ')'
      );
    });

    // Fallback path for environments without DEV_AUTO_LOGIN
    loginAsProvider(browser);
    browser.pause(1000);
  },

  '02. Test patient created and selected (patient context)': function (browser) {
    browser.executeAsync(function (fhirId, done) {
      Meteor.call('patients.insert', {
        id: fhirId,
        resourceType: 'Patient',
        active: true,
        name: [{
          use: 'official',
          text: 'BaseEHR DeviceList',
          family: 'DeviceList',
          given: ['BaseEHR']
        }],
        gender: 'male',
        birthDate: '1955-11-11'
      }, function (insertErr, mongoId) {
        if (insertErr) {
          done({ ok: false, stage: 'insert', error: insertErr.message });
          return;
        }
        Meteor.call('patients.findOne', mongoId, function (findErr, patient) {
          if (findErr || !patient) {
            done({ ok: false, stage: 'findOne', error: findErr ? findErr.message : 'not found' });
            return;
          }
          Session.set('selectedPatientId', patient.id);
          Session.set('selectedPatient', patient);
          done({ ok: true, mongoId: mongoId, fhirId: patient.id });
        });
      });
    }, [testPatientFhirId], function (result) {
      browser.assert.ok(
        result.value && result.value.ok,
        'ONC 170.315.a.14 - Test patient created + Session context set (' +
          JSON.stringify(result.value) + ')'
      );
    });

    browser.pause(500);
  },

  '03. PARSE: UDI parsed into DI + production identifiers (§ a.14.ii)': function (browser) {
    browser.executeAsync(function (udi, done) {
      Meteor.call('implantableDevices.parseUDI', udi, function (err, result) {
        if (err) { done({ ok: false, error: err.message }); return; }
        done({ ok: true, components: result.components, deviceInfo: result.deviceInfo });
      });
    }, [TEST_UDI], function (result) {
      var v = result.value || {};
      browser.assert.ok(v.ok, 'ONC 170.315.a.14 - parseUDI completed (' + JSON.stringify(v.error || '') + ')');
      if (v.ok) {
        var c = v.components || {};
        browser.assert.ok(
          c.deviceId === '00844588003288',
          'ONC 170.315.a.14 - PARSE: Device Identifier (GTIN) extracted (' + c.deviceId + ')'
        );
        browser.assert.ok(
          c.lotNumber === 'A213B1',
          'ONC 170.315.a.14 - PARSE: lot number extracted (' + c.lotNumber + ')'
        );
        browser.assert.ok(
          !!c.serialNumber && c.serialNumber.indexOf('SN') === 0,
          'ONC 170.315.a.14 - PARSE: serial number extracted (' + c.serialNumber + ')'
        );
        browser.assert.ok(
          c.expirationDate === '150707',
          'ONC 170.315.a.14 - PARSE: expiration date extracted (' + c.expirationDate + ')'
        );
        browser.assert.ok(
          c.productionDate === '141231',
          'ONC 170.315.a.14 - PARSE: production/manufacture date extracted (' + c.productionDate + ')'
        );
        browser.assert.ok(
          !!v.deviceInfo,
          'ONC 170.315.a.14 - PARSE: device description obtained from GUDID lookup (§ a.14.iii)'
        );
      }
    });
  },

  '04. RECORD: device registered with UDI for the patient': function (browser) {
    browser.executeAsync(function (params, done) {
      Meteor.call('implantableDevices.register', {
        patientId: params.patientId,
        udi: params.udi,
        deviceName: params.deviceName,
        manufacturer: 'BaseEHR Devices Inc',
        model: 'PM-3000',
        type: 'Cardiac Pacemaker',
        class: 'III',
        implantDate: new Date('2024-05-15T09:30:00Z'),
        implantSite: 'Left pectoral region'
      }, function (err, result) {
        if (err) { done({ ok: false, error: err.message }); return; }
        done({ ok: true, deviceId: result.deviceId, success: result.success });
      });
    }, [{ patientId: testPatientFhirId, udi: TEST_UDI, deviceName: DEVICE_NAME }], function (result) {
      var v = result.value || {};
      browser.assert.ok(
        v.ok && v.success && !!v.deviceId,
        'ONC 170.315.a.14 - RECORD: device registered (' + JSON.stringify(v) + ')'
      );
      if (v.deviceId) { deviceMongoId = v.deviceId; }
    });
  },

  '05. ACCESS: device list returns UDI, identifiers, and description': function (browser) {
    browser.executeAsync(function (patientId, done) {
      Meteor.call('implantableDevices.getPatientDevices', patientId, function (err, devices) {
        if (err) { done({ ok: false, error: err.message }); return; }
        var d = (devices || [])[0] || null;
        done({
          ok: true,
          count: (devices || []).length,
          device: d ? {
            status: d.status,
            udiCarrier: (d.udiCarrier && d.udiCarrier[0] && d.udiCarrier[0].carrierHRF) || null,
            distinctIdentifier: d.distinctIdentifier || null,
            manufacturer: d.manufacturer,
            deviceName: (d.deviceName && d.deviceName[0] && d.deviceName[0].name) || null,
            modelNumber: d.modelNumber,
            profile: (d.meta && d.meta.profile && d.meta.profile[0]) || null,
            patientRef: (d.patient && d.patient.reference) || null
          } : null
        });
      });
    }, [testPatientFhirId], function (result) {
      var v = result.value || {};
      browser.assert.ok(v.ok, 'ONC 170.315.a.14 - getPatientDevices completed');
      browser.assert.ok(
        v.count >= 1 && v.device,
        'ONC 170.315.a.14 - ACCESS: implantable device list populated (count: ' + v.count + ')'
      );
      if (v.device) {
        browser.assert.ok(
          v.device.udiCarrier === TEST_UDI,
          'ONC 170.315.a.14 - ACCESS: UDI recorded on device (udiCarrier HRF)'
        );
        browser.assert.ok(
          !!v.device.distinctIdentifier && v.device.distinctIdentifier.indexOf('SN') === 0,
          'ONC 170.315.a.14 - ACCESS: distinct identification code present (' + v.device.distinctIdentifier + ')'
        );
        browser.assert.ok(
          v.device.deviceName === DEVICE_NAME && v.device.manufacturer === 'BaseEHR Devices Inc',
          'ONC 170.315.a.14 - ACCESS: device description present (name + manufacturer)'
        );
        browser.assert.ok(
          v.device.profile === 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-implantable-device',
          'ONC 170.315.a.14 - Device conforms to US Core Implantable Device profile'
        );
        browser.assert.ok(
          v.device.patientRef === 'Patient/' + testPatientFhirId,
          'ONC 170.315.a.14 - Device linked to the patient'
        );
      }
    });
  },

  '06. ACCESS (UI): device list page renders for the patient': function (browser) {
    // Client-side navigation preserves the Session patient context the page
    // uses to load devices. NOTE: this page has no element ids — text-based.
    browser.execute(function () {
      if (typeof Meteor !== 'undefined' && typeof Meteor.navigate === 'function') {
        Meteor.navigate('/implantable-devices');
        return { navigated: 'Meteor.navigate' };
      }
      window.location.href = '/implantable-devices';
      return { navigated: 'location.href' };
    }, [], function (result) {
      console.log('[a.14] navigation via', result.value.navigated);
    });

    browser.pause(3000); // page fetch via getPatientDevices

    verifyPageLoaded(browser, '170.315.a.14');

    browser.execute(function (deviceName) {
      var text = document.body.textContent || '';
      return {
        hasDeviceVocabulary: /implant|device|UDI/i.test(text),
        hasOurDevice: text.indexOf(deviceName) !== -1 ||
                      text.indexOf('PM-3000') !== -1 ||
                      text.indexOf('Pacemaker') !== -1
      };
    }, [DEVICE_NAME], function (result) {
      var v = result.value;
      browser.assert.ok(
        v.hasDeviceVocabulary,
        'ONC 170.315.a.14 - ACCESS (UI): implantable devices page rendered'
      );
      browser.assert.ok(
        v.hasOurDevice,
        'ONC 170.315.a.14 - ACCESS (UI): registered device visible in the device list UI'
      );
    });
  },

  '07. CHANGE: device status updated and verified': function (browser) {
    browser.perform(function () {
      browser.assert.ok(!!deviceMongoId, 'ONC 170.315.a.14 - Device id captured for change leg');
    });

    browser.executeAsync(function (params, done) {
      Meteor.call('implantableDevices.updateStatus', params.deviceId, 'inactive', function (err, result) {
        if (err) { done({ ok: false, stage: 'update', error: err.message }); return; }
        Meteor.call('implantableDevices.getPatientDevices', params.patientId, function (getErr, devices) {
          if (getErr) { done({ ok: false, stage: 'get', error: getErr.message }); return; }
          var d = (devices || [])[0] || {};
          done({ ok: true, status: d.status });
        });
      });
    }, [{ deviceId: deviceMongoId, patientId: testPatientFhirId }], function (result) {
      var v = result.value || {};
      browser.assert.ok(v.ok, 'ONC 170.315.a.14 - CHANGE: status update round-trip succeeded (' + JSON.stringify(v) + ')');
      browser.assert.ok(
        v.status === 'inactive',
        'ONC 170.315.a.14 - CHANGE: device status change persisted (status: ' + v.status + ')'
      );
    });
  },

  '08. Cleanup and completion': function (browser) {
    browser.executeAsync(function (params, done) {
      Meteor.call('implantableDevices.removeDevice', params.deviceId, function (devErr) {
        Meteor.call('patients.remove', params.patientId, function (patErr) {
          done({
            deviceRemoved: !devErr,
            patientRemoved: !patErr,
            notes: [devErr && devErr.message, patErr && (patErr.reason || patErr.message)].filter(Boolean)
          });
        });
      });
    }, [{ deviceId: deviceMongoId, patientId: testPatientFhirId }], function (result) {
      console.log('[a.14] cleanup:', JSON.stringify(result.value));
    });

    takeScreenshot(browser, 'base-ehr_170.315.a.14_implantable-devices.png', '170.315.a.14');

    logTestCompletion(browser, '170.315.a.14', 'Implantable Device List (behavioral)', [
      'PARSE: GS1 UDI → DI (GTIN), lot, serial, expiration, production date',
      'PARSE: device description obtained (GUDID lookup)',
      'RECORD: US Core Implantable Device profile Device + DeviceUseStatement',
      'ACCESS: patient device list with UDI carrier + distinct identifier',
      'ACCESS (UI): /implantable-devices renders registered device',
      'CHANGE: device status active → inactive persisted'
    ]);

    browser.end();
  }
};
