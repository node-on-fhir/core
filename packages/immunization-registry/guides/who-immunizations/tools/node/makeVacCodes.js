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
let relationships = {
  'Related to': [ 'relatedto', 'relatedto' ],
  '': [ 'relatedto', 'relatedto' ],
  'Equivalent': [ 'equivalent', 'equivalent' ],
  'Source is narrower than target': [ 'wider', 'narrower' ],
  'Source is broader than target': [ 'narrower', 'wider' ]
}

let title = csvFile.substring(csvFile.lastIndexOf('/')+1).replace(/\.csv$/,'')

let deid, label, info, codesystem, csName, dataelement
let codeused = {}

fs.createReadStream(csvFile)
  .pipe(csv.parse( {headers:true}) )
  .on('data', row => {
    //console.log(row)
    
    if ( row['Data element ID'] ) {

      deid = row['Data element ID'].replace(/((\S+)\.(\S+)\.DE)\.(\d+)/, '$1$4')
      //console.log(deid)
      label = row['Data element label']
      let regex = /((\S+)\.(\S+))\.(DE\d+)/
      info = deid.match(regex)
      codesystem = info[1]
      csName = info[2]+"_"+info[3]
      dataelement = info[4]
    

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
        conceptmaps[codesystem].toatc = "* group[+]\n  * source = Canonical("+codesystem+")\n  * target = $ATC\n"
        conceptmaps[codesystem].fromatc = "* group[+]\n  * source = $ATC\n  * target = Canonical("+codesystem+")\n"
      }
      codesystems[codesystem] += "* #"+dataelement+" \""+label+"\" \""+row['Description and definition']+"\"\n"

      if ( valuesets[deid] ) {
        console.error("Codes for "+deid+" already exists!!")
      }
      valuesets[deid] = "ValueSet: "+deid+"\nTitle: \""+deid+" ValueSet for "+label+"\"\nDescription: \"ValueSet for "+label+" for "+deid+"\"\n\n* ^status = #active\n* ^name = \""+csName+"_"+dataelement+"\"\n* ^expansion.timestamp = "+runtime+"\n\n"
      valuesets[deid] += "* insert AddWithExpandCanonical("+codesystem+", #"+dataelement+", [["+label+"]])\n"
      codeused[deid] = {}

    }
    let icd11 = row['ICD-11\ncode'].trim()
    let loinc = row['LOINC version 2.68\ncode'].trim()
    let sct = row['SNOMED GPS code'].trim()
    let atc = row['WHO ATC code'].trim()

    if ( icd11 && !codeused[deid][icd11] && !icd11.startsWith('Not classifiable in ICD-11') ) {
      let relationship = row['ICD-11 relationship']
      //console.log("HERE",icd11,relationship, relationships[relationship])
      valuesets[deid] += "* insert AddWithExpand($ICD11, #"+icd11+", [["+row['ICD-11\ncomments/considerations'].replace(/Code title:\s*/, "").replace(/([^\n]+)\n.+/s, "$1").trim()+"]])\n"
      codeused[deid][icd11] = true

      conceptmaps[codesystem].toicd11 += "  * insert ElementMap("+dataelement+", "+icd11+", "+relationships[relationship][0]+")\n"
      conceptmaps[codesystem].fromicd11 += "  * insert ElementMap("+icd11+", "+dataelement+", "+relationships[relationship][1]+")\n"
    }
    if ( loinc && !codeused[deid][loinc] &&!loinc.startsWith('Not classifiable in LOINC') ) {
      let relationship = row['LOINC relationship']
      valuesets[deid] += "* insert AddWithExpand($LNC, #"+loinc+", [["+row['LOINC version 2.68\ncomments/considerations'].replace(/Code title:\s*/, "").replace(/([^\n]+)\n.+/s, "$1").trim()+"]])\n"
      codeused[deid][loinc] = true

      if ( relationship != 'Not related to' ) {
        conceptmaps[codesystem].toloinc += "  * insert ElementMap("+dataelement+", "+loinc+", "+relationships[relationship][0]+")\n"
        conceptmaps[codesystem].fromloinc += "  * insert ElementMap("+loinc+", "+dataelement+", "+relationships[relationship][1]+")\n"
      }
    }
    if ( sct && !codeused[deid][sct] && !sct.startsWith('Not classifiable in SNOMED GPS') ) {
      let relationship = row['SNOMED GPS relationship']
      valuesets[deid] += "* insert AddWithExpand($SCT, #"+sct+",  [["+row['SNOMED GPS code\ncomments/considerations'].replace(/Code title:\s*/, "").replace(/([^\n]+)\n.+/s, "$1").trim()+"]])\n"
      codeused[deid][sct] = true

      conceptmaps[codesystem].tosct += "  * insert ElementMap("+dataelement+", "+sct+", "+relationships[relationship][0]+")\n"
      conceptmaps[codesystem].fromsct += "  * insert ElementMap("+sct+", "+dataelement+", "+relationships[relationship][1]+")\n"
    }

    if ( atc && !codeused[deid][atc] && !atc.startsWith('Not classifiable in WHO ATC') ) {
      let relationship = row['WHO ATC relationship']
      valuesets[deid] += "* insert AddWithExpand($ATC, #"+atc+",  [["+row['WHO ATC name'].replace(/Code title:\s*/, "").replace(/([^\n]+)\n.+/s, "$1").trim()+"]])\n"
      codeused[deid][atc] = true

      conceptmaps[codesystem].toatc += "  * insert ElementMap("+dataelement+", "+atc+", "+relationships[relationship][0]+")\n"
      conceptmaps[codesystem].fromatc += "  * insert ElementMap("+atc+", "+dataelement+", "+relationships[relationship][1]+")\n"
    }

  })
  .on('end', () => {
    //console.log(model)

    for( cs in codesystems ) {
      let file = fs.createWriteStream("output/"+cs+".fsh")
      file.write(codesystems[cs])
      file.close()
      let cm = fs.createWriteStream("output/"+cs+".ConceptMap.fsh")
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
      cm.write(conceptmaps[cs].toatc)
      cm.write(conceptmaps[cs].fromatc)
      cm.write("\n")
      cm.close()
    }

    for( vs in valuesets ) {
      let file = fs.createWriteStream("output/"+vs+".fsh")
      file.write(valuesets[vs])
      file.close()
    }

  })

