// npmPackages/implantable-devices/lib/scanCapability.js
//
// Platform guard for the add-a-device barcode scanner. Camera scanning is only
// offered on Cordova builds and phone/tablet-class devices — desktop browsers
// get the Type-it-in path. Deliberately NOT gated on window width
// (LayoutHelpers.determineFormFactor): a narrow desktop window is not a phone,
// and a phone is still a phone in landscape. UA + Cordova is the capability
// signal.

import { Meteor } from 'meteor/meteor';

export function isScanCapableDevice() {
  if (Meteor.isCordova) { return true; }
  if (typeof navigator === 'undefined') { return false; }
  if (/iPad|iPhone|iPod|Android/i.test(navigator.userAgent)) { return true; }
  // iPadOS 13+ reports a desktop Macintosh UA but exposes multi-touch
  return navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent);
}
