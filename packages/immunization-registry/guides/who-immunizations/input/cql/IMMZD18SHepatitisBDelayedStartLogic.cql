/*
 * Library: IMMZD18SHepatitisBDelayedStartLogic (IMMZ.D18.S.Hepatitis B.Delayed start schedule)
 * Schedule Table: 3-dose schedule (no birth dose + 3 doses), delayed start
 */
library IMMZD18SHepatitisBDelayedStartLogic

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
  not "First hepatitis B dose was administered"
  and not "Second hepatitis B dose was administered"
  and not "Third hepatitis B dose was administered. The primary series has been completed"


/*
@output: Hepatitis B dose 1 Create
@create: If delayed or interrupted scheduling of vaccination for children, adolescents and adults, 3 doses are recommended, with the second dose administered at least 1 month after the first, and the third dose 6 months after the first dose.
*/
define "Hepatitis B dose 1 Create":
  if "Hepatitis B dose 1"
  then 'If delayed or interrupted scheduling of vaccination for children, adolescents and adults, 3 doses are recommended, with the second dose administered at least 1 month after the first, and the third dose 6 months after the first dose.' + '
Due Date: ' + ToString("Hepatitis B dose 1 Due Date") + '
Overdue: ' + ToString("Hepatitis B dose 1 Overdue")
  else ''


/*
@dynamicValue: Hepatitis B dose 1 Due Date
@pseudocode: "Date of birth"
*/
define "Hepatitis B dose 1 Due Date":
  if "Hepatitis B dose 1" then Patient.birthDate
  else null


/*
@dynamicValue: Hepatitis B dose 1 Overdue
@pseudocode: Today's date − "Date of birth" > Member States defined lower limit
*/
define "Hepatitis B dose 1 Overdue":
  Patient.birthDate + (Encounter.HepBLowerLimitWeeks * 1 weeks)


/*
@dynamicValue: Hepatitis B dose 1 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended expiration date and individuals are always eligible to be vaccinated.
*/
define "Hepatitis B dose 1 Expiration":
  null

  
/*
@complete: First hepatitis B dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Hepatitis B-containing vaccines") = 1
*/
define "First hepatitis B dose was administered":
  Encounter."One hepatitis B primary series dose was administered"



/*
@output: Hepatitis B dose 2
@description: Provision of hepatitis B dose 2
@trigger: First hepatitis B dose was administered
@pseudo: Count of vaccines administered (where "Vaccine type" = "Hepatitis B-containing vaccines") = 1
@triggerDate: Latest "Date and time of vaccination" (where "Vaccine type" = "Hepatitis B-containing vaccines")
*/
define "Hepatitis B dose 2":
  "First hepatitis B dose was administered"
  and not "Second hepatitis B dose was administered"
  and not "Third hepatitis B dose was administered. The primary series has been completed"


/*
@output: Hepatitis B dose 2 Create
@create: If delayed or interrupted scheduling of vaccination for children, adolescents and adults, 3 doses are recommended, with the second dose administered at least 1 month after the first, and the third dose 6 months after the first dose.
*/
define "Hepatitis B dose 2 Create":
  if "Hepatitis B dose 2"
  then 'If delayed or interrupted scheduling of vaccination for children, adolescents and adults, 3 doses are recommended, with the second dose administered at least 1 month after the first, and the third dose 6 months after the first dose.' + '
Due Date: ' + ToString("Hepatitis B dose 2 Due Date")
  else ''


/*
@dynamicValue: Hepatitis B dose 2 Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Vaccine type" = "Hepatitis B-containing vaccines") + 1 month
*/
define "Hepatitis B dose 2 Due Date":
  if "Hepatitis B dose 2" then Encounter."Date of Latest Hepatitis B Dose" + 1 month
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
@complete: Second hepatitis B dose was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Hepatitis B-containing vaccines") = 2
*/
define "Second hepatitis B dose was administered":
  Encounter."Two hepatitis B primary series doses were administered"



/*
@output: Hepatitis B dose 3
@description: Provision of hepatitis B dose 3
@trigger: Second hepatitis B dose was administered
@pseudo: Count of vaccines administered (where "Vaccine type" = "Hepatitis B-containing vaccines") = 2
@triggerDate: "Date and time of vaccination" (where "Vaccine type" = "Hepatitis B-containing vaccines" and "Dose number" = 1)
*/
define "Hepatitis B dose 3":
  "Second hepatitis B dose was administered"
  and not "Third hepatitis B dose was administered. The primary series has been completed"


/*
@output: Hepatitis B dose 3 Create
@create: If delayed or interrupted scheduling of vaccination for children, adolescents and adults, 3 doses are recommended, with the second dose administered at least 1 month after the first, and the third dose 6 months after the first dose.
*/
define "Hepatitis B dose 3 Create":
  if "Hepatitis B dose 3"
  then 'If delayed or interrupted scheduling of vaccination for children, adolescents and adults, 3 doses are recommended, with the second dose administered at least 1 month after the first, and the third dose 6 months after the first dose.' + '
Due Date: ' + ToString("Hepatitis B dose 3 Due Date")
  else ''


/*
@dynamicValue: Hepatitis B dose 3 Due Date
@pseudocode: "Date and time of vaccination" (where "Vaccine type" = "Hepatitis B-containing vaccines" and "Dose number" = 1) + 6 months
*/
define "Hepatitis B dose 3 Due Date":
  if "Hepatitis B dose 3" then Encounter."Date of First Hepatitis B Dose" + 6 months
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
@complete: Third hepatitis B dose was administered. The primary series has been completed
@pseudocode: "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Hepatitis B-containing vaccines")
*/
define "Third hepatitis B dose was administered. The primary series has been completed":
  Encounter."Three hepatitis B primary series doses were administered"



/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = 'HepatitisB50.2' then "Hepatitis B dose 1"
    when Patient.id = 'HepatitisB51.2' then "Hepatitis B dose 2"
    when Patient.id = 'HepatitisB52.2' then "Hepatitis B dose 2"
    when Patient.id = 'HepatitisB53.2' then "Hepatitis B dose 3"
    when Patient.id = 'HepatitisB54.3' then "Hepatitis B dose 3"
    when Patient.id = 'HepatitisB55.3' then "Hepatitis B dose 3"
    when Patient.id = 'HepatitisB56.1' then not "Hepatitis B dose 3" and "Third hepatitis B dose was administered. The primary series has been completed"
    else 'No test case set'
  end
