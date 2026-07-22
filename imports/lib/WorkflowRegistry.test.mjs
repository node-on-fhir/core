// imports/lib/WorkflowRegistry.test.mjs
// node --test imports/lib/WorkflowRegistry.test.mjs
//
// Fast, Meteor-free unit tests for the component-override API (the
// `components` map + legacy default-export keys). React is not imported:
// "elements" are fabricated with the react.element $$typeof tag, which is
// exactly what the registry's isReactElement() inspects.

import test from 'node:test';
import assert from 'node:assert/strict';
import WorkflowRegistry from './WorkflowRegistry.js';
import { warnOnce, resetWarnOnce } from './warnOnce.js';

function fakeElement(type = 'div') {
  return { $$typeof: Symbol.for('react.element'), type, props: {}, key: null };
}

function BrandAboutPage() { return null; }
function BrandNotFoundPage() { return null; }

function withSilencedConsole(t) {
  const warns = [];
  const logs = [];
  t.mock.method(console, 'warn', (...args) => { warns.push(args.join(' ')); });
  t.mock.method(console, 'log', (...args) => { logs.push(args.join(' ')); });
  return { warns, logs };
}

test.beforeEach(function() {
  WorkflowRegistry.clear();
  resetWarnOnce();
});

// ---------------------------------------------------------------- warnOnce

test('warnOnce fires a given key exactly once, resetWarnOnce re-arms it', function(t) {
  const { warns } = withSilencedConsole(t);
  warnOnce('k1', 'message one');
  warnOnce('k1', 'message one');
  warnOnce('k2', 'message two');
  assert.deepEqual(warns, ['message one', 'message two']);
  resetWarnOnce();
  warnOnce('k1', 'message one');
  assert.equal(warns.length, 3);
});

// ------------------------------------------------------- components map

test('registerWorkflow stores components-map entries; getComponent returns the reference', function(t) {
  withSilencedConsole(t);
  WorkflowRegistry.registerWorkflow({
    name: 'brand-a',
    components: { AboutPage: BrandAboutPage }
  });
  assert.equal(WorkflowRegistry.getComponent('AboutPage'), BrandAboutPage);
  assert.equal(WorkflowRegistry.getComponent('PrivacyPage'), null);
});

test('JSX-element values are normalized ONCE into a stable wrapper component', function(t) {
  withSilencedConsole(t);
  const element = fakeElement('BrandFooter');
  WorkflowRegistry.registerWorkflow({ name: 'brand-a', components: { Footer: element } });
  const first = WorkflowRegistry.getComponent('Footer');
  const second = WorkflowRegistry.getComponent('Footer');
  assert.equal(typeof first, 'function');
  assert.equal(first, second, 'wrapper reference must be stable across gets');
  assert.equal(first(), element, 'wrapper renders the registered element');
});

test('duplicate key: higher zIndex wins and a warning names both packages', function(t) {
  const { warns } = withSilencedConsole(t);
  WorkflowRegistry.registerWorkflow({ name: 'brand-low', components: { AboutPage: BrandAboutPage } }, { zIndex: 1 });
  function BrandBAbout() { return null; }
  WorkflowRegistry.registerWorkflow({ name: 'brand-high', components: { AboutPage: BrandBAbout } }, { zIndex: 10 });
  assert.equal(WorkflowRegistry.getComponent('AboutPage'), BrandBAbout);
  const conflict = warns.find(w => w.includes('registered by both'));
  assert.ok(conflict, 'conflict warning fired');
  assert.match(conflict, /brand-low/);
  assert.match(conflict, /brand-high/);
  assert.match(conflict, /"brand-high" wins/);
});

test('duplicate key: on a zIndex tie the EARLIER registration wins', function(t) {
  const { warns } = withSilencedConsole(t);
  WorkflowRegistry.registerWorkflow({ name: 'brand-first', components: { AboutPage: BrandAboutPage } }, { zIndex: 5 });
  function LaterAbout() { return null; }
  WorkflowRegistry.registerWorkflow({ name: 'brand-second', components: { AboutPage: LaterAbout } }, { zIndex: 5 });
  assert.equal(WorkflowRegistry.getComponent('AboutPage'), BrandAboutPage);
  assert.match(warns.find(w => w.includes('registered by both')), /"brand-first" wins/);
});

test('duplicate key: lower zIndex later does not displace the winner', function(t) {
  withSilencedConsole(t);
  WorkflowRegistry.registerWorkflow({ name: 'brand-high', components: { AboutPage: BrandAboutPage } }, { zIndex: 10 });
  function LowAbout() { return null; }
  WorkflowRegistry.registerWorkflow({ name: 'brand-low', components: { AboutPage: LowAbout } }, { zIndex: 1 });
  assert.equal(WorkflowRegistry.getComponent('AboutPage'), BrandAboutPage);
});

test('unknown component key warns (typo net) but is still stored for forward-compat', function(t) {
  const { warns } = withSilencedConsole(t);
  function Mystery() { return null; }
  WorkflowRegistry.registerWorkflow({ name: 'brand-a', components: { AboutPagee: Mystery } });
  assert.ok(warns.some(w => w.includes('unknown component key "AboutPagee"')));
  assert.equal(WorkflowRegistry.getComponent('AboutPagee'), Mystery);
});

test('non-component, non-element values are rejected with a warning', function(t) {
  const { warns } = withSilencedConsole(t);
  WorkflowRegistry.registerWorkflow({ name: 'brand-a', components: { AboutPage: 'not-a-component' } });
  assert.equal(WorkflowRegistry.getComponent('AboutPage'), null);
  assert.ok(warns.some(w => w.includes('neither a component nor a JSX element')));
});

// ------------------------------------------------------------ legacy keys

test('legacy notFoundPage maps into components.NotFoundPage AND the legacy getter, with deprecation', function(t) {
  const { warns } = withSilencedConsole(t);
  const element = fakeElement('Custom404');
  WorkflowRegistry.registerWorkflow({ name: 'legacy-pkg', notFoundPage: element });
  assert.equal(WorkflowRegistry.getNotFoundPage(), element, 'legacy getter returns the raw value');
  const wrapped = WorkflowRegistry.getComponent('NotFoundPage');
  assert.equal(typeof wrapped, 'function');
  assert.equal(wrapped(), element);
  assert.ok(warns.some(w => w.includes('DEPRECATED') && w.includes('notFoundPage')));
});

test('legacy welcomeComponent is EXCLUDED from getComponent(WelcomePage) — it is a dialog slot', function(t) {
  withSilencedConsole(t);
  const dialogElement = fakeElement('LunarWelcome');
  WorkflowRegistry.registerWorkflow({ name: 'orbital-like', welcomeComponent: dialogElement });
  assert.equal(WorkflowRegistry.getWelcomeComponent(), dialogElement, 'WelcomeDialog seam intact');
  assert.equal(WorkflowRegistry.getComponent('WelcomePage'), null, 'legacy dialog must NOT render at "/"');
});

test('canonical components.WelcomePage IS returned by getComponent(WelcomePage)', function(t) {
  withSilencedConsole(t);
  function BrandWelcome() { return null; }
  WorkflowRegistry.registerWorkflow({ name: 'brand-a', components: { WelcomePage: BrandWelcome } });
  assert.equal(WorkflowRegistry.getComponent('WelcomePage'), BrandWelcome);
});

test('legacy noPatientSelectedPage maps to NoSelectedPatientPage + legacy getter', function(t) {
  withSilencedConsole(t);
  const element = fakeElement('CustomNoPatient');
  WorkflowRegistry.registerWorkflow({ name: 'legacy-pkg', noPatientSelectedPage: element });
  assert.equal(WorkflowRegistry.getNoPatientSelectedPage(), element);
  assert.equal(typeof WorkflowRegistry.getComponent('NoSelectedPatientPage'), 'function');
});

// ------------------------------------------------------------------ clear

test('clear() resets the components map and registered workflows', function(t) {
  withSilencedConsole(t);
  WorkflowRegistry.registerWorkflow({ name: 'brand-a', components: { AboutPage: BrandAboutPage } });
  WorkflowRegistry.clear();
  assert.equal(WorkflowRegistry.getComponent('AboutPage'), null);
  assert.deepEqual(WorkflowRegistry.getRegisteredWorkflows(), []);
  // Same name can register again post-clear
  WorkflowRegistry.registerWorkflow({ name: 'brand-a', components: { AboutPage: BrandAboutPage } });
  assert.equal(WorkflowRegistry.getComponent('AboutPage'), BrandAboutPage);
});

// -------------------------------------------------- existing behavior net

test('routes/sidebar/footer registration is unaffected by the components map', function(t) {
  withSilencedConsole(t);
  WorkflowRegistry.registerWorkflow({
    name: 'brand-a',
    routes: [{ name: 'X', path: '/x' }],
    sidebarItems: [{ primaryText: 'X', to: '/x' }],
    components: { AboutPage: BrandAboutPage }
  }, { zIndex: 3 });
  assert.equal(WorkflowRegistry.getRoutes().length, 1);
  assert.equal(WorkflowRegistry.getRoutes()[0]._zIndex, 3);
  assert.equal(WorkflowRegistry.getSidebarItems().length, 1);
});

test('duplicate workflow NAME still warns and skips the whole registration', function(t) {
  const { warns } = withSilencedConsole(t);
  WorkflowRegistry.registerWorkflow({ name: 'brand-a', components: { AboutPage: BrandAboutPage } });
  WorkflowRegistry.registerWorkflow({ name: 'brand-a', components: { AboutPage: BrandNotFoundPage } });
  assert.equal(WorkflowRegistry.getComponent('AboutPage'), BrandAboutPage);
  assert.ok(warns.some(w => w.includes('already registered')));
});
