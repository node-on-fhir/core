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
  registeredWorkflows: [],

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

    this.registeredWorkflows.push(workflowName);
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
    this.registeredWorkflows = [];
  }
};

export default WorkflowRegistry;
