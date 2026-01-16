
/*
 * Library: IMMZD18SMeaslesDose0OTLogic (IMMZ.D18.S.Measles.MCV dose 0 schedule)
 * Schedule Table: Measles-containing vaccine dose 0 (MCV0) schedule for Ongoing Transmission
 */
library IMMZD18SMeaslesDose0OTLogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD2DTMeaslesEncounterElements called Encounter

parameter Today Date default Today()

context Patient


/*
@output: MCV0
@description: Provision of the MCV0
@trigger: Child's birth
@triggerDate: "Date of birth"
*/
define "MCV0":
  not "MCV0 was administered" and "MCV0 Expiration" after Today

/*
@output: MCV0 Create
@create: In the following situations, a supplementary dose of MCV should be given to infants from 6 months of age: 
• during a measles outbreak as part of intensified service delivery;
• during campaigns in settings where the risk of measles among infants aged under 9 months remains high (e.g. in endemic countries experiencing regular outbreaks);
• for internally displaced populations and refugees, and populations in conflict zones;
• for individual infants at high risk of contracting measles (e.g. contacts of known measles cases or in settings with increased risk of exposure during outbreaks such as day-care facilities);
• for infants travelling to countries experiencing measles outbreaks;
• for infants known to be HIV-infected or exposed (i.e. born to a woman infected with HIV).
*/
define "MCV0 Create":
  if "MCV0" 
  then 'In the following situations, a supplementary dose of MCV should be given to infants from 6 months of age: 
• during a measles outbreak as part of intensified service delivery;
• during campaigns in settings where the risk of measles among infants aged under 9 months remains high (e.g. in endemic countries experiencing regular outbreaks);
• for internally displaced populations and refugees, and populations in conflict zones;
• for individual infants at high risk of contracting measles (e.g. contacts of known measles cases or in settings with increased risk of exposure during outbreaks such as day-care facilities);
• for infants travelling to countries experiencing measles outbreaks;
• for infants known to be HIV-infected or exposed (i.e. born to a woman infected with HIV).' + '
Due Date: ' + ToString("MCV0 Due Date") + '
Expiration: ' + ToString("MCV0 Expiration")
  else ''

/*
@dynamicValue: MCV0 Due Date
@pseudocode: "Date of birth" + 6 months
*/
define "MCV0 Due Date":
  if "MCV0" then Patient.birthDate + 6 months
  else null

/*
@dynamicValue: MCV0 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "MCV0 Overdue":
  null

/*
@dynamicValue: MCV0 Expiration
@pseudocode: "Date of birth" + 9 months for countries with ongoing transmission in which the risk of measles mortality remains high
*/
define "MCV0 Expiration":
  Patient.birthDate + 9 months

/*
@complete: MCV0 was administered
@pseudocode: Count of vaccines administered (where "Vaccine type" = "Measles-containing vaccines" and "Type of dose" = "Dose 0") = 1
*/
define "MCV0 was administered":
  Encounter."MCV0 was administered"


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '35.Alt6m' then "MCV0"
    when Patient.id = '35.Agt9m' then not "MCV0"  // expired
    when Patient.id = '35.Agt6mLVlt4w' then "MCV0"
    when Patient.id = '35.D1' then not "MCV0"  // done
    else 'No test case set'
  end
