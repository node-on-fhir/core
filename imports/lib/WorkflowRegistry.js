// imports/lib/WorkflowRegistry.js

import { Meteor } from 'meteor/meteor';

const log = (Meteor.Logger ? Meteor.Logger.for('WorkflowRegistry') : console);

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
  registeredWorkflows: [],
  onChangeCallbacks: [],

  /**
   * Register a workflow with its routes and sidebar items
   * @param {Object} workflow - Workflow object with routes and/or sidebarItems arrays
   */
  registerWorkflow(workflow) {
    if (!workflow) {
      console.warn('[WorkflowRegistry] Attempted to register null/undefined workflow');
      return;
    }

    const workflowName = workflow.name || 'unnamed';

    if (this.registeredWorkflows.includes(workflowName)) {
      console.warn(`[WorkflowRegistry] Workflow "${workflowName}" already registered, skipping`);
      return;
    }

    if (workflow.routes && Array.isArray(workflow.routes)) {
      this.routes.push(...workflow.routes);
      console.log(`[WorkflowRegistry] Registered ${workflow.routes.length} route(s) from "${workflowName}"`);
    }

    if (workflow.sidebarItems && Array.isArray(workflow.sidebarItems)) {
      this.sidebarItems.push(...workflow.sidebarItems);
      console.log(`[WorkflowRegistry] Registered ${workflow.sidebarItems.length} sidebar item(s) from "${workflowName}"`);
    }

    if (workflow.footerButtons && Array.isArray(workflow.footerButtons)) {
      this.footerButtons.push(...workflow.footerButtons);
      console.log(`[WorkflowRegistry] Registered ${workflow.footerButtons.length} footer button(s) from "${workflowName}"`);
    }

    if (workflow.patientsDirectoryButtons && Array.isArray(workflow.patientsDirectoryButtons)) {
      this.patientsDirectoryButtons.push(...workflow.patientsDirectoryButtons);
      log.debug(`Registered ${workflow.patientsDirectoryButtons.length} patients directory button(s) from "${workflowName}"`);
    }

    if (workflow.serverConfigs && Array.isArray(workflow.serverConfigs)) {
      this.serverConfigs.push(...workflow.serverConfigs);
      this.serverConfigsByWorkflow.push({
        name: workflowName,
        components: workflow.serverConfigs
      });
      console.log(`[WorkflowRegistry] Registered ${workflow.serverConfigs.length} server config(s) from "${workflowName}"`);
    }

    if (workflow.notFoundPage) {
      this.notFoundPage = workflow.notFoundPage;
      console.log(`[WorkflowRegistry] Registered custom 404 page from "${workflowName}"`);
    }

    if (workflow.welcomeComponent) {
      this.welcomeComponent = workflow.welcomeComponent;
      console.log(`[WorkflowRegistry] Registered custom welcome component from "${workflowName}"`);
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
   * Get all registered routes
   * @returns {Array} Array of route objects
   */
  getRoutes() {
    return this.routes;
  },

  /**
   * Get all registered sidebar items
   * @returns {Array} Array of sidebar item objects
   */
  getSidebarItems() {
    return this.sidebarItems;
  },

  /**
   * Get all registered footer buttons
   * @returns {Array} Array of footer button objects
   */
  getFooterButtons() {
    return this.footerButtons;
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
   * @returns {React.Element|null} Custom not-found page or null
   */
  getNotFoundPage() {
    return this.notFoundPage;
  },

  /**
   * Get custom welcome component if registered by a workflow
   * @returns {React.Element|null} Custom welcome component or null
   */
  getWelcomeComponent() {
    return this.welcomeComponent;
  },

  /**
   * Get custom no-patient-selected page if registered by a workflow.
   * Rendered by the router for routes declaring `requirePatient: true` when
   * no patient is selected. Falls back to the core NoPatientSelectedPage.
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
    this.registeredWorkflows = [];
    this.onChangeCallbacks = [];
  }
};

export default WorkflowRegistry;
