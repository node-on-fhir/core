// npmPackages/fhircast-module/client/components/SubscriptionList.jsx

import React from 'react';
import {
  Card, CardHeader, CardContent,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Chip, Typography, IconButton
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LinkOffIcon from '@mui/icons-material/LinkOff';

// =============================================================================
// SUB ROW
// =============================================================================

function SubRow({ sub, onUnsubscribe }) {
  return (
    <TableRow>
      <TableCell sx={{ color: 'text.primary' }}>{sub.topic}</TableCell>
      <TableCell>
        {sub.events.map(function(e) {
          return (
            <Chip
              key={e}
              label={e}
              size="small"
              color="info"
              sx={{ mr: 0.5, mb: 0.5 }}
            />
          );
        })}
      </TableCell>
      <TableCell>
        {sub.status === 'active' ? (
          <CheckCircleIcon sx={{ color: 'success.main' }} />
        ) : null}
      </TableCell>
      <TableCell>
        <IconButton
          size="small"
          onClick={function() { if (onUnsubscribe) onUnsubscribe(sub); }}
          title="Release"
        >
          <LinkOffIcon fontSize="small" />
        </IconButton>
      </TableCell>
    </TableRow>
  );
}

// =============================================================================
// SUBSCRIPTION LIST
// =============================================================================

function SubscriptionList({ subs, onUnsubscribe }) {
  return (
    <Card sx={{ mb: 2, bgcolor: 'background.paper' }}>
      <CardHeader
        title="Subscriptions"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiCardHeader-title': {
            fontSize: '1.1rem'
          }
        }}
      />
      <CardContent>
        {subs.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            No active subscriptions
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small" id="subscriptionListTable">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Topic</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Events</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subs.map(function(sub) {
                  return <SubRow key={sub.topic} sub={sub} onUnsubscribe={onUnsubscribe} />;
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}

export default SubscriptionList;
