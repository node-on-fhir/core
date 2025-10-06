
/*
 * Library: IMMZD18SPoliobOPVIPVLogic (IMMZ.D18.S.Polio.bOPV plus IPV schedule)
 * Schedule Table: Bivalent oral polio vaccine (bOPV) plus inactivated polio vaccine (IPV) schedule
 */
library IMMZD18SPoliobOPVIPVLogic

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
@output: bOPV dose 1
@description: Provision of bOPV dose 1
@trigger: Child's birth
@triggerDate: "Date of birth"
*/
define "bOPV dose 1":
  not "First bOPV dose from the primary series was administered"

/*
@output: bOPV dose 1 Create
@create: The preferred schedule is to administer the 3 doses of bOPV starting from the minimum age of 6 weeks, with at least a 4 week-interval between doses.
*/
define "bOPV dose 1 Create":
  if "bOPV dose 1" 
  then 'The preferred schedule is to administer the 3 doses of bOPV starting from the minimum age of 6 weeks, with at least a 4 week-interval between doses.' + '
Due Date: ' + ToString("bOPV dose 1 Due Date")
  else ''

/*
@dynamicValue: bOPV dose 1 Due Date
@pseudocode: "Date of birth" + 6 weeks
*/
define "bOPV dose 1 Due Date":
  if "bOPV dose 1" then Patient.birthDate + 6 weeks
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
@pseudocode: Count of vaccines administered (where "Type of dose" = "Primary series" and "Type of poliovirus dose" = "bOPV") = 1
*/
define "First bOPV dose from the primary series was administered":
  Encounter."Number of Polio bOPV Primary Series Doses Administered" >= 1


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
@create: The first IPV dose should be administered from a minimum of 14 weeks of age.
*/
define "IPV dose 1 Create":
  if "IPV dose 1" 
  then 'The first IPV dose should be administered from a minimum of 14 weeks of age.' + '
Due Date: ' + ToString("IPV dose 1 Due Date")
  else ''

/*
@dynamicValue: IPV dose 1 Due Date
@pseudocode: "Date of birth" + 14 weeks
*/
define "IPV dose 1 Due Date":
  if "IPV dose 1" then Patient.birthDate + 14 weeks
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
@output: bOPV dose 2
@description: Provision of bOPV dose 2
@trigger: First bOPV dose from the primary series was administered
Count of vaccines administered (where "Type of dose" = "Primary series" and "Type of poliovirus dose" = "bOPV") = 1
@triggerDate: Latest "Date and time of vaccination" (where "Type of poliovirus dose" = "bOPV")
*/
define "bOPV dose 2":
  "First bOPV dose from the primary series was administered" and not "Second bOPV dose from the primary series was administered"

/*
@output: bOPV dose 2 Create
@create: The preferred schedule is to administer the 3 doses of bOPV starting from the minimum age of 6 weeks, with at least a 4 week-interval between doses.
*/
define "bOPV dose 2 Create":
  if "bOPV dose 2" 
  then 'The preferred schedule is to administer the 3 doses of bOPV starting from the minimum age of 6 weeks, with at least a 4 week-interval between doses.' + '
Due Date: ' + ToString("bOPV dose 2 Due Date")
  else ''

/*
@dynamicValue: bOPV dose 2 Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Type of poliovirus dose" = "bOPV") + 4 weeks
*/
define "bOPV dose 2 Due Date":
  if "bOPV dose 2" then Encounter."Date of Latest bOPV Dose" + 4 weeks
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
@complete: Second bOPV dose from the primary series was administered
@pseudocode: Count of vaccines administered (where "Type of dose" = "Primary series" and "Type of poliovirus dose" = "bOPV") = 2
*/
define "Second bOPV dose from the primary series was administered":
  Encounter."Number of Polio bOPV Primary Series Doses Administered" >= 2

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
@create: The first IPV dose should be administered from a minimum of 14 weeks of age (with the third dose of the diphtheria–tetanus–pertussis vaccine [DTP3] or pentavalent vaccine [penta3]), with the second IPV dose being given at least 4 months later (possibly coinciding with other vaccines administered at 9 months of age).
*/
define "IPV dose 2 Create":
  if "IPV dose 2" 
  then 'The first IPV dose should be administered from a minimum of 14 weeks of age (with the third dose of the diphtheria–tetanus–pertussis vaccine [DTP3] or pentavalent vaccine [penta3]), with the second IPV dose being given at least 4 months later (possibly coinciding with other vaccines administered at 9 months of age).' + '
Due Date: ' + ToString("IPV dose 2 Due Date")
  else ''

/*
@dynamicValue: IPV dose 2 Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Type of poliovirus dose" = "IPV") + 4 months
*/
define "IPV dose 2 Due Date":
  if "IPV dose 2" then Encounter."Date of Latest IPV Dose" + 4 months
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
@output: bOPV dose 3
@description: Provision of bOPV dose 3
@trigger: Second bOPV dose from the primary series was administered
Count of vaccines administered (where "Type of dose" = "Primary series" and "Type of poliovirus dose" = "bOPV") = 2
@triggerDate: Latest "Date and time of vaccination" (where "Type of poliovirus dose" = "bOPV")
*/
define "bOPV dose 3":
  "Second bOPV dose from the primary series was administered" and not "Third bOPV dose from the primary series was administered. The primary series has been completed"

/*
@output: bOPV dose 3 Create
@create: The preferred schedule is to administer the 3 doses of bOPV starting from the minimum age of 6 weeks, with at least a 4 week-interval between doses.
*/
define "bOPV dose 3 Create":
  if "bOPV dose 3" 
  then 'The preferred schedule is to administer the 3 doses of bOPV starting from the minimum age of 6 weeks, with at least a 4 week-interval between doses.' + '
Due Date: ' + ToString("bOPV dose 3 Due Date")
  else ''

/*
@dynamicValue: bOPV dose 3 Due Date
@pseudocode: Latest "Date and time of vaccination" (where "Type of poliovirus dose" = "bOPV") + 4 weeks
*/
define "bOPV dose 3 Due Date":
  if "bOPV dose 3" then Encounter."Date of Latest bOPV Dose" + 4 weeks
  else null

/*
@dynamicValue: bOPV dose 3 Overdue
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "bOPV dose 3 Overdue":
  null

/*
@dynamicValue: bOPV dose 3 Expiration
@pseudocode: To be determined by Member States; however, there is no recommended overdue date and individuals are always eligible to be vaccinated.
*/
define "bOPV dose 3 Expiration":
  null

/*
@complete: Third bOPV dose from the primary series was administered. The primary series has been completed
@pseudocode: "Completed the primary vaccination series" = TRUE (where "Vaccine type" = "Poliovirus-containing vaccines")
*/
define "Third bOPV dose from the primary series was administered. The primary series has been completed":
  Encounter."Number of Polio bOPV Primary Series Doses Administered" >= 3

/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '18.Alt6w' then "bOPV dose 1" and "IPV dose 1"
    when Patient.id = '19.D0Abt6w3m' then "bOPV dose 1" and "IPV dose 1"
    when Patient.id = '21.D1Abt6w14wBlt4w' then "IPV dose 1" and "bOPV dose 2"
    when Patient.id = '22.D1Abt6w14wBgt4w' then "IPV dose 1" and "bOPV dose 2"
    when Patient.id = '23.Db1Agt14wBlt4w' then "IPV dose 1" and "bOPV dose 2"
    when Patient.id = '24.Db1Agt14wBgt4w' then "IPV dose 1" and "bOPV dose 2"
    when Patient.id = '25.DI1Agt14wIlt4m' then "IPV dose 2" and "bOPV dose 1"
    when Patient.id = '26.DI1Agt14wIgt4m' then "IPV dose 2" and "bOPV dose 1"
    when Patient.id = '27.DB2Abt6w14wBlt4w' then "IPV dose 1" and "bOPV dose 3"
    when Patient.id = '28.DB2Abt6w14wBgt4w' then "IPV dose 1" and "bOPV dose 3"
    when Patient.id = '29.DB2Agt14wBlt4w' then "IPV dose 1" and "bOPV dose 3"
    when Patient.id = '30.DB2Agt14wBgt4w' then "IPV dose 1" and "bOPV dose 3"
    when Patient.id = '31.DB1I1Blt4wIlt4m' then "IPV dose 2" and "bOPV dose 2"
    when Patient.id = '32.DB1I1Blt4wIgt4m' then "IPV dose 2" and "bOPV dose 2"
    when Patient.id = '33.DB1I1Bgt4wIlt4m' then "IPV dose 2" and "bOPV dose 2"
    when Patient.id = '34.DB1I1Bgt4wIgt4m' then "IPV dose 2" and "bOPV dose 2"
    when Patient.id = '35.DI2' then "bOPV dose 1"
    when Patient.id = '36.DB3Alt14w.' then "IPV dose 1"
    when Patient.id = '37.DB3Agt14w.' then "IPV dose 1"
    when Patient.id = '38.DB2I1Blt4wIlt4m' then "IPV dose 2" and "bOPV dose 3"
    when Patient.id = '39.DB2I1Blt4wIgt4m' then "IPV dose 2" and "bOPV dose 3"
    when Patient.id = '40.DB2I1Bgt4wIlt4m' then "IPV dose 2" and "bOPV dose 3"
    when Patient.id = '41.DB2I1Bgt4wIgt4m' then "IPV dose 2" and "bOPV dose 3"
    when Patient.id = '42.DB1I2Blt4w' then "bOPV dose 2"
    when Patient.id = '43.DB1I2Bgt4w' then "bOPV dose 2"
    when Patient.id = '44.DB3I1Ilt4m' then "IPV dose 2"
    when Patient.id = '45.DB3I1Igt4m' then "IPV dose 2"
    when Patient.id = '46.DB2I2Blt4w' then "bOPV dose 3"
    when Patient.id = '47.DB2I2Bgt4w' then "bOPV dose 3"
    when Patient.id = '48.DB3I2' then "Third bOPV dose from the primary series was administered. The primary series has been completed"
      and "Second IPV dose from the primary series was administered"

    else 'No test case set'
  end
