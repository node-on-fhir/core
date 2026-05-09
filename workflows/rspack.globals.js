// workflows/rspack.globals.js
//
// Shim module for Rspack ProvidePlugin on the server bundle.
// ProvidePlugin replaces bare `window` and `self` references with
// require('global'), so we need a resolvable module that returns
// the Node.js global object.
module.exports = typeof globalThis !== 'undefined' ? globalThis : global;
