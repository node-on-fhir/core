import { Meteor } from 'meteor/meteor';
import { assert } from 'meteor/practicalmeteor:chai';
import { chai } from 'meteor/practicalmeteor:chai';
import { expect } from 'meteor/practicalmeteor:chai';

describe('symptomatic:continuity-of-care', function () {
  beforeEach(function () {
    //console.log('beforeEach');
  });
  afterEach(function () {
    //console.log('afterEach');
  });
  it('exists globally', function () {
    expect(MedicalRecordImporter).to.exist;
  });
});