// npmPackages/implantable-devices/lib/udi.js
//
// Isomorphic GS1 UDI helpers shared by the add-a-device client (live parse
// strip, scanner normalization) and the server (parseUDI method). Plain data
// in/out — no Meteor imports.

// GS1 Application Identifiers we understand. Fixed-length AIs are terminated
// by their length; variable-length AIs are terminated by a GS (0x1D) separator
// or end-of-string in raw scanner payloads.
const FIXED_LENGTH_AIS = {
  '01': 14,  // GTIN / Device Identifier
  '11': 6,   // Production date (YYMMDD)
  '17': 6    // Expiration date (YYMMDD)
};
const VARIABLE_AIS = ['10', '21'];  // Lot number, Serial number

/**
 * Parse a human-readable-form GS1 string — '(01)00844...(17)291120(10)LOT(21)SN'
 * @param {string} udiString
 * @returns {Object} - { di, productionDate, expirationDate, lotNumber, serialNumber, raw }
 *   (all string fields '' when absent)
 */
export function parseGs1(udiString) {
  const raw = String(udiString || '');
  const parsed = {
    di: '',
    productionDate: '',
    expirationDate: '',
    lotNumber: '',
    serialNumber: '',
    raw: raw
  };

  const segments = raw.matchAll(/\((\d+)\)([^()]+)/g);
  for (const segment of segments) {
    const ai = segment[1];
    const value = segment[2].trim();
    switch (ai) {
      case '01': parsed.di = value; break;
      case '10': parsed.lotNumber = value; break;
      case '11': parsed.productionDate = value; break;
      case '17': parsed.expirationDate = value; break;
      case '21': parsed.serialNumber = value; break;
      default: break;
    }
  }

  return parsed;
}

/**
 * Normalize a raw scanner payload into parenthesized human-readable form.
 * Real GS1 DataMatrix scans arrive without parentheses — fixed-length AIs run
 * together and variable-length AIs are GS (0x1D) separated, optionally with a
 * symbology identifier prefix like ']d2' or ']C1'. Already-HRF input passes
 * through unchanged.
 * @param {string} rawScan
 * @returns {string} - '(01)...(17)...' HRF, or '' when nothing parseable
 */
export function normalizeScanToHrf(rawScan) {
  let scan = String(rawScan || '').trim();
  if (!scan) { return ''; }

  // Already human-readable
  if (scan.indexOf('(') === 0) { return scan; }

  // Strip symbology identifier prefix (]d2 = GS1 DataMatrix, ]C1 = GS1-128, ]Q3 = GS1 QR)
  scan = scan.replace(/^\][a-zA-Z]\d/, '');
  // Leading FNC1 sometimes arrives as a GS
  scan = scan.replace(/^\x1d/, '');

  let hrf = '';
  let cursor = 0;
  let guard = 0;

  while (cursor < scan.length && guard < 20) {
    guard++;
    const ai = scan.substring(cursor, cursor + 2);

    if (FIXED_LENGTH_AIS[ai]) {
      const length = FIXED_LENGTH_AIS[ai];
      const value = scan.substring(cursor + 2, cursor + 2 + length);
      hrf += '(' + ai + ')' + value;
      cursor += 2 + length;
      // Skip a stray separator after a fixed-length field
      if (scan.charAt(cursor) === '\x1d') { cursor++; }
    } else if (VARIABLE_AIS.indexOf(ai) !== -1) {
      const rest = scan.substring(cursor + 2);
      const gsIndex = rest.indexOf('\x1d');
      const value = gsIndex === -1 ? rest : rest.substring(0, gsIndex);
      hrf += '(' + ai + ')' + value;
      cursor += 2 + value.length + (gsIndex === -1 ? 0 : 1);
    } else {
      // Unknown AI — stop rather than mis-slice the remaining identifiers
      break;
    }
  }

  return hrf;
}

/**
 * Convert a GS1 YYMMDD date to ISO 'YYYY-MM-DD'. GS1 spec: years 00-50 → 20xx,
 * 51-99 → 19xx (medical devices in practice are all 20xx).
 * @param {string} yymmdd
 * @returns {string} - ISO date, or '' when not a 6-digit date
 */
export function formatExpiry(yymmdd) {
  const value = String(yymmdd || '').trim();
  if (!/^\d{6}$/.test(value)) { return ''; }
  const yy = parseInt(value.substring(0, 2), 10);
  const century = yy <= 50 ? '20' : '19';
  return century + value.substring(0, 2) + '-' + value.substring(2, 4) + '-' + value.substring(4, 6);
}
