// test/a11y/meteorStub.js — jsdom-only stub for meteor virtual packages
export const Meteor = { isClient: true, settings: { public: {} } };
export const Session = { get: () => undefined, set: () => {} };
export const useTracker = (fn) => fn();
export default {};
