// imports/lib/WorkflowNavigation.test.mjs
// node --test imports/lib/WorkflowNavigation.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import WorkflowNavigation from './WorkflowNavigation.js';

const { sanitizeRouteSlug, paramPathFromSearch, resolveWorkflowExit, forwardHome } = WorkflowNavigation;

// ---------------------------------------------------------------- sanitize

test('sanitizeRouteSlug accepts a bare slug', function() {
  assert.equal(sanitizeRouteSlug('pacio-dashboard'), 'pacio-dashboard');
});

test('sanitizeRouteSlug strips leading slashes and whitespace', function() {
  assert.equal(sanitizeRouteSlug('/pacio-dashboard'), 'pacio-dashboard');
  assert.equal(sanitizeRouteSlug('  radiology/reading  '), 'radiology/reading');
});

test('sanitizeRouteSlug rejects unsafe and malformed values', function() {
  assert.equal(sanitizeRouteSlug(''), null);
  assert.equal(sanitizeRouteSlug('   '), null);
  assert.equal(sanitizeRouteSlug(null), null);
  assert.equal(sanitizeRouteSlug(undefined), null);
  assert.equal(sanitizeRouteSlug('https://evil.com'), null);
  assert.equal(sanitizeRouteSlug('//evil.com'), null);
  assert.equal(sanitizeRouteSlug('a\\b'), null);
  assert.equal(sanitizeRouteSlug('dicom-studies?tab=studies'), null);
  assert.equal(sanitizeRouteSlug('x#frag'), null);
  assert.equal(sanitizeRouteSlug('///'), null);
});

// ------------------------------------------------------ paramPathFromSearch

test('paramPathFromSearch reads from query string with or without ?', function() {
  assert.equal(paramPathFromSearch('?home=pacio-dashboard', 'home'), '/pacio-dashboard');
  assert.equal(paramPathFromSearch('home=pacio-dashboard', 'home'), '/pacio-dashboard');
});

test('paramPathFromSearch reads from URLSearchParams', function() {
  const params = new URLSearchParams('home=pacio-dashboard&next=radiology/reading');
  assert.equal(paramPathFromSearch(params, 'home'), '/pacio-dashboard');
  assert.equal(paramPathFromSearch(params, 'next'), '/radiology/reading');
});

test('paramPathFromSearch returns null for missing, empty, or unsafe values', function() {
  assert.equal(paramPathFromSearch('?other=x', 'home'), null);
  assert.equal(paramPathFromSearch(null, 'home'), null);
  assert.equal(paramPathFromSearch(undefined, 'home'), null);
  assert.equal(paramPathFromSearch('?home=//evil.com', 'home'), null);
});

test('paramPathFromSearch decodes percent-encoded slugs', function() {
  assert.equal(paramPathFromSearch('?home=radiology%2Freading', 'home'), '/radiology/reading');
});

// -------------------------------------------------------- resolveWorkflowExit

test('resolveWorkflowExit: next wins over home, settings, and fallback', function() {
  const search = '?next=radiology/reading&home=pacio-dashboard';
  assert.equal(resolveWorkflowExit(search, '/chronicle', '/dicom/studies'), '/radiology/reading');
});

test('resolveWorkflowExit: home wins over settings and fallback', function() {
  const search = '?home=pacio-dashboard&previous=/radiology/reading';
  assert.equal(resolveWorkflowExit(search, '/chronicle', '/dicom/studies'), '/pacio-dashboard');
});

test('resolveWorkflowExit: settings route used when no params', function() {
  assert.equal(resolveWorkflowExit('', '/pacio-dashboard', '/dicom/studies'), '/pacio-dashboard');
});

test('resolveWorkflowExit: settings "/" and empty treated as unset', function() {
  assert.equal(resolveWorkflowExit('', '/', '/dicom/studies'), '/dicom/studies');
  assert.equal(resolveWorkflowExit('', '', '/dicom/studies'), '/dicom/studies');
  assert.equal(resolveWorkflowExit('', undefined, '/dicom/studies'), '/dicom/studies');
});

test('resolveWorkflowExit: invalid values fall through per-tier', function() {
  const search = '?next=https://evil.com&home=//evil.com';
  assert.equal(resolveWorkflowExit(search, '/pacio-dashboard', '/dicom/studies'), '/pacio-dashboard');
  assert.equal(resolveWorkflowExit(search, '/', '/dicom/studies'), '/dicom/studies');
});

test('resolveWorkflowExit: invalid next falls to valid home', function() {
  const search = '?next=x?tab=y&home=pacio-dashboard';
  assert.equal(resolveWorkflowExit(search, '/', '/dicom/studies'), '/pacio-dashboard');
});

// ---------------------------------------------------------------- forwardHome

test('forwardHome appends ?home= to a bare path', function() {
  assert.equal(
    forwardHome('/service-requests', '?home=pacio-dashboard'),
    '/service-requests?home=pacio-dashboard'
  );
});

test('forwardHome appends &home= after an existing query', function() {
  assert.equal(
    forwardHome('/dicom/viewer/abc?previous=/radiology/reading', '?home=pacio-dashboard'),
    '/dicom/viewer/abc?previous=/radiology/reading&home=pacio-dashboard'
  );
});

test('forwardHome is a no-op without an inbound home', function() {
  assert.equal(forwardHome('/service-requests', ''), '/service-requests');
  assert.equal(forwardHome('/service-requests', '?next=x'), '/service-requests');
  assert.equal(forwardHome('/service-requests', null), '/service-requests');
});

test('forwardHome is a no-op when the target already carries home=', function() {
  assert.equal(
    forwardHome('/order-catalog?home=pacio-dashboard', '?home=other-place'),
    '/order-catalog?home=pacio-dashboard'
  );
});

test('forwardHome does not forward unsafe inbound values', function() {
  assert.equal(forwardHome('/service-requests', '?home=https://evil.com'), '/service-requests');
});

test('forwardHome percent-encodes the forwarded slug', function() {
  assert.equal(
    forwardHome('/x', '?home=radiology/reading'),
    '/x?home=' + encodeURIComponent('radiology/reading')
  );
});

test('forwardHome round-trips through its own output', function() {
  const hop1 = forwardHome('/service-requests', '?home=pacio-dashboard');
  const hop1Search = hop1.split('?')[1];
  const hop2 = forwardHome('/radiology/tech', '?' + hop1Search);
  assert.equal(hop2, '/radiology/tech?home=pacio-dashboard');
});
