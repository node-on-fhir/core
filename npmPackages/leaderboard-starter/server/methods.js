
import { get, has, set } from 'lodash';

Meteor.startup(function(){
    if(process.env.OPENAI_KEY){
        set(Meteor, 'settings.private.openApiKey', process.env.OPENAI_KEY);
    } else if(process.env.OPENAI_API_KEY){
        set(Meteor, 'settings.private.openApiKey', process.env.OPENAI_API_KEY);
    }
})

// rpc-migration (feat/json-rpc): this file's `Meteor.methods({})` block was
// EMPTY (registered no methods) — removed rather than converted, since there is
// nothing to define. The OPENAI key-loading startup above is untouched.
// SECURITY TODO: should probably add authentication token here if methods are
// added later (define them via Meteor.ServerMethods.define).