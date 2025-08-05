// /packages/workqueues/ui/pages/WorkQueuesPage.jsx

import React, { useState, useCallback, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { 
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Button,
  Menu,
  MenuItem,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Badge,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { 
  Queue as QueueIcon,
  Add as AddIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { WorkQueues, WorkQueueItems } from '../../lib/collections';
import { WorkQueueList } from '../components/WorkQueueList';
import { WorkItemCard } from '../components/WorkItemCard';
import { WorkItemDetail } from '../components/WorkItemDetail';
import { WorkQueueFilters } from '../components/WorkQueueFilters';
import { QuickAddTask } from '../components/QuickAddTask';

export function WorkQueuesPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // list, cards, dashboard
  const [filters, setFilters] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [createQueueAnchor, setCreateQueueAnchor] = useState(null);

  // Subscribe to data
  const [queues, setQueues] = useState([]);
  const [stats, setStats] = useState({
    all: 0,
    active: 0,
    urgent: 0,
    overdue: 0,
    completed: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handles = [];
    
    const queuesHandle = Meteor.subscribe('workqueues.activeQueues', {
      onReady: () => {
        console.log('Queues subscription ready');
      }
    });
    handles.push(queuesHandle);
    
    const statsHandle = Meteor.subscribe('workqueues.taskStats', {
      queueId: selectedQueue,
      userId: Meteor.userId()
    });
    handles.push(statsHandle);

    const computation = Tracker.autorun(() => {
      const queueList = WorkQueues.find({ active: true }).fetch();
      setQueues(queueList);

      // Get task counts for filters
      const allTasks = WorkQueueItems.find({
        $or: [
          { assignee: Meteor.userId() },
          { creator: Meteor.userId() },
          { owner: Meteor.userId() }
        ]
      }).fetch();

      const newStats = {
        all: allTasks.length,
        active: allTasks.filter(t => !t.done && ['requested', 'accepted', 'in-progress'].includes(t.status)).length,
        urgent: allTasks.filter(t => !t.done && ['stat', 'urgent'].includes(t.priority)).length,
        overdue: allTasks.filter(t => !t.done && t.dueDate && new Date(t.dueDate) < new Date()).length,
        completed: allTasks.filter(t => t.done).length
      };
      
      setStats(newStats);
      setIsLoading(handles.some(h => !h.ready()));
    });

    return () => {
      computation.stop();
      handles.forEach(h => h.stop());
    };
  }, [selectedQueue]);

  const handleTaskClick = useCallback((task) => {
    setSelectedTask(task);
  }, []);

  const handleTaskUpdate = useCallback(async (taskId, done) => {
    try {
      await Meteor.callAsync('workqueues.updateTask', taskId, { done });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  }, []);

  const handleTaskStar = useCallback(async (taskId, star) => {
    try {
      await Meteor.callAsync('workqueues.starTask', taskId, star);
    } catch (error) {
      console.error('Error starring task:', error);
    }
  }, []);

  const handleCreateQueue = async (type) => {
    setCreateQueueAnchor(null);
    
    const queueName = prompt(`Enter name for new ${type} queue:`);
    if (!queueName) return;

    try {
      await Meteor.callAsync('workqueues.createQueue', {
        name: queueName,
        department: type,
        settings: {
          autoAssign: false,
          maxItemsPerUser: 20
        }
      });
    } catch (error) {
      console.error('Error creating queue:', error);
      alert('Failed to create queue: ' + error.message);
    }
  };

  const sidebarContent = (
    <Box sx={{ width: 250, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Work Queues</Typography>
        {isMobile && (
          <IconButton onClick={() => setSidebarOpen(false)}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>
      
      <Divider />
      
      <List sx={{ flex: 1, overflow: 'auto' }}>
        <ListItem button selected={!selectedQueue} onClick={() => setSelectedQueue(null)}>
          <ListItemIcon>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText 
            primary="My Tasks" 
            secondary={
              <Badge badgeContent={stats.active} color="primary" variant="standard">
                <span>{stats.active} active</span>
              </Badge>
            }
          />
        </ListItem>
        
        <ListItem button>
          <ListItemIcon>
            <GroupIcon />
          </ListItemIcon>
          <ListItemText primary="Team Overview" />
        </ListItem>
        
        <Divider sx={{ my: 1 }} />
        
        <ListItem>
          <Typography variant="caption" color="textSecondary">
            QUEUES
          </Typography>
        </ListItem>
        
        {queues.map((queue) => (
          <ListItem 
            key={queue._id} 
            button 
            selected={selectedQueue === queue._id}
            onClick={() => setSelectedQueue(queue._id)}
          >
            <ListItemIcon>
              <QueueIcon />
            </ListItemIcon>
            <ListItemText 
              primary={queue.name}
              secondary={queue.department}
            />
          </ListItem>
        ))}
        
        <ListItem 
          button 
          onClick={(e) => setCreateQueueAnchor(e.currentTarget)}
        >
          <ListItemIcon>
            <AddIcon />
          </ListItemIcon>
          <ListItemText primary="Create Queue" />
        </ListItem>
      </List>
      
      <Divider />
      
      <List>
        <ListItem button>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      {isMobile ? (
        <Drawer
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          anchor="left"
        >
          {sidebarContent}
        </Drawer>
      ) : (
        <Paper elevation={2} sx={{ borderRadius: 0 }}>
          {sidebarContent}
        </Paper>
      )}
      
      {/* Main content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <Paper elevation={0} sx={{ p: 2, borderRadius: 0, borderBottom: 1, borderColor: 'divider' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              {isMobile && (
                <IconButton onClick={() => setSidebarOpen(true)}>
                  <MenuIcon />
                </IconButton>
              )}
              <Typography variant="h5">
                {selectedQueue ? queues.find(q => q._id === selectedQueue)?.name : 'My Tasks'}
              </Typography>
            </Box>
            
            <Tabs value={viewMode} onChange={(e, v) => setViewMode(v)}>
              <Tab label="List" value="list" />
              <Tab label="Cards" value="cards" />
              <Tab label="Dashboard" value="dashboard" />
            </Tabs>
          </Box>
        </Paper>
        
        {/* Content area */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <Container maxWidth="lg">
            <QuickAddTask 
              queueId={selectedQueue}
              onTaskAdded={() => {}}
            />
            
            <WorkQueueFilters
              filters={filters}
              onFiltersChange={setFilters}
              taskCounts={stats}
            />
            
            {viewMode === 'list' && (
              <WorkQueueList
                queueId={selectedQueue}
                filters={filters}
                onItemClick={handleTaskClick}
              />
            )}
            
            {viewMode === 'cards' && (
              <Grid container spacing={2}>
                {/* We'd need to fetch tasks here and map them to cards */}
                <Grid item xs={12} sm={6} md={4}>
                  <Typography color="textSecondary">
                    Card view coming soon...
                  </Typography>
                </Grid>
              </Grid>
            )}
            
            {viewMode === 'dashboard' && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h3" color="primary">
                      {stats.active}
                    </Typography>
                    <Typography variant="subtitle1">Active Tasks</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h3" color="warning.main">
                      {stats.urgent}
                    </Typography>
                    <Typography variant="subtitle1">Urgent Tasks</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h3" color="error">
                      {stats.overdue}
                    </Typography>
                    <Typography variant="subtitle1">Overdue Tasks</Typography>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </Container>
        </Box>
      </Box>
      
      {/* Task detail dialog */}
      {selectedTask && (
        <WorkItemDetail
          task={selectedTask}
          open={Boolean(selectedTask)}
          onClose={() => setSelectedTask(null)}
        />
      )}
      
      {/* Create queue menu */}
      <Menu
        anchorEl={createQueueAnchor}
        open={Boolean(createQueueAnchor)}
        onClose={() => setCreateQueueAnchor(null)}
      >
        <MenuItem onClick={() => handleCreateQueue('radiology')}>
          Radiology Queue
        </MenuItem>
        <MenuItem onClick={() => handleCreateQueue('laboratory')}>
          Laboratory Queue
        </MenuItem>
        <MenuItem onClick={() => handleCreateQueue('pharmacy')}>
          Pharmacy Queue
        </MenuItem>
        <MenuItem onClick={() => handleCreateQueue('general')}>
          General Queue
        </MenuItem>
      </Menu>
    </Box>
  );
}