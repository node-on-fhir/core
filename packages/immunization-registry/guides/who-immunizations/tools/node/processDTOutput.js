const xlsx = require('node-xlsx')
const fs = require('fs')

const getRange = ( nums, offset ) => {
  let match = nums.match(/(\d+)-(\d+)/)
  let start, end
  if ( match ) {
    start = match[1]
    end = match[2]
  } else {
    start = nums
    end = nums
  }
  return [ parseInt(start)-offset, parseInt(end)-offset ]
}

const getInitials = ( str ) => {
  return str.match(/\b(\d+|\w)/g).join('').toLowerCase()
}

const runtime = new Date().toISOString()

var file, sheetname, rowoffset, rows, cols, prefix, dt;

[file, sheetname, rowoffset, rows, cols, prefix, dt] = process.argv.slice(2);
// output and guidance are expected to be +1 and +2 from the last column.  Even if blank, all columns should be listed.
rowoffset = parseInt(rowoffset)

const workbook = xlsx.parse( file )
let sheet = workbook.filter( (tab) => { return tab.name === sheetname } );
let sheetdisplay = sheetname.replace(/\s/,"")
sheet = sheet[0].data

let rs = getRange( rows, rowoffset )
let cs = getRange( cols, 0 )

let top = rs[0]

let table = sheet[top-2][cs[0]]
let dtmod = 0
if ( dt == "single" ) {
  table = sheet[top-5][cs[0]+1]
  dtmod = 1
  dt = ""
} else if ( dt == "CI" ) {
  table = sheet[top-1][cs[0]]
  dtmod = 2
}

const EXTRA = 0

let did = sheet[top-6-EXTRA+dtmod][cs[0]+1]
let rule = sheet[top-5-EXTRA+dtmod][cs[0]+1]
let trigger = sheet[top-4-EXTRA+dtmod][cs[0]+1]

let enclib = fs.createWriteStream("output/libraries/IMMZ"+prefix+sheetdisplay+dt+"Logic.fsh")
enclib.write(`
Instance: IMMZ${prefix}${sheetdisplay}${dt}Logic
InstanceOf: Library
Title: "IMMZ${prefix}${sheetdisplay}${dt}Logic"
Description: "This library defines decision support logic for the ${did} decision table in the Immunization CPG"
Usage: #definition

* insert LogicLibrary( IMMZ${prefix}${sheetdisplay}${dt}Logic )
`)
enclib.close()

let logic = fs.createWriteStream("output/cql/IMMZ"+prefix+sheetdisplay+dt+"Logic.cql")

let draftCI = ""
if ( dt == "CI" ) {
  draftCI = `/*
  @dynamicValue: Draft Medication Request ID for ${sheetname} dose
  */
  define "Draft Medication Request ID for ${sheetname} dose":
    First(Encounter."Draft Medication Request for ${sheetname} dose").id

`
}

logic.write(`
/*
 * Library: IMMZ${prefix}${sheetdisplay}${dt}Logic (${did})
 * Rule: ${rule}
 * Decision Table: ${table}
 * Trigger: ${trigger}
 */
library IMMZ${prefix}${sheetdisplay}${dt}Logic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZ${prefix}${sheetdisplay}EncounterElements called Encounter

parameter Today Date default Today()

context Patient

${draftCI}
`)

let pdef = fs.createWriteStream("output/plandefinitions/IMMZ"+prefix+sheetdisplay+dt+".fsh")

pdef.write(`
Instance: IMMZ${prefix}${sheetdisplay}${dt}
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "${did}"
Description: """
${did}
${table}
"""
Usage: #definition

* insert PlanDefMain( IMMZ${prefix}${sheetdisplay}${dt}, 0.1.0 )

* insert PlanDefCommunicationRequestAction([[Check for Guidance for the patient regarding ${did}.]], [["""
    Show Guidance for the patient regarding ${did}.
  """]], Has Guidance, Guidance)
`)

let feature = fs.createWriteStream("output/tests/IMMZ"+prefix+sheetdisplay+dt+".feature")
feature.write(`
Feature: ${did} Decision Table ${table}

  Background: Set the date to use for all tests
    Given call read('../IMMZ${prefix}.feature@defaults')
    And applyParams.parameter[1].resource.parameter[0].valueDate = "202X-XX-XX"
    And resultWithMedication.contained[2].medicationCodeableConcept.coding.code = ""

`)


let prevtitles = []
let prevci = []
let outputs = {}
let codeinput = {}
let codeoutput = {}



const readCodes = ( type, didputs, cache ) => {
  let fsh = fs.readFileSync("../../input/fsh/codesystems/"+didputs+"."+type+".fsh").toString().split("\n")
  let notyet = true
  let code = null
  //let codeid = null
  for( let line of fsh ) {
    if ( line.startsWith("* #") ) {
      notyet = false
      let matches = line.match(/^\* #(\S+) "(.+)" "(.*)"$/)
      console.log(line,matches)
      code = matches[1].trim()
      let display = matches[2].trim()
      let definition = matches[3].trim()
      
      // Was used to update previous method.
      //codeid = code+"-"+display.length+"."+definition.length
      cache[code] = {
        code: code,
        display: display,
        definition: definition,
        table: []
      }
      continue
    }
    if ( notyet ) continue

    let matches = line.match(/  \* \^property\[=\].valueString = "(.+)"$/)
    if ( matches ) cache[code].table.push( matches[1] )

  }
}
let didputs = "IMMZ."+prefix.slice(0,2)+"."+prefix.slice(-2)

readCodes("Inputs", didputs, codeinput)
readCodes("Outputs", didputs, codeoutput)

let yaml = fs.createWriteStream("output/tests/examples.yaml")

for ( let r = rs[0]; r <= rs[1]; r++ ) {
  let expression = [];
  let testid = sheetdisplay + (r+rowoffset < 10 ? "0" : "" ) + (r+rowoffset) + "."
  let examples = []
  let scenario = []
  for( let c = cs[0]; c <= cs[1]; c++ ) {
    let content = []
    //if ( sheet[r] && sheet[r][c] && sheet[r][c] != '-' ) {
    if ( sheet[r] && sheet[r][c] && sheet[r][c].trim().length > 3 ) {
      content = sheet[r][c].split( "\n", 2 )
      content[0] = content[0].trim()
      content[1] = content[1].trim()
      prevtitles[c] = content
    }
    if ( !content[0] && !sheet[r][c] ) content = prevtitles[c]
    if ( content[0] ) {
      testid += c
      expression.push( 'Encounter."' + content[0] + '"' )
      scenario.push(content[0])
      examples.push( "#" + c + ". " + content[0] + ( content[1] ? "\n#   " + content[1] : "" ) )
//      let inputid = getInitials(content[0])
//      let codeid = inputid+"-"+content[0].length+"."+content[1].length
      let codeid = content[0]
      if ( !codeinput[codeid] ) {
        codeinput[codeid] = {
          code: codeid,
          display: content[0],
          definition: content[1],
          table: [ did ]
        }
      } else {
        codeinput[codeid].table.push( did )
      }

    }
  }

  let scenariotext = ""
  if ( scenario.length > 2 ) {
    scenario[scenario.length-1] = "and " + scenario[scenario.length-1]
    scenariotext = scenario.join(", ")
  } else if ( scenario.length > 1 ) scenariotext = scenario.join(" and ")
  else scenariotext = scenario.join(" ")

  scenariotext += ": " + sheet[r][cs[1]+1].split("\n")[0]


  feature.write(`
  @patient=${testid}
  Scenario: ${scenariotext}
    Given call read('../../IMMZ.feature@create') { "file": "./data/tests-${testid}-bundle.json" }

    And url urlBase
    And path 'PlanDefinition/IMMZ${prefix}${sheetdisplay}${dt}/$apply'
    And applyParams.parameter[0].valueString = 'Patient/${testid}'
    And request applyParams
    When method post
    Then status 200
    And resultWithMedication.contained[0].subject.reference = 'Patient/${testid}'
    And resultWithMedication.contained[1].payload.contentString = "${sheet[r][cs[1]+2].replace(/\n/, "\\n").replace(/"/, '\"')}"
    And match response contains deep RESULT

    And call read('../../IMMZ.feature@delete') { "file": "./data/del-${testid}-bundle.json" }
  
`)

  examples.push( "### " + sheet[r][cs[1]+1].split("\n").join("\n### ") )

  let exampletext = examples.join("\n")
  yaml.write(`---
${exampletext}
id: "${testid}"
birth: 
patient:
  fhir:
    gender: female
`)
  if ( dt == "CI" ) {
    for( let c = cs[0]; c <= cs[1]; c++ ) {
      if ( !sheet[r][c] ) sheet[r][c] = prevci[c]
      if ( sheet[r][c].length < 3 ) continue
      prevci[c] = sheet[r][c]
      let ci = sheet[r][c].match(/.*"(.+)"$/)
      if ( !ci ) ci = sheet[r][c].match(/.*"(.+)"[^"]*$/)
      let ciid = ci[1].replace(/\W/g, '').toLowerCase()
      yaml.write(`contraindication:
      ${ciid}:
        code: DE
        display: "${ci[1]}"
        effectiveDateTime: -1d
`)
    }
    let mrname = sheetdisplay.toLowerCase()
    yaml.write(`medicationrequest:
  ${mrname}:
    medication:
      code: 
      system: "http://id.who.int/icd/release/11/mms"
      display: ""
    fhir:
      authoredOn: 0d
      status: draft
      intent: proposal
`)
  }

  let content = sheet[r][1+cs[1]].split( "\n", 2 );
  if ( content[0].trim().length > 3 ) {
    if ( !content[1] ) content[1] = ""
    content[0] = content[0].trim()
    content[1] = content[1].trim()
    if ( !outputs[ content[0] ] ) outputs[ content[0] ] = []
    outputs[ content[0] ].push( { content, expression: expression.join("\n    and "), guidance: sheet[r][parseInt(cs[1])+2], 
      testid: testid, testidx: (r+rowoffset) } )
//    let outputid = getInitials(content[0])
//    let codeid = outputid+"-"+content[0].length+"."+content[1].length
    let codeid = content[0]

    if ( !codeoutput[codeid] ) {
      codeoutput[codeid] = {
        code: codeid,
        display: content[0],
        definition: content[1],
        table: [ did ]
      }
    } else {
      codeoutput[codeid].table.push( did )
    }
  }
}
yaml.close()

const displayGuidance = ( title, guidance, comment ) => {
  logic.write( "/*\n@output: " + title + " Guidance" + comment + "\n*/\ndefine \""+title+" Guidance\":\n")
  logic.write( "  " + guidance + "\n\n" )
}

const displayOutput = ( title, pseudo, expression, guidance ) => {
  logic.write( "/*\n@output: " + title + "\n@pseudocode: " + pseudo + "\n*/\ndefine \""+title+"\":\n")
  logic.write( "  " + expression + "\n\n" )
  
  if ( guidance ) {
    displayGuidance( title, "'"+guidance.replace(/'/g, '\\\'')+"'", "\n@guidance: "+guidance )
  }
}

logic.write( "/*\n@dynamicValue: Guidance\n*/\ndefine \"Guidance\":\n  case\n" 
  + Object.keys(outputs).map((title) => "    when \"" + title +"\" then \""+ title +" Guidance\"" ).join("\n") 
  + "\n    else ''\n  end\n\ndefine \"Has Guidance\":\n  \"Guidance\" is not null and \"Guidance\" != ''\n\n" )

let tests = []

for( let title in outputs ) {

  let output = outputs[title]
  if ( output.length === 1 ) {
    tests[output[0].testidx] = "    when Patient.id = '"+(output[0].testid)+"' then \""+output[0].content[0]+"\" and \"Guidance\" = '" + output[0].guidance.replace(/'/, '\\\'') + "'"

    displayOutput( output[0].content[0], output[0].content[1], output[0].expression, output[0].guidance )

  } else {
    let guidances = []
    let comment = []
    let titles = []
    for( let idx in output ) {
      let display = parseInt(idx) + 1
      let title = output[idx].content[0] + " Case " + display
      displayOutput( title, output[idx].content[1], output[idx].expression )
      tests[output[idx].testidx] = "    when Patient.id = '"+output[idx].testid+"' then \""+title+"\" and \"Guidance\" = '" + output[idx].guidance.replace(/'/, '\\\'') + "'"
      guidances.push( "    when \""+ title + "\" then '" + output[idx].guidance.replace(/'/, '\\\'') + "'" )
      comment.push( "@guidance: " + output[idx].guidance )
      titles.push( "\"" + title + "\"" )
    }

    displayOutput( output[0].content[0], output[0].content[1], titles.join("\n    or ") )
    displayGuidance( output[0].content[0], "case\n" + guidances.join("\n") + "\n    else ''\n  end", "\n"+comment.join("\n") )
  }
}

logic.write(`
/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
`)
logic.write(tests.filter((test) => test.length > 0).join("\n")+"\n")
logic.write("    else 'No test case set'\n  end\n")

//logic.write( "/*\n@output: " + content[0] + "\n@pseudocode: " + content[1] + "\n*/\ndefine \""+content[0]+"\":")
//logic.write( "  " + expression.join( "\n    and ") + "\n" )

//logic.write( "/*\n@output: " + content[0] + " Guidance\n@guidance: " + content[1] + "\n*/\ndefine \""+content[0]+" Guidance\":")
//logic.write( "  '" + sheet[r][parseInt(cs[1])+2] + "'\n" )

logic.close()


let tablevsid = didputs+"."+sheetdisplay
if ( dt != "" ) tablevsid += "."+dt
let tablevsname = did.replace(/[^A-Za-z0-9_]/g, "_")

let tablevs = fs.createWriteStream("output/valuesets/"+tablevsid+".fsh")
tablevs.write(`ValueSet: ${tablevsid}
Title: "${tablevsid} ValueSet for Decision Table"
Description: """
ValueSet ${tablevsid} for ${did}.
Business rule: ${rule}
Trigger: ${trigger}
Table: ${table}
"""

* ^status = #active
* ^name = "${tablevsname}"
* ^expansion.timestamp = ${runtime}

`)

let inputfile = fs.createWriteStream("output/codesystems/"+didputs+".Inputs.fsh")

for( let id in codeinput ) {
  inputfile.write("* #"+codeinput[id].code+" \"" + codeinput[id].display +"\" \""+codeinput[id].definition.replace(/([^\\])"/g, '$1\\"').replace(/^"/, '\\"')+"\"\n")
  let tables = [...new Set(codeinput[id].table)]
  for( let decid of tables ) {
    if ( decid == did ) tablevs.write("* insert AddWithExpandCanonical( "+didputs+".Inputs, #"+codeinput[id].code+", [["+ codeinput[id].display +"]] )\n")
    inputfile.write(`  * ^property[+].code = #table
  * ^property[=].valueString = "${decid}"
`)
  }
}
inputfile.close()

let outputfile = fs.createWriteStream("output/codesystems/"+didputs+".Outputs.fsh")

for( let id in codeoutput ) {
  outputfile.write("* #"+codeoutput[id].code+" \"" + codeoutput[id].display +"\" \""+codeoutput[id].definition.replace(/([^\\])"/g, '$1\\"').replace(/^"/, '\\"')+"\"\n")
  let tables = [...new Set(codeoutput[id].table)]
  for( let decid of tables ) {
    if ( decid == did ) tablevs.write("* insert AddWithExpandCanonical( "+didputs+".Outputs, #"+codeoutput[id].code+", [["+ codeoutput[id].display +"]] )\n")
    outputfile.write(`  * ^property[+].code = #table
  * ^property[=].valueString = "${decid}"
`)
  }
}
outputfile.close()