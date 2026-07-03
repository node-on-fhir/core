// npmPackages/prescription-benefit/client/components/BenefitResultCard.jsx

import React from 'react';
import {
  Card, CardHeader, CardContent, Box, Typography, Chip, Alert, Divider
} from '@mui/material';
import LocalPharmacyIcon from '@mui/icons-material/LocalPharmacy';
import { get } from 'lodash';

function money(amount) {
  if (amount === null || amount === undefined || amount === '') return '—';
  return '$' + Number(amount).toFixed(2);
}

function coverageColor(status) {
  if (status === 'covered') return 'success';
  if (status === 'covered-with-restrictions') return 'warning';
  if (status === 'not-covered') return 'error';
  return 'default';
}

// Stock labels for inventory responses (the same coverage codes, remapped).
function stockLabel(status) {
  if (status === 'covered') return 'In stock';
  if (status === 'covered-with-restrictions') return 'Low stock';
  if (status === 'not-covered') return 'Out of stock';
  return 'Unknown';
}

function BenefitResultCard(props) {
  const result = props.result || {};
  const responseJson = get(result, 'responseJson', {});
  const requested = get(responseJson, 'requestedProduct', {});
  const coverageStatus = get(responseJson, 'coverage.status', '');
  const payerName = get(responseJson, 'coverage.payerName', '');
  const messages = get(responseJson, 'messages', []);
  const mode = get(result, 'mode', '');
  const isInventory = get(responseJson, 'responderType', '') === 'inventory';

  return (
    <Card sx={{ bgcolor: 'background.paper', mb: 3 }}>
      <CardHeader
        avatar={<LocalPharmacyIcon />}
        title={isInventory ? 'Inventory Check' : 'Prescription Benefit'}
        subheader={payerName}
        action={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', pr: 1 }}>
            <Chip
              size="small"
              label={isInventory ? 'Inventory' : (mode === 'live' ? 'Live' : 'Mock')}
              color={isInventory ? 'secondary' : (mode === 'live' ? 'info' : 'default')}
              variant="outlined"
            />
            <Chip
              size="small"
              label={isInventory ? stockLabel(coverageStatus) : (coverageStatus || 'unknown')}
              color={coverageColor(coverageStatus)}
            />
          </Box>
        }
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          '& .MuiCardHeader-subheader': { color: 'primary.contrastText' },
          '& .MuiCardHeader-avatar': { color: 'primary.contrastText' }
        }}
      />
      <CardContent>
        <Typography variant="h6" color="text.primary" gutterBottom>
          {get(requested, 'display', '—')}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          RxNorm {get(requested, 'rxnorm', '—')} · NDC {get(requested, 'ndc', '—')} ·
          Qty {get(requested, 'quantity', '—')} · {get(requested, 'daysSupply', '—')} days ·
          {' '}{get(requested, 'pharmacy', '—')}
        </Typography>

        <Divider sx={{ my: 2 }} />

        {isInventory ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Quantity on hand
              </Typography>
              <Typography variant="h4" color="text.primary" sx={{ fontWeight: 700 }}>
                {get(requested, 'qtyOnHand', '—')}
                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  {get(requested, 'parLevel', null) !== null ? '(par ' + get(requested, 'parLevel') + ')' : ''}
                </Typography>
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Status</Typography>
              <Typography variant="h6" color="text.primary">
                {stockLabel(coverageStatus)}
              </Typography>
            </Box>
            {get(requested, 'location', '') ? (
              <Box>
                <Typography variant="caption" color="text.secondary">Location</Typography>
                <Typography variant="h6" color="text.primary">
                  {get(requested, 'location', '—')}
                </Typography>
              </Box>
            ) : null}
            {get(requested, 'expiry', '') ? (
              <Box>
                <Typography variant="caption" color="text.secondary">Lot · Expiry</Typography>
                <Typography variant="h6" color="text.primary">
                  {get(requested, 'lot', '—')} · {get(requested, 'expiry', '—')}
                </Typography>
              </Box>
            ) : null}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Estimated patient out-of-pocket
              </Typography>
              <Typography variant="h4" color="text.primary" sx={{ fontWeight: 700 }}>
                {money(get(requested, 'patientPayAmount', null))}
              </Typography>
            </Box>
            {get(requested, 'planPayAmount', null) !== null ? (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Estimated plan pay
                </Typography>
                <Typography variant="h5" color="text.secondary">
                  {money(get(requested, 'planPayAmount', null))}
                </Typography>
              </Box>
            ) : null}
          </Box>
        )}

        {get(requested, 'priorAuthRequired', false) ? (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Prior authorization is required for this product.
          </Alert>
        ) : null}

        {messages && messages.length > 0 ? (
          <Box sx={{ mt: 2 }}>
            {messages.map(function(msg, idx) {
              return (
                <Typography key={idx} variant="body2" color="text.secondary">
                  • {msg}
                </Typography>
              );
            })}
          </Box>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default BenefitResultCard;
