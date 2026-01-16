// /packages/checklist-manifesto/ui/components/ProtocolLibrary.jsx

import React, { useState } from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';
import { ChecklistTasks } from '../../lib/collections/ChecklistTasks';

// Material UI
import {
  Box, Card, CardContent, CardActions, Typography, Button,
  Chip, Grid, IconButton, Collapse, List, ListItem, ListItemText
} from '@mui/material';

// Icons
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import VerifiedIcon from '@mui/icons-material/Verified';
import PersonIcon from '@mui/icons-material/Person';

export function ProtocolLibrary({ protocols, onClone }) {
  const [expandedId, setExpandedId] = useState(null);
  const [previewTasks, setPreviewTasks] = useState({});

  const handleExpand = async (protocolId) => {
    if (expandedId === protocolId) {
      setExpandedId(null);
    } else {
      setExpandedId(protocolId);
      
      // Load tasks if not already loaded
      if (!previewTasks[protocolId]) {
        try {
          const subscription = Meteor.subscribe('checklist.protocolTasks', protocolId, {
            onReady: () => {
              const tasks = ChecklistTasks.find({
                listId: protocolId,
                isDeleted: { $ne: true }
              }, {
                sort: { ordinal: 1 }
              }).fetch();
              
              setPreviewTasks(prev => ({
                ...prev,
                [protocolId]: tasks
              }));
            }
          });
        } catch (error) {
          console.error('Error loading protocol tasks:', error);
        }
      }
    }
  };

  const groupedProtocols = {
    system: protocols.filter(p => p.isSystemTemplate),
    user: protocols.filter(p => !p.isSystemTemplate)
  };

  const renderProtocolCard = (protocol) => {
    const isExpanded = expandedId === protocol._id;
    const tasks = previewTasks[protocol._id] || [];

    return (
      <Card key={protocol._id} sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="flex-start" justifyContent="space-between">
            <Box flex={1}>
              <Typography variant="h6" display="flex" alignItems="center" gap={1}>
                {get(protocol, 'title', 'Untitled Protocol')}
                {protocol.isSystemTemplate && (
                  <Chip 
                    size="small" 
                    icon={<VerifiedIcon />} 
                    label="System" 
                    color="primary"
                  />
                )}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {get(protocol, 'description', 'No description')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {get(protocol, 'taskCount', 0)} tasks
              </Typography>
            </Box>
            <IconButton onClick={() => handleExpand(protocol._id)}>
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>

          <Collapse in={isExpanded}>
            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>
                Tasks Preview:
              </Typography>
              {tasks.length > 0 ? (
                <List dense>
                  {tasks.slice(0, 5).map((task, index) => (
                    <ListItem key={task._id || index}>
                      <ListItemText
                        primary={`${index + 1}. ${get(task, 'description', 'Untitled task')}`}
                        secondary={get(task, 'priority', 'routine') !== 'routine' ? 
                          `Priority: ${get(task, 'priority')}` : null
                        }
                      />
                    </ListItem>
                  ))}
                  {tasks.length > 5 && (
                    <ListItem>
                      <ListItemText 
                        primary={`... and ${tasks.length - 5} more tasks`}
                        primaryTypographyProps={{ color: 'text.secondary' }}
                      />
                    </ListItem>
                  )}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Loading tasks...
                </Typography>
              )}
            </Box>
          </Collapse>
        </CardContent>
        
        <CardActions>
          <Button
            startIcon={<ContentCopyIcon />}
            onClick={() => onClone(protocol._id)}
            color="primary"
          >
            Use This Protocol
          </Button>
        </CardActions>
      </Card>
    );
  };

  return (
    <Box>
      {groupedProtocols.system.length > 0 && (
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            System Protocols
          </Typography>
          {groupedProtocols.system.map(renderProtocolCard)}
        </Box>
      )}

      {groupedProtocols.user.length > 0 && (
        <Box>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
            User Protocols
          </Typography>
          {groupedProtocols.user.map(renderProtocolCard)}
        </Box>
      )}

      {protocols.length === 0 && (
        <Typography variant="body2" color="text.secondary" textAlign="center">
          No protocols available yet
        </Typography>
      )}
    </Box>
  );
}