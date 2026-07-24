// imports/lib/WorkflowRegistry.js

import { warnOnce } from './warnOnce.js';

// Meteor is looked up off globalThis (not imported) so this module stays
// loadable under plain `node --test` — Meteor sets the global in-app, and
// the structured Logger is used whenever it's available.
const Meteor = globalThis.Meteor;
const log = (Meteor && Meteor.Logger ? Meteor.Logger.for('WorkflowRegistry') : console);

// Canonical component-override slot names for the `components` map on a
// workflow's default export. Default implementations live in
// imports/ui/extensible/. See extensions/API.md for the full contract.
const CANONICAL_COMPONENT_KEYS = [
  'AboutPage', 'PrivacyPage', 'SupportPage', 'TermsPage', 'EulaPage',
  'WelcomePage', 'NotFoundPage', 'NoAuthorizationPage', 'NoSelectedPatientPage',
  'NoDataPage', 'ErrorPage', 'LoadingPage',
  'Sidebar', 'Header', 'ProminentHeader', 'Footer'
];

// Deprecated top-level default-export keys, mapped into the components map.
// NOTE: welcomeComponent is a WelcomeDialog slot (cloned with dialog props by
// WelcomeDialog.jsx), NOT the root splash page — see getComponent().
const LEGACY_COMPONENT_KEYS = {
  notFoundPage: 'NotFoundPage',
  welcomeComponent: 'WelcomePage',
  noPatientSelectedPage: 'NoSelectedPatientPage'
};

const REACT_ELEMENT_TYPE = Symbol.for('react.element');
function isReactElement(value) {
  return typeof value === 'object' && value !== null && value.$$typeof === REACT_ELEMENT_TYPE;
}

/**
 * WorkflowRegistry - Typed plugin discovery system for NPM-based workflows
 *
 * This replaces the window.Package iteration pattern used for Atmosphere packages.
 * Workflows register their routes and sidebar items here, and App.jsx/PatientSidebar.jsx
 * query the registry to discover available workflows.
 *
 * Usage:
 *   import WorkflowRegistry from '/imports/lib/WorkflowRegistry.js';
 *   import merkalisWorkflow from '@merkalis/node-on-fhir-merkle-storage';
 *   WorkflowRegistry.registerWorkflow(merkalisWorkflow);
 */

const WorkflowRegistry = {
  routes: [],
  sidebarItems: [],
  footerButtons: [],
  patientsDirectoryButtons: [],
  serverConfigs: [],
  serverConfigsByWorkflow: [],
  notFoundPage: null,
  welcomeComponent: null,
  noPatientSelectedPage: null,
  // canonicalName -> { component, element, zIndex, workflowName, viaLegacyKey }
  components: {},
  registeredWorkflows: [],
  onChangeCallbacks: [],

  /**
   * Register a workflow with its routes and sidebar items
   * @param {Object} workflow - Workflow object with routes and/or sidebarItems arrays
   * @param {Object} [options] - Loader-supplied metadata
   * @param {number} [options.zIndex] - Package precedence (CSS mnemonic: higher
   *   sits on top). Resolved by rspack.workflowParser.js from the central
   *   manifest or the package's own workflow.json; defaults to 0.
   */
  registerWorkflow(workflow, options = {}) {
    if (!workflow) {
      log.warn('Attempted to register null/undefined workflow');
      return;
    }

    const workflowName = workflow.name || 'unnamed';

    if (this.registeredWorkflows.includes(workflowName)) {
      log.warn('Workflow already registered, skipping', { workflow: workflowName });
      return;
    }

    const zIndex = Number.isFinite(options?.zIndex) ? options.zIndex
      : (Number.isFinite(workflow?.zIndex) ? workflow.zIndex : 0);

    if (workflow.routes && Array.isArray(workflow.routes)) {
      this.routes.push(...workflow.routes.map(r => ({ ...r, _zIndex: zIndex })));
      log.info('Registered routes', { count: workflow.routes.length, workflow: workflowName });
    }

    if (workflow.sidebarItems && Array.isArray(workflow.sidebarItems)) {
      this.sidebarItems.push(...workflow.sidebarItems.map(s => ({ ...s, _zIndex: zIndex })));
      log.info('Registered sidebar items', { count: workflow.sidebarItems.length, workflow: workflowName });
    }

    if (workflow.footerButtons && Array.isArray(workflow.footerButtons)) {
      this.footerButtons.push(...workflow.footerButtons.map(b => ({ ...b, _zIndex: zIndex })));
      log.info('Registered footer buttons', { count: workflow.footerButtons.length, workflow: workflowName });
    }

    if (workflow.patientsDirectoryButtons && Array.isArray(workflow.patientsDirectoryButtons)) {
      this.patientsDirectoryButtons.push(...workflow.patientsDirectoryButtons.map(b => ({ ...b, _zIndex: zIndex })));
      log.debug(`Registered ${workflow.patientsDirectoryButtons.length} patients directory button(s) from "${workflowName}"`);
    }

    if (workflow.serverConfigs && Array.isArray(workflow.serverConfigs)) {
      this.serverConfigs.push(...workflow.serverConfigs);
      this.serverConfigsByWorkflow.push({
        name: workflowName,
        components: workflow.serverConfigs
      });
      log.info('Registered server configs', { count: workflow.serverConfigs.length, workflow: workflowName });
    }

    if (workflow.components && typeof workflow.components === 'object') {
      Object.keys(workflow.components).forEach((key) => {
        this.registerComponent(key, workflow.components[key], { zIndex, workflowName });
      });
    }

    // Deprecated top-level keys: mapped into the components map (tagged
    // viaLegacyKey) AND mirrored onto the legacy singleton fields so the
    // deprecated getters keep their exact historical behavior.
    Object.keys(LEGACY_COMPONENT_KEYS).forEach((legacyKey) => {
      if (workflow[legacyKey]) {
        const canonical = LEGACY_COMPONENT_KEYS[legacyKey];
        warnOnce(`legacy-key-${legacyKey}-${workflowName}`,
          `[WorkflowRegistry] DEPRECATED: "${workflowName}" uses default-export key "${legacyKey}". Use components: { ${canonical}: ... } instead (see extensions/API.md).`);
        this.registerComponent(canonical, workflow[legacyKey], { zIndex, workflowName, viaLegacyKey: true });
      }
    });

    if (workflow.notFoundPage) {
      this.notFoundPage = workflow.notFoundPage;
      log.info('Registered custom 404 page', { workflow: workflowName });
    }

    if (workflow.welcomeComponent) {
      this.welcomeComponent = workflow.welcomeComponent;
      log.info('Registered custom welcome component', { workflow: workflowName });
    }

    if (workflow.noPatientSelectedPage) {
      this.noPatientSelectedPage = workflow.noPatientSelectedPage;
      log.debug(`Registered custom no-patient-selected page from "${workflowName}"`);
    }

    this.registeredWorkflows.push(workflowName);

    // Notify subscribers that routes/sidebar items changed
    this.onChangeCallbacks.forEach(cb => cb());
  },

  /**
   * Register a single component override into the components map.
   * Usually called via registerWorkflow (the `components` key on the default
   * export); callable directly for tests and programmatic registration.
   *
   * Values are normalized ONCE here so getComponent() always returns a STABLE
   * React component reference (a fresh wrapper per render would remount the
   * subtree). Component references are preferred; JSX elements (the legacy
   * style) are wrapped in a zero-prop functional component.
   *
   * Conflict semantics: higher zIndex wins; on a tie the EARLIER registration
   * wins (mirrors route first-match-wins). Every conflict logs a console
   * warning naming both packages and the winner — only one brand package per
   * runtime is expected to use this map.
   *
   * @param {String} name - Canonical slot name (see CANONICAL_COMPONENT_KEYS)
   * @param {Function|React.Element} value - Component reference or JSX element
   * @param {Object} [meta] - { zIndex, workflowName, viaLegacyKey }
   */
  registerComponent(name, value, { zIndex = 0, workflowName = 'unnamed', viaLegacyKey = false } = {}) {
    if (!CANONICAL_COMPONENT_KEYS.includes(name)) {
      log.warn(`"${workflowName}" registered unknown component key "${name}" — known keys: ${CANONICAL_COMPONENT_KEYS.join(', ')}. Check for typos.`);
      // Still stored below (forward-compat); the warning is the typo net.
    }
    if (!value) {
      log.warn('Registered empty value for component — skipping', { workflow: workflowName, component: name });
      return;
    }

    let entry;
    if (isReactElement(value)) {
      const element = value;
      const LegacyElementWrapper = function LegacyElementWrapper() { return element; };
      entry = { component: LegacyElementWrapper, element, zIndex, workflowName, viaLegacyKey };
    } else if (typeof value === 'function') {
      entry = { component: value, element: null, zIndex, workflowName, viaLegacyKey };
    } else {
      log.warn('Registered component that is neither a component nor a JSX element — skipping', { workflow: workflowName, component: name });
      return;
    }

    const existing = this.components[name];
    if (existing) {
      const newWins = zIndex > existing.zIndex;
      log.warn(`Component "${name}" registered by both "${existing.workflowName}" (zIndex ${existing.zIndex}) and "${workflowName}" (zIndex ${zIndex}) — "${newWins ? workflowName : existing.workflowName}" wins`);
      if (!newWins) {
        return;
      }
    } else {
      log.info('Registered component override', { component: name, workflow: workflowName });
    }
    this.components[name] = entry;
  },

  /**
   * Get the winning override component for a canonical slot name.
   * Always returns a React COMPONENT (element registrations were wrapped at
   * registration time), or null when no override is present.
   *
   * NOTE: 'WelcomePage' skips entries mapped from the legacy
   * `welcomeComponent` key — that legacy slot is a WelcomeDialog replacement
   * (cloneElement'd with dialog props by WelcomeDialog.jsx), not the root
   * splash page. Rendering it at "/" would mount a bare dialog.
   *
   * @param {String} name - Canonical slot name
   * @returns {Function|null} Override component or null
   */
  getComponent(name) {
    const entry = this.components[name];
    if (!entry) {
      return null;
    }
    if (name === 'WelcomePage' && entry.viaLegacyKey) {
      return null;
    }
    return entry.component;
  },

  /**
   * Subscribe to workflow registration events
   * @param {Function} callback - Function to call when workflows are registered
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.onChangeCallbacks.push(callback);
    return () => {
      this.onChangeCallbacks = this.onChangeCallbacks.filter(cb => cb !== callback);
    };
  },

  /**
   * Get all registered routes, highest zIndex first.
   * DESC because both consumers are first-match-wins: the App.jsx allRoutes
   * dedup skips later duplicates, and React Router mounts the first matching
   * <Route> — so the higher-zIndex package's route must come first.
   * Stable sort: equal zIndex preserves registration order.
   * @returns {Array} Array of route objects
   */
  getRoutes() {
    return [...this.routes].sort((a, b) => (b._zIndex || 0) - (a._zIndex || 0));
  },

  /**
   * Get all registered sidebar items, highest zIndex first (display order —
   * the orchestrator package's nav items render at the top).
   * @returns {Array} Array of sidebar item objects
   */
  getSidebarItems() {
    return [...this.sidebarItems].sort((a, b) => (b._zIndex || 0) - (a._zIndex || 0));
  },

  /**
   * Get all registered footer buttons, LOWEST zIndex first.
   * ASC because Footer.jsx renderWestNavbar is last-match-wins (it reassigns
   * renderDom on every pathname match) — so the higher-zIndex package's footer
   * must come last to win. Stable sort preserves intra-package order (e.g.
   * radiology-workflow deliberately relies on its later entries beating its
   * earlier ones).
   * @returns {Array} Array of footer button objects
   */
  getFooterButtons() {
    return [...this.footerButtons].sort((a, b) => (a._zIndex || 0) - (b._zIndex || 0));
  },

  /**
   * Get all registered patients directory buttons
   * @returns {Array} Array of button config objects for PatientsTable expanded rows
   */
  getPatientsDirectoryButtons() {
    return this.patientsDirectoryButtons;
  },

  /**
   * Get all registered server config components
   * @returns {Array} Array of React elements for server configuration page
   */
  getServerConfigs() {
    return this.serverConfigs;
  },

  /**
   * Get server config components grouped by workflow name
   * @returns {Array} Array of { name, components } objects
   */
  getServerConfigsWithNames() {
    return this.serverConfigsByWorkflow;
  },

  /**
   * Get custom 404 page element if registered by a workflow
   * @deprecated Use getComponent('NotFoundPage') — kept for the legacy
   *   `notFoundPage` default-export key.
   * @returns {React.Element|null} Custom not-found page or null
   */
  getNotFoundPage() {
    return this.notFoundPage;
  },

  /**
   * Get custom welcome component if registered by a workflow.
   * @deprecated Legacy `welcomeComponent` slot. Still the ONLY correct getter
   *   for WelcomeDialog.jsx, which cloneElement's the raw registered value
   *   with dialog props ({ open, onClose, ... }). getComponent('WelcomePage')
   *   deliberately excludes values registered through this legacy key.
   * @returns {React.Element|null} Custom welcome component or null
   */
  getWelcomeComponent() {
    return this.welcomeComponent;
  },

  /**
   * Get custom no-patient-selected page if registered by a workflow.
   * Rendered by the router for routes declaring `requirePatient: true` when
   * no patient is selected. Falls back to the core NoSelectedPatientPage.
   * @deprecated Use getComponent('NoSelectedPatientPage') — kept for the
   *   legacy `noPatientSelectedPage` default-export key.
   * @returns {React.Element|null} Custom no-patient page or null
   */
  getNoPatientSelectedPage() {
    return this.noPatientSelectedPage;
  },

  /**
   * Get list of registered workflow names
   * @returns {Array} Array of workflow names
   */
  getRegisteredWorkflows() {
    return this.registeredWorkflows;
  },

  /**
   * Clear all registered workflows (useful for testing)
   */
  clear() {
    this.routes = [];
    this.sidebarItems = [];
    this.footerButtons = [];
    this.patientsDirectoryButtons = [];
    this.serverConfigs = [];
    this.serverConfigsByWorkflow = [];
    this.notFoundPage = null;
    this.welcomeComponent = null;
    this.noPatientSelectedPage = null;
    this.components = {};
    this.registeredWorkflows = [];
    this.onChangeCallbacks = [];
  }
};

export default WorkflowRegistry;
