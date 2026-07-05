// /imports/ui/customThemeProvider.tests.js
/* eslint-env mocha */

import { expect } from 'chai';
import { Meteor } from 'meteor/meteor';
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
