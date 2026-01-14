
/*
 * Library: IMMZD5DTYellowfeverCILogic (IMMZ.D5.DT.Yellow fever contraindications)
 * Rule: Check for contraindications before administering the vaccine(s) due	
 * Decision Table: Age
 * Trigger: IMMZ.D5 Determine vaccine(s) to be administered based on contraindications
 */
library IMMZD5DTYellowfeverCILogic

using FHIR version '4.0.1'
include FHIRHelpers version '4.0.1'

include IMMZD5DTYellowfeverEncounterElements called Encounter

parameter Today Date default Today()

context Patient

/*
  @dynamicValue: Draft Medication Request ID for Yellow fever dose
  */
  define "Draft Medication Request ID for Yellow fever dose":
    First(Encounter."Draft Medication Request for Yellow fever dose").id


/*
@dynamicValue: Guidance
*/
define "Guidance":
  case
    when "Yellow fever vaccination is contraindicated" then "Yellow fever vaccination is contraindicated Guidance"
    when "Clinical judgement is required. Create a clinical note" then "Clinical judgement is required. Create a clinical note Guidance"
    when "Yellow fever vaccination could be contraindicated. Clinical judgement is required. Create a clinical note" then "Yellow fever vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Guidance"
    else ''
  end

define "Has Guidance":
  "Guidance" is not null and "Guidance" != ''

/*
@output: Yellow fever vaccination is contraindicated Case 1
@pseudocode: "Immunization recommendation status" = "Contraindicated"
*/
define "Yellow fever vaccination is contraindicated Case 1":
  Encounter."Client's age is less than 6 months"

/*
@output: Yellow fever vaccination is contraindicated Case 2
@pseudocode: "Immunization recommendation status" = "Contraindicated"
*/
define "Yellow fever vaccination is contraindicated Case 2":
  Encounter."The client is severely immunocompromised"

/*
@output: Yellow fever vaccination is contraindicated
@pseudocode: "Immunization recommendation status" = "Contraindicated"
*/
define "Yellow fever vaccination is contraindicated":
  "Yellow fever vaccination is contraindicated Case 1"
    or "Yellow fever vaccination is contraindicated Case 2"

/*
@output: Yellow fever vaccination is contraindicated Guidance
@guidance: Do not vaccinate client with yellow fever as yellow fever vaccination is contraindicated in client's aged less than 6 months.
@guidance: Do not vaccinate client with yellow fever as yellow fever vaccination is contraindicated in severely immunocompromised clients.
*/
define "Yellow fever vaccination is contraindicated Guidance":
  case
    when "Yellow fever vaccination is contraindicated Case 1" then 'Do not vaccinate client with yellow fever as yellow fever vaccination is contraindicated in client\'s aged less than 6 months.'
    when "Yellow fever vaccination is contraindicated Case 2" then 'Do not vaccinate client with yellow fever as yellow fever vaccination is contraindicated in severely immunocompromised clients.'
    else ''
  end

/*
@output: Clinical judgement is required. Create a clinical note Case 1
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create a clinical note Case 1":
  Encounter."Client's age is 6–9 months"

/*
@output: Clinical judgement is required. Create a clinical note Case 2
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create a clinical note Case 2":
  Encounter."Client's age is more than or equal to 60 years"

/*
@output: Clinical judgement is required. Create a clinical note Case 3
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create a clinical note Case 3":
  Encounter."The client is currently pregnant"

/*
@output: Clinical judgement is required. Create a clinical note Case 4
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create a clinical note Case 4":
  Encounter."The client is lactating"

/*
@output: Clinical judgement is required. Create a clinical note
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Clinical judgement is required. Create a clinical note":
  "Clinical judgement is required. Create a clinical note Case 1"
    or "Clinical judgement is required. Create a clinical note Case 2"
    or "Clinical judgement is required. Create a clinical note Case 3"
    or "Clinical judgement is required. Create a clinical note Case 4"

/*
@output: Clinical judgement is required. Create a clinical note Guidance
@guidance: Check if exceptions to age range is being met, consider risks of vaccination and make a clinical judgement. Vaccine is not recommended for those aged 6–8 months, except during epidemics when the risk of infection with the yellow fever virus is very high.
@guidance: Conduct a risk–benefit assessment taking into account the risk of acquiring yellow fever disease, consider risks of potential adverse events following immunization and make a clinical judgement.
@guidance: Conduct a risk–benefit assessment since yellow fever is a live vaccine and make a clinical judgement. Pregnant women may be vaccinated during epidemics at the direction of local health authorities.
@guidance: Conduct a risk–benefit assessment since yellow fever is a live vaccine and make a clinical judgement. Lactating women should be advised that the benefits of breastfeeding far outweigh alternatives.
*/
define "Clinical judgement is required. Create a clinical note Guidance":
  case
    when "Clinical judgement is required. Create a clinical note Case 1" then 'Check if exceptions to age range is being met, consider risks of vaccination and make a clinical judgement. Vaccine is not recommended for those aged 6–8 months, except during epidemics when the risk of infection with the yellow fever virus is very high.'
    when "Clinical judgement is required. Create a clinical note Case 2" then 'Conduct a risk–benefit assessment taking into account the risk of acquiring yellow fever disease, consider risks of potential adverse events following immunization and make a clinical judgement.'
    when "Clinical judgement is required. Create a clinical note Case 3" then 'Conduct a risk–benefit assessment since yellow fever is a live vaccine and make a clinical judgement. Pregnant women may be vaccinated during epidemics at the direction of local health authorities.'
    when "Clinical judgement is required. Create a clinical note Case 4" then 'Conduct a risk–benefit assessment since yellow fever is a live vaccine and make a clinical judgement. Lactating women should be advised that the benefits of breastfeeding far outweigh alternatives.'
    else ''
  end

/*
@output: Yellow fever vaccination could be contraindicated. Clinical judgement is required. Create a clinical note
@pseudocode: "Immunization recommendation status" = "Further evaluation needed"
*/
define "Yellow fever vaccination could be contraindicated. Clinical judgement is required. Create a clinical note":
  Encounter."The client has a history of severe allergic reactions"

/*
@output: Yellow fever vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Guidance
@guidance: Do not vaccinate client with yellow fever if client has severe hypersensitivity to egg antigens.
*/
define "Yellow fever vaccination could be contraindicated. Clinical judgement is required. Create a clinical note Guidance":
  'Do not vaccinate client with yellow fever if client has severe hypersensitivity to egg antigens.'


/*
@test: Test expected results based on example patients
*/
define "Test Validation":
  case
    when Patient.id = '16.0' then "Yellow fever vaccination is contraindicated Case 1" and "Guidance" = 'Do not vaccinate client with yellow fever as yellow fever vaccination is contraindicated in client\'s aged less than 6 months.'
    when Patient.id = '17.0' then "Clinical judgement is required. Create a clinical note Case 1" and "Guidance" = 'Check if exceptions to age range is being met, consider risks of vaccination and make a clinical judgement. Vaccine is not recommended for those aged 6–8 months, except during epidemics when the risk of infection with the yellow fever virus is very high.'
    when Patient.id = '18.0' then "Clinical judgement is required. Create a clinical note Case 2" and "Guidance" = 'Conduct a risk–benefit assessment taking into account the risk of acquiring yellow fever disease, consider risks of potential adverse events following immunization and make a clinical judgement.'
    when Patient.id = '19.1' then "Yellow fever vaccination could be contraindicated. Clinical judgement is required. Create a clinical note" and "Guidance" = 'Do not vaccinate client with yellow fever if client has severe hypersensitivity to egg antigens.'
    when Patient.id = '20.1' then "Yellow fever vaccination is contraindicated Case 2" and "Guidance" = 'Do not vaccinate client with yellow fever as yellow fever vaccination is contraindicated in severely immunocompromised clients.'
    when Patient.id = '21.1' then "Clinical judgement is required. Create a clinical note Case 3" and "Guidance" = 'Conduct a risk–benefit assessment since yellow fever is a live vaccine and make a clinical judgement. Pregnant women may be vaccinated during epidemics at the direction of local health authorities.'
    when Patient.id = '22.1' then "Clinical judgement is required. Create a clinical note Case 4" and "Guidance" = 'Conduct a risk–benefit assessment since yellow fever is a live vaccine and make a clinical judgement. Lactating women should be advised that the benefits of breastfeeding far outweigh alternatives.'
    else 'No test case set'
  end
