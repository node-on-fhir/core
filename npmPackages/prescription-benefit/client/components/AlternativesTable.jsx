// npmPackages/prescription-benefit/client/components/AlternativesTable.jsx

import React from 'react';
import {
  Card, CardHeader, CardContent, Table, TableHead, TableBody, TableRow,
  TableCell, Chip, Typography, Box
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { get } from 'lodash';

function money(amount) {
  if (amount === null || amount === undefined || amount === '') return '—';
  return '$' + Number(amount).toFixed(2);
}

function AlternativesTable(props) {
  const alternatives = props.alternatives || [];

  return (
    <Card sx={{ bgcolor: 'background.paper' }}>
      <CardHeader
        avatar={<SwapHorizIcon />}
        title="Alternative Products"
        subheader={alternatives.length + ' lower-cost alternative(s)'}
      />
      <CardContent>
        {alternatives.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No lower-cost alternatives were returned for this product.
          </Typography>
        ) : (
          <Table id="prescriptionBenefitAlternativesTable" size="small">
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>RxNorm</TableCell>
                <TableCell>NDC</TableCell>
                <TableCell align="right">Out-of-pocket</TableCell>
                <TableCell align="right">Savings</TableCell>
                <TableCell>Coverage</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alternatives.map(function(alt, idx) {
                return (
                  <TableRow key={get(alt, 'rxnorm', idx)} hover>
                    <TableCell>
                      <Typography variant="body2" color="text.primary">
                        {get(alt, 'display', '—')}
                      </Typography>
                    </TableCell>
                    <TableCell>{get(alt, 'rxnorm', '—')}</TableCell>
                    <TableCell>{get(alt, 'ndc', '—')}</TableCell>
                    <TableCell align="right">{money(get(alt, 'patientPayAmount', null))}</TableCell>
                    <TableCell align="right">
                      {get(alt, 'savings', 0) > 0 ? (
                        <Box component="span" sx={{ color: 'success.main', fontWeight: 600 }}>
                          {money(get(alt, 'savings', 0))}
                        </Box>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={get(alt, 'priorAuthRequired', false) ? 'PA required' : get(alt, 'coverageStatus', 'covered')}
                        color={get(alt, 'priorAuthRequired', false) ? 'warning' : 'success'}
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default AlternativesTable;
