// /packages/checklist-manifesto/ui/pages/ChecklistManifestoPage.jsx

import React, { useState, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { get } from 'lodash';

// Material UI components
import { 
  Box, Container, Typography, Paper, Grid, Tabs, Tab,
  Button, IconButton, TextField, InputAdornment, 
  List, ListItem, ListItemText, ListItemIcon, ListItemSecondaryAction,
  Chip, CircularProgress, Alert, Dialog, DialogTitle, DialogContent,
  Card, CardContent, CardActions, Divider, Badge
} from '@mui/material';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ListIcon from '@mui/icons-material/List';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Import collections
import { ChecklistLists } from '../../lib/collections/ChecklistLists';
import { ChecklistTasks } from '../../lib/collections/ChecklistTasks';

// Import components
import { TaskList } from '../components/TaskList';
import { TaskForm } from '../components/TaskForm';
import { ListForm } from '../components/ListForm';
import { ProtocolLibrary } from '../components/ProtocolLibrary';

// Get useNavigate from Meteor (packages can't import from react-router-dom directly)
let useNavigate;
Meteor.startup(function(){
  useNavigate = Meteor.useNavigate;
});

// Get useTheme from Meteor for dark mode support
let useAppTheme;
Meteor.startup(function(){
  useAppTheme = Meteor.useTheme;
});

export function ChecklistManifestoPage(props) {
  const navigate = useNavigate ? useNavigate() : null;

  // Theme support
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };
  const isDark = appTheme.theme === 'dark';
  const cardBgColor = isDark ? '#1e1e1e' : '#ffffff';
  const cardTextColor = isDark ? 'rgba(255, 255, 255, 0.87)' : 'rgba(0, 0, 0, 0.87)';

  // State
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedListId, setSelectedListId] = useState(null);
  const [lists, setLists] = useState([]);
  const [protocols, setProtocols] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showListForm, setShowListForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [notification, setNotification] = useState(null);

  // Subscribe to data
  useEffect(() => {
    let listsHandle, protocolsHandle, tasksHandle;
    
    const computation = Tracker.autorun(() => {
      // Subscribe to lists
      listsHandle = Meteor.subscribe('checklist.lists', {}, {
        onReady: () => {
          const listData = ChecklistLists.find({
            isDeleted: { $ne: true }
          }, {
            sort: { lastModified: -1 }
          }).fetch();
          setLists(listData);
        }
      });

      // Subscribe to protocols
      protocolsHandle = Meteor.subscribe('checklist.protocols', {
        onReady: () => {
          const protocolData = ChecklistLists.find({
            $or: [
              { isProtocol: true },
              { isSystemTemplate: true }
            ],
            isDeleted: { $ne: true }
          }, {
            sort: { isSystemTemplate: -1, title: 1 }
          }).fetch();
          setProtocols(protocolData);
        }
      });

      // Subscribe to tasks if a list is selected
      if (selectedListId) {
        tasksHandle = Meteor.subscribe('checklist.tasksByList', selectedListId, {
          onReady: () => {
            const taskData = ChecklistTasks.find({
              listId: selectedListId,
              isDeleted: { $ne: true }
            }, {
              sort: { ordinal: 1 }
            }).fetch();
            setTasks(taskData);
          }
        });
      }

      setIsLoading(!listsHandle.ready() || !protocolsHandle.ready());
    });

    return () => {
      computation.stop();
      if (listsHandle) listsHandle.stop();
      if (protocolsHandle) protocolsHandle.stop();
      if (tasksHandle) tasksHandle.stop();
    };
  }, [selectedListId]);

  // Handlers
  const handleCreateList = async (listData) => {
    try {
      const listId = await Meteor.callAsync('checklist.lists.insert', listData);
      setShowListForm(false);
      setSelectedListId(listId);
      setNotification({ severity: 'success', message: 'List created successfully' });
    } catch (error) {
      setNotification({ severity: 'error', message: error.reason || 'Failed to create list' });
    }
  };

  const handleDeleteList = async (listId) => {
    if (!confirm('Are you sure you want to delete this list and all its tasks?')) {
      return;
    }

    try {
      await Meteor.callAsync('checklist.lists.remove', listId);
      if (selectedListId === listId) {
        setSelectedListId(null);
      }
      setNotification({ severity: 'success', message: 'List deleted successfully' });
    } catch (error) {
      setNotification({ severity: 'error', message: error.reason || 'Failed to delete list' });
    }
  };

  const handleCloneList = async (listId) => {
    try {
      const newListId = await Meteor.callAsync('checklist.lists.clone', listId);
      setSelectedListId(newListId);
      setNotification({ severity: 'success', message: 'List cloned successfully' });
    } catch (error) {
      setNotification({ severity: 'error', message: error.reason || 'Failed to clone list' });
    }
  };

  const handleCloneProtocol = async (protocolId) => {
    try {
      const newListId = await Meteor.callAsync('checklist.protocols.clone', protocolId);
      setSelectedListId(newListId);
      setSelectedTab(0); // Switch to lists tab
      setNotification({ severity: 'success', message: 'Protocol cloned successfully' });
    } catch (error) {
      setNotification({ severity: 'error', message: error.reason || 'Failed to clone protocol' });
    }
  };

  // Filter lists based on search
  const filteredLists = lists.filter(list => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      get(list, 'title', '').toLowerCase().includes(term) ||
      get(list, 'description', '').toLowerCase().includes(term)
    );
  });

  // Render list item
  const renderListItem = (list) => {
    const isOwner = list.userId === Meteor.userId();
    const taskCount = get(list, 'taskCount', 0);
    const incompleteCount = get(list, 'incompleteCount', 0);

    return (
      <ListItem 
        key={list._id}
        button
        selected={selectedListId === list._id}
        onClick={() => setSelectedListId(list._id)}
        sx={{ mb: 1, borderRadius: 1 }}
      >
        <ListItemIcon>
          <Badge badgeContent={incompleteCount} color="error">
            <ListIcon />
          </Badge>
        </ListItemIcon>
        <ListItemText 
          primary={
            <Box display="flex" alignItems="center" gap={1}>
              {get(list, 'title', 'Untitled')}
              {list.public ? <PublicIcon fontSize="small" /> : <LockIcon fontSize="small" />}
            </Box>
          }
          secondary={
            <Box>
              <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                {get(list, 'description', 'No description')}
              </Typography>
              <Typography variant="caption" sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                {taskCount} tasks, {incompleteCount} incomplete
              </Typography>
            </Box>
          }
        />
        {isOwner && (
          <ListItemSecondaryAction>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleCloneList(list._id); }}>
              <ContentCopyIcon />
            </IconButton>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteList(list._id); }}>
              <DeleteIcon />
            </IconButton>
          </ListItemSecondaryAction>
        )}
      </ListItem>
    );
  };

  const selectedList = lists.find(l => l._id === selectedListId);

  return (
    <div id="checklistManifestoPage" style={{ paddingLeft: 20, paddingRight: 20 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ py: 3 }}>
          <Typography variant="h4" gutterBottom>
            Checklist Manifesto
          </Typography>
          <Typography variant="body1" sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
            Manage your checklists and protocols for clinical workflows
          </Typography>
        </Box>

        {/* Main Content */}
        <Grid container spacing={3}>
          {/* Left Panel - Lists */}
          <Grid item xs={12} md={4}>
            <Paper sx={{
              p: 2,
              height: '100%',
              bgcolor: cardBgColor,
              color: cardTextColor,
              '& .MuiTab-root': { color: cardTextColor },
              '& .MuiTab-root.Mui-selected': { color: 'primary.main' },
              '& .MuiInputBase-root': { color: cardTextColor },
              '& .MuiInputBase-input::placeholder': { color: cardTextColor, opacity: 0.6 },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)' },
              '& .MuiInputAdornment-root': { color: cardTextColor },
              '& .MuiListItemIcon-root': { color: cardTextColor },
              '& .MuiListItemText-secondary': { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }
            }}>
              {/* Tabs */}
              <Tabs value={selectedTab} onChange={(e, v) => setSelectedTab(v)} sx={{ mb: 2 }}>
                <Tab label="My Lists" />
                <Tab label="Protocols" />
              </Tabs>

              {/* Search */}
              <TextField
                fullWidth
                size="small"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
                sx={{ mb: 2 }}
              />

              {/* List Content */}
              {selectedTab === 0 ? (
                <Box>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setShowListForm(true)}
                    sx={{ mb: 2 }}
                  >
                    Create New List
                  </Button>

                  {isLoading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <List>
                      {filteredLists.map(renderListItem)}
                    </List>
                  )}
                </Box>
              ) : (
                <ProtocolLibrary 
                  protocols={protocols}
                  onClone={handleCloneProtocol}
                />
              )}
            </Paper>
          </Grid>

          {/* Right Panel - Tasks */}
          <Grid item xs={12} md={8}>
            <Paper sx={{
              p: 2,
              height: '100%',
              minHeight: 600,
              bgcolor: cardBgColor,
              color: cardTextColor,
              '& .MuiSvgIcon-root': { color: cardTextColor },
              '& .MuiCheckbox-root': { color: cardTextColor },
              '& .MuiListItemText-secondary': { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }
            }}>
              {selectedList ? (
                <Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Box>
                      <Typography variant="h5">
                        {get(selectedList, 'title', 'Untitled')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                        {get(selectedList, 'description', '')}
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setShowTaskForm(true)}
                    >
                      Add Task
                    </Button>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  <TaskList 
                    tasks={tasks}
                    listId={selectedListId}
                    onTaskUpdate={() => {
                      // Tasks will update via reactive subscription
                    }}
                  />
                </Box>
              ) : (
                <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%">
                  <AssignmentIcon sx={{ fontSize: 64, color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', mb: 2 }} />
                  <Typography variant="h6" sx={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                    Select a list to view tasks
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Dialogs */}
        <Dialog
          open={showListForm}
          onClose={() => setShowListForm(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: cardBgColor,
              color: cardTextColor,
              '& .MuiDialogTitle-root': { color: cardTextColor },
              '& .MuiInputLabel-root': { color: cardTextColor },
              '& .MuiInputBase-root': { color: cardTextColor },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)' },
              '& .MuiFormControlLabel-label': { color: cardTextColor }
            }
          }}
        >
          <DialogTitle>Create New List</DialogTitle>
          <DialogContent>
            <ListForm 
              onSubmit={handleCreateList}
              onCancel={() => setShowListForm(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog
          open={showTaskForm}
          onClose={() => setShowTaskForm(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: cardBgColor,
              color: cardTextColor,
              '& .MuiDialogTitle-root': { color: cardTextColor },
              '& .MuiInputLabel-root': { color: cardTextColor },
              '& .MuiInputBase-root': { color: cardTextColor },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: isDark ? 'rgba(255,255,255,0.23)' : 'rgba(0,0,0,0.23)' },
              '& .MuiSelect-icon': { color: cardTextColor }
            }
          }}
        >
          <DialogTitle>Add Task</DialogTitle>
          <DialogContent>
            <TaskForm 
              listId={selectedListId}
              onSubmit={async (taskData) => {
                try {
                  await Meteor.callAsync('checklist.tasks.insert', taskData.description, {
                    ...taskData,
                    listId: selectedListId
                  });
                  setShowTaskForm(false);
                  setNotification({ severity: 'success', message: 'Task added successfully' });
                } catch (error) {
                  setNotification({ severity: 'error', message: error.reason || 'Failed to add task' });
                }
              }}
              onCancel={() => setShowTaskForm(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Notification */}
        {notification && (
          <Alert 
            severity={notification.severity}
            onClose={() => setNotification(null)}
            sx={{ position: 'fixed', bottom: 24, right: 24 }}
          >
            {notification.message}
          </Alert>
        )}
      </Container>
    </div>
  );
}