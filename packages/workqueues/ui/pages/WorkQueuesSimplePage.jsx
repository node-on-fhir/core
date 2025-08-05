// /packages/workqueues/ui/pages/WorkQueuesSimplePage.jsx

import React, { useState, useCallback } from 'react';
import { 
  Container,
  Box,
  Typography,
  Paper
} from '@mui/material';
import { WorkQueueList } from '../components/WorkQueueList.jsx';
import { WorkItemDetail } from '../components/WorkItemDetail.jsx';
import { WorkQueueFilters } from '../components/WorkQueueFilters.jsx';
import { QuickAddTask } from '../components/QuickAddTask.jsx';
import { useWorkQueue } from '../../client/hooks/useWorkQueue.js';

export function WorkQueuesSimplePage() {
  const [selectedTask, setSelectedTask] = useState(null);
  const [filters, setFilters] = useState({});
  
  // Use the hook to get stats
  const { stats } = useWorkQueue(null, filters);

  const handleTaskClick = useCallback((task) => {
    setSelectedTask(task);
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 2 }}>
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          Work Queues
        </Typography>
      </Box>
      
      <QuickAddTask 
        onTaskAdded={() => {
          // Could refresh or show notification
        }}
      />
      
      <WorkQueueFilters
        filters={filters}
        onFiltersChange={setFilters}
        taskCounts={stats}
      />
      
      <Paper elevation={1}>
        <WorkQueueList
          filters={filters}
          onItemClick={handleTaskClick}
        />
      </Paper>
      
      {selectedTask && (
        <WorkItemDetail
          task={selectedTask}
          open={Boolean(selectedTask)}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </Container>
  );
}