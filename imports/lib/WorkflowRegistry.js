// imports/lib/WorkflowRegistry.js

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
  serverConfigs: [],
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

    if (workflow.serverConfigs && Array.isArray(workflow.serverConfigs)) {
      this.serverConfigs.push(...workflow.serverConfigs);
      console.log(`[WorkflowRegistry] Registered ${workflow.serverConfigs.length} server config(s) from "${workflowName}"`);
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
   * Get all registered server config components
   * @returns {Array} Array of React elements for server configuration page
   */
  getServerConfigs() {
    return this.serverConfigs;
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
    this.serverConfigs = [];
    this.registeredWorkflows = [];
    this.onChangeCallbacks = [];
  }
};

export default WorkflowRegistry;
