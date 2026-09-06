// imports/ui-modules/InstrumentsGalleryPage.jsx
//
// Living documentation / design-review gallery for the Inline Instruments
// family: renders all seven cards from illustrative FHIR fixtures matching
// the design handoff's values (workzone/design_handoff_inline_instruments).
// Route: /inline-instruments. Compare against the handoff HTML under the
// Nocturne theme preset; the numeric values are illustrative only.

import React from 'react';
import { Box, Container, Typography } from '@mui/material';

import { InstrumentGrid } from './InstrumentCard';
import { LabPanelInstrument } from './LabPanelInstrument';
import { ObservationTrendInstrument } from './ObservationTrendInstrument';
import { MedicationTimelineInstrument } from './MedicationTimelineInstrument';
import { CbcInstrument } from './CbcInstrument';
import { KeyImagesInstrument } from './KeyImagesInstrument';
import { KaryotypeInstrument } from './KaryotypeInstrument';
import { ImmunizationScheduleInstrument } from './ImmunizationScheduleInstrument';

// --- fixtures (values mirror the design handoff mock) ----------------------

function labObs(id, display, code, value, unit, low, high) {
  return {
    resourceType: 'Observation',
    _id: id,
    id: id,
    code: { coding: [{ system: 'http://loinc.org', code: code, display: display }] },
    valueQuantity: { value: value, unit: unit },
    referenceRange: [{ low: { value: low }, high: { value: high } }]
  };
}

const hormoneObservations = [
  labObs('lh', 'LH', '10501-5', 12.4, null, 1.9, 12.0),
  labObs('fsh', 'FSH', '15067-2', 5.1, null, 3.5, 12.5),
  labObs('testosterone', 'Testosterone', '2986-8', 68, 'ng/dL', 8, 48)
];

const bpValues = [
  [118, 76, 72], [121, 78, 70], [117, 74, 74], [124, 80, 71], [123, 79, 69],
  [128, 82, 75], [121, 77, 72], [126, 81, 70], [124, 78, 73], [131, 84, 76],
  [127, 80, 71], [129, 82, 74], [128, 81, 72], [127, 80, 73]
];
const bpObservations = bpValues.map(function (sample, index) {
  const day = String(index + 1).padStart(2, '0');
  return {
    resourceType: 'Observation',
    _id: 'bp-' + index,
    id: 'bp-' + index,
    effectiveDateTime: '2026-08-' + day,
    code: { coding: [{ system: 'http://loinc.org', code: '85354-9', display: 'Blood pressure panel' }] },
    component: [
      { code: { coding: [{ code: '8480-6', display: 'Systolic' }] }, valueQuantity: { value: sample[0], unit: 'mm[Hg]' } },
      { code: { coding: [{ code: '8462-4', display: 'Diastolic' }] }, valueQuantity: { value: sample[1], unit: 'mm[Hg]' } },
      { code: { coding: [{ code: '8867-4', display: 'Heart rate' }] }, valueQuantity: { value: sample[2], unit: '/min' } }
    ]
  };
});

const medicationRequests = [
  {
    resourceType: 'MedicationRequest',
    medicationCodeableConcept: { text: 'Albuterol inhaler' },
    authoredOn: '2008-05-14',
    status: 'active',
    dosageInstruction: [{ asNeededBoolean: true }]
  },
  {
    resourceType: 'MedicationRequest',
    medicationCodeableConcept: { text: 'Metformin' },
    authoredOn: '2019-02-01',
    status: 'stopped',
    dispenseRequest: { validityPeriod: { start: '2019-02-01', end: '2023-06-15' } },
    dosageInstruction: [{ text: '500 mg' }]
  },
  {
    resourceType: 'MedicationRequest',
    medicationCodeableConcept: { text: 'Combined oral contraceptive' },
    authoredOn: '2008-01-01',
    status: 'stopped',
    dispenseRequest: { validityPeriod: { start: '2008-01-01', end: '2013-01-01' } },
    _sensitive: true,
    _sensitiveNote: 'hidden under IL lens · hover to reveal'
  }
];

function diffObs(id, display, code, percent, low, high, absolute) {
  return {
    resourceType: 'Observation',
    _id: id,
    id: id,
    code: { coding: [{ system: 'http://loinc.org', code: code, display: display + '/100 leukocytes' }] },
    valueQuantity: { value: percent, unit: '%' },
    referenceRange: [{ low: { value: low }, high: { value: high } }],
    component: [{ code: { coding: [{ code: code + '-abs', display: display + ' abs' }] }, valueQuantity: { value: absolute } }]
  };
}

const cbcObservations = [
  labObs('wbc', 'WBC', '6690-2', 7.8, 'K/µL', 4.5, 11.0),
  labObs('rbc', 'RBC', '789-8', 4.21, 'M/µL', 3.9, 5.03),
  labObs('hgb', 'Hemoglobin', '718-7', 11.6, 'g/dL', 12.0, 16.0),
  labObs('hct', 'Hematocrit', '4544-3', 35.2, '%', 36, 46),
  labObs('mcv', 'MCV', '787-2', 83, 'fL', 80, 100),
  labObs('plt', 'Platelets', '777-3', 262, 'K/µL', 150, 400),
  diffObs('neut', 'Neutrophils', '26511-6', 61, 40, 75, 4.76),
  diffObs('lymph', 'Lymphocytes', '26478-8', 29, 20, 45, 2.26),
  diffObs('mono', 'Monocytes', '26485-3', 7, 2, 12, 0.55),
  diffObs('eos', 'Eosinophils', '26450-7', 2, 0, 6, 0.16),
  diffObs('baso', 'Basophils', '26444-0', 1, 0, 2, 0.08)
];
const cbcPriorObservations = [
  labObs('wbc-p', 'WBC', '6690-2', 7.4, 'K/µL', 4.5, 11.0),
  labObs('rbc-p', 'RBC', '789-8', 4.33, 'M/µL', 3.9, 5.03),
  labObs('hgb-p', 'Hemoglobin', '718-7', 12.7, 'g/dL', 12.0, 16.0),
  labObs('hct-p', 'Hematocrit', '4544-3', 38.1, '%', 36, 46),
  labObs('mcv-p', 'MCV', '787-2', 86, 'fL', 80, 100),
  labObs('plt-p', 'Platelets', '777-3', 244, 'K/µL', 150, 400)
];

const immunizations = [
  { resourceType: 'Immunization', vaccineCode: { text: 'Tdap' }, occurrenceDateTime: '2019-04-12' },
  { resourceType: 'Immunization', vaccineCode: { text: 'MMR' }, occurrenceDateTime: '1995-06-01' },
  { resourceType: 'Immunization', vaccineCode: { text: 'MMR' }, occurrenceDateTime: '1999-08-15' },
  { resourceType: 'Immunization', vaccineCode: { text: 'HepB' }, occurrenceDateTime: '1994-01-10' },
  { resourceType: 'Immunization', vaccineCode: { text: 'HepB' }, occurrenceDateTime: '1994-03-10' },
  { resourceType: 'Immunization', vaccineCode: { text: 'HepB' }, occurrenceDateTime: '1994-09-10' },
  { resourceType: 'Immunization', vaccineCode: { text: 'Flu' }, occurrenceDateTime: '2025-10-20' }
];

// --- page ------------------------------------------------------------------

export function InstrumentsGalleryPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h5" gutterBottom>Inline Instruments</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Gallery of the seven instrument cards, rendered from illustrative FHIR
        fixtures. Design reference: workzone/design_handoff_inline_instruments
        (compare under the Nocturne theme preset).
      </Typography>
      <InstrumentGrid>
        <LabPanelInstrument
          report={{ effectiveDateTime: '2019-05-28' }}
          observations={hormoneObservations}
          title="Hormone panel"
          kickerRight="Quest · API"
          derivedRows={[{ analyte: 'LH : FSH', value: 2.4, interpretation: 'above 2 · consistent with E28.2' }]}
        />
        <ObservationTrendInstrument
          kicker="Observation ×14 · Aug 2026"
          title="Blood pressure"
          observations={bpObservations}
          tabs={[
            { key: 'systolic', label: 'Systolic', componentCode: '8480-6' },
            { key: 'diastolic', label: 'Diastolic', componentCode: '8462-4' },
            { key: 'hr', label: 'HR', componentCode: '8867-4' }
          ]}
          low={90}
          high={120}
          onExpand={function (count) {
            console.log('[InstrumentsGalleryPage] expand requested for', count, 'rows');
          }}
        />
        <MedicationTimelineInstrument medicationRequests={medicationRequests} />
        <CbcInstrument
          report={{ effectiveDateTime: '2026-09-04T06:10:00Z' }}
          observations={cbcObservations}
          priorObservations={cbcPriorObservations}
          kickerRight="UChicago · inpatient day 1 · hospital"
          priorDateLabel="2023-06-02"
          interpretation="Hgb and Hct below range — mild anemia pattern, microcytic trend (MCV 83, ↓3)"
          trendActionLabel="Hgb trend · 4 results since 2019"
          onSelectTrend={function () {
            console.log('[InstrumentsGalleryPage] Hgb trend requested');
          }}
        />
        <KeyImagesInstrument
          kicker="ImagingStudy · 2023-06-06"
          kickerRight="DICOM · 3 series"
          tiles={[{ seriesLabel: 'AX T2' }, { seriesLabel: 'SAG' }, { seriesLabel: 'COR' }]}
          overflowCount={21}
          meta={<span>Placeholder tiles — Cornerstone renders the real key images</span>}
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
          <KaryotypeInstrument
            karyotype="46,XX"
            variantCount={0}
            meta={<span>Ideogram placeholder — @orbital/genome-central renders the real one · no patient variants on file</span>}
          />
          <ImmunizationScheduleInstrument
            immunizations={immunizations}
            due={['COVID booster due']}
          />
        </Box>
      </InstrumentGrid>
    </Container>
  );
}

export default InstrumentsGalleryPage;
