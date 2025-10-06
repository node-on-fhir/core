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

var file, sheetname, rowoffset, rows, col, prefix, dt;

[file, sheetname, rowoffset, rows, col, prefix, dt] = process.argv.slice(2);
col = parseInt(col)
rowoffset = parseInt(rowoffset)

const workbook = xlsx.parse( file )
let sheet = workbook.filter( (tab) => { return tab.name === sheetname } );
let sheetdisplay = sheetname.replace(/\s/,"")
sheet = sheet[0].data

let rs = getRange( rows, rowoffset )

let top = parseInt(rs[0])
let dtmod = 0

let table = sheet[top-1][col]
if ( dt == "single" ) {
  table = sheet[top-4][col+1]
  dtmod = 1
  dt = ""
}

let sid = sheet[top-5+dtmod][col+1]

let enclib = fs.createWriteStream("output/libraries/IMMZ"+prefix+sheetdisplay+dt+"Logic.fsh")
enclib.write(`
Instance: IMMZ${prefix}${sheetdisplay}${dt}Logic
InstanceOf: Library
Title: "IMMZ${prefix}${sheetdisplay}${dt}Logic"
Description: "This library defines decision support logic for the ${sid} table in the Immunization CPG"
Usage: #definition

* insert LogicLibrary( IMMZ${prefix}${sheetdisplay}${dt}Logic )
`)
enclib.close()

let logic = fs.createWriteStream("output/cql/IMMZ"+prefix+sheetdisplay+dt+"Logic.cql")

logic.write(`
/*
 * Library: IMMZ${prefix}${sheetdisplay}${dt}Logic (${sid})
 * Schedule Table: ${table}
 */
library IMMZ${prefix}${sheetdisplay}${dt}Logic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called IE
include IMMZD2DT${sheetdisplay}EncounterElements called Encounter

parameter Today Date default Today()

context Patient

`)

let pdef = fs.createWriteStream("output/plandefinitions/IMMZ"+prefix+sheetdisplay+dt+".fsh")

pdef.write(`
Instance: IMMZ${prefix}${sheetdisplay}${dt}
InstanceOf: http://hl7.org/fhir/uv/cpg/StructureDefinition/cpg-recommendationdefinition
Title: "${sid}"
Description: """
${sid}
${table}
"""
Usage: #definition

* insert PlanDefMain( IMMZ${prefix}${sheetdisplay}${dt}, 0.1.0 )
`)


let tests = []
let lastcreate = ""

for ( let r = rs[0]; r <= rs[1]; r++ ) {

  // console.log(sheet[r])
  // console.log(sheet[r][col])
  // console.log(col+1,sheet[r][col+1])
  
  let sname = sheet[r][col].trim()
  let sdesc = sheet[r][col+1].trim()
  let trigger = sheet[r][col+2].trim()
  let tdate = sheet[r][col+3].trim()
  let create
  if ( sheet[r][col+4] ) {
    create = sheet[r][col+4].trim()
    lastcreate = create
  } else {
    create = lastcreate
  }
  let due = sheet[r][col+5].trim()
  let overdue = sheet[r][col+6].trim()
  let expiration = sheet[r][col+7].trim()
  let complete = sheet[r][col+8].trim().split(/\s*\n\s*/, 2)

  let createmsg = "'" + create.replace(/'/g, '\\\'') + "'"
  if ( !due.startsWith('To be determined by Member States') ) createmsg += " + '\nDue Date: ' + ToString(\""+sname+" Due Date\")"
  if ( !overdue.startsWith('To be determined by Member States') ) createmsg += " + '\nOverdue: ' + ToString(\""+sname+" Overdue\")"
  if ( !expiration.startsWith('To be determined by Member States') ) createmsg += " + '\nExpiration: ' + ToString(\""+sname+" Expiration\")"

  tests.push("    when Patient.id = '"+(r+2)+".' then \""+sname+"\"")

  defaultdate = `if "${sname}" then
  else null`
  if ( due.startsWith("To be determined") ) {
    duecode = "null"
  } else {
    duecode = defaultdate
  }
  if ( overdue.startsWith("To be determined") ) {
    overduecode = "null"
  } else {
    overduecode = defaultdate
  }
  if ( expiration.startsWith("To be determined") ) {
    expcode = "null"
  } else {
    expcode = defaultdate
  }

  logic.write(`
/*
@output: ${sname}
@description: ${sdesc}
@trigger: ${trigger}
@triggerDate: ${tdate}
*/
define "${sname}":
  not "${complete[0]}"

/*
@output: ${sname} Create
@create: ${create}
*/
define "${sname} Create":
  if "${sname}" 
  then ${createmsg}
  else ''

/*
@dynamicValue: ${sname} Due Date
@pseudocode: ${due}
*/
define "${sname} Due Date":
  ${duecode}

/*
@dynamicValue: ${sname} Overdue
@pseudocode: ${overdue}
*/
define "${sname} Overdue":
  ${overduecode}

/*
@dynamicValue: ${sname} Expiration
@pseudocode: ${expiration}
*/
define "${sname} Expiration":
  ${expcode}
  
/*
@complete: ${complete[0]}
@pseudocode: ${complete[1]}
*/
define "${complete[0]}":

`)

  pdef.write(`
* insert PlanDefCommunicationRequestAction([[${sname}]], [["""
${sdesc}
Trigger event: ${trigger}
Trigger date: ${tdate}
Create condition: ${create}
"""]], [[${sname}]], [[${sname} Create]])
`)

}

pdef.close()

logic.write(`
/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
`)
logic.write(tests.filter((test) => test.length > 0).join("\n")+"\n")
logic.write("    else 'No test case set'\n  end\n")

logic.close()
