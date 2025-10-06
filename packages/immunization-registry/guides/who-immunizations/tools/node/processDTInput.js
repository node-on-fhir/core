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

// node processDTInput.js FILE.xlsx ANTIGENTAB R-R C-C DID 
// node processDTinput.js FILE.xlsx Measles 6-12 0-2 D2DT 
// Sometimes the indices for the rows/cols are a bit off so may need to adjust for that

var file, sheetname, rowoffset, rows, cols, prefix

[file, sheetname, rowoffset, rows, cols, prefix] = process.argv.slice(2)
let cqlname = sheetname.replace(/\s/,"")
rowoffset = parseInt(rowoffset)


const workbook = xlsx.parse( file )
let sheet = workbook.filter( (tab) => { return tab.name === sheetname } )

var title, pseudo, rs, re, cs, ce

[ rs, re ] = getRange( rows, rowoffset );
[ cs, ce ] = getRange( cols, 0 );

let tabledesc = sheet[0].data[rs-2][cs]
if ( tabledesc == "Trigger" ) tabledesc = sheet[0].data[rs-1][cs]
if ( tabledesc == "Inputs" ) tabledesc = null

let eleoutput = {}
let encoutput = {}
for( let c = cs; c <= ce; c++ ) {
  for ( let r = rs; r <= re; r++ ) {
    //if ( sheet[0].data[r] && sheet[0].data[r][c] && sheet[0].data[r][c] != '-' ) {
    if ( sheet[0].data[r] && sheet[0].data[r][c] && sheet[0].data[r][c].trim().length > 3 ) {
      [ title, pseudo ] = sheet[0].data[r][c].split( "\n", 2 )
      title = title.trim()
      if (!pseudo) pseudo = ""
      pseudo = pseudo.trim()
      eleoutput[title+pseudo] = "/*\n@input: " + title + "\n@pseudocode: " + pseudo + "\n" 
      + (tabledesc ? "@decision: " + tabledesc + "\n" : "" ) + "*/\ndefine \""+title+"\":\n  Elements.\""+title+"\"\n\n"
      encoutput[title+pseudo] = "/*\n@input: " + title + "\n@pseudocode: " + pseudo + "\n"
      + (tabledesc ? "@decision: " + tabledesc + "\n" : "" ) + "*/\ndefine \""+title+"\":\n  Encounter.\""+title+"\"\n\n"
    }
  }
}

let elelib = fs.createWriteStream("output/libraries/IMMZ"+prefix+cqlname+"Elements.fsh")
elelib.write(`
Instance: IMMZ${prefix}${cqlname}Elements
InstanceOf: Library
Title: "IMMZ${prefix}${cqlname}Elements"
Description: "This library defines context-independent elements for ${sheetname} used throughout the Immunization CPG"
Usage: #definition

* insert LogicLibrary( IMMZ${prefix}${cqlname}Elements )
`)
elelib.close()

let elements = fs.createWriteStream("output/cql/IMMZ"+prefix+cqlname+"Elements.cql")

let D2orD5
if ( prefix == "D2DT" ) {
  D2orD5 = `/*
@internal: ${sheetname} containing Doses Administered to Patient
*/
define "${sheetname} Doses Administered to Patient":
  Elements."Doses Administered to Patient" I
  where
    I.vaccineCode in Concepts."${sheetname}-containing vaccines"

/*
@internal: ${sheetname} containing Doses Administered to Patient that are in the Primary series
*/
define "${sheetname} Primary Series Doses Administered to Patient":
  "${sheetname} Doses Administered to Patient".seriesPrimary()

/*
@internal: Number of ${sheetname} Primary Series doses
*/
define "Number of ${sheetname} Primary Series Doses Administered":
  Count("${sheetname} Primary Series Doses Administered to Patient")
`

} else if ( prefix == "D5DT" ) {
  D2orD5 = `/*
@internal: Draft Medication Request for ${sheetname} dose
*/
define "Draft Medication Request for ${sheetname} dose":
  Elements."Draft Medication Request for Patient" MR 
    where MR.medication in Concepts."${sheetname}-containing vaccines"
`
}

elements.write(`
/*
  * Library: IMMZ${prefix}${cqlname}Elements
  */
library IMMZ${prefix}${cqlname}Elements

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOConcepts
include WHOCommon called WC
include WHOElements called WE

include IMMZCommon called Common
include IMMZConcepts called Concepts
include IMMZElements called Elements

context Patient

${D2orD5}

`)

elements.write(Object.values(eleoutput).join(""))
elements.close()

let enclib = fs.createWriteStream("output/libraries/IMMZ"+prefix+cqlname+"EncounterElements.fsh")
enclib.write(`
Instance: IMMZ${prefix}${cqlname}EncounterElements
InstanceOf: Library
Title: "IMMZ${prefix}${cqlname}EncounterElements"
Description: "This library defines encounter-based elements for ${sheetname} used throughout the Immunization CPG"
Usage: #definition

* insert LogicLibrary( IMMZ${prefix}${cqlname}EncounterElements )
`)
enclib.close()

let encounter = fs.createWriteStream("output/cql/IMMZ"+prefix+cqlname+"EncounterElements.cql")

D2orD5 = D2orD5.replace(/Elements/g, 'Encounter')

encounter.write(`
/*
  * Library: IMMZ${prefix}${cqlname}EncounterElements
  */
library IMMZ${prefix}${cqlname}EncounterElements

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOConcepts
include WHOCommon called WC
include WHOElements called WE

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called Encounter

include IMMZ${prefix}${cqlname}Elements called ${cqlname}Elements

parameter Today Date default Today()
parameter EncounterId String

context Patient

${D2orD5}

`)

encounter.write(Object.values(encoutput).join(""))
