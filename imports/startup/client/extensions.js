// imports/startup/client/extensions.js
// Installs the core extension helpers (ported from clinical:extended-api)
// before any other client startup code evaluates -- this import must stay
// first in imports/startup/client/index.js.
import { Session } from 'meteor/session';
import { Random } from 'meteor/random';
import SessionExtensionsModule from '/imports/lib/extensions/SessionExtensions.js';
import StringExtensionsModule from '/imports/lib/extensions/StringExtensions.js';
import RandomExtensionsModule from '/imports/lib/extensions/RandomExtensions.js';

SessionExtensionsModule.installSessionExtensions(Session);
StringExtensionsModule.installStringExtensions();
RandomExtensionsModule.installRandomExtensions(Random);
