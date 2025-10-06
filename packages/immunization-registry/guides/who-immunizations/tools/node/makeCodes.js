const csv = require('@fast-csv/parse')
const fs = require('fs')

const csvFile = process.argv[2]

const camelCase = (str) => {
  return str.toLowerCase().replace(/[-_\W](.)/g, (match, char) => char.toUpperCase())
}
const runtime = new Date().toISOString()

let codesystems = {}
let conceptmaps = {}
let valuesets = {}
let containeds = {}
let models = {}
let quests = {}
let currentVS = null
let relationships = {
  'Related to': [ 'relatedto', 'relatedto' ],
  '': [ 'relatedto', 'relatedto' ],
  'Equivalent': [ 'equivalent', 'equivalent' ],
  'Source is narrower than target': [ 'wider', 'narrower' ],
  'Source is broader than target': [ 'narrower', 'wider' ]
}

let title = csvFile.substring(csvFile.lastIndexOf('/')+1).replace(/\.csv$/,'')

let createModel = ( modelName, title ) => {
  let model = []
  model.push("Logical:      " + modelName)
  model.push("Title:        \"" + title + "\"")
  model.push("Description:  \"Data elements for the " + title + " Data Dictionary Activity.\"")
  model.push('')
  model.push("* ^name = \"" + title.replace(/\W/g, '_') + "\"")
  model.push("* ^status = #active")
  model.push('* ^meta.profile[+] = "http://hl7.org/fhir/uv/crmi/StructureDefinition/crmi-shareablestructuredefinition"')
  model.push('* ^meta.profile[+] = "http://hl7.org/fhir/uv/crmi/StructureDefinition/crmi-publishablestructuredefinition"')
  model.push('* ^version = "0.2.0"')
  model.push('* ^experimental = false')
  model.push('* ^publisher = "WHO"')
  model.push('* ^extension[+].url = "http://hl7.org/fhir/StructureDefinition/cqf-knowledgeCapability"')
  model.push('* ^extension[=].valueCode = #shareable')
  model.push('* ^extension[+].url = "http://hl7.org/fhir/StructureDefinition/artifact-versionAlgorithm"')
  model.push('* ^extension[=].valueCoding = http://hl7.org/fhir/version-algorithm#semver')
  model.push('* ^extension[+].url = "http://hl7.org/fhir/StructureDefinition/artifact-versionPolicy"')
  model.push('* ^extension[=].valueCodeableConcept = http://terminology.hl7.org/CodeSystem/artifact-version-policy-codes#metadata')
  model.push('* ^date = "2025-01-13"')
  model.push('')
  return model
}


let createQuest = ( modelName, title ) => {
  let quest = []
  quest.push("Instance:     Q" + modelName)
  quest.push("InstanceOf:   sdc-questionnaire-extr-smap")
  quest.push("Title:        \"" + title + "\"")
  quest.push("Description:  \"Questionnaire for " + title + "\"")
  quest.push("Usage: #definition")
  quest.push('')
  quest.push("* version = \"2025\"")
  quest.push("* status = #draft")
  quest.push("* subjectType = #Patient")
  quest.push("* language = #en")
  quest.push("CONTAINED")
  quest.push("* extension[+].url = \"http://hl7.org/fhir/uv/sdc/StructureDefinition/sdc-questionnaire-targetStructureMap\"")
  quest.push("* extension[=].valueCanonical = \"http://smart.who.int/immunizations/StructureMap/\"")
  quest.push('')
  return quest
}

let getType = ( type, isQuestionnaire ) => {
  switch ( type.trim().toLowerCase() ) {
    case "coding" : 
      return (isQuestionnaire ? "choice" : "Coding")
      break
    case "date" :
      return "date"
      break
    case "datetime":
      return "dateTime"
      break
    case "boolean" :
      return "boolean"
      break
    case "quantity":
      return "decimal"
      break
    default:
      return "string"
      break
  }
}

fs.createReadStream(csvFile)
  .pipe(csv.parse( {headers:true}) )
  .on('data', row => {
    console.log(row)

    let model = []
    let quest = []
    let contained = []


    
    let deid = row['Data element ID'].replace(/((\S+)\.(\S+)\.DE)\.(\d+)/, '$1$4')
    //console.log(deid)
    let label = row['Data element label']
    let regex = /((\S+)\.(\S+))\.(DE\d+)/
    let info = deid.match(regex)
    let codesystem = info[1]
    let csName = info[2]+"_"+info[3]
    let dataelement = info[4]
    let type = row['Data type']

    fieldName = camelCase(label)

    if ( type != 'Codes' ) {
      model.push("* " + fieldName + " " + (row['Required'] == 'R' ? '1' : '0') + "..1 "
        + getType(type, false) + " \""+label+"\" \""+row['Description and definition'] 
        + "\"")
      if ( type == 'Coding' ) {
        model.push("* " + fieldName + " from " + codesystem + "." + dataelement + " (required)")
        contained.push("* contained[+] = " + codesystem + "." + dataelement )
      }
      model.push("  * ^code[+] = " + codesystem + "#" + dataelement )

      quest.push("* insert Question(" + fieldName + ", " + label
        + ", " + getType(type, true) + ", " 
        + (row['Required'] == 'R' ? 'true' : 'false') + ", false)")
      quest.push("* item[=]")
      if ( type == 'Coding' ) {
        quest.push("  * answerValueSet = Canonical(" + codesystem + "." + dataelement + ")")
      }
      quest.push("  * code[+] = " + codesystem + "#" + dataelement )
    }
    if ( !codesystems[codesystem] ) {
      codesystems[codesystem] = "CodeSystem: "+codesystem+"\nTitle:        \""+codesystem+" CodeSystem for Data Elements\"\nDescription:  \"CodeSystem for "+codesystem
        +" Data Elements\"\n\n* ^experimental = false\n* ^caseSensitive = false\n* ^name = \""+csName+"\"\n* ^status = #active\n\n"
      conceptmaps[codesystem] = {}
      conceptmaps[codesystem].header = "Instance: "+codesystem+".ConceptMap\nInstanceOf: ConceptMap\nDescription:  \"Mapping to and from "+codesystem+" Data Dictionary to other codesystems.\"\nUsage:        #definition\n\n"
      conceptmaps[codesystem].header += "* name = \""+csName+"_ConceptMap\"\n* title = \"ConceptMap to and from "+codesystem+" DataElements\"\n* status = #active\n* experimental = false\n* date = \"2025-01-13\"\n\n"
      conceptmaps[codesystem].toicd11 = "* group[+]\n  * source = Canonical("+codesystem+")\n  * target = $ICD11\n"
      conceptmaps[codesystem].fromicd11 = "* group[+]\n  * source = $ICD11\n  * target = Canonical("+codesystem+")\n"
      conceptmaps[codesystem].toloinc = "* group[+]\n  * source = Canonical("+codesystem+")\n  * target = $LNC\n"
      conceptmaps[codesystem].fromloinc = "* group[+]\n  * source = $LNC\n  * target = Canonical("+codesystem+")\n"
      conceptmaps[codesystem].tosct = "* group[+]\n  * source = Canonical("+codesystem+")\n  * target = $SCT\n"
      conceptmaps[codesystem].fromsct = "* group[+]\n  * source = $SCT\n  * target = Canonical("+codesystem+")\n"
    }
    codesystems[codesystem] += "* #"+dataelement+" \""+label+"\" \""+row['Description and definition']+"\"\n"
    if ( currentVS ) {
      if ( type == 'Codes' ) {
        valuesets[currentVS] += "* insert AddWithExpandCanonical("+codesystem+", #"+dataelement+", [["+label+"]])\n"
      } else {
        currentVS = null
      }
    }

    if ( type == 'Coding' ) {
      currentVS = deid
      if ( valuesets[deid] ) {
        console.error("Codes for "+deid+" already exists!!")
      }
      valuesets[deid] = "ValueSet: "+deid+"\nTitle: \""+deid+" ValueSet for "+label+"\"\nDescription: \"ValueSet for "+label+" for "+deid+"\"\n\n* ^status = #active\n* ^name = \""+csName+"_"+dataelement+"\"\n* ^expansion.timestamp = "+runtime+"\n\n"
    }
    let icd11 = row['ICD-11\ncode'].trim()
    let loinc = row['LOINC version 2.68\ncode'].trim()
    let sct = row['SNOMED GPS code'].trim()

    if ( icd11 && !icd11.startsWith('Not classifiable in ICD-11') ) {
      let relationship = row['ICD-11 relationship']
      //console.log("HERE",icd11,relationship, relationships[relationship])
      conceptmaps[codesystem].toicd11 += "  * insert ElementMap("+dataelement+", "+icd11+", "+relationships[relationship][0]+")\n"
      conceptmaps[codesystem].fromicd11 += "  * insert ElementMap("+icd11+", "+dataelement+", "+relationships[relationship][1]+")\n"
      if ( type !== 'Codes') {
        model.push("  * ^code[+] = $ICD11#" + icd11 + " \""+row['ICD-11\ncomments/considerations'].replace(/Code title:\s+/,'') + "\"")
        quest.push("  * code[+] = $ICD11#" + icd11 + " \""+row['ICD-11\ncomments/considerations'].replace(/Code title:\s+/,'') + "\"")
      }
    }
    if ( loinc && !loinc.startsWith('Not classifiable in LOINC') ) {
      let relationship = row['LOINC version 2.68 relationship']
      if ( relationship != 'Not related to' ) {
        conceptmaps[codesystem].toloinc += "  * insert ElementMap("+dataelement+", "+loinc+", "+relationships[relationship][0]+")\n"
        conceptmaps[codesystem].fromloinc += "  * insert ElementMap("+loinc+", "+dataelement+", "+relationships[relationship][1]+")\n"
      }
      if ( type !== 'Codes') {
        model.push("  * ^code[+] = $LNC#" + loinc + " \""+row['LOINC version 2.68\ncomments/considerations'].replace(/Long common name:\s+/,'') + "\"")
        quest.push("  * code[+] = $LNC#" + loinc + " \""+row['LOINC version 2.68\ncomments/considerations'].replace(/Long common name:\s+/,'') + "\"")
      }
    }
    if ( sct && !sct.startsWith('Not classifiable in SNOMED GPS') ) {
      let relationship = row['SNOMED GPS\nrelationship']
      conceptmaps[codesystem].tosct += "  * insert ElementMap("+dataelement+", "+sct+", "+relationships[relationship][0]+")\n"
      conceptmaps[codesystem].fromsct += "  * insert ElementMap("+sct+", "+dataelement+", "+relationships[relationship][1]+")\n"
      if ( type !== 'Codes') {
        model.push("  * ^code[+] = $SCT#" + sct + " \""+row['SNOMED GPS \ncomments/considerations'].replace(/Code title:\s+/,'') + "\"")
        quest.push("  * code[+] = $SCT#" + sct + " \""+row['SNOMED GPS \ncomments/considerations'].replace(/Code title:\s+/,'') + "\"")
      }
    }

    let actids = row['Activity ID'].split(/\s+OR\s+/m)
    for( let actid of actids ) {
      let details = actid.match(/(IMMZ\.\w\d+[.\d]*)\..*/)
      let modelName = details[1].replace(/\./g, '')
      if ( !models[modelName] ) {
        models[modelName] = createModel(modelName, details[0])
        quests[modelName] = createQuest(modelName, details[0])
        containeds[modelName] = []
      }
      models[modelName].push(...model)
      quests[modelName].push(...quest)
      containeds[modelName].push(...contained)
    }
  })
  .on('end', () => {
    //console.log(model)
    for( let code in models ) {
      let modelFile = fs.createWriteStream("output/models/"+code+".fsh")
      modelFile.write(models[code].join("\n"))
      modelFile.close()
    }

    for( let code in quests ) {
      let questFile = fs.createWriteStream("output/questionnaires/Q"+code+".fsh")
      for ( line of quests[code] ) {
        if ( line === "CONTAINED" ) {
          questFile.write(containeds[code].join("\n")+"\n")
        } else {
          questFile.write(line+"\n")
        }
      }
      //questFile.write(quests[code].join("\n"))
      questFile.close()    
    }

    for( cs in codesystems ) {
      let file = fs.createWriteStream("output/codesystems/"+cs+".fsh")
      file.write(codesystems[cs])
      file.close()
      let cm = fs.createWriteStream("output/conceptmaps/"+cs+".ConceptMap.fsh")
      cm.write(conceptmaps[cs].header)
      cm.write(conceptmaps[cs].toicd11)
      cm.write(conceptmaps[cs].fromicd11)
      cm.write("\n")
      cm.write(conceptmaps[cs].toloinc)
      cm.write(conceptmaps[cs].fromloinc)
      cm.write("\n")
      cm.write(conceptmaps[cs].tosct)
      cm.write(conceptmaps[cs].fromsct)
      cm.write("\n")
      cm.close()
    }

    for( vs in valuesets ) {
      let file = fs.createWriteStream("output/valuesets/"+vs+".fsh")
      file.write(valuesets[vs])
      file.close()
    }

  })

