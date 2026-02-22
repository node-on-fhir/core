// packages/international-patient-summary/client/sections/IPSMedicalDevicesSection.jsx

import React from 'react';
import { Session } from 'meteor/session';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert
} from '@mui/material';

import { get } from 'lodash';

function IPSMedicalDevicesSection(props) {
  const selectedPatientId = useTracker(function(){
    return Session.get('selectedPatientId');
  }, []);

  const devices = useTracker(function(){
    if(!selectedPatientId) return [];
    if(!window.Collections?.Devices) return [];
    return window.Collections.Devices.find({}).fetch();
  }, [selectedPatientId]);

  function getStatus(device) {
    const status = get(device, 'status', 'unknown');
    const statusColors = {
      'active': 'success',
      'inactive': 'default',
      'entered-in-error': 'error'
    };
    return { status, color: statusColors[status] || 'default' };
  }

  if(devices.length === 0) {
    return (
      <Box>
        <Alert severity="info">
          No medical devices recorded
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ opacity: 0.7 }} paragraph>
        Medical devices and implants relevant to the patient
      </Typography>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Device</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Manufacturer</TableCell>
              <TableCell>Model</TableCell>
              <TableCell>Serial Number</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {devices.map(function(device, index) {
              const { status, color } = getStatus(device);
              return (
                <TableRow key={device._id || index}>
                  <TableCell>
                    <Typography variant="body2">
                      {get(device, 'deviceName[0].name',
                        get(device, 'type.coding[0].display',
                          get(device, 'type.text', 'Unknown device')))}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.6 }}>
                      {get(device, 'type.coding[0].code', '')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={status}
                      size="small"
                      color={color}
                    />
                  </TableCell>
                  <TableCell>
                    {get(device, 'manufacturer', '-')}
                  </TableCell>
                  <TableCell>
                    {get(device, 'modelNumber', '-')}
                  </TableCell>
                  <TableCell>
                    {get(device, 'serialNumber', '-')}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default IPSMedicalDevicesSection;
