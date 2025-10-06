
/*
  * Library: IMMZD2DTJEElements
  */
library IMMZD2DTJEElements

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
@internal: JE containing Doses Administered to Patient
*/
define "JE Doses Administered to Patient":
  Elements."Doses Administered to Patient" I
  where
    I.vaccineCode in Concepts."JE vaccines"

/*
@internal: JE containing Doses Administered to Patient that are in the Primary series
*/
define "JE Primary Series Doses Administered to Patient":
  "JE Doses Administered to Patient".seriesPrimary()

/*
@internal: Number of JE Primary Series doses
*/
define "Number of JE Primary Series Doses Administered":
  Count("JE Primary Series Doses Administered to Patient")

/*
@internal: Date and time of last JE dose
*/
define "Date of Latest JE Dose":
  date from start of "JE Doses Administered to Patient".mostRecent().occurrence.toInterval()

/*
@input: No JE primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "JE vaccines" and "Type of dose" = "Primary series") = 0
@decision: Inactivated Vero cell-derived vaccination schedule (2-dose scheme)
JE vaccination should be integrated into national immunization schedules in all areas where JE is recognized as a public health priority
@decision: Live attenuated vaccination schedule (1-dose scheme)
JE vaccination should be integrated into national immunization schedules in all areas where JE is recognized as a public health priority
@decision: Live recombinant vaccination schedule (1-dose scheme)
JE vaccination should be integrated into national immunization schedules in all areas where JE is recognized as a public health priority
*/
define "No JE primary series doses were administered":
  "Number of JE Primary Series Doses Administered" = 0

/*
@input: One JE primary series dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "JE vaccines" and "Type of dose" = "Primary series") = 1
@decision: Inactivated Vero cell-derived vaccination schedule (2-dose scheme)
JE vaccination should be integrated into national immunization schedules in all areas where JE is recognized as a public health priority
@decision: Live attenuated vaccination schedule (1-dose scheme)
JE vaccination should be integrated into national immunization schedules in all areas where JE is recognized as a public health priority
*/
define "One JE primary series dose was administered":
  "Number of JE Primary Series Doses Administered" = 1

/*
@input: One JE primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "JE vaccines" and "Type of dose" = "Primary series") = 1
@decision: Live recombinant vaccination schedule (1-dose scheme)
JE vaccination should be integrated into national immunization schedules in all areas where JE is recognized as a public health priority
*/
define "One JE primary series doses were administered":
  "One JE primary series dose was administered"
  
/*
@input: Two JE primary series doses were administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "JE vaccines" and "Type of dose" = "Primary series") = 2
@decision: Inactivated Vero cell-derived vaccination schedule (2-dose scheme)
JE vaccination should be integrated into national immunization schedules in all areas where JE is recognized as a public health priority
*/
define "Two JE primary series doses were administered":
  "Number of JE Primary Series Doses Administered" = 2

/*
@input: Client's age is less than 6 months
@pseudocode: Today's date − "Date of birth" < 6 months
@decision: Inactivated Vero cell-derived vaccination schedule (2-dose scheme)
JE vaccination should be integrated into national immunization schedules in all areas where JE is recognized as a public health priority
*/
define "Client's age is less than 6 months":
  Elements."Current Patient Age In Months" < 6

/*
@input: Client's age is more than or equal to 6 months
@pseudocode: Today's date − "Date of birth" ≥ 6 months
@decision: Inactivated Vero cell-derived vaccination schedule (2-dose scheme)
JE vaccination should be integrated into national immunization schedules in all areas where JE is recognized as a public health priority
*/
define "Client's age is more than or equal to 6 months":
  Elements."Current Patient Age In Months" >= 6

/*
@input: Client's age is less than 8 months
@pseudocode: Today's date − "Date of birth" < 8 months
@decision: Live attenuated vaccination schedule (1-dose scheme)
JE vaccination should be integrated into national immunization schedules in all areas where JE is recognized as a public health priority
*/
define "Client's age is less than 8 months":
  Elements."Current Patient Age In Months" < 8

/*
@input: Client's age is more than or equal to 8 months
@pseudocode: Today's date − "Date of birth" ≥ 8 months
@decision: Live attenuated vaccination schedule (1-dose scheme)
JE vaccination should be integrated into national immunization schedules in all areas where JE is recognized as a public health priority
*/
define "Client's age is more than or equal to 8 months":
  Elements."Current Patient Age In Months" >= 8

/*
@input: Client's age is less than 9 months
@pseudocode: Today's date − "Date of birth" < 9 months
@decision: Live recombinant vaccination schedule (1-dose scheme)
JE vaccination should be integrated into national immunization schedules in all areas where JE is recognized as a public health priority
*/
define "Client's age is less than 9 months":
  Elements."Current Patient Age In Months" < 9

/*
@input: Client's age is more than or equal to 9 months
@pseudocode: Today's date − "Date of birth" ≥  9 months
@decision: Live recombinant vaccination schedule (1-dose scheme)
JE vaccination should be integrated into national immunization schedules in all areas where JE is recognized as a public health priority
*/
define "Client's age is more than or equal to 9 months":
  Elements."Current Patient Age In Months" >= 9

/*
@input: The latest JE dose was administered less than 4 weeks ago
@pseudocode: Today's date − "Date and time of vaccination" (where "Vaccine type" = "JE vaccines") < 4 weeks
@decision: Inactivated Vero cell-derived vaccination schedule (2-dose scheme)
JE vaccination should be integrated into national immunization schedules in all areas where JE is recognized as a public health priority
*/
define "The latest JE dose was administered less than 4 weeks ago":
  "Date of Latest JE Dose" is not null
    and duration in weeks between "Date of Latest JE Dose" and Now() < 4

/*
@input: The latest JE dose was administered more than 4 weeks ago
@pseudocode: Today's date − "Date and time of vaccination" (where "Vaccine type" = "JE vaccines") ≥ 4 weeks
@decision: Inactivated Vero cell-derived vaccination schedule (2-dose scheme)
JE vaccination should be integrated into national immunization schedules in all areas where JE is recognized as a public health priority
*/
define "The latest JE dose was administered more than 4 weeks ago":
  not "The latest JE dose was administered less than 4 weeks ago"

/*
@input: No live vaccine was administered in the last 4 weeks
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Vaccine type" = "JE vaccines") ≥ 4 weeks
@decision: Live attenuated vaccination schedule (1-dose scheme)
JE vaccination should be integrated into national immunization schedules in all areas where JE is recognized as a public health priority
@decision: Live recombinant vaccination schedule (1-dose scheme)
JE vaccination should be integrated into national immunization schedules in all areas where JE is recognized as a public health priority*/
define "No live vaccine was administered in the last 4 weeks":
  Elements."No live vaccine was administered in the last 4 weeks"

/*
@input: Live vaccine was administered in the last 4 weeks
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Live vaccine" = TRUE) < 4 weeks
@decision: Live attenuated vaccination schedule (1-dose scheme)
JE vaccination should be integrated into national immunization schedules in all areas where JE is recognized as a public health priority
@decision: Live recombinant vaccination schedule (1-dose scheme)
JE vaccination should be integrated into national immunization schedules in all areas where JE is recognized as a public health priority*/
define "Live vaccine was administered in the last 4 weeks":
  Elements."Live vaccine was administered in the last 4 weeks"