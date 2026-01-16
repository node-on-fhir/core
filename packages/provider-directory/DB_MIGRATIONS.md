
#### Copy Endpoints.address to Practitioner.telecom

```js
db.Practitioners.find({}, {}, function(doc){
  let directAddress;
  let endpoint = db.Endpoints.findOne({_id: doc._id)});
  if(endpoint){
    if(endpoint.address){
      db.Practitioners.update({_id: doc._id}, {$addToSet: {'telecom': {
        system: 'email',
        use: 'work',
        value: endpoint.address
      }})  
    }
  }
})
```


```js
db.Practitioners.find({id: '1154324382'}, {}).forEach(function(doc){
    print(db.Endpoints.findOne({id: doc.id}).address)
})
```

```js
db.Practitioners.find({id: '1154324382'}, {}).forEach(function(doc){
    let endpointAddress = db.Endpoints.findOne({id: doc.id}).address;
    if(endpointAddress){
      let newTelco = {
        system: 'email',
        use: 'work',
        value: endpointAddress
      }
      print(newTelco)
    }
})
```

```js
db.Practitioners.find({id: '1154324382'}, {}).forEach(function(doc){
    let endpointAddress = db.Endpoints.findOne({id: doc.id}).address;
    if(endpointAddress){
      db.Practitioners.updateOne({id: doc.id}, {$addToSet: {'telecom': {
        system: 'email',
        use: 'work',
        value: endpointAddress
      }}})
    }
})
```


```js
let count = 0;
db.Endpoints.find({}, {}).forEach(function(doc, index){
    count++;
    print(count)
    if(doc.connectionType){
      if(doc.connectionType.code === "direct-project"){
        db.Practitioners.updateMany({id: doc.id}, {$addToSet: {'telecom': {
          system: 'email',
          use: 'work',
          value: doc.address
        }}})
      }
    }
})
```

WITHOUT INDICES

1min - 570  570
2min - 915  345
3min - 1130 215
4min - 1320 210
5min - 1508 188
6min - 1508 188
7min - 1700 192
8min - 1890 190

2K - 8min 30s 
4K - 17min - 1%

WITH INDICES

1min - 830   830
2min - 1120  290
3min - 1340  220
4min - 1560  220
5min - 1780  220
6min - 2000  

2K - 6min
4K - 12min

20K / hr
2hr = 40K = 10%

430K = 22hrs




// Endpoints
```js
db.Organizations.find().forEach(function(org, index){
  print(index)
  let newOrg = org;
  let endpoint = db.Endpoints.findOne({id: org.id});

  if(endpoint && endpoint.address){
    if(newOrg.telecom){
      newOrg.telecom.push({
        system: "email",
        use: "work",
        value: endpoint.address
      })
      db.Organizations.updateOne({_id: org._id}, {$set: newOrg})
    }
  }
})


db.Practitioners.find().forEach(function(org, index){
  print(index)
  let newPractitioner = org;
  let endpoint = db.Endpoints.findOne({id: org.id});

  if(endpoint && endpoint.address){
    if(newPractitioner.telecom){
      newPractitioner.telecom.push({
        system: "email",
        use: "work",
        value: endpoint.address
      })
      db.Practitioners.updateOne({_id: org._id}, {$set: newPractitioner})
    }
  }
})

db.Endpoints.find({'connectionType.code': "direct-project"}).forEach(function(record){

})
db.Endpoints.updateMany({'connectionType.code': "FHIR"}, {$set: {'connectionType.code': 'hl7-fhir-rest'}})



db.Endpoints.find({'connectionType.code': "hl7-fhir-rest"}).forEach(function(record){
  let matchedOrg = db.Organizations.findOne({id: record.id});
  if(matchedOrg){
    db.Endpoints.updateOne({_id: record._id}, {$set: {managingOrganization: {
      reference: "Organization/" + record.id,
      display: matchedOrg.name
    }}})
  }
})


db.Endpoints.find({'connectionType.code': "hl7-fhir-rest", "address": {$regex: "@"}}).forEach(function(record){
  db.Endpoints.updateOne({_id: record._id}, {$set: {'connectionType.code': 'direct-project', 'connectionType.display': 'Direct Project'}});
})

db.HealthcareServices.deleteMany({resourceType: "Location"})


db.Locations.find({id: {$regex: "BPS"}}).forEach(function(record){
  if(record){
    if(record.address){
      if(record.address.state){
        db.Locations.updateOne({_id: record._id}, {$set: {'address.state': (record.address.state).trim() }})
      }
    }
  }
})

```


