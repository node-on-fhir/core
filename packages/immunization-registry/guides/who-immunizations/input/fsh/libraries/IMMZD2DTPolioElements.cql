
/*
  * Library: IMMZD2DTPolioElements
  */
library IMMZD2DTPolioElements

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOConcepts
include WHOCommon called WC
include WHOElements called WE

include IMMZCommon called Common
include IMMZConcepts called Concepts
include IMMZElements called Elements

context Patient

/*
@input: bOPV birth dose (a zero dose) was not administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Poliovirus-containing vaccines" and "Type of dose" = "Dose 0" AND "Birth dose" = TRUE) = 0
*/
define "bOPV birth dose (a zero dose) was not administered":
  Elements."bOPV birth dose (a zero dose) was not administered"

/*
@input: bOPV birth dose (a zero dose) was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Poliovirus-containing vaccines" and "Type of dose" = "Dose 0" AND "Birth dose" = TRUE) = 1
*/
define "bOPV birth dose (a zero dose) was administered":
  Elements."bOPV birth dose (a zero dose) was administered"

/*
@input: Client's age is less than 1 week
@pseudocode: Today's date − "Date of birth" < 1 week
*/
define "Client's age is less than 1 week":
  Elements."Client's age is less than 1 week"

/*
@input: Client's age is more than or equal to 1 week
@pseudocode: Today's date − "Date of birth" ≥ 1 week
*/
define "Client's age is more than or equal to 1 week":
  Elements."Client's age is more than or equal to 1 week"

