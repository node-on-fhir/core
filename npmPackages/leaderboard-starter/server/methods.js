
import { get, has, set } from 'lodash';

Meteor.startup(function(){
    if(process.env.OPENAI_KEY){
        set(Meteor, 'settings.private.openApiKey', process.env.OPENAI_KEY);
    } else if(process.env.OPENAI_API_KEY){
        set(Meteor, 'settings.private.openApiKey', process.env.OPENAI_API_KEY);
    }
})

// SECURITY TODO:  should probably add authentication token here
Meteor.methods({
});