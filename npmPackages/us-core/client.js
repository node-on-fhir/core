// npmPackages/us-core/client.js
//
// Client entry — US Core is a SERVER-SIDE profile provider; it has no client UI.
// The default export carries empty routes/sidebar so the WorkflowRegistry accepts
// it without contributing nav. All real work is server-side (ProfileSet +
// ProfileDecorators), registered into the Package registry via server/index.js.

export default {
  name: 'us-core',
  routes: [],
  sidebarItems: []
};
