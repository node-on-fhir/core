
import { Meteor } from 'meteor/meteor';

let Patients;
Meteor.startup(async function(){
  Patients = await global.Collections.Patients;

  if(Meteor.isClient){
    Meteor.subscribe('Patients');  
  }
  
  if(Meteor.isServer){  
    let defaultQuery = {};
    let defaultOptions = {limit: 5000}
  
    Meteor.publish('Patients', function(){
      return Patients.find(defaultQuery, defaultOptions);
    });    
  }
  
  Patients.allow({
    insert: function(userId, doc){
      return true;
    }
  });  
})



