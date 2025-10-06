/*
 * Library: IMMZD18SHepatitisB3DosesLogic (IMMZ.D18.S.Hepatitis B.3-dose schedule)
 * Schedule Table: 3-dose schedule (birth dose + 2 primary series doses), on-time start
 */
library IMMZD18SHepatitisB3DosesLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called IE
include IMMZD2DTHepatitisBEncounterElements called Encounter

parameter Today Date default Today()


context Patient


/*
@output: Hepatitis B dose 1
@description: Provision of hepatitis B dose 1
@trigger: Child's birth
@pseudo: 
@triggerDate: "Date of birth"
*/
define "Hepatitis B dose 1":
  not "First hepatitis B dose from the primary series was administered"
    and not "Second hepatitis B dose from the primary series was administered. The primary series has been completed for client whose weight at birth was over 2000 g and was not a premature infant"
    and not "Third hepatitis B dose from the primary series was administered. The primary series has been completed for client whose weight at birth was less than 2000 g and was a premature infant"


/*
@output: Hepatitis B dose 1 Create
@create: The following option is considered appropriate: a 3-dose schedule with the first dose (monovalent) being given at birth and the second and third (monovalent or as part of a combined vaccine) given at the same time as the first and third doses of DTP-containing vaccine.
The interval between doses should be at least 4 weeks.
*/
define "Hepatitis B dose 1 Create":
  if "Hepatitis B dose 1"
  then 'The following option is considered appropriate: a 3-dose schedule with the first dose (monovalent) being given at birth and the second and third (monovalent or as part of a combined vaccine) given at the same time as the first and third doses of DTP-containing vaccine.
The interval between doses should be at least 4 weeks.' + '
Due Date: ' + ToString("Hepatitis B dose 1 Due Date")
  else ''


/*
@dynamicValue: Hepatitis B dose 1 Due Date
@pseudocode: "Date of birth" + Member States defined lower limit
*/
define "Hepatitis B dose 1 Due Date":
  if "Hepatitis B dose 1" then Patient.birthDate + (Encounter.HepBLowerLimitWeeks * 1 weeks)
  else null


/*
@dynamicValue: Hepatitis B dose 1 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date.
*/
define "Hepatitis B dose 1 Overdue":
  null


/*
@dynamicValue: Hepatitis B dose 1 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "Hepatitis B dose 1 Expiration":
  null

  
/*
@complete: First hepatitis B dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Hepatitis B-containing vaccines" and "Type of dose"= "Primary series") = 1
*/
define "First hepatitis B dose from the primary series was administered":
  Encounter."One hepatitis B primary series dose was administered"



/*
@output: Hepatitis B dose 2
@description: Provision of hepatitis B dose 2
@trigger: First hepatitis B dose from the primary series was administered
@pseudo: Count of vaccines administered (where "Vaccine type" = "Hepatitis B-containing vaccines" and "Type of dose"= "Primary series") = 1
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "Hepatitis B-containing vaccines")
*/
define "Hepatitis B dose 2":
  "First hepatitis B dose from the primary series was administered"
    and not "Second hepatitis B dose from the primary series was administered. The primary series has been completed for client whose weight at birth was over 2000 g and was not a premature infant"
    and not "Third hepatitis B dose from the primary series was administered. The primary series has been completed for client whose weight at birth was less than 2000 g and was a premature infant"


/*
@output: Hepatitis B dose 2 Create
@create: The following option is considered appropriate: a 3-dose schedule with the first dose (monovalent) being given at birth and the second and third (monovalent or as part of a combined vaccine) given at the same time as the first and third doses of DTP-containing vaccine.
The interval between doses should be at least 4 weeks.
*/
define "Hepatitis B dose 2 Create":
  if "Hepatitis B dose 2"
  then 'The following option is considered appropriate: a 3-dose schedule with the first dose (monovalent) being given at birth and the second and third (monovalent or as part of a combined vaccine) given at the same time as the first and third doses of DTP-containing vaccine.
The interval between doses should be at least 4 weeks.' + '
Due Date: ' + ToString("Hepatitis B dose 2 Due Date")
  else ''


/*
@dynamicValue: Hepatitis B dose 2 Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "Hepatitis B-containing vaccines") + 4 weeks
*/
define "Hepatitis B dose 2 Due Date":
  if "Hepatitis B dose 2" then Encounter."Date of Latest Hepatitis B Dose" + 4 weeks
  else null


/*
@dynamicValue: Hepatitis B dose 2 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date.
*/
define "Hepatitis B dose 2 Overdue":
  null


/*
@dynamicValue: Hepatitis B dose 2 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "Hepatitis B dose 2 Expiration":
  null

  
/*
@complete: Second hepatitis B dose from the primary series was administered. The primary series has been completed for client whose weight at birth was over 2000 g and was not a premature infant
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Hepatitis B-containing vaccines" and "Type of dose"= "Primary series") = 2
"Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Hepatitis B-containing vaccines")
*/
define "Second hepatitis B dose from the primary series was administered. The primary series has been completed for client whose weight at birth was over 2000 g and was not a premature infant":
  Encounter."Two hepatitis B primary series doses were administered"



/*
@output: Hepatitis B dose 3
@description: Provision of hepatitis B dose 3 for low-birth-weight and premature infants
@trigger: Second hepatitis B dose from the primary series was administered. Client's weight at birth was less than 2000 g or client was a premature infant
@pseudo: Count of vaccines administered (where "Vaccine type" = "Hepatitis B-containing vaccines") = 2 and ("Birth weight in grams" < 2000) or ("Preterm birth" = TRUE)
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "Hepatitis B-containing vaccines")
*/
define "Hepatitis B dose 3":
  "Second hepatitis B dose from the primary series was administered. The primary series has been completed for client whose weight at birth was over 2000 g and was not a premature infant"
    and not "Third hepatitis B dose from the primary series was administered. The primary series has been completed for client whose weight at birth was less than 2000 g and was a premature infant"
    and (
      Encounter."Client's weight at birth was below 2000 g"
      or Encounter."Client was a premature infant at birth"
    )


/*
@output: Hepatitis B dose 3 Create
@create: A birth dose of hepatitis B-containing vaccine can be given to low-birth-weight (< 2000 g) and premature infants. For these infants, the birth dose should not count as part of the primary 3-dose series; the 3 doses of the standard primary series should be given according to the national vaccination schedule.
*/
define "Hepatitis B dose 3 Create":
  if "Hepatitis B dose 3"
  then 'A birth dose of hepatitis B-containing vaccine can be given to low-birth-weight (< 2000 g) and premature infants. For these infants, the birth dose should not count as part of the primary 3-dose series; the 3 doses of the standard primary series should be given according to the national vaccination schedule.' + '
Due Date: ' + ToString("Hepatitis B dose 3 Due Date")
  else ''


/*
@dynamicValue: Hepatitis B dose 3 Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "Hepatitis B-containing vaccines") + 4 weeks
*/
define "Hepatitis B dose 3 Due Date":
  if "Hepatitis B dose 3" then Encounter."Date of Latest Hepatitis B Dose" + 4 weeks
  else null


/*
@dynamicValue: Hepatitis B dose 3 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date.
*/
define "Hepatitis B dose 3 Overdue":
  null


/*
@dynamicValue: Hepatitis B dose 3 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "Hepatitis B dose 3 Expiration":
  null

  
/*
@complete: Third hepatitis B dose from the primary series was administered. The primary series has been completed for client whose weight at birth was less than 2000 g and was a premature infant
@pseudocode: "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Hepatitis B-containing vaccines")
*/
define "Third hepatitis B dose from the primary series was administered. The primary series has been completed for client whose weight at birth was less than 2000 g and was a premature infant":
  Encounter."Three hepatitis B primary series doses were administered"



/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = 'HepatitisB19.2' then "Hepatitis B dose 1"
    when Patient.id = 'HepatitisB20.2' then "Hepatitis B dose 1"
    when Patient.id = 'HepatitisB21.2' then "Hepatitis B dose 2"
    when Patient.id = 'HepatitisB22.2' then "Hepatitis B dose 2"
    when Patient.id = 'HepatitisB23.3' then not "Hepatitis B dose 3" and "Second hepatitis B dose from the primary series was administered. The primary series has been completed for client whose weight at birth was over 2000 g and was not a premature infant"
    when Patient.id = 'HepatitisB24.3' then "Hepatitis B dose 3"
    when Patient.id = 'HepatitisB25.3' then "Hepatitis B dose 3"
    when Patient.id = 'HepatitisB26.3' then "Hepatitis B dose 3"
    when Patient.id = 'HepatitisB27.3' then "Hepatitis B dose 3"
    when Patient.id = 'HepatitisB28.1' then "Third hepatitis B dose from the primary series was administered. The primary series has been completed for client whose weight at birth was less than 2000 g and was a premature infant"
    else 'No test case set'
  end
