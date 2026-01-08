# Material-UI v5 Component Patterns

## Component Imports

```javascript
import {
  Box, Container, Card, CardHeader, CardContent, CardActions,
  TextField, Button, Select, MenuItem, FormControl, InputLabel,
  Typography, Alert, CircularProgress, Checkbox, FormControlLabel,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Dialog, DialogTitle, DialogContent, DialogActions,
  AppBar, Toolbar, IconButton, Drawer, List, ListItem, ListItemText
} from '@mui/material';

import { useTheme } from '@mui/material/styles';
```

## Layout Components

### Container
```javascript
<Container maxWidth="lg" sx={{ py: 4 }}>
  Content
</Container>
```

### Box (Flexible Wrapper)
```javascript
<Box sx={{
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  p: 3
}}>
  Content
</Box>
```

### Card
```javascript
<Card sx={{ boxShadow: 3 }}>
  <CardHeader
    title="Title"
    sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
  />
  <CardContent>
    Content
  </CardContent>
  <CardActions sx={{ justifyContent: 'flex-end' }}>
    <Button>Action</Button>
  </CardActions>
</Card>
```

## Form Components

### TextField
```javascript
<TextField
  id="nameInput"
  fullWidth
  label="Name"
  value={name}
  onChange={(e) => setName(e.target.value)}
  disabled={!isEditing}
  sx={{ mb: 2 }}
/>
```

### Select (Portal-Based)
```javascript
<FormControl fullWidth sx={{ mb: 2 }}>
  <InputLabel id="status-label">Status</InputLabel>
  <Select
    labelId="status-label"
    id="statusSelect"
    value={status}
    onChange={(e) => setStatus(e.target.value)}
    label="Status"
  >
    <MenuItem value="active">Active</MenuItem>
    <MenuItem value="inactive">Inactive</MenuItem>
  </Select>
</FormControl>
```

### Button
```javascript
<Button
  variant="contained"  // or "outlined", "text"
  color="primary"
  onClick={handleClick}
  disabled={isLoading}
  startIcon={<SaveIcon />}
>
  Save
</Button>
```

## Typography

```javascript
<Typography variant="h5" gutterBottom>
  Title
</Typography>

<Typography variant="body1" sx={{ mb: 2 }}>
  Body text
</Typography>

<Typography variant="caption" color="text.secondary">
  Small text
</Typography>
```

## Table

```javascript
<TableContainer>
  <Table id="dataTable">
    <TableHead>
      <TableRow>
        <TableCell>Column 1</TableCell>
        <TableCell>Column 2</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {data.map((row) => (
        <TableRow
          key={row._id}
          onClick={() => handleRowClick(row)}
          sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
        >
          <TableCell>{row.field1}</TableCell>
          <TableCell>{row.field2}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
```

## Dialog

```javascript
<Dialog open={open} onClose={handleClose}>
  <DialogTitle>Confirm Delete</DialogTitle>
  <DialogContent>
    Are you sure you want to delete this record?
  </DialogContent>
  <DialogActions>
    <Button onClick={handleClose}>Cancel</Button>
    <Button onClick={handleConfirm} color="error">Delete</Button>
  </DialogActions>
</Dialog>
```

## Common Patterns

### Loading State
```javascript
{isLoading ? (
  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
    <CircularProgress />
  </Box>
) : (
  <Content />
)}
```

### Error/Warning
```javascript
<Alert severity="error" sx={{ mb: 2 }}>
  Error message
</Alert>

<Alert severity="warning" sx={{ mb: 2 }}>
  Warning message
</Alert>
```

### Conditional Rendering
```javascript
{!patient ? (
  <Alert severity="warning">
    No patient selected. Please select a patient from the sidebar.
  </Alert>
) : (
  <PatientData patient={patient} />
)}
```

## sx Prop Patterns

### Flexbox
```javascript
<Box sx={{
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 2
}} />
```

### Grid Layout
```javascript
<Box sx={{
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 2
}} />
```

### Responsive
```javascript
<Box sx={{
  width: { xs: '100%', sm: '75%', md: '50%' },
  padding: { xs: 1, sm: 2, md: 3 }
}} />
```

### Hover States
```javascript
<TableRow sx={{
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: 'action.hover'
  }
}} />
```

## Related

- Rule: `rules/ui/theming.md` - Theme tokens
- Rule: `rules/ui/responsive.md` - Responsive patterns
- Agent: `theme-auditor` - Theme compliance
- Material-UI docs: https://mui.com/material-ui/
