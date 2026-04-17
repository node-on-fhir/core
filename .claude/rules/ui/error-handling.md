# UI Error Handling: ErrorBoundary + Suspense for Heavy Components

## Core Principle

**Wrap heavy or dynamically-loaded components with ErrorBoundary + Suspense** to prevent page crashes and provide loading feedback. This is especially important for third-party editors (AceEditor, Monaco), chart libraries, and any component that loads large chunks.

## ErrorBoundary (`imports/ui/ErrorBoundary.jsx`)

Existing shared component. Supports a `fallback` prop for custom error UI:

```jsx
// Default fallback (generic message)
<ErrorBoundary>
  <RiskyComponent />
</ErrorBoundary>

// Custom fallback (context-specific guidance)
<ErrorBoundary fallback={
  <Alert severity="warning">
    The editor failed to load. Try refreshing the page.
  </Alert>
}>
  <RiskyComponent />
</ErrorBoundary>
```

## React.lazy + Suspense Pattern

Use `React.lazy` for components that pull in large dependencies (code editors, chart libraries, PDF viewers). Pair with `Suspense` for a loading indicator:

```jsx
// Lazy-load the heavy component
const AceEditor = React.lazy(() => import('react-ace'));

// Keep side-effect imports static (modes, themes, polyfills)
import "ace-builds";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";
```

## Combined Pattern

Always wrap lazy components with both ErrorBoundary (outer) and Suspense (inner):

```jsx
<ErrorBoundary fallback={
  <Alert severity="warning" sx={{ mb: 2 }}>
    The code editor failed to load. Try refreshing the page.
  </Alert>
}>
  <React.Suspense fallback={
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
      <CircularProgress />
    </Box>
  }>
    <AceEditor
      mode="json"
      theme="github"
      width="100%"
      height="400px"
      setOptions={{ useWorker: false }}
    />
  </React.Suspense>
</ErrorBoundary>
```

**Order matters**: ErrorBoundary must be the outer wrapper because Suspense doesn't catch render errors, only async loading states.

## When to Apply

Apply this pattern when adding or modifying:
- **Code editors**: AceEditor, Monaco Editor
- **Chart libraries**: Recharts, Chart.js, D3 visualizations
- **PDF/document viewers**: react-pdf, mammoth
- **Map components**: Leaflet, Mapbox
- **Any component behind `React.lazy()`**

## Sizing the Suspense Fallback

Match the `height` of the Suspense fallback to the component it replaces, so the layout doesn't jump when loading completes:

```jsx
// Editor is 400px tall → fallback is 400px tall
<React.Suspense fallback={
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
    <CircularProgress />
  </Box>
}>
```

## Existing Usages

- `imports/ui/GettingStartedPage.jsx` — AceEditor in "Settings file" section (lazy-loaded with ErrorBoundary + Suspense)

## Related

- File: `imports/ui/ErrorBoundary.jsx` — ErrorBoundary component
- Rule: `rules/ui/material-ui.md` — MUI component patterns
- Rule: `rules/ui/theming.md` — Theme tokens
