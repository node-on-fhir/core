/* xlsx.js (C) 2013-present  SheetJS -- http://sheetjs.com */
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import XLSX from 'xlsx';

// ServerMethods registry (rpc migration). These SheetJS parse/generate helpers
// had NO auth guard historically; requireAuth now applies (default true) — they
// are only invoked from the signed-in /import-data page. Renamed to canonical
// dotted 'dataImporter.*' names with the bare legacy names as aliases; legacy
// (bstr, name) / (ab, name) / (html) order preserved via positionalParams.
// phi:true — the uploaded spreadsheets may contain patient data. Uses the
// global Meteor.ServerMethods per the npmPackages exemplar.
Meteor.ServerMethods.define('dataImporter.readXlsxBinary', {
  description: 'Parse a binary-string spreadsheet upload into an XLSX workbook object',
  aliases: ['uploadS'],
  phi: true,
  positionalParams: ['bstr', 'name'],
  schemaObject: {
    type: 'object',
    properties: { bstr: { type: 'string' }, name: { type: 'string' } },
    required: ['bstr', 'name']
  }
}, async function(params, context){
    const bstr = get(params, 'bstr');
    try {
      return XLSX.read(bstr, { type: 'binary' });
    } catch (error) {
      // SheetJS throws raw Errors on non-spreadsheet input
      throw new Meteor.Error('validation-failed', 'Not a parseable spreadsheet: ' + error.message);
    }
});

Meteor.ServerMethods.define('dataImporter.readXlsxArray', {
  description: 'Parse a Uint8Array spreadsheet upload into an XLSX workbook object',
  aliases: ['uploadU'],
  phi: true,
  positionalParams: ['ab', 'name'],
  schemaObject: {
    type: 'object',
    properties: { ab: {}, name: { type: 'string' } },
    required: ['ab', 'name']
  }
}, async function(params, context){
    const ab = get(params, 'ab');
    try {
      return XLSX.read(ab, { type: 'array' });
    } catch (error) {
      throw new Meteor.Error('validation-failed', 'Not a parseable spreadsheet: ' + error.message);
    }
});

Meteor.ServerMethods.define('dataImporter.downloadXlsx', {
  description: 'Parse HTML into an XLSX workbook, or generate a sample workbook when none is provided',
  aliases: ['download'],
  phi: true,
  positionalParams: ['html'],
  schemaObject: {
    type: 'object',
    properties: { html: { type: 'string' } },
    required: ['html']
  }
}, async function(params, context){
    const html = get(params, 'html');
    let wb;
    if (html.length > 3) {
      /* parse workbook if html is available */
      try {
        wb = XLSX.read(html, { type: 'binary' });
      } catch (error) {
        throw new Meteor.Error('validation-failed', 'Not parseable as a workbook: ' + error.message);
      }
    } else {
      /* generate a workbook object otherwise */
      const data = [['a', 'b', 'c'], [1, 2, 3]];
      const ws = XLSX.utils.aoa_to_sheet(data);
      wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'SheetJS');
    }
    return wb;
});