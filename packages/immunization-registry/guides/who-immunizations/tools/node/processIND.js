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

const sheetname = 'Indicator table'
var file, rowoffset, rows, col;

[file, rowoffset, rows, col] = process.argv.slice(2);
// output and guidance are expected to be +1 and +2 from the last column.  Even if blank, all columns should be listed.
rowoffset = parseInt(rowoffset)

const workbook = xlsx.parse( file )
let sheet = workbook.filter( (tab) => { return tab.name === sheetname } );
sheet = sheet[0].data

let rs = getRange( rows, rowoffset )
let c = parseInt(col)

for ( let r = rs[0]; r <= rs[1]; r++ ) {
  [ iid, iname, def, numdesc, numcomp, dendesc, dencomp, disagg, ref, anno] = sheet[r]

  let ishort = iid.replace(/\./g, '')

  let indmeas = fs.createWriteStream("output/measures/"+ishort+".fsh")
  indmeas.write(`Instance: ${ishort}
InstanceOf: http://hl7.org/fhir/us/cqfmeasures/StructureDefinition/proportion-measure-cqfm
Title: "${ishort}"
Usage: #definition

* insert MeasureProportion( [[${iid} ${iname}]], ${ishort},
  0.1.0, 2025-06-11, ${iid} )
`)
  indmeas.close()

  let indlib = fs.createWriteStream("output/libraries/"+ishort+"Logic.fsh")
  indlib.write(`
Instance: ${ishort}Logic
InstanceOf: Library
Title: "${ishort}Logic"
Description: "This library defines population criteria logic for the ${iid} indicator in the Immunization CPG"
Usage: #definition

* insert LogicLibrary( ${ishort}Logic )
`)
  indlib.close()


  let disaggdisp = disagg.replace(/^/, " *  - ").replace(/\n/g, "\n *  - ")

  let indlogic = fs.createWriteStream("output/cql/"+ishort+"Logic.cql")
  indlogic.write(`/*
 * Library: ${iid} Logic
 * ${iname}
 * ${def}
 * 
 * Numerator: ${numdesc}
 * Numerator Computation: ${numcomp}
 * Denominator: ${dendesc}
 * Denominator Computation: ${dencomp}
 * 
 * Disaggregation
${disaggdisp}
 *
 * References: ${ref.replace(/\n/g, "\n *   ")}
 * 
 * Annotations: ${anno.replace(/\n/g, "\n *   ")}
 */
library ${ishort}Logic

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts
include IMMZIndicatorElements called Elements


parameter "Measurement Period" Interval<Date> default Interval[@2025-01-01, @2025-12-31]

context Patient

/*
 * As defined by Member State
 */
define "Initial Population":
  true

/*
@denominator: ${dendesc}
@pseudocode: ${dencomp}
*/
define "Denominator":
  true

/*
@numerator: ${numdesc}
@pseudocode: ${numcomp}
*/
define "Numerator":
  true

/*
@disaggregation: ${disagg.replace(/\n/g, "\n                 ")}
*/
define "Stratification 1":
	Elements."By Geographic Region Stratifier"

define "Stratification 2":
	Elements."By Administrative Gender Stratifier"

define "Stratification 3":
	Elements."Age Stratifier"

define "Stratification 4":
	Elements."By Age Group Stratifier"
`)
  indlogic.close()
}
