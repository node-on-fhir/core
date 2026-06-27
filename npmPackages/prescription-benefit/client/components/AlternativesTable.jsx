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

function stockLabel(status) {
  if (status === 'covered') return 'In stock';
  if (status === 'covered-with-restrictions') return 'Low stock';
  if (status === 'not-covered') return 'Out of stock';
  return 'Unknown';
}

function stockColor(status) {
  if (status === 'covered') return 'success';
  if (status === 'covered-with-restrictions') return 'warning';
  return 'default';
}

function AlternativesTable(props) {
  const alternatives = props.alternatives || [];
  const isInventory = props.responderType === 'inventory';

  return (
    <Card sx={{ bgcolor: 'background.paper' }}>
      <CardHeader
        avatar={<SwapHorizIcon />}
        title={isInventory ? 'In-Kit Substitutes' : 'Alternative Products'}
        subheader={isInventory
          ? alternatives.length + ' in-stock substitute(s) in this kit'
          : alternatives.length + ' lower-cost alternative(s)'}
      />
      <CardContent>
        {alternatives.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {isInventory
              ? 'No in-stock substitutes were found in this kit for the requested product.'
              : 'No lower-cost alternatives were returned for this product.'}
          </Typography>
        ) : (
          <Table id="prescriptionBenefitAlternativesTable" size="small">
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>RxNorm</TableCell>
                <TableCell>NDC</TableCell>
                {isInventory ? (
                  <TableCell align="right">Qty on hand</TableCell>
                ) : (
                  <React.Fragment>
                    <TableCell align="right">Out-of-pocket</TableCell>
                    <TableCell align="right">Savings</TableCell>
                  </React.Fragment>
                )}
                <TableCell>{isInventory ? 'Status' : 'Coverage'}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {alternatives.map(function(alt, idx) {
                const status = get(alt, 'coverageStatus', 'covered');
                return (
                  <TableRow key={get(alt, 'rxnorm', idx)} hover>
                    <TableCell>
                      <Typography variant="body2" color="text.primary">
                        {get(alt, 'display', '—')}
                      </Typography>
                    </TableCell>
                    <TableCell>{get(alt, 'rxnorm', '—')}</TableCell>
                    <TableCell>{get(alt, 'ndc', '—')}</TableCell>
                    {isInventory ? (
                      <TableCell align="right">{get(alt, 'qtyOnHand', '—')}</TableCell>
                    ) : (
                      <React.Fragment>
                        <TableCell align="right">{money(get(alt, 'patientPayAmount', null))}</TableCell>
                        <TableCell align="right">
                          {get(alt, 'savings', 0) > 0 ? (
                            <Box component="span" sx={{ color: 'success.main', fontWeight: 600 }}>
                              {money(get(alt, 'savings', 0))}
                            </Box>
                          ) : '—'}
                        </TableCell>
                      </React.Fragment>
                    )}
                    <TableCell>
                      {isInventory ? (
                        <Chip
                          size="small"
                          label={stockLabel(status)}
                          color={stockColor(status)}
                          variant="outlined"
                        />
                      ) : (
                        <Chip
                          size="small"
                          label={get(alt, 'priorAuthRequired', false) ? 'PA required' : status}
                          color={get(alt, 'priorAuthRequired', false) ? 'warning' : 'success'}
                          variant="outlined"
                        />
                      )}
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
