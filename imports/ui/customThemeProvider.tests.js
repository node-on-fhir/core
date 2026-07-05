// /imports/ui/customThemeProvider.tests.js
/* eslint-env mocha */

import { expect } from 'chai';
import { Meteor } from 'meteor/meteor';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { CustomThemeProvider, useTheme } from './CustomThemeProvider.jsx';

// Client-side tests wrap browser context; server-side tests verify the
// export surface (no DOM APIs touched, so both sides can import the module).
describe('CustomThemeProvider', function () {
  it('exports CustomThemeProvider as a React component (function)', function () {
    expect(CustomThemeProvider).to.be.a('function');
  });

  it('exports useTheme as a function', function () {
    expect(useTheme).to.be.a('function');
  });

  it('exposes useTheme on the Meteor object for package consumers', function () {
    expect(Meteor.useTheme).to.be.a('function');
    expect(Meteor.useTheme).to.equal(useTheme);
  });
});

// Behavioral context-shape test — requires a real DOM (createRoot).
// Guarded by Meteor.isClient so the server-side test run (which has no DOM)
// skips the entire describe block rather than erroring on document/createRoot.
if (Meteor.isClient) {
  describe('CustomThemeProvider context shape', function () {
    it('provides {theme, setTheme, toggleTheme, refreshTheme} with a valid theme value', function (done) {
      let captured = null;

      // React 18.3 requires IS_REACT_ACT_ENVIRONMENT flag when using React.act()
      const priorActEnv = globalThis.IS_REACT_ACT_ENVIRONMENT;
      globalThis.IS_REACT_ACT_ENVIRONMENT = true;

      // Probe component: grabs the context value on every render
      function Probe() {
        captured = useTheme();
        return null;
      }

      const host = document.createElement('div');
      document.body.appendChild(host);
      const root = createRoot(host);

      function finish(err) {
        try { root.unmount(); } catch (_) {}
        try { document.body.removeChild(host); } catch (_) {}
        globalThis.IS_REACT_ACT_ENVIRONMENT = priorActEnv;
        done(err);
      }

      function assertAndFinish() {
        try {
          expect(captured).to.be.an('object').and.not.equal(null);
          // Exactly four keys — no extras, no missing
          expect(Object.keys(captured).sort()).to.deep.equal(
            ['refreshTheme', 'setTheme', 'theme', 'toggleTheme']
          );
          // theme must be a valid mode string
          expect(captured.theme).to.be.oneOf(['light', 'dark']);
          finish();
        } catch (err) {
          finish(err);
        }
      }

      // React 18 act() flushes synchronous state initialization in a single
      // pass, so captured is populated before assertAndFinish() runs.
      // Fall back to a brief setTimeout settle on older React builds.
      if (typeof React.act === 'function') {
        React.act(function () {
          root.render(React.createElement(CustomThemeProvider, null,
            React.createElement(Probe, null)));
        });
        assertAndFinish();
      } else {
        root.render(React.createElement(CustomThemeProvider, null,
          React.createElement(Probe, null)));
        setTimeout(assertAndFinish, 50);
      }
    });
  });
}
