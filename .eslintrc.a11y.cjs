// .eslintrc.a11y.cjs — a11y-only lint pass (separate from any app eslint).
// Run via `npm run lint:a11y`, which adds --rulesdir scripts/eslint-rules
// (for icon-button-aria-label) and --no-inline-config (app files carry
// eslint-disable comments for plugins this scoped pass doesn't load).
module.exports = {
  root: true,
  parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['jsx-a11y'],
  // Latent `await` inside non-async functions — standard espree cannot parse
  // these files. Pre-existing app bugs, noted for follow-up, out of a11y scope.
  ignorePatterns: [
    'imports/ui-consent-engine/FooterButtons.jsx',
    'imports/ui-vault-server/FhirBasePage.jsx',
    'imports/ui-vault-server/FooterButtons.jsx'
  ],
  settings: {
    'jsx-a11y': {
      components: { IconButton: 'button' } // treat MUI IconButton as a <button>
    }
  },
  rules: {
    // The A-4 finding: icon-only IconButton without an accessible name.
    // Custom rule — jsx-a11y/control-has-associated-label passes elements with
    // JSX-element children, so it never fires on <IconButton><XIcon/></IconButton>.
    'icon-button-aria-label': 'warn',
    // Kept for native controls (inputs/selects without labels) — real findings,
    // though outside the IconButton scope of A-4.
    'jsx-a11y/control-has-associated-label': ['warn', {
      labelAttributes: ['aria-label', 'aria-labelledby', 'title'],
      controlComponents: ['IconButton']
    }]
  }
};
