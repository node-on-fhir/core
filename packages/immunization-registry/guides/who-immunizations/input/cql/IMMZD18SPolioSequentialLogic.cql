
/*
 * Library: IMMZD18SPolioSequentialLogic (IMMZ.D18.S.Polio.Sequential IPV–bOPV schedule)
 * Schedule Table: Sequential bivalent oral polio vaccine (bOPV)–inactivated polio vaccine (IPV) schedule
 */
library IMMZD18SPolioSequentialLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include WHOCommon called WC

include IMMZCommon called Common
include IMMZConcepts called Concepts

include IMMZEncounterElements called IE
include IMMZD2DTPolioEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@output: IPV dose 1
@description: Provision of IPV dose 1
@trigger: Child's birth
@triggerDate: "Date of birth"
*/
define "IPV dose 1":
  not "First IPV dose from the primary series was administered"

/*
@output: IPV dose 1 Create
@create: For sequential IPV– bOPV schedules, WHO recommends that the first dose of IPV be given starting from 8 weeks of age with an interval of 4–8 weeks before administration of the second IPV dose.
*/
define "IPV dose 1 Create":
  if "IPV dose 1" 
  then 'For sequential IPV– bOPV schedules, WHO recommends that the first dose of IPV be given starting from 8 weeks of age with an interval of 4–8 weeks before administration of the second IPV dose.' + '
Due Date: ' + ToString("IPV dose 1 Due Date")
  else ''

/*
@dynamicValue: IPV dose 1 Due Date
@pseudocode: "Date of birth" + 8 weeks
*/
define "IPV dose 1 Due Date":
  if "IPV dose 1" then Patient.birthDate + 8 weeks
  else null
/*
@dynamicValue: IPV dose 1 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "IPV dose 1 Overdue":
  null

/*
@dynamicValue: IPV dose 1 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "IPV dose 1 Expiration":
  null

/*
@complete: First IPV dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Type of poliovirus dose" = "IPV") = 1
*/
define "First IPV dose from the primary series was administered":
  Encounter."Number of Polio IPV Primary Series Doses Administered" >= 1

/*
@output: IPV dose 2
@description: Provision of IPV dose 2
@trigger: First IPV dose from the primary series was administered
Count of vaccines administered (where "Type of poliovirus dose" = "IPV") = 1
@triggerDate: Latest "Date and time of vaccination" (where "Type of poliovirus dose" = "IPV")
*/
define "IPV dose 2":
  "First IPV dose from the primary series was administered" and not "Second IPV dose from the primary series was administered"

/*
@output: IPV dose 2 Create
@create: For sequential IPV– bOPV schedules, WHO recommends that the first dose of IPV be given starting from 8 weeks of age with an interval of 4–8 weeks before administration of the second IPV dose.
*/
define "IPV dose 2 Create":
  if "IPV dose 2" 
  then 'For sequential IPV– bOPV schedules, WHO recommends that the first dose of IPV be given starting from 8 weeks of age with an interval of 4–8 weeks before administration of the second IPV dose.' + '
Due Date: ' + ToString("IPV dose 2 Due Date")
  else ''

/*
@dynamicValue: IPV dose 2 Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Type of poliovirus dose" = "IPV") + 4 weeks
*/
define "IPV dose 2 Due Date":
  if "IPV dose 2" then Encounter."Date of Latest IPV Dose" + 4 weeks
  else null

/*
@dynamicValue: IPV dose 2 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "IPV dose 2 Overdue":
  null

/*
@dynamicValue: IPV dose 2 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "IPV dose 2 Expiration":
  null

/*
@complete: Second IPV dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Type of poliovirus dose" = "IPV") = 2
*/
define "Second IPV dose from the primary series was administered":
  Encounter."Number of Polio IPV Primary Series Doses Administered" >= 2

/*
@output: bOPV dose 1
@description: Provision of bOPV dose 1
@trigger: Second IPV dose from the primary series was administered
Count of vaccines administered (where "Type of poliovirus dose" = "IPV") = 2
@triggerDate: Latest "Date and time of vaccination" (where "Type of poliovirus dose" = "IPV")
*/
define "bOPV dose 1":
  "Second IPV dose from the primary series was administered" and not "First bOPV dose from the primary series was administered"

/*
@output: bOPV dose 1 Create
@create: Where a sequential IPV–bOPV schedule is used, the initial administration of 2 doses of IPV should be followed by ≥2 doses of bOPV separated by 4–8 weeks depending on the risk of exposure to poliovirus in early childhood.
*/
define "bOPV dose 1 Create":
  if "bOPV dose 1" 
  then 'Where a sequential IPV–bOPV schedule is used, the initial administration of 2 doses of IPV should be followed by ≥2 doses of bOPV separated by 4–8 weeks depending on the risk of exposure to poliovirus in early childhood.' + '
Due Date: ' + ToString("bOPV dose 1 Due Date")
  else ''

/*
@dynamicValue: bOPV dose 1 Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Type of poliovirus dose" = "IPV")
*/
define "bOPV dose 1 Due Date":
  if "bOPV dose 1" then Encounter."Date of Latest IPV Dose"
  else null

/*
@dynamicValue: bOPV dose 1 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "bOPV dose 1 Overdue":
  null

/*
@dynamicValue: bOPV dose 1 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "bOPV dose 1 Expiration":
  null

/*
@complete: First bOPV dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Type of poliovirus dose" = "bOPV") = 1
*/
define "First bOPV dose from the primary series was administered":
  Encounter."Number of Polio bOPV Primary Series Doses Administered" >= 1

/*
@output: bOPV dose 2
@description: Provision of bOPV dose 2
@trigger: First bOPV dose from the primary series was administered
Count of vaccines administered (where "Type of poliovirus dose" = "bOPV") = 1
@triggerDate: Latest "Date and time of vaccination" (where "Type of poliovirus dose" = "bOPV")
*/
define "bOPV dose 2":
  "First bOPV dose from the primary series was administered" and not "Second bOPV dose from the primary series was administered. The primary series has been completed"

/*
@output: bOPV dose 2 Create
@create: Where a sequential IPV–bOPV schedule is used, the initial administration of 2 doses of IPV should be followed by ≥2 doses of bOPV separated by 4–8 weeks depending on the risk of exposure to poliovirus in early childhood.
*/
define "bOPV dose 2 Create":
  if "bOPV dose 2" 
  then 'Where a sequential IPV–bOPV schedule is used, the initial administration of 2 doses of IPV should be followed by ≥2 doses of bOPV separated by 4–8 weeks depending on the risk of exposure to poliovirus in early childhood.' + '
Due Date: ' + ToString("bOPV dose 2 Due Date")
  else ''

/*
@dynamicValue: bOPV dose 2 Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Type of poliovirus dose" = "bOPV") + 4 weeks
*/
define "bOPV dose 2 Due Date":
  if "bOPV dose 1" then Encounter."Date of Latest bOPV Dose" + 4 weeks
  else null
/*
@dynamicValue: bOPV dose 2 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "bOPV dose 2 Overdue":
  null

/*
@dynamicValue: bOPV dose 2 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "bOPV dose 2 Expiration":
  null

/*
@complete: Second bOPV dose from the primary series was administered. The primary series has been completed
@pseudocode: "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Poliovirus-containing vaccines")
*/
define "Second bOPV dose from the primary series was administered. The primary series has been completed":
  Encounter."Number of Polio bOPV Primary Series Doses Administered" >= 2

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '56.Alt8w' then "IPV dose 1"
    when Patient.id = '57.Agt8w' then "IPV dose 1"
    when Patient.id = '58.D1PDlt4w' then "IPV dose 2"
    when Patient.id = '59.D1PDgt4w' then "IPV dose 2"
    when Patient.id = '60.D2' then "bOPV dose 1"
    when Patient.id = '61.D3PDlt4w' then "bOPV dose 2"
    when Patient.id = '62.D3PDgt4w' then "bOPV dose 2"
    when Patient.id = '63.D4' then "Second bOPV dose from the primary series was administered. The primary series has been completed"
    else 'No test case set'
  end
