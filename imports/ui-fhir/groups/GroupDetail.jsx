// imports/ui-fhir/groups/GroupDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTracker } from 'meteor/react-meteor-data';

import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Container,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  Box
} from '@mui/material';

import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';

import { get } from 'lodash';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Groups } from '/imports/lib/schemas/SimpleSchemas/Groups';

function GroupDetail(props) {
  const navigate = useNavigate();
  const { id } = useParams();

  const isNewGroup = !id || id === 'new';

  // Initialize state with FHIR R4 structure
  const [group, setGroup] = useState({
    resourceType: 'Group',
    active: true,
    type: 'person',
    actual: true,
    code: {},
    name: '',
    description: '',
    quantity: 0,
    managingEntity: { display: '' },
    characteristic: [],
    member: [],
    note: []
  });

  const [isEditing, setIsEditing] = useState(isNewGroup);
  const [error, setError] = useState(null);

  // Subscribe to groups data
  const isSubscriptionReady = useTracker(function(){
    let autoSubscribe = get(Meteor, 'settings.public.defaults.autoSubscribe', false);
    let handle;
    if(autoSubscribe){
      handle = Meteor.subscribe('autopublish.Groups', {}, {});
    } else {
      handle = Meteor.subscribe('autopublish.Groups', {}, {});
    }
    return handle.ready();
  }, []);

  // Load data when available
  useEffect(function() {
    if (id && id !== 'new') {
      // Load immediately if data exists - don't wait for subscription
      const existing = Groups.findOne({_id: id});
      if (existing) {
        setGroup(existing);
        setIsEditing(false);
      } else {
        // Fallback: try id field
        const byId = Groups.findOne({id: id});
        if (byId) {
          setGroup(byId);
          setIsEditing(false);
        }
      }
    }
  }, [id, isSubscriptionReady]);

  function handleChange(path, value) {
    const forbiddenKeys = new Set(['__proto__', 'prototype', 'constructor']);
    const parts = path.includes('.') ? path.split('.') : [path];

    if (parts.some(part => forbiddenKeys.has(part))) {
      setError('Invalid field path.');
      return;
    }

    const updated = { ...group };
    if (parts.length > 1) {
      let current = updated;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) {
          current[parts[i]] = {};
        }
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
    } else {
      updated[path] = value;
    }
    setGroup(updated);
  }

  async function handleSave() {
    setError(null);

    const dataToSave = {
      resourceType: 'Group',
      active: get(group, 'active', true),
      type: get(group, 'type', 'person'),
      actual: get(group, 'actual', true),
      code: get(group, 'code', {}),
      name: get(group, 'name', ''),
      description: get(group, 'description', ''),
      quantity: parseInt(get(group, 'quantity', 0)) || 0,
      managingEntity: get(group, 'managingEntity', {}),
      characteristic: get(group, 'characteristic', []),
      member: get(group, 'member', []),
      note: get(group, 'note', [])
    };

    try {
      if (id && id !== 'new') {
        await Meteor.callAsync('groups.update', id, dataToSave);
        console.log('[GroupDetail] Updated group:', id);
        setIsEditing(false);
      } else {
        const result = await Meteor.callAsync('groups.insert', dataToSave);
        console.log('[GroupDetail] Created group:', result);
        navigate('/groups');
      }
    } catch (err) {
      console.error('[GroupDetail] Error saving group:', err);
      setError(err.message || 'Error saving group');
    }
  }

  async function handleDelete() {
    if (window.confirm('Are you sure you want to delete this group?')) {
      try {
        await Meteor.callAsync('groups.remove', id);
        console.log('[GroupDetail] Deleted group:', id);
        navigate('/groups');
      } catch (err) {
        console.error('[GroupDetail] Error deleting group:', err);
        setError(err.message || 'Error deleting group');
      }
    }
  }

  function toggleEditMode() {
    setIsEditing(!isEditing);
  }

  return (
    <Container id="groupDetailPage" maxWidth="md" sx={{ py: 4 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardHeader
          title={isNewGroup ? 'New Group' : 'Group Detail'}
          sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
          action={
            !isNewGroup && (
              <Tooltip title={isEditing ? 'Lock (view mode)' : 'Unlock (edit mode)'}>
                <IconButton onClick={toggleEditMode} sx={{ color: 'primary.contrastText' }}>
                  {isEditing ? <LockOpenIcon /> : <LockIcon />}
                </IconButton>
              </Tooltip>
            )
          }
        />
        <CardContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
          )}

          {(id && id !== 'new') && (
            <Box sx={{ mb: 3, textAlign: 'right' }}>
              <span className="barcode helveticas" style={{ fontSize: '2rem' }}>{id}</span>
            </Box>
          )}

          <TextField
            id="nameInput"
            fullWidth
            label="Name"
            value={get(group, 'name', '')}
            onChange={(e) => handleChange('name', e.target.value)}
            disabled={!isEditing}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="type-label">Type</InputLabel>
            <Select
              labelId="type-label"
              id="typeSelect"
              value={get(group, 'type', 'person')}
              onChange={(e) => handleChange('type', e.target.value)}
              label="Type"
              disabled={!isEditing}
            >
              <MenuItem value="person">Person</MenuItem>
              <MenuItem value="animal">Animal</MenuItem>
              <MenuItem value="practitioner">Practitioner</MenuItem>
              <MenuItem value="device">Device</MenuItem>
              <MenuItem value="careteam">Care Team</MenuItem>
              <MenuItem value="healthcareservice">Healthcare Service</MenuItem>
              <MenuItem value="organization">Organization</MenuItem>
              <MenuItem value="relatedperson">Related Person</MenuItem>
              <MenuItem value="specimen">Specimen</MenuItem>
            </Select>
          </FormControl>

          <TextField
            id="descriptionTextarea"
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={get(group, 'description', '')}
            onChange={(e) => handleChange('description', e.target.value)}
            disabled={!isEditing}
            sx={{ mb: 2 }}
          />

          <TextField
            id="quantityInput"
            fullWidth
            label="Quantity"
            type="number"
            value={get(group, 'quantity', 0)}
            onChange={(e) => handleChange('quantity', e.target.value)}
            disabled={!isEditing}
            sx={{ mb: 2 }}
          />

          <TextField
            id="managingEntityInput"
            fullWidth
            label="Managing Entity"
            value={get(group, 'managingEntity.display', '')}
            onChange={(e) => handleChange('managingEntity.display', e.target.value)}
            disabled={!isEditing}
            sx={{ mb: 2 }}
          />
        </CardContent>

        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          {!isEditing ? (
            <Stack direction="row" spacing={1}>
              <Button onClick={() => navigate('/groups')}>Back</Button>
              <Button variant="outlined" onClick={toggleEditMode}>Edit</Button>
              {!isNewGroup && (
                <Button color="error" onClick={handleDelete}>Delete</Button>
              )}
            </Stack>
          ) : (
            <Stack direction="row" spacing={1}>
              <Button onClick={() => {
                if (isNewGroup) {
                  navigate('/groups');
                } else {
                  setIsEditing(false);
                }
              }}>Cancel</Button>
              <Button variant="contained" onClick={handleSave}>Save</Button>
            </Stack>
          )}
        </CardActions>
      </Card>
    </Container>
  );
}

export default GroupDetail;
