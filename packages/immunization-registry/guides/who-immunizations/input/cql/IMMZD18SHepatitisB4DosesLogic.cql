/*
 * Library: IMMZD18SHepatitisB4DosesLogic (IMMZ.D18.S.Hepatitis B.4-dose schedule)
 * Schedule Table: 4-dose schedule (birth dose + 3 primary series doses), on-time start
 */
library IMMZD18SHepatitisB4DosesLogic

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
    and not "Second hepatitis B dose from the primary series was administered"
    and not "Third hepatitis B dose from the primary series was administered. The primary series has been completed"


/*
@output: Hepatitis B dose 1 Create
@create: The following option is considered appropriate: 4 doses, where a monovalent birth dose is followed by 3 (monovalent or combined vaccine) doses, usually given with other routine infant vaccines; the additional dose does not cause any harm. The interval between doses should be at least 4 weeks.
*/
define "Hepatitis B dose 1 Create":
  if "Hepatitis B dose 1"
  then 'The following option is considered appropriate: 4 doses, where a monovalent birth dose is followed by 3 (monovalent or combined vaccine) doses, usually given with other routine infant vaccines; the additional dose does not cause any harm. The interval between doses should be at least 4 weeks.' + '
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
    and not "Second hepatitis B dose from the primary series was administered"
    and not "Third hepatitis B dose from the primary series was administered. The primary series has been completed"


/*
@output: Hepatitis B dose 2 Create
@create: The following option is considered appropriate: 4 doses, where a monovalent birth dose is followed by 3 (monovalent or combined vaccine) doses, usually given with other routine infant vaccines; the additional dose does not cause any harm. The interval between doses should be at least 4 weeks.
*/
define "Hepatitis B dose 2 Create":
  if "Hepatitis B dose 2"
  then 'The following option is considered appropriate: 4 doses, where a monovalent birth dose is followed by 3 (monovalent or combined vaccine) doses, usually given with other routine infant vaccines; the additional dose does not cause any harm. The interval between doses should be at least 4 weeks.' + '
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
@complete: Second hepatitis B dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Hepatitis B-containing vaccines" and "Type of dose"= "Primary series") = 2
*/
define "Second hepatitis B dose from the primary series was administered":
  Encounter."Two hepatitis B primary series doses were administered"



/*
@output: Hepatitis B dose 3
@description: Provision of hepatitis B dose 3
@trigger: Second hepatitis B dose from the primary series was administered
@pseudo: Count of vaccines administered (where "Vaccine type" = "Hepatitis B-containing vaccines" and "Type of dose"= "Primary series") = 2
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "Hepatitis B-containing vaccines")
*/
define "Hepatitis B dose 3":
  "Second hepatitis B dose from the primary series was administered"
    and not "Third hepatitis B dose from the primary series was administered. The primary series has been completed"


/*
@output: Hepatitis B dose 3 Create
@create: The following option is considered appropriate: 4 doses, where a monovalent birth dose is followed by 3 (monovalent or combined vaccine) doses, usually given with other routine infant vaccines; the additional dose does not cause any harm. The interval between doses should be at least 4 weeks.
*/
define "Hepatitis B dose 3 Create":
  if "Hepatitis B dose 3"
  then 'The following option is considered appropriate: 4 doses, where a monovalent birth dose is followed by 3 (monovalent or combined vaccine) doses, usually given with other routine infant vaccines; the additional dose does not cause any harm. The interval between doses should be at least 4 weeks.' + '
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
@complete: Third hepatitis B dose from the primary series was administered. The primary series has been completed
@pseudocode: "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Hepatitis B-containing vaccines")
*/
define "Third hepatitis B dose from the primary series was administered. The primary series has been completed":
  Encounter."Three hepatitis B primary series doses were administered"



/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = 'HepatitisB36.2' then "Hepatitis B dose 1"
    when Patient.id = 'HepatitisB37.2' then "Hepatitis B dose 1"
    when Patient.id = 'HepatitisB38.2' then "Hepatitis B dose 2"
    when Patient.id = 'HepatitisB39.2' then "Hepatitis B dose 2"
    when Patient.id = 'HepatitisB40.2' then "Hepatitis B dose 3"
    when Patient.id = 'HepatitisB41.2' then "Hepatitis B dose 3"
    when Patient.id = 'HepatitisB42.1' then not "Hepatitis B dose 3" and "Third hepatitis B dose from the primary series was administered. The primary series has been completed"
    else 'No test case set'
  end
