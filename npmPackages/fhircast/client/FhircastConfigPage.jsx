// npmPackages/fhircast-module/client/FhircastConfigPage.jsx

import React, { useState } from 'react';
import { Container, Box, Typography, Card, CardHeader, CardContent } from '@mui/material';
import { Random } from 'meteor/random';
import CastIcon from '@mui/icons-material/Cast';

import SubscriptionPanel from './components/SubscriptionPanel.jsx';
import WebSocketPanel from './components/WebSocketPanel.jsx';

// =============================================================================
// FHIRCAST CONFIG PAGE
// =============================================================================

function FhircastConfigPage() {
  const [connectWebSocket, setConnectWebSocket] = useState(false);
  const [wsEndpoint, setWsEndpoint] = useState(Random.id());

  function handleSubscriptionsChange(subs) {
    var emptySubs = subs.length === 0;
    if (emptySubs) {
      setWsEndpoint(Random.id());
    }
    setConnectWebSocket(!emptySubs);
  }

  return (
    <Container id="fhircastConfigPage" maxWidth="lg" sx={{ py: 4 }}>
      <Card sx={{ mb: 3, bgcolor: 'background.paper' }}>
        <CardHeader
          avatar={<CastIcon />}
          title="FHIRcast Configuration"
          subheader="Real-time context synchronization via WebSocket"
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '& .MuiCardHeader-subheader': {
              color: 'primary.contrastText'
            },
            '& .MuiCardHeader-avatar': {
              color: 'primary.contrastText'
            }
          }}
        />
      </Card>

      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 3
      }}>
        <Box sx={{ flex: 1 }}>
          <SubscriptionPanel
            wsEndpoint={wsEndpoint}
            onSubscriptionsChange={handleSubscriptionsChange}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <WebSocketPanel
            endpoint={wsEndpoint}
            connect={connectWebSocket}
          />
        </Box>
      </Box>
    </Container>
  );
}

export default FhircastConfigPage;
