Instance: IMMZIND45
InstanceOf: http://hl7.org/fhir/us/cqfmeasures/StructureDefinition/proportion-measure-cqfm
Title: "IMMZIND45"
Usage: #definition

* insert MeasureProportionBasic( [[IMMZ.IND.45 Immunization session completion rate]], IMMZIND45,
  0.1.0, 2025-06-11, IMMZ.IND.45 )
* group[=]
  * insert Stratifier( {idprefix}, 1, IMMZ.I#DE32 "By-Administrative Area" )
  * insert Stratifier( {idprefix}, 2, IMMZ.I#DE32 "By-Administrative Area" )
