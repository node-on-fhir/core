# Pacio-Core Package Design Document

## Overview
The `pacio-core` package extends Honeycomb with Pseudo EHR-specific functionality, focusing on advance directives, enhanced patient resource views, and specialized UI components.

## Package Architecture

### Package Metadata (package.js)
```javascript
// /packages/pacio-core/package.js
Package.describe({
  name: 'clinical:pacio-core',
  version: '0.1.0',
  summary: 'PACIO-compliant EHR functionality for Honeycomb FHIR platform',
  git: 'https://github.com/clinical-meteor/pacio-core',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('3.0.4');
  
  api.use([
    'meteor',
    'webapp',
    'ecmascript',
    'react-meteor-data',
    'clinical:hl7-fhir-data-infrastructure',
    'clinical:extended-api'
  ]);
  
  api.mainModule('index.jsx', 'client');
  api.mainModule('server/index.js', 'server');
});
```

### Main Module Export (index.jsx)
```javascript
// /packages/pacio-core/index.jsx
import React from 'react';

// Page Components
const PatientAdvanceDirectives = React.lazy(() => 
  import('./client/pages/PatientAdvanceDirectives'));
const PatientTransitionOfCare = React.lazy(() => 
  import('./client/pages/PatientTransitionOfCare'));
const PatientEnhancedGoals = React.lazy(() => 
  import('./client/pages/PatientEnhancedGoals'));
const PatientMedicationLists = React.lazy(() => 
  import('./client/pages/PatientMedicationLists'));
const PatientNutritionOrders = React.lazy(() => 
  import('./client/pages/PatientNutritionOrders'));

// Detail Views
const AdvanceDirectiveDetail = React.lazy(() => 
  import('./client/components/advanceDirectives/AdvanceDirectiveDetail'));
const TransitionOfCareDetail = React.lazy(() => 
  import('./client/components/transitionOfCare/TransitionOfCareDetail'));

// Dynamic Routes
export const DynamicRoutes = [
  {
    path: '/patient/:id/advance-directives',
    element: <PatientAdvanceDirectives />,
    requireAuth: true
  },
  {
    path: '/advance-directive/:id',
    element: <AdvanceDirectiveDetail />,
    requireAuth: true
  },
  {
    path: '/advance-directive/:id/revoke',
    element: <AdvanceDirectiveRevoke />,
    requireAuth: true
  },
  {
    path: '/patient/:id/transition-of-care',
    element: <PatientTransitionOfCare />,
    requireAuth: true
  },
  {
    path: '/transition-of-care/:id',
    element: <TransitionOfCareDetail />,
    requireAuth: true
  },
  {
    path: '/patient/:id/enhanced-goals',
    element: <PatientEnhancedGoals />,
    requireAuth: true
  },
  {
    path: '/patient/:id/medication-lists',
    element: <PatientMedicationLists />,
    requireAuth: true
  },
  {
    path: '/patient/:id/nutrition-orders',
    element: <PatientNutritionOrders />,
    requireAuth: true
  },
  {
    path: '/pdf/:binaryId',
    element: <PdfViewer />,
    requireAuth: true
  }
];

// Sidebar Elements
export const SidebarElements = [
  {
    primaryText: 'Advance Directives',
    to: '/advance-directives',
    iconName: 'Assignment',
    permission: 'patient.advance-directives'
  },
  {
    primaryText: 'Transition of Care',
    to: '/transition-of-care',
    iconName: 'SwapHoriz',
    permission: 'patient.transition-of-care'
  }
];

// Footer Elements
export const FooterElements = [
  {
    label: 'Sync Patient Record',
    className: 'sync-patient-record',
    style: {
      color: '#FFF',
      backgroundColor: '#2196F3',
      marginLeft: '10px'
    },
    onClick: function() {
      Meteor.call('pacio.syncPatientRecord', Session.get('selectedPatientId'));
    }
  }
];

// Module Config
export const ModuleConfig = {
  name: 'PacioCoreModule',
  version: '0.1.0',
  fhirResources: [
    'AdvanceDirective',
    'DocumentReference',
    'List',
    'NutritionOrder'
  ],
  settings: {
    enableWatermarking: true,
    enableAdvanceDirectives: true,
    enableTransitionOfCare: true,
    pdfViewerConfig: {
      enablePrint: false,
      enableDownload: true
    }
  }
};
```

## Component Structure

### Advance Directives Components

#### AdvanceDirectiveDetail.jsx
```javascript
// /packages/pacio-core/client/components/advanceDirectives/AdvanceDirectiveDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardActions, 
  Typography, 
  Button,
  Chip,
  Dialog
} from '@mui/material';
import { get } from 'lodash';
import moment from 'moment';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import PdfViewer from '../shared/PdfViewer';

export default function AdvanceDirectiveDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showRevoke, setShowRevoke] = useState(false);
  
  const { directive, loading } = useTracker(() => {
    const sub = Meteor.subscribe('advanceDirectives.one', id);
    return {
      directive: AdvanceDirectives.findOne(id),
      loading: !sub.ready()
    };
  });
  
  const handleRevoke = async function() {
    Meteor.call('pacio.revokeAdvanceDirective', id, function(error, result) {
      if (!error) {
        Session.set('mainAppDialogJson', {
          title: 'Success',
          message: 'Advance Directive has been revoked.'
        });
        navigate(`/patient/${get(directive, 'subject.reference')}/advance-directives`);
      }
    });
  };
  
  if (loading) return <div>Loading...</div>;
  if (!directive) return <div>Advance Directive not found</div>;
  
  const status = get(directive, 'status', 'unknown');
  const isRevoked = status === 'entered-in-error';
  
  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Advance Directive Details
        </Typography>
        
        <Chip 
          label={status} 
          color={isRevoked ? 'error' : 'success'}
          style={{ marginBottom: '1rem' }}
        />
        
        <Typography variant="body1">
          <strong>Type:</strong> {get(directive, 'type.coding[0].display', 'Unknown')}
        </Typography>
        
        <Typography variant="body1">
          <strong>Date:</strong> {moment(get(directive, 'date')).format('MMMM D, YYYY')}
        </Typography>
        
        <Typography variant="body1">
          <strong>Author:</strong> {get(directive, 'author[0].display', 'Unknown')}
        </Typography>
        
        {get(directive, 'content[0].attachment.url') && (
          <PdfViewer 
            url={get(directive, 'content[0].attachment.url')}
            watermark={isRevoked ? 'REVOKED' : null}
          />
        )}
      </CardContent>
      
      <CardActions>
        {!isRevoked && (
          <Button 
            variant="contained" 
            color="error"
            onClick={() => setShowRevoke(true)}
          >
            Revoke Directive
          </Button>
        )}
        <Button onClick={() => navigate(-1)}>
          Back
        </Button>
      </CardActions>
      
      <Dialog open={showRevoke} onClose={() => setShowRevoke(false)}>
        {/* Revoke confirmation dialog */}
      </Dialog>
    </Card>
  );
}
```

#### AdvanceDirectiveStatusFilter.jsx
```javascript
// /packages/pacio-core/client/components/advanceDirectives/AdvanceDirectiveStatusFilter.jsx
import React from 'react';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem 
} from '@mui/material';

export default function AdvanceDirectiveStatusFilter({ value, onChange }) {
  return (
    <FormControl fullWidth margin="normal">
      <InputLabel>Status Filter</InputLabel>
      <Select value={value} onChange={onChange}>
        <MenuItem value="all">All</MenuItem>
        <MenuItem value="current">Current</MenuItem>
        <MenuItem value="superseded">Superseded</MenuItem>
        <MenuItem value="entered-in-error">Revoked</MenuItem>
      </Select>
    </FormControl>
  );
}
```

### Shared Components

#### PdfViewer.jsx
```javascript
// /packages/pacio-core/client/components/shared/PdfViewer.jsx
import React, { useRef, useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { Meteor } from 'meteor/meteor';

export default function PdfViewer({ url, watermark }) {
  const containerRef = useRef();
  const [loading, setLoading] = React.useState(true);
  const [pdfUrl, setPdfUrl] = React.useState(url);
  
  useEffect(function() {
    if (watermark) {
      // Request watermarked version from server
      Meteor.call('pacio.getWatermarkedPdf', url, watermark, function(error, result) {
        if (!error && result) {
          setPdfUrl(result);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [url, watermark]);
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box ref={containerRef} height="600px" width="100%">
      <iframe 
        src={pdfUrl}
        width="100%"
        height="100%"
        style={{ border: 'none' }}
      />
    </Box>
  );
}
```

#### PatientSyncButton.jsx
```javascript
// /packages/pacio-core/client/components/shared/PatientSyncButton.jsx
import React, { useState } from 'react';
import { Button, CircularProgress, Snackbar } from '@mui/material';
import { Sync as SyncIcon } from '@mui/icons-material';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

export default function PatientSyncButton() {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  
  const handleSync = function() {
    const patientId = Session.get('selectedPatientId');
    if (!patientId) {
      setMessage('No patient selected');
      return;
    }
    
    setSyncing(true);
    Meteor.call('pacio.syncPatientRecord', patientId, function(error, result) {
      setSyncing(false);
      if (error) {
        setMessage(`Sync failed: ${error.message}`);
      } else {
        setMessage(`Synced ${result.resourcesUpdated} resources`);
      }
    });
  };
  
  return (
    <>
      <Button
        variant="contained"
        startIcon={syncing ? <CircularProgress size={20} /> : <SyncIcon />}
        onClick={handleSync}
        disabled={syncing}
      >
        {syncing ? 'Syncing...' : 'Sync Patient Record'}
      </Button>
      
      <Snackbar
        open={!!message}
        autoHideDuration={6000}
        onClose={() => setMessage('')}
        message={message}
      />
    </>
  );
}
```

## Server-Side Implementation

### Methods
```javascript
// /packages/pacio-core/server/methods/pacioMethods.js
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import moment from 'moment';

Meteor.methods({
  'pacio.syncPatientRecord': async function(patientId) {
    check(patientId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }
    
    // Get FHIR client
    const fhirClient = await FhirUtilities.getFhirClient();
    
    // Resources to sync for Pseudo EHR
    const resourceTypes = [
      'DocumentReference',
      'Composition', 
      'List',
      'Goal',
      'NutritionOrder',
      'ServiceRequest',
      'QuestionnaireResponse'
    ];
    
    let totalUpdated = 0;
    
    for (const resourceType of resourceTypes) {
      const bundle = await fhirClient.search({
        resourceType,
        searchParams: {
          patient: patientId,
          _count: 100
        }
      });
      
      if (bundle.entry) {
        for (const entry of bundle.entry) {
          const resource = entry.resource;
          
          // Upsert into appropriate collection
          const Collection = Collections[resourceType];
          if (Collection) {
            await Collection.upsertAsync(
              { id: resource.id },
              { $set: resource }
            );
            totalUpdated++;
          }
        }
      }
    }
    
    return { 
      success: true, 
      resourcesUpdated: totalUpdated,
      timestamp: moment().toISOString()
    };
  },
  
  'pacio.revokeAdvanceDirective': async function(directiveId) {
    check(directiveId, String);
    
    if (!this.userId) {
      throw new Meteor.Error('unauthorized', 'User must be logged in');
    }
    
    const directive = await AdvanceDirectives.findOneAsync(directiveId);
    if (!directive) {
      throw new Meteor.Error('not-found', 'Advance Directive not found');
    }
    
    // Update status to revoked
    await AdvanceDirectives.updateAsync(directiveId, {
      $set: {
        status: 'entered-in-error',
        _lastUpdated: moment().toISOString()
      }
    });
    
    // Also update on FHIR server if connected
    try {
      const fhirClient = await FhirUtilities.getFhirClient();
      directive.status = 'entered-in-error';
      await fhirClient.update(directive);
    } catch (error) {
      console.warn('Failed to update FHIR server:', error);
    }
    
    return { success: true };
  },
  
  'pacio.getWatermarkedPdf': async function(pdfUrl, watermarkText) {
    check(pdfUrl, String);
    check(watermarkText, String);
    
    // Implementation would use PDF manipulation library
    // For now, return original URL with watermark param
    return `${pdfUrl}?watermark=${encodeURIComponent(watermarkText)}`;
  }
});
```

### Publications
```javascript
// /packages/pacio-core/server/publications/pacioPublications.js
import { Meteor } from 'meteor/meteor';

Meteor.publish('pacio.advanceDirectives', function(patientId) {
  check(patientId, Match.Maybe(String));
  
  if (!this.userId) {
    return this.ready();
  }
  
  const query = {};
  if (patientId) {
    query['subject.reference'] = `Patient/${patientId}`;
  }
  
  return AdvanceDirectives.find(query);
});

Meteor.publish('pacio.transitionOfCare', function(patientId) {
  check(patientId, Match.Maybe(String));
  
  if (!this.userId) {
    return this.ready();
  }
  
  const query = {
    type: {
      $in: ['transition-of-care', 'continuity-of-care-document']
    }
  };
  
  if (patientId) {
    query['subject.reference'] = `Patient/${patientId}`;
  }
  
  return Compositions.find(query);
});
```

## Utilities

### AdvanceDirectiveUtils.js
```javascript
// /packages/pacio-core/lib/utilities/AdvanceDirectiveUtils.js
import { get } from 'lodash';
import moment from 'moment';

export const AdvanceDirectiveUtils = {
  getStatus: function(directive) {
    return get(directive, 'status', 'unknown');
  },
  
  isCurrent: function(directive) {
    const status = this.getStatus(directive);
    return status === 'completed' || status === 'active';
  },
  
  isSuperseded: function(directive) {
    return this.getStatus(directive) === 'superseded';
  },
  
  isRevoked: function(directive) {
    return this.getStatus(directive) === 'entered-in-error';
  },
  
  filterByStatus: function(directives, statusFilter) {
    if (statusFilter === 'all') return directives;
    
    return directives.filter(function(directive) {
      switch (statusFilter) {
        case 'current':
          return AdvanceDirectiveUtils.isCurrent(directive);
        case 'superseded':
          return AdvanceDirectiveUtils.isSuperseded(directive);
        case 'entered-in-error':
          return AdvanceDirectiveUtils.isRevoked(directive);
        default:
          return true;
      }
    });
  }
};
```

## Configuration Integration

### Settings Structure
```javascript
{
  "public": {
    "modules": {
      "fhir": {
        "AdvanceDirectives": {
          "enabled": true,
          "showInSidebar": true,
          "showInPatientChart": true,
          "allowRevoke": true,
          "watermarkRevoked": true
        },
        "TransitionOfCare": {
          "enabled": true,
          "showInSidebar": true,
          "showInPatientChart": true
        },
        "EnhancedGoals": {
          "enabled": true,
          "showTargets": true,
          "showAchievements": true
        },
        "ObservationGrouping": {
          "enabled": true,
          "groupByCategory": true,
          "groupByDomain": true
        }
      },
      "pacio": {
        "pdfViewer": {
          "enablePrint": false,
          "enableDownload": true,
          "enableWatermark": true
        },
        "sync": {
          "autoSync": false,
          "syncInterval": 300000,
          "resourceTypes": [
            "DocumentReference",
            "Composition",
            "List",
            "Goal",
            "NutritionOrder"
          ]
        }
      }
    }
  }
}
```

## Testing Strategy

### Unit Tests
```javascript
// /packages/pacio-core/tests/AdvanceDirectiveUtils.tests.js
import { expect } from 'chai';
import { AdvanceDirectiveUtils } from '../lib/utilities/AdvanceDirectiveUtils';

describe('AdvanceDirectiveUtils', function() {
  it('should correctly identify current directives', function() {
    const directive = { status: 'active' };
    expect(AdvanceDirectiveUtils.isCurrent(directive)).to.be.true;
  });
  
  it('should filter directives by status', function() {
    const directives = [
      { id: '1', status: 'active' },
      { id: '2', status: 'superseded' },
      { id: '3', status: 'entered-in-error' }
    ];
    
    const current = AdvanceDirectiveUtils.filterByStatus(directives, 'current');
    expect(current).to.have.length(1);
    expect(current[0].id).to.equal('1');
  });
});
```

## Package Distribution

### NPM Package.json
```json
{
  "name": "@clinical/pacio-core",
  "version": "0.1.0",
  "description": "PACIO-compliant EHR functionality for Honeycomb FHIR platform",
  "main": "index.js",
  "meteor": {
    "mainModule": {
      "client": "index.jsx",
      "server": "server/index.js"
    }
  },
  "dependencies": {
    "@mui/material": "^5.0.0",
    "lodash": "^4.17.21",
    "moment": "^2.29.0",
    "pdfjs-dist": "^3.0.0"
  },
  "keywords": [
    "meteor",
    "fhir",
    "pacio",
    "ehr",
    "advance-directives"
  ]
}
```

## Deployment Checklist

1. **Package Setup**
   - [ ] Create package directory structure
   - [ ] Configure package.js
   - [ ] Set up index.jsx exports

2. **Components**
   - [ ] Implement AdvanceDirective components
   - [ ] Create TransitionOfCare components
   - [ ] Build shared utility components
   - [ ] Add PDF viewer with watermarking

3. **Server Methods**
   - [ ] Implement sync functionality
   - [ ] Add revoke directive method
   - [ ] Create PDF watermarking service

4. **Integration**
   - [ ] Test route configuration
   - [ ] Verify sidebar elements
   - [ ] Validate module configuration

5. **Testing**
   - [ ] Unit tests for utilities
   - [ ] Component testing
   - [ ] Integration tests with FHIR server

6. **Documentation**
   - [ ] API documentation
   - [ ] User guide
   - [ ] Configuration guide