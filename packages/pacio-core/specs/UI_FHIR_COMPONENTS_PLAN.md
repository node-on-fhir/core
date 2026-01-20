# UI-FHIR Components Update Plan

## Overview
This document outlines the specific updates needed for the core Honeycomb UI components in `/imports/ui-fhir` to support Pseudo EHR functionality.

## New Components Required

### 1. AdvanceDirectives (/imports/ui-fhir/AdvanceDirectives/)

#### AdvanceDirectivesTable.jsx
```javascript
// /imports/ui-fhir/AdvanceDirectives/AdvanceDirectivesTable.jsx
import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Visibility as ViewIcon,
  Error as RevokedIcon 
} from '@mui/icons-material';
import { get } from 'lodash';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { TableNoData } from '../core/TableNoData';
import { TablePagination } from '../core/TablePagination';

export function AdvanceDirectivesTable(props) {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  const {
    advanceDirectives = [],
    selectedDirectiveId,
    onRowClick,
    showStatus = true,
    showActions = true,
    statusFilter = 'all'
  } = props;
  
  // Filter directives based on status
  const filteredDirectives = advanceDirectives.filter(function(directive) {
    if (statusFilter === 'all') return true;
    return get(directive, 'status') === statusFilter;
  });
  
  const handleRowClick = function(directiveId) {
    if (onRowClick) {
      onRowClick(directiveId);
    } else {
      navigate(`/advance-directive/${directiveId}`);
    }
  };
  
  const renderStatusChip = function(status) {
    let color = 'default';
    let icon = null;
    
    switch (status) {
      case 'completed':
      case 'active':
        color = 'success';
        break;
      case 'superseded':
        color = 'warning';
        break;
      case 'entered-in-error':
        color = 'error';
        icon = <RevokedIcon />;
        break;
    }
    
    return (
      <Chip 
        label={status} 
        color={color}
        icon={icon}
        size="small"
      />
    );
  };
  
  if (filteredDirectives.length === 0) {
    return <TableNoData message="No advance directives found" />;
  }
  
  const paginatedDirectives = filteredDirectives.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  return (
    <>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Type</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Author</TableCell>
            {showStatus && <TableCell>Status</TableCell>}
            <TableCell>Version</TableCell>
            {showActions && <TableCell align="center">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedDirectives.map(function(directive) {
            const isSelected = selectedDirectiveId === directive.id;
            
            return (
              <TableRow
                key={directive.id}
                hover
                selected={isSelected}
                onClick={() => handleRowClick(directive.id)}
                style={{ cursor: 'pointer' }}
              >
                <TableCell>
                  {get(directive, 'type.coding[0].display', 'Unknown')}
                </TableCell>
                <TableCell>
                  {moment(get(directive, 'date')).format('MMM D, YYYY')}
                </TableCell>
                <TableCell>
                  {get(directive, 'author[0].display', 'Unknown')}
                </TableCell>
                {showStatus && (
                  <TableCell>
                    {renderStatusChip(get(directive, 'status', 'unknown'))}
                  </TableCell>
                )}
                <TableCell>
                  {get(directive, 'versionNumber', '1.0')}
                </TableCell>
                {showActions && (
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton size="small">
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      <TablePagination
        count={filteredDirectives.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(event, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
      />
    </>
  );
}
```

#### AdvanceDirectiveDetail.jsx
```javascript
// /imports/ui-fhir/AdvanceDirectives/AdvanceDirectiveDetail.jsx
import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Grid,
  Divider,
  Box,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { get } from 'lodash';
import moment from 'moment';
import { FhirHumanName } from '../datatypes/FhirHumanName';
import { FhirReference } from '../datatypes/FhirReference';

export function AdvanceDirectiveDetail(props) {
  const { advanceDirective, showHeader = true } = props;
  
  if (!advanceDirective) {
    return null;
  }
  
  const renderContent = function() {
    const contents = get(advanceDirective, 'content', []);
    
    if (contents.length === 0) {
      return <Typography variant="body2">No content available</Typography>;
    }
    
    return (
      <List>
        {contents.map(function(content, index) {
          const attachment = get(content, 'attachment', {});
          return (
            <ListItem key={index}>
              <ListItemText
                primary={get(attachment, 'title', 'Document')}
                secondary={
                  <>
                    <Typography variant="caption" display="block">
                      Type: {get(attachment, 'contentType', 'Unknown')}
                    </Typography>
                    <Typography variant="caption" display="block">
                      Size: {get(attachment, 'size', 0)} bytes
                    </Typography>
                  </>
                }
              />
            </ListItem>
          );
        })}
      </List>
    );
  };
  
  return (
    <Card>
      {showHeader && (
        <>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Advance Directive Details
            </Typography>
          </CardContent>
          <Divider />
        </>
      )}
      
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Type
            </Typography>
            <Typography variant="body1" gutterBottom>
              {get(advanceDirective, 'type.coding[0].display', 'Not specified')}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Status
            </Typography>
            <Typography variant="body1" gutterBottom>
              {get(advanceDirective, 'status', 'Unknown')}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Date
            </Typography>
            <Typography variant="body1" gutterBottom>
              {moment(get(advanceDirective, 'date')).format('MMMM D, YYYY')}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Version
            </Typography>
            <Typography variant="body1" gutterBottom>
              {get(advanceDirective, 'versionNumber', '1.0')}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="textSecondary">
              Patient
            </Typography>
            <FhirReference reference={get(advanceDirective, 'subject')} />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="textSecondary">
              Authors
            </Typography>
            {get(advanceDirective, 'author', []).map(function(author, index) {
              return (
                <Box key={index} mb={1}>
                  <FhirReference reference={author} />
                </Box>
              );
            })}
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Content
            </Typography>
            {renderContent()}
          </Grid>
          
          {get(advanceDirective, 'note') && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary">
                Notes
              </Typography>
              {get(advanceDirective, 'note', []).map(function(note, index) {
                return (
                  <Typography key={index} variant="body2" paragraph>
                    {get(note, 'text')}
                  </Typography>
                );
              })}
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
}
```

#### AdvanceDirectivesPage.jsx
```javascript
// /imports/ui-fhir/AdvanceDirectives/AdvanceDirectivesPage.jsx
import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Button,
  Box,
  FormControl,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useTracker } from 'meteor/react-meteor-data';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { AdvanceDirectivesTable } from './AdvanceDirectivesTable';
import { AdvanceDirectiveDetail } from './AdvanceDirectiveDetail';
import { StyledCard } from '../core/StyledCard';
import { PageCanvas } from '../core/PageCanvas';

export function AdvanceDirectivesPage() {
  const [selectedDirectiveId, setSelectedDirectiveId] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  const { advanceDirectives, selectedDirective, loading } = useTracker(() => {
    const sub = Meteor.subscribe('advanceDirectives');
    const patientId = Session.get('selectedPatientId');
    
    let query = {};
    if (patientId) {
      query['subject.reference'] = `Patient/${patientId}`;
    }
    
    return {
      advanceDirectives: AdvanceDirectives.find(query).fetch(),
      selectedDirective: selectedDirectiveId ? 
        AdvanceDirectives.findOne(selectedDirectiveId) : null,
      loading: !sub.ready()
    };
  });
  
  const handleRowClick = function(directiveId) {
    setSelectedDirectiveId(directiveId);
    setDetailsOpen(true);
  };
  
  const handleStatusFilterChange = function(event) {
    setStatusFilter(event.target.value);
  };
  
  return (
    <PageCanvas>
      <Container maxWidth="lg">
        <Box mb={4}>
          <Typography variant="h4" gutterBottom>
            Advance Directives
          </Typography>
          
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <FormControl variant="outlined" size="small" style={{ minWidth: 200 }}>
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                label="Status Filter"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Current</MenuItem>
                <MenuItem value="superseded">Superseded</MenuItem>
                <MenuItem value="entered-in-error">Revoked</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
            >
              Add Advance Directive
            </Button>
          </Box>
        </Box>
        
        <StyledCard>
          {loading ? (
            <Typography>Loading...</Typography>
          ) : (
            <AdvanceDirectivesTable
              advanceDirectives={advanceDirectives}
              selectedDirectiveId={selectedDirectiveId}
              onRowClick={handleRowClick}
              statusFilter={statusFilter}
            />
          )}
        </StyledCard>
        
        {detailsOpen && selectedDirective && (
          <Box mt={3}>
            <AdvanceDirectiveDetail advanceDirective={selectedDirective} />
          </Box>
        )}
      </Container>
    </PageCanvas>
  );
}
```

### 2. MedicationLists (/imports/ui-fhir/Lists/)

#### MedicationListsTable.jsx
```javascript
// /imports/ui-fhir/Lists/MedicationListsTable.jsx
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow,
  Chip
} from '@mui/material';
import { get } from 'lodash';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

export function MedicationListsTable(props) {
  const navigate = useNavigate();
  const {
    lists = [],
    selectedListId,
    onRowClick,
    showStatus = true
  } = props;
  
  // Filter for medication lists only
  const medicationLists = lists.filter(function(list) {
    const code = get(list, 'code.coding[0].code');
    return code === 'medications' || 
           code === '10160-0' || // History of medication use
           code === '29549-3';   // Medication list
  });
  
  const handleRowClick = function(listId) {
    if (onRowClick) {
      onRowClick(listId);
    } else {
      navigate(`/medication-list/${listId}`);
    }
  };
  
  if (medicationLists.length === 0) {
    return (
      <Table size="small">
        <TableBody>
          <TableRow>
            <TableCell colSpan={5} align="center">
              No medication lists found
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  }
  
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Title</TableCell>
          <TableCell>Date</TableCell>
          <TableCell>Mode</TableCell>
          {showStatus && <TableCell>Status</TableCell>}
          <TableCell>Items</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {medicationLists.map(function(list) {
          const isSelected = selectedListId === list.id;
          const itemCount = get(list, 'entry', []).length;
          
          return (
            <TableRow
              key={list.id}
              hover
              selected={isSelected}
              onClick={() => handleRowClick(list.id)}
              style={{ cursor: 'pointer' }}
            >
              <TableCell>
                {get(list, 'title', 'Medication List')}
              </TableCell>
              <TableCell>
                {moment(get(list, 'date')).format('MMM D, YYYY')}
              </TableCell>
              <TableCell>
                {get(list, 'mode', 'working')}
              </TableCell>
              {showStatus && (
                <TableCell>
                  <Chip 
                    label={get(list, 'status', 'current')}
                    size="small"
                    color={get(list, 'status') === 'current' ? 'success' : 'default'}
                  />
                </TableCell>
              )}
              <TableCell>
                {itemCount} {itemCount === 1 ? 'medication' : 'medications'}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
```

### 3. NutritionOrders (/imports/ui-fhir/NutritionOrders/)

#### NutritionOrdersTable.jsx
```javascript
// /imports/ui-fhir/NutritionOrders/NutritionOrdersTable.jsx
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableRow,
  Chip,
  Typography
} from '@mui/material';
import { get } from 'lodash';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { TableNoData } from '../core/TableNoData';

export function NutritionOrdersTable(props) {
  const navigate = useNavigate();
  const {
    nutritionOrders = [],
    selectedOrderId,
    onRowClick,
    showStatus = true,
    showOrdrer = true
  } = props;
  
  const handleRowClick = function(orderId) {
    if (onRowClick) {
      onRowClick(orderId);
    } else {
      navigate(`/nutrition-order/${orderId}`);
    }
  };
  
  const renderDietType = function(order) {
    const oralDiet = get(order, 'oralDiet');
    if (oralDiet) {
      const types = get(oralDiet, 'type', []);
      return types.map(type => 
        get(type, 'coding[0].display', 'Diet')
      ).join(', ');
    }
    
    if (get(order, 'supplement')) {
      return 'Supplement';
    }
    
    if (get(order, 'enteralFormula')) {
      return 'Enteral Formula';
    }
    
    return 'Unknown';
  };
  
  if (nutritionOrders.length === 0) {
    return <TableNoData message="No nutrition orders found" />;
  }
  
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Date Ordered</TableCell>
          <TableCell>Diet Type</TableCell>
          {showOrdrer && <TableCell>Orderer</TableCell>}
          {showStatus && <TableCell>Status</TableCell>}
          <TableCell>Special Instructions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {nutritionOrders.map(function(order) {
          const isSelected = selectedOrderId === order.id;
          const instructions = get(order, 'oralDiet.instruction') || 
                             get(order, 'supplement[0].instruction') ||
                             'None';
          
          return (
            <TableRow
              key={order.id}
              hover
              selected={isSelected}
              onClick={() => handleRowClick(order.id)}
              style={{ cursor: 'pointer' }}
            >
              <TableCell>
                {moment(get(order, 'dateTime')).format('MMM D, YYYY')}
              </TableCell>
              <TableCell>
                {renderDietType(order)}
              </TableCell>
              {showOrdrer && (
                <TableCell>
                  {get(order, 'orderer.display', 'Unknown')}
                </TableCell>
              )}
              {showStatus && (
                <TableCell>
                  <Chip 
                    label={get(order, 'status', 'active')}
                    size="small"
                    color={
                      get(order, 'status') === 'active' ? 'success' : 
                      get(order, 'status') === 'completed' ? 'default' : 
                      'error'
                    }
                  />
                </TableCell>
              )}
              <TableCell>
                <Typography variant="body2" noWrap style={{ maxWidth: 200 }}>
                  {instructions}
                </Typography>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
```

#### NutritionOrderDetail.jsx
```javascript
// /imports/ui-fhir/NutritionOrders/NutritionOrderDetail.jsx
import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Grid,
  Divider,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import { get } from 'lodash';
import moment from 'moment';
import { FhirReference } from '../datatypes/FhirReference';

export function NutritionOrderDetail(props) {
  const { nutritionOrder, showHeader = true } = props;
  
  if (!nutritionOrder) {
    return null;
  }
  
  const renderOralDiet = function() {
    const oralDiet = get(nutritionOrder, 'oralDiet');
    if (!oralDiet) return null;
    
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Oral Diet
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="textSecondary">
              Diet Types
            </Typography>
            {get(oralDiet, 'type', []).map(function(type, index) {
              return (
                <Chip 
                  key={index}
                  label={get(type, 'coding[0].display', 'Diet')}
                  size="small"
                  style={{ marginRight: 8, marginBottom: 8 }}
                />
              );
            })}
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="textSecondary">
              Texture Modifications
            </Typography>
            {get(oralDiet, 'texture', []).map(function(texture, index) {
              return (
                <Box key={index} mb={1}>
                  <Typography variant="body2">
                    {get(texture, 'modifier.coding[0].display')}
                    {get(texture, 'foodType.coding[0].display') && 
                      ` - ${get(texture, 'foodType.coding[0].display')}`}
                  </Typography>
                </Box>
              );
            })}
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="textSecondary">
              Fluid Consistency
            </Typography>
            {get(oralDiet, 'fluidConsistencyType', []).map(function(fluid, index) {
              return (
                <Chip 
                  key={index}
                  label={get(fluid, 'coding[0].display')}
                  size="small"
                  style={{ marginRight: 8 }}
                />
              );
            })}
          </Grid>
          
          {get(oralDiet, 'instruction') && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary">
                Instructions
              </Typography>
              <Typography variant="body2">
                {get(oralDiet, 'instruction')}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Box>
    );
  };
  
  const renderSupplements = function() {
    const supplements = get(nutritionOrder, 'supplement', []);
    if (supplements.length === 0) return null;
    
    return (
      <Box mt={3}>
        <Typography variant="h6" gutterBottom>
          Supplements
        </Typography>
        
        <List>
          {supplements.map(function(supplement, index) {
            return (
              <ListItem key={index}>
                <ListItemText
                  primary={get(supplement, 'type.coding[0].display', 'Supplement')}
                  secondary={
                    <>
                      <Typography variant="caption" display="block">
                        Schedule: {get(supplement, 'schedule[0].timing[0].repeat.frequency', 1)}x 
                        per {get(supplement, 'schedule[0].timing[0].repeat.period', 1)} 
                        {' '}{get(supplement, 'schedule[0].timing[0].repeat.periodUnit', 'day')}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Quantity: {get(supplement, 'quantity.value')} 
                        {' '}{get(supplement, 'quantity.unit')}
                      </Typography>
                      {get(supplement, 'instruction') && (
                        <Typography variant="caption" display="block">
                          Instructions: {get(supplement, 'instruction')}
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItem>
            );
          })}
        </List>
      </Box>
    );
  };
  
  return (
    <Card>
      {showHeader && (
        <>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Nutrition Order Details
            </Typography>
          </CardContent>
          <Divider />
        </>
      )}
      
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Date Ordered
            </Typography>
            <Typography variant="body1" gutterBottom>
              {moment(get(nutritionOrder, 'dateTime')).format('MMMM D, YYYY h:mm A')}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Status
            </Typography>
            <Chip 
              label={get(nutritionOrder, 'status', 'active')}
              color={get(nutritionOrder, 'status') === 'active' ? 'success' : 'default'}
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Patient
            </Typography>
            <FhirReference reference={get(nutritionOrder, 'patient')} />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="textSecondary">
              Orderer
            </Typography>
            <FhirReference reference={get(nutritionOrder, 'orderer')} />
          </Grid>
          
          {get(nutritionOrder, 'allergyIntolerance') && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary">
                Allergy Considerations
              </Typography>
              {get(nutritionOrder, 'allergyIntolerance', []).map(function(allergy, index) {
                return (
                  <Box key={index} mb={1}>
                    <FhirReference reference={allergy} />
                  </Box>
                );
              })}
            </Grid>
          )}
          
          {get(nutritionOrder, 'foodPreferenceModifier') && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary">
                Food Preferences
              </Typography>
              {get(nutritionOrder, 'foodPreferenceModifier', []).map(function(pref, index) {
                return (
                  <Chip 
                    key={index}
                    label={get(pref, 'coding[0].display')}
                    size="small"
                    style={{ marginRight: 8 }}
                  />
                );
              })}
            </Grid>
          )}
          
          {get(nutritionOrder, 'excludeFoodModifier') && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="textSecondary">
                Excluded Foods
              </Typography>
              {get(nutritionOrder, 'excludeFoodModifier', []).map(function(food, index) {
                return (
                  <Chip 
                    key={index}
                    label={get(food, 'coding[0].display')}
                    size="small"
                    color="error"
                    variant="outlined"
                    style={{ marginRight: 8 }}
                  />
                );
              })}
            </Grid>
          )}
        </Grid>
        
        <Box mt={3}>
          {renderOralDiet()}
          {renderSupplements()}
        </Box>
      </CardContent>
    </Card>
  );
}
```

### 4. DocumentReferences (/imports/ui-fhir/DocumentReferences/)

#### PdfViewer.jsx
```javascript
// /imports/ui-fhir/DocumentReferences/PdfViewer.jsx
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  CircularProgress, 
  IconButton,
  Toolbar,
  Typography,
  Tooltip
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Download as DownloadIcon,
  Print as PrintIcon
} from '@mui/icons-material';
import { Meteor } from 'meteor/meteor';

export function PdfViewer(props) {
  const {
    url,
    binaryId,
    watermark,
    enableDownload = true,
    enablePrint = true,
    height = '600px'
  } = props;
  
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState('');
  const [zoom, setZoom] = useState(100);
  
  useEffect(function() {
    let finalUrl = url;
    
    // If binaryId provided, construct URL
    if (binaryId && !url) {
      finalUrl = `/pdf/${binaryId}`;
    }
    
    // If watermark needed, get watermarked version
    if (watermark) {
      setLoading(true);
      Meteor.call('getWatermarkedPdf', finalUrl, watermark, function(error, result) {
        if (!error && result) {
          setPdfUrl(result);
        } else {
          setPdfUrl(finalUrl);
        }
        setLoading(false);
      });
    } else {
      setPdfUrl(finalUrl);
      setLoading(false);
    }
  }, [url, binaryId, watermark]);
  
  const handleZoomIn = function() {
    setZoom(prevZoom => Math.min(prevZoom + 25, 200));
  };
  
  const handleZoomOut = function() {
    setZoom(prevZoom => Math.max(prevZoom - 25, 50));
  };
  
  const handleDownload = function() {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'document.pdf';
    link.click();
  };
  
  const handlePrint = function() {
    const iframe = document.getElementById('pdf-iframe');
    if (iframe) {
      iframe.contentWindow.print();
    }
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={height}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Toolbar variant="dense" style={{ backgroundColor: '#f5f5f5' }}>
        <Typography variant="subtitle2" style={{ flexGrow: 1 }}>
          PDF Document {watermark && `(${watermark})`}
        </Typography>
        
        <Tooltip title="Zoom Out">
          <IconButton onClick={handleZoomOut} size="small">
            <ZoomOutIcon />
          </IconButton>
        </Tooltip>
        
        <Typography variant="caption" style={{ margin: '0 8px' }}>
          {zoom}%
        </Typography>
        
        <Tooltip title="Zoom In">
          <IconButton onClick={handleZoomIn} size="small">
            <ZoomInIcon />
          </IconButton>
        </Tooltip>
        
        {enableDownload && (
          <Tooltip title="Download">
            <IconButton onClick={handleDownload} size="small">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        )}
        
        {enablePrint && (
          <Tooltip title="Print">
            <IconButton onClick={handlePrint} size="small">
              <PrintIcon />
            </IconButton>
          </Tooltip>
        )}
      </Toolbar>
      
      <Box height={height} width="100%" style={{ overflow: 'auto' }}>
        <iframe
          id="pdf-iframe"
          src={`${pdfUrl}#zoom=${zoom}`}
          width="100%"
          height="100%"
          style={{ border: 'none' }}
          title="PDF Viewer"
        />
      </Box>
    </Box>
  );
}
```

### 5. Enhanced Components Updates

#### Enhanced GoalsTable.jsx
```javascript
// /imports/ui-fhir/Goals/GoalsTable.jsx (enhancement)
// Add these features to existing GoalsTable:

// Additional columns for target display
<TableCell>Target</TableCell>
<TableCell>Achievement</TableCell>

// In table body, add:
<TableCell>
  {get(goal, 'target', []).map(function(target, index) {
    const measure = get(target, 'measure.coding[0].display', '');
    const value = get(target, 'detailQuantity.value', '');
    const unit = get(target, 'detailQuantity.unit', '');
    const dueDate = get(target, 'dueDate');
    
    return (
      <Box key={index}>
        <Typography variant="caption" display="block">
          {measure}: {value} {unit}
          {dueDate && ` by ${moment(dueDate).format('MMM D, YYYY')}`}
        </Typography>
      </Box>
    );
  })}
</TableCell>

<TableCell>
  <Chip
    label={get(goal, 'achievementStatus.coding[0].display', 'In Progress')}
    color={
      get(goal, 'achievementStatus.coding[0].code') === 'achieved' ? 'success' :
      get(goal, 'achievementStatus.coding[0].code') === 'not-achieved' ? 'error' :
      'warning'
    }
    size="small"
  />
</TableCell>
```

#### Enhanced ObservationsTable.jsx
```javascript
// /imports/ui-fhir/Observations/ObservationsTable.jsx (enhancement)
// Add grouping functionality:

export function ObservationsTable(props) {
  const {
    observations = [],
    groupByCategory = false,
    groupByDomain = false,
    showCollectionToggle = false,
    ...otherProps
  } = props;
  
  const [viewMode, setViewMode] = useState('individual'); // 'individual' or 'collection'
  
  // Group observations if requested
  const groupedObservations = React.useMemo(() => {
    if (!groupByCategory && !groupByDomain) {
      return { ungrouped: observations };
    }
    
    const groups = {};
    observations.forEach(function(obs) {
      let groupKey = 'ungrouped';
      
      if (groupByCategory) {
        groupKey = get(obs, 'category[0].coding[0].display', 'Other');
      } else if (groupByDomain) {
        // Custom domain logic based on code
        const code = get(obs, 'code.coding[0].code');
        groupKey = determineObservationDomain(code);
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(obs);
    });
    
    return groups;
  }, [observations, groupByCategory, groupByDomain]);
  
  // Render grouped view
  if (groupByCategory || groupByDomain) {
    return (
      <Box>
        {showCollectionToggle && (
          <Box mb={2}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newMode) => setViewMode(newMode)}
              size="small"
            >
              <ToggleButton value="individual">Individual</ToggleButton>
              <ToggleButton value="collection">Collections</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}
        
        {Object.entries(groupedObservations).map(([groupName, groupObs]) => (
          <Box key={groupName} mb={3}>
            <Typography variant="h6" gutterBottom>
              {groupName} ({groupObs.length})
            </Typography>
            <ObservationsTableBasic
              observations={groupObs}
              {...otherProps}
            />
          </Box>
        ))}
      </Box>
    );
  }
  
  // Regular table view
  return <ObservationsTableBasic observations={observations} {...otherProps} />;
}
```

## Integration Points

### 1. SimpleSchema Updates
```javascript
// /imports/lib/schemas/SimpleSchemas/AdvanceDirectiveSchema.js
import SimpleSchema from 'simpl-schema';

AdvanceDirectiveSchema = new SimpleSchema({
  id: { type: String, optional: true },
  identifier: { type: Array, optional: true },
  'identifier.$': { type: IdentifierSchema, optional: true },
  status: { type: String, allowedValues: ['draft', 'active', 'completed', 'superseded', 'entered-in-error'] },
  type: { type: CodeableConceptSchema },
  subject: { type: ReferenceSchema },
  date: { type: Date, optional: true },
  author: { type: Array, optional: true },
  'author.$': { type: ReferenceSchema },
  content: { type: Array, optional: true },
  'content.$': { type: Object },
  'content.$.attachment': { type: AttachmentSchema },
  versionNumber: { type: String, optional: true },
  note: { type: Array, optional: true },
  'note.$': { type: AnnotationSchema }
});
```

### 2. Collection Registration
```javascript
// /imports/lib/collections/AdvanceDirectives.js
import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { AdvanceDirectiveSchema } from '../schemas/SimpleSchemas/AdvanceDirectiveSchema';

AdvanceDirectives = new Mongo.Collection('AdvanceDirectives');
AdvanceDirectives.attachSchema(AdvanceDirectiveSchema);

if (Meteor.isServer) {
  Meteor.publish('advanceDirectives', function(query = {}) {
    if (!this.userId) {
      return this.ready();
    }
    return AdvanceDirectives.find(query);
  });
}
```

### 3. Router Integration
```javascript
// /client/AppRouter.jsx (addition)
const AdvanceDirectivesPage = React.lazy(() => 
  import('/imports/ui-fhir/AdvanceDirectives/AdvanceDirectivesPage'));
const MedicationListsPage = React.lazy(() => 
  import('/imports/ui-fhir/Lists/MedicationListsPage'));
const NutritionOrdersPage = React.lazy(() => 
  import('/imports/ui-fhir/NutritionOrders/NutritionOrdersPage'));

// In routes array:
{ path: '/advance-directives', element: <AdvanceDirectivesPage /> },
{ path: '/medication-lists', element: <MedicationListsPage /> },
{ path: '/nutrition-orders', element: <NutritionOrdersPage /> }
```

## Testing Strategy

### Component Tests
```javascript
// /imports/ui-fhir/AdvanceDirectives/AdvanceDirectivesTable.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdvanceDirectivesTable } from './AdvanceDirectivesTable';

describe('AdvanceDirectivesTable', () => {
  const mockDirectives = [{
    id: '1',
    type: { coding: [{ display: 'Living Will' }] },
    date: '2024-01-01',
    status: 'active',
    author: [{ display: 'Dr. Smith' }]
  }];
  
  it('renders advance directives', () => {
    render(<AdvanceDirectivesTable advanceDirectives={mockDirectives} />);
    expect(screen.getByText('Living Will')).toBeInTheDocument();
  });
  
  it('filters by status', () => {
    render(
      <AdvanceDirectivesTable 
        advanceDirectives={mockDirectives} 
        statusFilter="active"
      />
    );
    expect(screen.getByText('Living Will')).toBeInTheDocument();
  });
});
```

## Deployment Checklist

### Phase 1: Core Components
- [ ] Create AdvanceDirectives directory structure
- [ ] Implement AdvanceDirectivesTable
- [ ] Implement AdvanceDirectiveDetail
- [ ] Create AdvanceDirectivesPage
- [ ] Add SimpleSchema for AdvanceDirective
- [ ] Register AdvanceDirectives collection

### Phase 2: Additional Resources
- [ ] Implement MedicationListsTable
- [ ] Create NutritionOrders components
- [ ] Add PdfViewer component
- [ ] Update DocumentReferences handling

### Phase 3: Enhancements
- [ ] Enhance GoalsTable with targets
- [ ] Add achievement indicators to Goals
- [ ] Implement Observation grouping
- [ ] Add collection toggle for Observations

### Phase 4: Integration
- [ ] Update router with new routes
- [ ] Add sidebar navigation items
- [ ] Test with sample data
- [ ] Verify FHIR compliance