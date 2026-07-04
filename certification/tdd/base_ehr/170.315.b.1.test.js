// certification/tdd/base_ehr/170.315.b.1.test.js
// ONC § 170.315(b)(1) - Transitions of Care (C-CDA) — BEHAVIORAL + documented gaps

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
const testPatientFhirId = `baseehr-b1-${runStamp}`;
const TOC_LOINC = '18761-7'; // Transfer Summary (transition-of-care document)

module.exports = {
  // Tags for test organization and filtering
  tags: ['base-ehr', 'onc-certification', '170.315.b.1', 'transitions-of-care', 'ccda'],

  /**
   * § 170.315(b)(1) - Transitions of Care
   *
   * OVERVIEW:
   * Behavioral verification of the ToC criterion: CREATE a transition-of-care
   * C-CDA document, VALIDATE it, and ACCESS it — plus documented gaps where
   * the capability is not genuinely built.
   *
   * What IS exercised (green):
   * - clinicalDocuments.generateCCDA produces a C-CDA R2.1-enveloped XML
   *   document (ClinicalDocument root, US realm, CCD templateIds, LOINC
   *   document type incl. ToC types: Transfer Summary 18761-7, Referral Note
   *   57133-1) with LOINC-coded sections (Allergies/Medications/Problems).
   * - The document is persisted as a FHIR DocumentReference (LOINC type,
   *   subject = patient, base64 XML attachment) + AuditEvent.
   * - clinicalDocuments.validateCCDA rejects malformed content (negative test).
   * - /clinical-documents UI route renders.
   *
   * DOCUMENTED GAPS (red — see PROGRESS.md gap register):
   * - GAP(170.315.b.1): the generator uses hardcoded demo data —
   *   gatherPatientData() returns canned "John Doe" demographics and fabricated
   *   allergies/medications/problems regardless of patientId. The real
   *   fhir2ccda conversion is commented out ("In production, this would use
   *   the fhir2ccda library"). A ToC document that does not reflect the
   *   patient's actual record does not satisfy (b)(1) create requirements
   *   (C-CDA + USCDI code-set deadline 12/31/2025 has PASSED).
   * - GAP(170.315.b.1): no receive/display/incorporate capability for inbound
   *   C-CDA documents (no clinicalDocuments.receiveCCDA or equivalent).
   * - Also noted: validateCCDA is string-inspection only (no schematron).
   *
   * BDD Reference: certification/bdd/170.315-b-1-transitions-of-care.feature
   *
   * IMPORTANT NOTES:
   * - Server boot per fable/baseehr-ralph/CONTEXT.md (EXTRA_WORKFLOWS incl.
   *   @node-on-fhir/ccda-export).
   * - Methods: npmPackages/ccda-export/server/methods.js
   * - UI: /clinical-documents (#clinicalDocumentsPage)
   * - clinicalDocuments.getPatientDocuments has a latent findAsync bug and
   *   always returns [] — ACCESS is verified via DocumentReferences directly.
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
        'ONC 170.315.b.1 - Provider session established (' + JSON.stringify(result.value) + ')'
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
          text: 'BaseEHR CcdaTransition',
          family: 'CcdaTransition',
          given: ['BaseEHR']
        }],
        gender: 'female',
        birthDate: '1962-03-03'
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
        'ONC 170.315.b.1 - Test patient created + Session context set (' +
          JSON.stringify(result.value) + ')'
      );
    });

    browser.pause(500);
  },

  '03. CREATE: transition-of-care C-CDA generated and persisted': function (browser) {
    browser.timeouts('script', TIMEOUTS.maximum, function () {});

    browser.executeAsync(function (params, done) {
      Meteor.call('clinicalDocuments.generateCCDA', {
        patientId: params.patientId,
        documentType: params.loinc,
        format: 'xml',
        includeNarrative: true,
        validateDocument: true,
        sections: { Allergies: true, Medications: true, Problems: true }
      }, function (err, result) {
        if (err) { done({ ok: false, error: err.message }); return; }
        // Stash the document for later structural + gap assertions
        window.__b1Doc = result.content;
        done({
          ok: true,
          success: result.success,
          documentId: result.documentId,
          validation: result.validation,
          contentLength: (result.content || '').length,
          filename: result.filename
        });
      });
    }, [{ patientId: testPatientFhirId, loinc: TOC_LOINC }], function (result) {
      var v = result.value || {};
      browser.assert.ok(
        v.ok && v.success && !!v.documentId,
        'ONC 170.315.b.1 - CREATE: ToC document generated + stored (' + JSON.stringify({ ok: v.ok, documentId: v.documentId }) + ')'
      );
      browser.assert.ok(
        v.contentLength > 500,
        'ONC 170.315.b.1 - CREATE: document has substantive content (' + v.contentLength + ' bytes)'
      );
      browser.assert.ok(
        v.validation && v.validation.isValid === true,
        'ONC 170.315.b.1 - CREATE: generation-time validation reported valid'
      );
    });
  },

  '04. Document structure: C-CDA R2.1 envelope + ToC type + coded sections': function (browser) {
    browser.execute(function (loinc) {
      var doc = window.__b1Doc || '';
      return {
        hasRoot: doc.indexOf('<ClinicalDocument') !== -1,
        hasUsRealm: doc.indexOf('<realmCode code="US"/>') !== -1,
        hasCcdTemplate: doc.indexOf('2.16.840.1.113883.10.20.22.1.1') !== -1,
        hasLoincDocCode: doc.indexOf('code="' + loinc + '"') !== -1 &&
                         doc.indexOf('2.16.840.1.113883.6.1') !== -1,
        hasTransferTitle: doc.indexOf('Transfer Summary') !== -1,
        hasMedsSection: doc.indexOf('2.16.840.1.113883.10.20.22.2.1.1') !== -1 &&
                        doc.indexOf('code="10160-0"') !== -1,
        hasAllergiesSection: doc.indexOf('code="48765-2"') !== -1,
        hasProblemsSection: doc.indexOf('code="11450-4"') !== -1
      };
    }, [TOC_LOINC], function (result) {
      var v = result.value;
      browser.assert.ok(v.hasRoot && v.hasUsRealm, 'ONC 170.315.b.1 - ClinicalDocument root with US realm');
      browser.assert.ok(v.hasCcdTemplate, 'ONC 170.315.b.1 - C-CDA R2.1 US Realm Header templateId present');
      browser.assert.ok(
        v.hasLoincDocCode && v.hasTransferTitle,
        'ONC 170.315.b.1 - Document typed as ToC Transfer Summary (LOINC ' + TOC_LOINC + ')'
      );
      browser.assert.ok(
        v.hasMedsSection && v.hasAllergiesSection && v.hasProblemsSection,
        'ONC 170.315.b.1 - LOINC-coded Medications/Allergies/Problems sections present'
      );
    });
  },

  '05. VALIDATE: validator accepts the document and rejects malformed input': function (browser) {
    browser.executeAsync(function (done) {
      Meteor.call('clinicalDocuments.validateCCDA', window.__b1Doc || '', function (err, good) {
        if (err) { done({ ok: false, error: err.message }); return; }
        Meteor.call('clinicalDocuments.validateCCDA', '<not-a-ccda/>', function (err2, bad) {
          if (err2) { done({ ok: false, error: err2.message }); return; }
          done({ ok: true, goodValid: good.isValid, badValid: bad.isValid, badErrors: (bad.errors || []).length });
        });
      });
    }, [], function (result) {
      var v = result.value || {};
      browser.assert.ok(v.ok, 'ONC 170.315.b.1 - VALIDATE: validator round-trip completed');
      browser.assert.ok(
        v.goodValid === true,
        'ONC 170.315.b.1 - VALIDATE: generated ToC document passes validation'
      );
      browser.assert.ok(
        v.badValid === false && v.badErrors > 0,
        'ONC 170.315.b.1 - VALIDATE: malformed content rejected (negative test)'
      );
    });
  },

  '06. ACCESS: DocumentReference persisted and clinical documents UI renders': function (browser) {
    browser.executeAsync(function (fhirId, done) {
      var finished = false;
      function finish(payload) {
        if (!finished) { finished = true; done(payload); }
      }
      setTimeout(function () { finish({ ok: false, error: 'subscription timeout' }); }, 15000);

      // autopublish.* publications pass the query verbatim to Mongo
      Meteor.subscribe('autopublish.DocumentReferences', { 'subject.reference': 'Patient/' + fhirId }, {}, {
        onReady: function () {
          var docs = DocumentReferences.find({
            'subject.reference': 'Patient/' + fhirId
          }).fetch();
          var d = docs[0] || null;
          finish({
            ok: true,
            count: docs.length,
            doc: d ? {
              status: d.status,
              loinc: (d.type && d.type.coding && d.type.coding[0] && d.type.coding[0].code) || null,
              contentType: (d.content && d.content[0] && d.content[0].attachment && d.content[0].attachment.contentType) || null,
              hasData: !!(d.content && d.content[0] && d.content[0].attachment && d.content[0].attachment.data)
            } : null
          });
        }
      });
    }, [testPatientFhirId], function (result) {
      var v = result.value || {};
      browser.assert.ok(v.ok, 'ONC 170.315.b.1 - DocumentReference query completed');
      browser.assert.ok(
        v.count >= 1 && v.doc,
        'ONC 170.315.b.1 - ACCESS: DocumentReference persisted for patient (count: ' + v.count + ')'
      );
      if (v.doc) {
        browser.assert.ok(
          v.doc.loinc === TOC_LOINC && v.doc.contentType === 'application/xml' && v.doc.hasData,
          'ONC 170.315.b.1 - ACCESS: stored document carries LOINC type + XML attachment'
        );
      }
    });

    // UI route
    browser.execute(function () {
      if (typeof Meteor !== 'undefined' && typeof Meteor.navigate === 'function') {
        Meteor.navigate('/clinical-documents');
        return { navigated: 'Meteor.navigate' };
      }
      window.location.href = '/clinical-documents';
      return { navigated: 'location.href' };
    }, [], function (result) {
      console.log('[b.1] navigation via', result.value.navigated);
    });

    // CCDAExportPage exposes no element ids — verify by page content
    browser.pause(3000);
    verifyPageLoaded(browser, '170.315.b.1');

    browser.execute(function () {
      var text = document.body.textContent || '';
      return {
        hasCcdaVocabulary: /C-CDA|Clinical Document|CCDA/i.test(text),
        hasDocumentConfig: text.indexOf('Document Configuration') !== -1 ||
                           text.indexOf('Patient Selection') !== -1
      };
    }, [], function (result) {
      var v = result.value;
      browser.assert.ok(
        v.hasCcdaVocabulary || v.hasDocumentConfig,
        'ONC 170.315.b.1 - ACCESS (UI): clinical documents page rendered (vocab: ' +
          v.hasCcdaVocabulary + ', config: ' + v.hasDocumentConfig + ')'
      );
    });
  },

  '07. Patient-record fidelity + receive capability — documented gaps': function (browser) {
    // GAP(170.315.b.1): generator uses canned demo data — see PROGRESS.md.
    // The generated ToC document must reflect THIS patient's demographics and
    // clinical content. gatherPatientData() ignores patientId and returns a
    // hardcoded "John Doe" bundle (fhir2ccda conversion commented out).
    browser.execute(function (familyName) {
      var doc = window.__b1Doc || '';
      return {
        hasPatientFamily: doc.indexOf(familyName) !== -1,
        hasCannedDoe: doc.indexOf('<family>Doe</family>') !== -1
      };
    }, ['CcdaTransition'], function (result) {
      var v = result.value;
      console.log('[b.1] fidelity probe:', JSON.stringify(v));
      if (!v.hasPatientFamily) {
        browser.verify.fail('GAP(170.315.b.1): generated ToC document does not contain the patient\'s demographics (canned "John Doe" demo data; fhir2ccda not wired)');
      }
    });

    // GAP(170.315.b.1): no receive/display/incorporate capability for inbound
    // C-CDA transition-of-care documents.
    browser.executeAsync(function (done) {
      Meteor.call('clinicalDocuments.receiveCCDA', '<ClinicalDocument/>', function (err) {
        done({
          methodExists: !(err && (err.error === 404 || /Method .* not found/i.test(err.message || '')))
        });
      });
    }, [], function (result) {
      var v = result.value || {};
      console.log('[b.1] receive probe:', JSON.stringify(v));
      if (!v.methodExists) {
        browser.verify.fail('GAP(170.315.b.1): no receive/display/incorporate capability for inbound C-CDA documents (clinicalDocuments.receiveCCDA absent)');
      }
    });
  },

  '08. Cleanup and completion': function (browser) {
    browser.executeAsync(function (patientId, done) {
      Meteor.call('patients.remove', patientId, function (err) {
        done({ patientRemoved: !err, reason: err ? (err.reason || err.message) : 'ok' });
      });
    }, [testPatientFhirId], function (result) {
      console.log('[b.1] cleanup:', JSON.stringify(result.value));
    });

    takeScreenshot(browser, 'base-ehr_170.315.b.1_transitions-of-care.png', '170.315.b.1');

    logTestCompletion(browser, '170.315.b.1', 'Transitions of Care (behavioral + gaps)', [
      'CREATE: C-CDA R2.1-enveloped ToC document (Transfer Summary 18761-7)',
      'CREATE: persisted as FHIR DocumentReference with XML attachment + audit',
      'Structure: US realm header, CCD templateIds, LOINC-coded sections',
      'VALIDATE: malformed input rejected (negative test)',
      'ACCESS: DocumentReference retrievable; /clinical-documents renders',
      'GAP (red): document content is canned demo data, not the patient record',
      'GAP (red): no inbound C-CDA receive/incorporate capability'
    ]);

    browser.end();
  }
};
