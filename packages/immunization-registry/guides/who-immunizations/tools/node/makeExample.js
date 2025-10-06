const yaml = require('yaml')
const fs = require('fs')
const Dates = require('date-math')

const file = fs.readFileSync(process.argv[2])
const docs = yaml.parseAllDocuments(file.toString())
const fmt = new Intl.DateTimeFormat('en-US', { year: "numeric", month: "numeric", day: "numeric" } )
const now = new Date(Date.parse(fmt.format(new Date())))
//const now = Dates.day.floor(new Date(Date.parse(fmt.format(new Date()))))
//const now = Dates.day.floor(new Date())

let directory = "."
if ( process.argv[3] ) directory = process.argv[3] 

for(let doc of docs) {
  let options = doc.toJSON()
  
  options.birth = shiftDate(options.birth)
  const topDir = directory + "/" + options.id
  //fs.mkdirSync(topDir, true)

  fs.mkdirSync(topDir+"/Patient", {recursive: true})
  let patient = makePatient( options.id, options.patient, options.birth )
  fs.writeFileSync( topDir + "/Patient/" + options.id +".json", Buffer.from( JSON.stringify(patient,null,2) ))
  if ( options.immunization ) {
    fs.mkdirSync(topDir+"/Immunization", {recursive: true})
    for( let immz in options.immunization ) {
      if ( options.immunization[immz].doses ) {
        let doses = options.immunization[immz].doses
        let newoptions = JSON.parse(JSON.stringify(options.immunization[immz]))
        delete newoptions.doses
        for( let series in doses ) {
          let found = series.match(/([bps0])(\d?)/)
          let paseries, padoses
          if ( found[1] ) paseries = found[1]
          if ( found[2] ) padoses = found[2]
          for( let i in doses[series] ) {
            let index = parseInt(i)+1
            newoptions.dose = paseries + index
            if ( padoses ) newoptions.dose += "/" + padoses
            if ( !newoptions.fhir ) newoptions.fhir = {}
            newoptions.fhir.occurrenceDateTime = doses[series][i]
            let immzr = makeImmunization( immz+paseries+index, options.id, newoptions, options.birth )
            fs.writeFileSync( topDir+"/Immunization/"+immzr.id+".json", Buffer.from( JSON.stringify(immzr,null,2)))
          }
        }
      } else {
        let immzr = makeImmunization( immz, options.id, options.immunization[immz], options.birth )
        fs.writeFileSync( topDir+"/Immunization/"+immzr.id+".json", Buffer.from( JSON.stringify(immzr,null,2)))
      }
    }
  }
  if ( options.condition ) {
    fs.mkdirSync(topDir+"/Condition", {recursive: true})
    for( let cond in options.condition ) {
      let condr = makeCondition( cond, options.id, options.condition[cond], options.birth )
      fs.writeFileSync( topDir+"/Condition/"+condr.id+".json", Buffer.from( JSON.stringify(condr,null,2)))
    }
  }
  if ( options.location ) {
    fs.mkdirSync(topDir+"/Location", {recursive: true})
    for( let loc in options.location ) {
      let locr = makeLocation( loc, options.id, options.location[loc] )
      fs.writeFileSync( topDir+"/Location/"+locr.id+".json", Buffer.from( JSON.stringify(locr,null,2)))
    }
  }
  if ( options.contraindication ) {
    if (!options.observation) options.observation = {}
    for ( let ci in options.contraindication ) {
      let ciopts = options.contraindication[ci]
      options.observation["ci"+ci] = {
        code: {
          code: 'DE161',
          system: 'http://smart.who.int/immunizations/CodeSystem/IMMZ.D',
          display: 'Potential contraindications'
        },
        fhir: {
          effectiveDateTime: ciopts.effectiveDateTime || '-1d',
          valueCodeableConcept: {
            coding: [
              {
                code: ciopts.code,
                system: ciopts.system || 'http://smart.who.int/immunizations/CodeSystem/IMMZ.D',
                display: ciopts.display
              }
            ]
          }
        }
      }
    }
  }
  if ( options.observation ) {
    fs.mkdirSync(topDir+"/Observation", {recursive: true})
    for( let obs in options.observation ) {
      let obsr = makeObservation( obs, options.id, options.observation[obs], options.birth )
      fs.writeFileSync( topDir+"/Observation/"+obsr.id+".json", Buffer.from( JSON.stringify(obsr,null,2)))
    }
  }
  if ( options.medicationrequest ) {
    fs.mkdirSync(topDir+"/MedicationRequest", {recursive: true})
    for( let mr in options.medicationrequest ) {
      let resource = makeMedicationRequest( mr, options.id, options.medicationrequest[mr], options.birth )
      fs.writeFileSync( topDir+"/MedicationRequest/"+resource.id+".json", Buffer.from( JSON.stringify(resource,null,2)))
    }
  }

  if ( options.adverseevent ) {
    fs.mkdirSync(topDir+"/AdverseEvent", {recursive: true})
    for( let ae in options.adverseevent ) {
      let resource = makeAdverseEvent( ae, options.id, options.adverseevent[ae], options.birth )
      fs.writeFileSync( topDir+"/AdverseEvent/"+resource.id+".json", Buffer.from( JSON.stringify(resource,null,2)))
    }
  }  

}

function shiftDate( shift, birth ) {

  if ( shift.match(/\d{4,4}-\d{2,2}-\d{2,2}/) ) return shift

  let shifted
  let start = now
  let match = shift.match( /([bn]?)\+?(-?\d+)([wdmyh])/)
  if ( match[1] == 'b' ) start = new Date(birth)
  switch( match[3] ) {
    case 'd':
      shifted = Dates.day.shift(start, parseInt(match[2]))
      break
    case 'w':
      shifted = Dates.week.shift(start, parseInt(match[2]))
      break
    case 'm':
      shifted = Dates.month.shift(start, parseInt(match[2]))
      break
    case 'y':
      shifted = Dates.year.shift(start, parseInt(match[2]))
      break
    case 'h':
      shifted = Dates.hour.shift(start, parseInt(match[2]))
      break
  }
  return shifted.toISOString().replace(/T.+/, '')
}

function copyFHIR( resource, options, birth ) {
  if ( options.fhir ) {
    let elements = options.fhir
    for( let element in elements ) {
      if ( element.endsWith('Date') || element.endsWith('DateTime') || element == 'authoredOn' || element == 'date' ) {
        elements[element] = shiftDate( elements[element], birth )
      }
      resource[element] = elements[element]
    }
  }
}

function makePatient ( id, options, birth ) {

  let patient = {
    "resourceType": "Patient",
    "id": "",
    "name": [
      {
        "text": "",
        "use": "official"
      }
    ]
  }
  patient.id = id
  if ( options.name ) {
    patient.name[0].text = options.name 
  } else {
    patient.name[0].text = id
  }
  if ( birth ) {
    patient.birthDate = birth
  }
  copyFHIR( patient, options, birth )

  return patient
}

function makeLocation( loc, patient, options ) {
  let location = {
    "resourceType": "Location",
    "id": "",
    "name": "",
    "status": "active",
    "address": {
      "state": ""
    }
  }
  location.id = loc+"-"+patient
  location.name = options.name
  location.address.state = options.state

  copyFHIR( location, options )

  return location
}

function makeAdverseEvent( ae, patient, options, birth ) {
  let aefi = {
    "resourceType": "AdverseEvent",
    "id": "",
    "actuality": "actual",
    "event": {},
    "subject": {
      "reference": "Patient/"
    },
    "seriousness": {},
    "outcome": {},
    "suspectEntity": [ {
      "instance": {
        "reference": "Immunization/"
      }
    } ],
    "location": {}
  }
  aefi.id = ae + "-" + patient
  aefi.subject.reference = "Patient/"+patient
  if ( options.location ) {
    aefi.location.reference = "Location/"+options.location+"-"+patient
  }
  aefi.suspectEntity[0].instance.reference = "Immunization/"+options.immunization+"-"+patient

  copyFHIR( aefi, options, birth )

  return aefi
}

function makeImmunization( immz, patient, options, birth ) {
  let immunization = {
    "resourceType": "Immunization",
    "id": "",
    "status": "completed",
    "vaccineCode": {
      "coding": []
    },
    "expirationDate": "2026-12-31",
    "lotNumber": "123",
    "patient": {
      "reference": "Patient/"
    },
    "location": {
      "display": "Vaccination Site"
    },
    "occurrenceDateTime": "2023-12-03"
  }
  
  immunization.id = immz+"-"+patient
  immunization.patient.reference = "Patient/"+patient
  immunization.vaccineCode.coding[0] = options.vaccine
  immunization.expirationDate - shiftDate( "1y", birth )
  if ( options.location ) {
    immunization.location.reference = "Location/"+options.location+"-"+patient
  }
  if ( options.dose ) {
    let found = options.dose.match(/([pbs0]?)\.?(\d+)\/?(\d*)/)
    let pa = {}
    pa.doseNumberString = found[2]
    if ( found[3] ) {
      pa.seriesDosesString = found[3]
    }
    switch( found[1] ) {
      case 'p':
        pa.series = 'Primary series'
        break
      case 'b':
        pa.series = 'Booster dose'
        break
      case 's':
        pa.series = 'Supplementary dose'
        break
      case '0':
        pa.series = 'Dose 0'
        break
      default:
        pa.series = 'Primary series'
    }
    immunization.protocolApplied = [ pa ]
  }
  copyFHIR( immunization, options, birth )

  return immunization
}

function makeCondition( cond, patient, options, birth ) {
  let condition = {
    "resourceType": "Condition",
    "id": "",
    "clinicalStatus": {
      "coding": [
        {
          "code": "active"
        }
      ]
    },
    "code": {
      "coding": []
    },
    "subject": {
      "reference": "Patient/"
    },
    "recordedDate": "2023-11-03"
  }

  condition.id = cond+"-"+patient
  condition.subject.reference = "Patient/"+patient
  condition.code.coding[0] = options.code
  copyFHIR( condition, options, birth )

  return condition
}

function makeObservation( obs, patient, options, birth ) {
  let observation = {
    "resourceType": "Observation",
    "id": "",
    "status": "final",
    "code": {
      "coding": []
    },
    "subject": {
      "reference": "Patient/"
    },
    "effectiveDateTime": "2023-11-03"
  }

  observation.id = obs+"-"+patient
  observation.subject.reference = "Patient/"+patient
  if ( Array.isArray( options.code ) ) {
    for( let code of options.code ) {
      observation.code.coding.push( code )
    }
  } else {
    observation.code.coding[0] = options.code
  }
  copyFHIR( observation, options, birth )

  return observation
}

function makeMedicationRequest( mreq, patient, options, birth ) {
  let medreq = {
    "resourceType": "MedicationRequest",
    "id": "",
    "status": "draft",
    "intent": "proposal",
    "medicationCodeableConcept": {
      "coding": []
    },
    "subject": {
      "reference": "Patient/"
    }
  }

  medreq.id = mreq+"-"+patient
  medreq.subject.reference = "Patient/"+patient
  medreq.medicationCodeableConcept.coding[0] =  options.medication 
  copyFHIR( medreq, options, birth )

  return medreq

}
