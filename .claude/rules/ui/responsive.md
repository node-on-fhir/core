# Responsive Design Patterns

## Breakpoints

Material-UI breakpoints:
```javascript
xs: 0px      // Extra small (phones)
sm: 600px    // Small (tablets)
md: 900px    // Medium (small laptops)
lg: 1200px   // Large (desktops)
xl: 1536px   // Extra large (large desktops)
```

## Responsive sx Prop

### Width/Height
```javascript
<Box sx={{
  width: { xs: '100%', sm: '75%', md: '50%' },
  height: { xs: '300px', md: '500px' }
}} />
```

### Padding/Margin
```javascript
<Container sx={{
  p: { xs: 1, sm: 2, md: 3 },
  my: { xs: 2, md: 4 }
}} />
```

### Typography
```javascript
<Typography sx={{
  fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' }
}}>
  Text
</Typography>
```

### Display
```javascript
<Box sx={{
  display: { xs: 'none', md: 'block' }  // Hidden on mobile, visible on desktop
}} />

<Box sx={{
  display: { xs: 'block', md: 'none' }  // Visible on mobile, hidden on desktop
}} />
```

### FlexDirection
```javascript
<Box sx={{
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },  // Stack on mobile, side-by-side on desktop
  gap: 2
}} />
```

### Grid Columns
```javascript
<Box sx={{
  display: 'grid',
  gridTemplateColumns: {
    xs: '1fr',               // 1 column on mobile
    sm: 'repeat(2, 1fr)',    // 2 columns on tablets
    md: 'repeat(3, 1fr)'     // 3 columns on desktop
  },
  gap: 2
}} />
```

## useTheme Breakpoints

```javascript
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

function MyComponent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <>
      {isMobile && <MobileLayout />}
      {isDesktop && <DesktopLayout />}
    </>
  );
}
```

## Common Patterns

### Mobile-First Container
```javascript
<Container
  maxWidth="lg"
  sx={{
    py: { xs: 2, md: 4 },
    px: { xs: 2, md: 3 }
  }}
>
  Content
</Container>
```

### Responsive Card
```javascript
<Card sx={{
  width: { xs: '100%', sm: '90%', md: '70%' },
  mx: 'auto',
  boxShadow: { xs: 1, md: 3 }
}}>
  Content
</Card>
```

### Responsive Table
```javascript
<TableContainer sx={{
  maxHeight: { xs: '400px', md: '600px' },
  overflowX: 'auto'
}}>
  <Table sx={{
    minWidth: { xs: '600px', md: 'auto' }  // Horizontal scroll on mobile
  }}>
    <TableBody>
      <TableRow>
        <TableCell sx={{
          fontSize: { xs: '0.75rem', md: '0.875rem' }
        }}>
          Content
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</TableContainer>
```

### Responsive Button Group
```javascript
<Box sx={{
  display: 'flex',
  flexDirection: { xs: 'column', sm: 'row' },
  gap: 1,
  justifyContent: { xs: 'stretch', sm: 'flex-end' }
}}>
  <Button fullWidth={{ xs: true, sm: false }}>Cancel</Button>
  <Button variant="contained" fullWidth={{ xs: true, sm: false }}>Save</Button>
</Box>
```

### Hide/Show Elements
```javascript
// Desktop-only sidebar
<Box sx={{
  display: { xs: 'none', md: 'block' },
  width: '250px'
}}>
  <Sidebar />
</Box>

// Mobile menu icon
<IconButton sx={{
  display: { xs: 'block', md: 'none' }
}}>
  <MenuIcon />
</IconButton>
```

## Mobile Drawer Pattern

```javascript
function ResponsiveLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <>
      {/* Mobile: Drawer */}
      <Drawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        <Sidebar />
      </Drawer>

      {/* Desktop: Permanent Sidebar */}
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <Sidebar />
      </Box>

      {/* Menu button (mobile only) */}
      <IconButton
        onClick={() => setMobileOpen(true)}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        <MenuIcon />
      </IconButton>
    </>
  );
}
```

## Testing Responsive Design

### Browser DevTools
1. Open Chrome DevTools
2. Toggle device toolbar (Cmd+Shift+M)
3. Select device or custom dimensions
4. Test breakpoints: 375px (mobile), 768px (tablet), 1024px (desktop)

### Nightwatch Tests
```javascript
it('Responsive layout works on mobile', browser => {
  browser.resizeWindow(375, 667); // iPhone dimensions
  browser.url('http://localhost:3000');

  // Verify mobile layout
  browser.expect.element('#mobileMenu').to.be.visible;
  browser.expect.element('#desktopSidebar').to.not.be.visible;
});

it('Responsive layout works on desktop', browser => {
  browser.resizeWindow(1920, 1080); // Desktop dimensions
  browser.url('http://localhost:3000');

  // Verify desktop layout
  browser.expect.element('#desktopSidebar').to.be.visible;
  browser.expect.element('#mobileMenu').to.not.be.visible;
});
```

## Anti-Patterns

### ❌ Fixed Pixel Widths
```javascript
<Box sx={{ width: '800px' }} /> // Breaks on mobile
```

### ✅ Responsive Widths
```javascript
<Box sx={{ width: { xs: '100%', md: '800px' }, maxWidth: '100%' }} />
```

### ❌ No Mobile Consideration
```javascript
<Box sx={{ display: 'flex', gap: 5 }}>
  <Item />
  <Item />
  <Item />
</Box>
```

### ✅ Mobile-Friendly
```javascript
<Box sx={{
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  gap: { xs: 2, md: 5 }
}}>
  <Item />
  <Item />
  <Item />
</Box>
```

## Related

- Rule: `rules/ui/theming.md` - Theme tokens
- Rule: `rules/ui/material-ui.md` - Component patterns
- Material-UI breakpoints: https://mui.com/material-ui/customization/breakpoints/
