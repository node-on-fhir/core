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

function BenefitResultCard(props) {
  const result = props.result || {};
  const responseJson = get(result, 'responseJson', {});
  const requested = get(responseJson, 'requestedProduct', {});
  const coverageStatus = get(responseJson, 'coverage.status', '');
  const payerName = get(responseJson, 'coverage.payerName', '');
  const messages = get(responseJson, 'messages', []);
  const mode = get(result, 'mode', '');

  return (
    <Card sx={{ bgcolor: 'background.paper', mb: 3 }}>
      <CardHeader
        avatar={<LocalPharmacyIcon />}
        title="Prescription Benefit"
        subheader={payerName}
        action={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', pr: 1 }}>
            <Chip
              size="small"
              label={mode === 'live' ? 'Live' : 'Mock'}
              color={mode === 'live' ? 'info' : 'default'}
              variant="outlined"
            />
            <Chip
              size="small"
              label={coverageStatus || 'unknown'}
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
