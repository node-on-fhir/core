// packages/quality-measures/server/measure-calculator.js
//
// Dispatch layer for evaluator-backed (PACIO) measures. Each evaluator
// implements the exploratory PACIO-FHIR mapping of its measure logic against
// the local Mongo collections — the very thing the July 2026 CMS Connectathon
// PACIO track is testing.
//
// Non-PACIO measures (CQL/ELM-based) are calculated via fqm-execution in
// server/fqm-engine.js, not here.

import { evaluateICARE } from './evaluators/icare-evaluator';
import { evaluateCMS1317 } from './evaluators/adi-acp-evaluator';

/**
 * Evaluate a PACIO-specific measure for a single patient.
 * Routes to the appropriate evaluator based on measureId.
 * @param {string} measureId - PACIO measure ID
 * @param {string} patientId - Patient _id (MongoDB primary key)
 * @param {string} periodStart - Measurement period start (ISO date)
 * @param {string} periodEnd - Measurement period end (ISO date)
 * @param {Object} measure - Full measure definition (code lists live in _pacio)
 * @returns {{ inInitialPopulation, inDenominator, inDenominatorExclusion, inNumerator, details }}
 */
export async function evaluatePacioMeasure(measureId, patientId, periodStart, periodEnd, measure) {
  console.log('[evaluatePacioMeasure] Evaluating', measureId, 'for patient:', patientId);

  switch (measureId) {
    case 'PACIO-ICARE-v1':
      return await evaluateICARE(patientId, periodStart, periodEnd);
    case 'CMS1317v1':
      return await evaluateCMS1317(patientId, periodStart, periodEnd, measure);
    default:
      console.warn('[evaluatePacioMeasure] Unknown evaluator-backed measure:', measureId);
      return {
        inInitialPopulation: false,
        inDenominator: false,
        inDenominatorExclusion: false,
        inNumerator: false,
        details: {}
      };
  }
}
