// /packages/accounts/client/AccessControlMatrix.jsx

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Box,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';

import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Security as SecurityIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

import { Meteor } from 'meteor/meteor';

export function AccessControlMatrix(props) {
  const [accessMatrix, setAccessMatrix] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAccessMatrix = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await new Promise((resolve, reject) => {
        Meteor.call('accounts.getAccessControlMatrix', (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
      });
      
      setAccessMatrix(result);
    } catch (err) {
      console.error('Error loading access control matrix:', err);
      setError(err.message || 'Failed to load access control matrix');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccessMatrix();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!accessMatrix) {
    return null;
  }

  const getRoleColor = (role) => {
    switch(role) {
      case 'admin':
        return 'error';
      case 'clinician':
        return 'primary';
      case 'user':
        return 'secondary';
      case 'patient':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SecurityIcon sx={{ mr: 1 }} />
            Access Control Matrix
          </Box>
        }
        subheader="ONC 170.315(d)(1) - Role-based access control permissions"
        action={
          <Tooltip title="Refresh Matrix">
            <IconButton onClick={loadAccessMatrix} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Role
                  </Typography>
                </TableCell>
                {accessMatrix.resources.map(resource => (
                  <TableCell key={resource} align="center">
                    <Typography variant="caption" fontWeight="bold">
                      {resource.replace(/\./g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2')}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {accessMatrix.matrix.map((roleMatrix) => (
                <TableRow key={roleMatrix.role} hover>
                  <TableCell>
                    <Chip 
                      label={roleMatrix.role}
                      color={getRoleColor(roleMatrix.role)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  {roleMatrix.permissions.map((permission, index) => (
                    <TableCell key={index} align="center">
                      {permission.granted ? (
                        <CheckIcon color="success" fontSize="small" />
                      ) : (
                        <CancelIcon color="disabled" fontSize="small" />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Legend:</strong> {' '}
            <CheckIcon color="success" fontSize="small" sx={{ verticalAlign: 'middle' }} /> Granted {' '}
            <CancelIcon color="disabled" fontSize="small" sx={{ verticalAlign: 'middle' }} /> Denied
          </Typography>
        </Box>
        
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            This access control matrix shows role-based permissions for FHIR resources and administrative functions. 
            Changes to roles immediately affect user permissions throughout the system.
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
}

export default AccessControlMatrix;