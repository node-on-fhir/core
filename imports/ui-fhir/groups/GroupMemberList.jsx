// imports/ui-fhir/groups/GroupMemberList.jsx

import React from 'react';

import {
  Box,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Chip
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

import { get } from 'lodash';

function GroupMemberList(props) {
  var {
    members,
    groupType,
    isEditing,
    onAddMember,
    onRemoveMember
  } = props;

  var memberArray = members || [];

  function parseReferenceType(reference) {
    if (!reference) return '';
    var parts = reference.split('/');
    if (parts.length >= 2) {
      return parts[0];
    }
    return '';
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle1" sx={{ color: 'text.primary', fontWeight: 500 }}>
          Members ({memberArray.length})
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={onAddMember}
          disabled={!isEditing}
        >
          Add Member
        </Button>
      </Box>

      {memberArray.length === 0 ? (
        <Box sx={{ py: 3, textAlign: 'center', border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            No members added yet.
          </Typography>
        </Box>
      ) : (
        <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'text.secondary' }}>Entity</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>Type</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>Period Start</TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>Status</TableCell>
                <TableCell sx={{ color: 'text.secondary', width: 60 }}>Remove</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {memberArray.map(function(member, index) {
                var entityDisplay = get(member, 'entity.display', '');
                var entityReference = get(member, 'entity.reference', '');
                var referenceType = parseReferenceType(entityReference);
                var periodStart = get(member, 'period.start', '');
                var isInactive = get(member, 'inactive', false);

                return (
                  <TableRow key={index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                    <TableCell sx={{ color: 'text.primary' }}>
                      {entityDisplay || entityReference || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {referenceType && (
                        <Chip
                          label={referenceType}
                          size="small"
                          variant="outlined"
                          sx={{ height: 22, fontSize: '0.7rem' }}
                        />
                      )}
                    </TableCell>
                    <TableCell sx={{ color: 'text.primary' }}>
                      {periodStart}
                    </TableCell>
                    <TableCell>
                      {isInactive ? (
                        <Chip label="Inactive" size="small" color="default" sx={{ height: 22, fontSize: '0.7rem' }} />
                      ) : (
                        <Chip label="Active" size="small" color="success" sx={{ height: 22, fontSize: '0.7rem' }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Remove member">
                        <span>
                          <IconButton
                            size="small"
                            onClick={function() { onRemoveMember(index); }}
                            disabled={!isEditing}
                            sx={{ color: 'error.main' }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default GroupMemberList;
