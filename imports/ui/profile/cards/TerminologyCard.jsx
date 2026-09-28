// imports/ui/profile/cards/TerminologyCard.jsx
//
// "Terminology relevant to my care" in the handoff's collapsed single-row
// form: icon · title · status line · Scan records button; a chip cloud expands
// below once codes exist. The scan logic is carried over from the previous
// MyProfilePage implementation (Conditions/Observations/Procedures →
// users.updateTerminology).

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';

import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { notify } from '/imports/lib/notify.js';

import { Kicker, NeutralChip, AccentChip } from '../ProfilePrimitives.jsx';

const log = (Meteor.Logger ? Meteor.Logger.for('TerminologyCard') : console);

const CHIP_STYLES = {
  snomed: { borderColor: 'var(--pf-accent)' },
  loinc: { borderColor: 'var(--pf-ink-mid)' },
  icd10: { borderColor: 'var(--pf-ink-dim)' }
};

export default function TerminologyCard({ user, patientId }) {
  const [scanning, setScanning] = useState(false);
  const [codes, setCodes] = useState({ snomed: [], loinc: [], icd10: [] });

  useEffect(function() {
    if (get(user, 'profile.terminology')) {
      setCodes({
        snomed: get(user, 'profile.terminology.snomed', []),
        loinc: get(user, 'profile.terminology.loinc', []),
        icd10: get(user, 'profile.terminology.icd10', [])
      });
    }
  }, [user]);

  async function handleScan() {
    setScanning(true);
    try {
      let Conditions, Observations, Procedures;
      if (typeof window !== 'undefined' && window.Collections) {
        Conditions = window.Collections.Conditions;
        Observations = window.Collections.Observations;
        Procedures = window.Collections.Procedures;
      } else if (Meteor.Collections) {
        Conditions = Meteor.Collections.Conditions;
        Observations = Meteor.Collections.Observations;
        Procedures = Meteor.Collections.Procedures;
      }
      if (!Conditions) {
        try {
          const { Conditions: ConditionsImport } = await import('/imports/lib/schemas/SimpleSchemas/Conditions');
          const { Observations: ObservationsImport } = await import('/imports/lib/schemas/SimpleSchemas/Observations');
          const { Procedures: ProceduresImport } = await import('/imports/lib/schemas/SimpleSchemas/Procedures');
          Conditions = ConditionsImport;
          Observations = ObservationsImport;
          Procedures = ProceduresImport;
        } catch (importError) {
          log.warn('Could not import collections:', { message: importError.message });
        }
      }

      const found = { snomed: new Map(), loinc: new Map(), icd10: new Map() };

      function extractCodes(coding) {
        if (!Array.isArray(coding)) { return; }
        coding.forEach(function(code) {
          if (!code.system || !code.code) { return; }
          const codeKey = `${code.code}|${code.display || ''}`;
          if (code.system.includes('snomed')) {
            found.snomed.set(codeKey, { code: code.code, display: code.display || code.code, system: 'SNOMED' });
          } else if (code.system.includes('loinc')) {
            found.loinc.set(codeKey, { code: code.code, display: code.display || code.code, system: 'LOINC' });
          } else if (code.system.includes('icd-10') || code.system.includes('icd10')) {
            found.icd10.set(codeKey, { code: code.code, display: code.display || code.code, system: 'ICD-10' });
          }
        });
      }

      const query = {
        $or: [
          { 'subject.reference': `Patient/${patientId}` },
          { 'subject.reference': { $regex: `Patient/${patientId}` } }
        ]
      };

      [Conditions, Observations, Procedures].forEach(function(collection) {
        if (!collection || !patientId) { return; }
        collection.find(query).fetch().forEach(function(resource) {
          if (get(resource, 'code.coding')) { extractCodes(resource.code.coding); }
        });
      });

      const newTerminology = {
        snomed: Array.from(found.snomed.values()),
        loinc: Array.from(found.loinc.values()),
        icd10: Array.from(found.icd10.values())
      };
      setCodes(newTerminology);

      try {
        // rpc-migration: ddp-straggler
        await Meteor.callAsync('users.updateTerminology', newTerminology);
      } catch (methodError) {
        log.warn('Could not save terminology to profile:', { message: methodError.message });
      }

      notify({
        title: 'Scan complete',
        message: `Found ${newTerminology.snomed.length} SNOMED, ${newTerminology.loinc.length} LOINC, and ${newTerminology.icd10.length} ICD-10 codes`,
        severity: 'success'
      });
    } catch (error) {
      log.error('Error scanning records:', { message: error.message });
      notify({ title: 'Scan failed', message: 'Failed to scan medical records', severity: 'error' });
    } finally {
      setScanning(false);
    }
  }

  const totalCodes = codes.snomed.length + codes.loinc.length + codes.icd10.length;

  return (
    <Box className="pf-card" id="terminologyCard">
      <Box sx={{ p: '10px 14px', display: 'flex', alignItems: 'center', gap: 1 }}>
        <MenuBookIcon sx={{ fontSize: 15, color: 'var(--pf-accent)' }} />
        <Typography variant="h5" sx={{ fontSize: 14, fontWeight: 500, color: 'var(--pf-ink)' }}>
          Terminology relevant to my care
        </Typography>
        <Typography sx={{ fontSize: 12, color: 'var(--pf-ink-dim)', flex: 1 }}>
          {totalCodes === 0 ? 'No codes extracted yet.' : `${totalCodes} codes extracted.`}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={scanning ? <CircularProgress size={14} color="inherit" /> : <DocumentScannerIcon sx={{ fontSize: 14 }} />}
          disabled={scanning || !patientId}
          onClick={handleScan}
          sx={{ fontSize: 12, borderRadius: '8px', color: 'var(--pf-accent)', borderColor: 'var(--pf-accent)' }}
        >
          {scanning ? 'Scanning…' : 'Scan records'}
        </Button>
      </Box>

      {totalCodes > 0 && (
        <Box sx={{ p: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {['snomed', 'loinc', 'icd10'].map(function(system) {
            if (!codes[system].length) { return null; }
            const labels = { snomed: 'SNOMED CT', loinc: 'LOINC', icd10: 'ICD-10' };
            return (
              <Box key={system}>
                <Kicker sx={{ display: 'block', mb: 0.5 }}>{labels[system]}</Kicker>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {codes[system].map(function(term, index) {
                    return (
                      <NeutralChip
                        key={index}
                        label={`${term.code}: ${term.display}`}
                        sx={{ height: 'auto', py: 0.25, ...CHIP_STYLES[system], border: '1px solid' }}
                      />
                    );
                  })}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
