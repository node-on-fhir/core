// npmPackages/prescription-benefit/client/PrescriptionBenefitProviderPage.jsx
//
// Provider (responder) inspector for the RTPB workflow. Read-only view of the
// in-process responders an RTPBRequest can be sent to:
//   - formulary (mock PBM)  -> drug catalog + the pricing policy the responder applies
//   - inventory (kits/carts) -> stocked contents with qty/par/lot/expiry + stock status
// Patient-agnostic: it inspects responders, not patient data.

import React, { useState } from 'react';
import {
  Container, Card, CardHeader, CardContent, Box, List, ListItemButton,
  ListItemText, Chip, Typography, Divider, Table, TableHead, TableBody,
  TableRow, TableCell, Alert
} from '@mui/material';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import { get } from 'lodash';

import { RESPONDERS } from '../lib/responders.js';

function money(amount) {
  if (amount === null || amount === undefined || amount === '') return '—';
  return '$' + Number(amount).toFixed(2);
}

// Stock status for an inventory item (mirrors lib/inventoryResponder.js).
function stockState(item) {
  const qty = Number(get(item, 'qtyOnHand', 0)) || 0;
  const par = Number(get(item, 'parLevel', 0)) || 0;
  if (qty <= 0) return { label: 'Out of stock', color: 'error' };
  if (qty <= par) return { label: 'Low stock', color: 'warning' };
  return { label: 'In stock', color: 'success' };
}

function typeChip(type) {
  return (
    <Chip
      size="small"
      variant="outlined"
      color={type === 'inventory' ? 'secondary' : 'default'}
      label={type === 'inventory' ? 'Inventory' : 'Formulary'}
    />
  );
}

function FormularyDetail(props) {
  const responder = props.responder;
  const drugs = get(responder, 'formulary', []);

  return (
    <Box>
      <Alert severity="info" icon={false} sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Pricing policy</Typography>
        <Typography variant="body2" color="text.secondary">
          • Generic drugs: flat copay tier of $4 / $10 / $15.<br />
          • Brand drugs: 25–40% coinsurance of list price.<br />
          • Prior authorization required when list price exceeds $250
          (coverage marked "covered-with-restrictions").<br />
          • Lower-cost alternatives are drawn from the same therapeutic class.
        </Typography>
      </Alert>

      <Table id="prescriptionBenefitFormularyTable" size="small">
        <TableHead>
          <TableRow>
            <TableCell>Product</TableCell>
            <TableCell>RxNorm</TableCell>
            <TableCell>NDC</TableCell>
            <TableCell>Class</TableCell>
            <TableCell>Brand</TableCell>
            <TableCell align="right">List price</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {drugs.map(function(d, idx) {
            return (
              <TableRow key={get(d, 'rxnorm', idx)} hover>
                <TableCell>
                  <Typography variant="body2" color="text.primary">{get(d, 'display', '—')}</Typography>
                </TableCell>
                <TableCell>{get(d, 'rxnorm', '—')}</TableCell>
                <TableCell>{get(d, 'ndc', '—')}</TableCell>
                <TableCell>{get(d, 'therapeuticClass', '—')}</TableCell>
                <TableCell>
                  <Chip size="small" variant="outlined"
                    color={get(d, 'brand', false) ? 'primary' : 'default'}
                    label={get(d, 'brand', false) ? 'Brand' : 'Generic'} />
                </TableCell>
                <TableCell align="right">{money(get(d, 'baseCost', null))}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}

function InventoryDetail(props) {
  const responder = props.responder;
  const inventory = get(responder, 'inventory', {});
  const items = get(inventory, 'items', []);

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Location: {get(inventory, 'location', '—')}
      </Typography>

      <Table id="prescriptionBenefitInventoryTable" size="small">
        <TableHead>
          <TableRow>
            <TableCell>Item</TableCell>
            <TableCell>RxNorm</TableCell>
            <TableCell>Class</TableCell>
            <TableCell align="right">Qty</TableCell>
            <TableCell align="right">Par</TableCell>
            <TableCell>Lot</TableCell>
            <TableCell>Expiry</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map(function(it, idx) {
            const state = stockState(it);
            return (
              <TableRow key={get(it, 'rxnorm', idx)} hover>
                <TableCell>
                  <Typography variant="body2" color="text.primary">{get(it, 'display', '—')}</Typography>
                </TableCell>
                <TableCell>{get(it, 'rxnorm', '—')}</TableCell>
                <TableCell>{get(it, 'therapeuticClass', '—')}</TableCell>
                <TableCell align="right">{get(it, 'qtyOnHand', '—')}</TableCell>
                <TableCell align="right">{get(it, 'parLevel', '—')}</TableCell>
                <TableCell>{get(it, 'lot', '—')}</TableCell>
                <TableCell>{get(it, 'expiry', '—')}</TableCell>
                <TableCell>
                  <Chip size="small" variant="outlined" color={state.color} label={state.label} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}

function PrescriptionBenefitProviderPage() {
  const [selectedId, setSelectedId] = useState(get(RESPONDERS, '0.id', ''));
  const selected = RESPONDERS.find(function(r) { return r.id === selectedId; }) || RESPONDERS[0] || {};

  return (
    <Container id="prescriptionBenefitProviderPage" maxWidth="lg" sx={{ py: 4 }}>
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardHeader
          avatar={<Inventory2Icon color="primary" />}
          title="Benefit Responders"
          subheader="RTPB counterparties — what an RTPBRequest is checked against"
        />
      </Card>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* Responder list */}
        <Card sx={{ bgcolor: 'background.paper', width: { xs: '100%', md: 320 }, flexShrink: 0 }}>
          <List disablePadding>
            {RESPONDERS.map(function(r) {
              const count = r.type === 'formulary'
                ? get(r, 'formulary', []).length
                : get(r, 'inventory.items', []).length;
              return (
                <ListItemButton
                  key={r.id}
                  id={'responder-' + r.id}
                  selected={r.id === selectedId}
                  onClick={function() { setSelectedId(r.id); }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" color="text.primary">{r.name}</Typography>
                        {typeChip(r.type)}
                      </Box>
                    }
                    secondary={
                      <Box component="span" sx={{ display: 'block' }}>
                        <Box component="code" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {r.url}
                        </Box>
                        <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {count} item(s)
                        </Typography>
                      </Box>
                    }
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Card>

        {/* Detail */}
        <Card sx={{ bgcolor: 'background.paper', flexGrow: 1 }}>
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {get(selected, 'name', '—')}
                {typeChip(get(selected, 'type'))}
              </Box>
            }
            subheader={get(selected, 'url', '')}
          />
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {get(selected, 'description', '')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {get(selected, 'type') === 'inventory'
              ? <InventoryDetail responder={selected} />
              : <FormularyDetail responder={selected} />}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

export default PrescriptionBenefitProviderPage;
