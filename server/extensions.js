// server/extensions.js
// Installs the core extension helpers (ported from clinical:extended-api)
// before any other server code evaluates -- this import must stay first
// in server/main.js.
import { Random } from 'meteor/random';
import { Mongo } from 'meteor/mongo';
import StringExtensionsModule from '/imports/lib/extensions/StringExtensions.js';
import RandomExtensionsModule from '/imports/lib/extensions/RandomExtensions.js';
import CollectionExtensionsModule from '/imports/lib/extensions/CollectionExtensions.js';

StringExtensionsModule.installStringExtensions();
RandomExtensionsModule.installRandomExtensions(Random);
CollectionExtensionsModule.installCollectionExtensions(Mongo);
