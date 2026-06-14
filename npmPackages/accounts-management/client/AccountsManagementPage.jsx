// /packages/accounts/client/AccountsManagementPage.jsx

import React, { useState, useEffect } from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import { useNavigate } from 'react-router-dom';

import { 
  Grid,
  Container,
  Card,
  CardHeader,
  CardContent,
  Button,
  Box,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Collapse,
  Chip,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Alert
} from '@mui/material';

import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  KeyboardArrowDown,
  KeyboardArrowUp,
  Person as PersonIcon,
  Security as SecurityIcon,
  VpnKey as TokenIcon,
  AdminPanelSettings as AdminIcon,
  LocalHospital as ClinicianIcon
} from '@mui/icons-material';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { get, has } from 'lodash';
import moment from 'moment';

import AccessControlMatrix from './AccessControlMatrix';

// Session defaults
Session.setDefault('accountsSearchFilter', '');
Session.setDefault('selectedUserId', null);

export function AccountsManagementPage(props) {
  const navigate = useNavigate();
  const [searchFilter, setSearchFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Subscribe to users data
  const { users, isLoading, currentUserRole } = useTracker(() => {
    const currentUser = Meteor.user();
    const currentUserRole = get(currentUser, 'roles', []);
    
    // Check authorization
    if (!currentUserRole.includes('admin') && !currentUserRole.includes('clinician')) {
      return { users: [], isLoading: false, currentUserRole: [] };
    }

    const subscription = Meteor.subscribe('accounts.userManagement', {
      search: searchFilter,
      limit: rowsPerPage,
      skip: page * rowsPerPage
    });

    const users = Meteor.users.find({}, {
      sort: { createdAt: -1 }
    }).fetch();

    return {
      users,
      isLoading: !subscription.ready(),
      currentUserRole
    };
  }, [searchFilter, page, rowsPerPage]);

  // Check if user has permission to view this page
  if (!currentUserRole.includes('admin') && !currentUserRole.includes('clinician')) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Access denied. You must be an administrator or clinician to view user accounts.
        </Alert>
      </Container>
    );
  }

  const handleSearchChange = (event) => {
    setSearchFilter(event.target.value);
    setPage(0); // Reset to first page when searching
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const toggleRowExpansion = (userId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedRows(newExpanded);
  };

  const handleRevokeTokens = async (userId) => {
    if (!confirm('Are you sure you want to revoke all authentication tokens for this user? They will be logged out of all sessions.')) {
      return;
    }
    
    try {
      await new Promise((resolve, reject) => {
        Meteor.call('accounts.revokeUserTokens', userId, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
      });
      
      // Refresh the users list
      // Note: In a real implementation, you might want to use reactive data
      console.log('Tokens revoked successfully');
    } catch (error) {
      console.error('Error revoking tokens:', error);
      alert('Failed to revoke tokens: ' + error.message);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return moment(date).format('MM/DD/YYYY hh:mm A');
  };

  const getUserDisplayName = (user) => {
    if (get(user, 'profile.name')) {
      return get(user, 'profile.name');
    }
    if (user.username) {
      return user.username;
    }
    if (get(user, 'emails.0.address')) {
      return get(user, 'emails.0.address');
    }
    return 'Unknown User';
  };

  const getRoleChips = (roles = []) => {
    return roles.map(role => {
      let color = 'default';
      let icon = <PersonIcon />;
      
      switch(role) {
        case 'admin':
          color = 'error';
          icon = <AdminIcon />;
          break;
        case 'clinician':
          color = 'primary';
          icon = <ClinicianIcon />;
          break;
        case 'patient':
          color = 'secondary';
          icon = <PersonIcon />;
          break;
      }
      
      return (
        <Chip
          key={role}
          label={role}
          color={color}
          size="small"
          icon={icon}
          sx={{ mr: 1 }}
        />
      );
    });
  };

  const renderUserDetails = (user) => {
    const loginTokens = get(user, 'services.resume.loginTokens', []);
    const hasOAuth = get(user, 'services.oauth');
    const hasTwoFactor = get(user, 'services.twoFactor.enabled', false);

    return (
      <Box sx={{ p: 2 }}>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12} md={4}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon sx={{ mr: 1 }} />
                  Account Details
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="User ID" 
                      secondary={user._id} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Username" 
                      secondary={user.username || 'Not set'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Email" 
                      secondary={get(user, 'emails.0.address', 'Not set')} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Created" 
                      secondary={formatDate(user.createdAt)} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Last Login" 
                      secondary={formatDate(user.lastLogin)} 
                    />
                  </ListItem>
                  {user.practitionerId && (
                    <ListItem>
                      <ListItemText 
                        primary="Practitioner ID" 
                        secondary={user.practitionerId} 
                      />
                    </ListItem>
                  )}
                  {user.patientId && (
                    <ListItem>
                      <ListItemText 
                        primary="Patient ID" 
                        secondary={user.patientId} 
                      />
                    </ListItem>
                  )}
                </List>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Authentication Tokens */}
          <Grid item xs={12} md={4}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <TokenIcon sx={{ mr: 1 }} />
                  Authentication Tokens ({loginTokens.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {loginTokens.length > 0 ? (
                  <List dense>
                    {loginTokens.slice(0, 5).map((token, index) => (
                      <ListItem key={index}>
                        <ListItemText 
                          primary={`Token ${index + 1}`}
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                Created: {formatDate(token.when)}
                              </Typography>
                              <Typography variant="caption" display="block" sx={{ fontFamily: 'monospace' }}>
                                Hash: {token.hashedToken ? token.hashedToken.substring(0, 20) + '...' : 'N/A'}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                    {loginTokens.length > 5 && (
                      <ListItem>
                        <ListItemText secondary={`... and ${loginTokens.length - 5} more tokens`} />
                      </ListItem>
                    )}
                    {loginTokens.length > 0 && currentUserRole.includes('admin') && (
                      <ListItem>
                        <Button 
                          variant="outlined" 
                          color="warning" 
                          size="small"
                          onClick={() => handleRevokeTokens(user._id)}
                          startIcon={<SecurityIcon />}
                        >
                          Revoke All Tokens
                        </Button>
                      </ListItem>
                    )}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No active login tokens
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Security & Access Control */}
          <Grid item xs={12} md={4}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <SecurityIcon sx={{ mr: 1 }} />
                  Security & Permissions
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Roles" 
                      secondary={
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                          {getRoleChips(user.roles)}
                        </Stack>
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Two-Factor Authentication" 
                      secondary={hasTwoFactor ? 'Enabled' : 'Disabled'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="OAuth Services" 
                      secondary={hasOAuth ? 'Configured' : 'Not configured'}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Account Status" 
                      secondary={
                        <Chip 
                          label={get(user, 'status.online', false) ? 'Online' : 'Offline'}
                          color={get(user, 'status.online', false) ? 'success' : 'default'}
                          size="small"
                        />
                      }
                    />
                  </ListItem>
                </List>
              </AccordionDetails>
            </Accordion>
          </Grid>
        </Grid>
      </Box>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Access Control Matrix */}
        <Grid item xs={12}>
          <AccessControlMatrix />
        </Grid>
        
        {/* User Management Table */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="User Account Management"
              subheader="ONC 170.315(d)(1) - Authentication, access control, and authorization"
              action={
                <TextField
                  size="small"
                  placeholder="Search users..."
                  value={searchFilter}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              }
            />
            <CardContent sx={{ p: 0 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width="50px"></TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Roles</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Last Login</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <React.Fragment key={user._id}>
                      <TableRow hover>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => toggleRowExpansion(user._id)}
                          >
                            {expandedRows.has(user._id) ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2">
                            {getUserDisplayName(user)}
                          </Typography>
                          {user.username && user.username !== getUserDisplayName(user) && (
                            <Typography variant="caption" color="text.secondary">
                              @{user.username}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {get(user, 'emails.0.address', 'No email')}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            {getRoleChips(user.roles)}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          {formatDate(user.createdAt)}
                        </TableCell>
                        <TableCell>
                          {formatDate(user.lastLogin)}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={get(user, 'status.online', false) ? 'Online' : 'Offline'}
                            color={get(user, 'status.online', false) ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                          <Collapse in={expandedRows.has(user._id)} timeout="auto" unmountOnExit>
                            {renderUserDetails(user)}
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
              
              <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
                component="div"
                count={users.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default AccountsManagementPage;