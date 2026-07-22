// imports/startup/both/rpcClientSetup.js
// Registers the rpc client callers as Meteor globals (both sides), same
// package-accessibility convention as Meteor.Logger — npmPackages/* and
// extensions/* call Meteor.rpc / Meteor.rpcStream without app-absolute
// imports. Server-side these route through ServerMethods.invoke in-process.

import { Meteor } from 'meteor/meteor';
import { rpc, rpcStream } from '/imports/lib/rpcClient.js';

Meteor.rpc = rpc;
Meteor.rpcStream = rpcStream;
