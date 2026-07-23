import React, { useState, useEffect, useMemo } from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { Table, TableHead, TableBody, TableRow, TableCell, Tooltip, Typography, Box } from '@mui/material';
import ReferenceRange from '../ui-fields/ReferenceRange';

function provenance(matched) {
  if (!matched) return '';
  const parts = [matched.source, matched.version].filter(Boolean).join(' ');
  const by = (get(matched, 'by', []) || []).join(', ');
  return parts + (by ? ' · matched on ' + by : '') + (matched.layer ? ' · ' + matched.layer + ' layer' : '');
}

export function BloodPanelView({ rows }) {
  const list = rows || [];
  return (
    <Table size="small" aria-label="Blood panel">
      <TableHead>
        <TableRow>
          <TableCell>Analyte</TableCell><TableCell>Result vs Reference</TableCell><TableCell>Source</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {list.map(function (row, i) {
          const resolved = row.resolved || {};
          return (
            <TableRow key={row.analyte + ':' + i}>
              <TableCell>{row.analyte}</TableCell>
              <TableCell>
                <ReferenceRange value={row.value} unit={row.unit || resolved.unit}
                  normal={resolved.normal} bands={resolved.bands} bandProfile={resolved.bandProfile} />
              </TableCell>
              <TableCell>
                <Tooltip title={provenance(resolved.matched)}>
                  <Typography component="span" variant="caption" sx={{ color: 'text.secondary' }}>
                    {get(resolved, 'matched.source', '—')}
                  </Typography>
                </Tooltip>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export function BloodPanel({ observations, patient }) {
  const [rows, setRows] = useState([]);
  const obs = observations || [];
  const observationsKey = useMemo(function () {
    return obs.map(function (o) {
      return get(o, '_id', '') + ':' + get(o, 'code.coding.0.code', '');
    }).join('|');
  }, [obs]);
  const patientId = get(patient, '_id');

  useEffect(function () {
    const items = obs.map(function (o) {
      return { loinc: get(o, 'code.coding.0.code'), value: get(o, 'valueQuantity.value') };
    });
    Meteor.rpc('referenceRanges.resolveBatch', {
      items,
      patientId,
      observationIds: obs.map(function (o) { return get(o, '_id'); })
    }).then(function (results) {
      setRows((results || []).map(function (r, i) {
        return {
          analyte: get(obs[i], 'code.coding.0.display', r.loinc),
          value: r.value,
          unit: get(obs[i], 'valueQuantity.unit'),
          resolved: r.resolved
        };
      }));
    }).catch(function () { setRows([]); });
  }, [observationsKey, patientId]);

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <BloodPanelView rows={rows} />
    </Box>
  );
}

export default BloodPanel;
