// npmPackages/fhircast-module/client/components/HubEventsFeed.jsx

import React, { useState } from 'react';
import {
  Card, CardHeader, Tabs, Tab, Box
} from '@mui/material';
import CellTowerIcon from '@mui/icons-material/CellTower';

import EventsAccordion from './EventsAccordion.jsx';

// =============================================================================
// HUB EVENTS FEED
// =============================================================================

function HubEventsFeed({ hubEvents, sentEvents }) {
  var [activeTab, setActiveTab] = useState(0);

  var effectiveHubEvents = hubEvents || [];
  var effectiveSentEvents = sentEvents || [];

  return (
    <Card sx={{ bgcolor: 'background.paper', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <CardHeader
        avatar={<CellTowerIcon color="primary" />}
        title="Hub Events Feed"
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiCardHeader-title': {
            fontSize: '1.1rem'
          }
        }}
      />
      <Tabs
        value={activeTab}
        onChange={function(e, newVal) { setActiveTab(newVal); }}
        sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label={'Hub Events (' + effectiveHubEvents.length + ')'} />
        <Tab label={'Sent Events (' + effectiveSentEvents.length + ')'} />
      </Tabs>
      <Box sx={{ flex: 1, overflow: 'auto', p: 0 }}>
        {activeTab === 0 ? (
          <EventsAccordion
            events={effectiveHubEvents}
            title=""
            severity="info"
            emptyMessage="No hub events received yet. Events will appear here as they flow through the WebSocket."
          />
        ) : (
          <EventsAccordion
            events={effectiveSentEvents}
            title=""
            severity="success"
            emptyMessage="No events sent yet. Use the Publish Event form to send events."
          />
        )}
      </Box>
    </Card>
  );
}

export default HubEventsFeed;
