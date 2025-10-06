library IMMZEncounterElements

using FHIR version '4.0.1'

include FHIRHelpers version '4.0.1'

include WHOConcepts
include WHOCommon called WC
include WHOEncounterElements called WE

include IMMZConcepts called Concepts
include IMMZCommon called Common
include IMMZElements called Elements

parameter Today Date default Today()
parameter EncounterId String

context Patient

/**
 * @dataElement All Doses Administered to Patient
 */
define "Doses Administered to Patient":
  Elements."Doses Administered to Patient" I
    where I.occurrence.toInterval() same day or before Today

/*
@dataElement: Draft Medication Request for Patient
*/
define "Draft Medication Request for Patient":
  Elements."Draft Medication Request for Patient" MR
    where MR.encounter.references(EncounterId) 
      or MR.authoredOn.toInterval() same day or before Today
  	sort by date from (authoredOn as FHIR.dateTime) desc

/*
@dataElement Live attenuated vaccines
*/
define "Live Attenuated Vaccines":
  Elements."Live Attenuated Vaccines" I
    where I.occurrence.toInterval() same day or before Today

/*
@dataElement Date and time of last live attenuated vaccine
*/
define "Date of Latest Live Attenuated Vaccine":
  date from start of "Live Attenuated Vaccines".mostRecent().occurrence.toInterval()
  
/** 
 * @dataElement Patient age in years
 */
define "Current Patient Age In Years":
  AgeInYearsAt(Today)

/** 
 * @dataElement Patient age in months
 */
define "Current Patient Age In Months":
  AgeInMonthsAt(Today)

/** 
 * @dataElement Patient age in weeks
 */
define "Current Patient Age In Weeks":
  AgeInWeeksAt(Today)

/** 
 * @dataElement Patient age in days
 */
define "Current Patient Age In Days":
  AgeInDaysAt(Today)

/*
@input: No live vaccine was administered
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Live vaccine" = TRUE) IS NULL
*/
define "No live vaccine was administered":
  not exists("Live Attenuated Vaccines")

/*
@input: Live vaccine was administered in the last 4 weeks
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Live vaccine" = TRUE) < 4 weeks
*/
define "Live vaccine was administered in the last 4 weeks":
	"Date of Latest Live Attenuated Vaccine" is not null 
    and duration in weeks between "Date of Latest Live Attenuated Vaccine" and Today < 4

/*
@input: No live vaccine was administered in the last 4 weeks
@pseudocode: Today's date − latest "Date and time of vaccination" (where "Live vaccine" = TRUE) ≥ 4 weeks
*/
define "No live vaccine was administered in the last 4 weeks":
  not("Live vaccine was administered in the last 4 weeks")

/*
@input: The client is pregnant
@pseudocode: "Potential contraindications" = "Currently pregnant"
*/
define "The client is pregnant":
  exists "CI Currently pregnant Observation"
  or exists "CI Currently pregnant Condition"
  or exists WE."Pregnant Observation"

/*
@internal: Observation for currently pregnant
*/
define "CI Currently pregnant Observation":
  Elements."CI Currently pregnant Observation" O
    where O.encounter.references(EncounterId)
      or O.effective.toInterval() starts same day or after Today - 9 months

/*
@internal: Condition for currently pregnant
*/
define "CI Currently pregnant Condition":
  Elements."CI Currently pregnant Condition" C
    where C.prevalenceInterval() includes Today

/*
@input: The client has history of anaphylactic reactions
@pseudocode: "Potential contraindications" = "History of anaphylactic reactions"
*/
define "The client has history of anaphylactic reactions":
  exists "CI History of anaphylactic reactions Observation"
    or exists "CI History of anaphylactic reactions Condition"
    
/*
@internal: Observation for History of anaphylactic reactions
*/
define "CI History of anaphylactic reactions Observation":
  Elements."CI History of anaphylactic reactions Observation".encounterOrOnBefore(EncounterId, Today)

/*
@internal: Condition for History of anaphylactic reactions
*/
define "CI History of anaphylactic reactions Condition":
  Elements."CI History of anaphylactic reactions Condition" C
    where C.prevalenceInterval() includes Today

/*
@input: The client has history of severe allergic reactions
@pseudocode: "Potential contraindications" = "Severe allergic reactions"
*/
define "The client has history of severe allergic reactions":
  exists "CI Severe allergic reactions Observation"
    or exists "CI Severe allergic reactions Condition"
    
/*
@internal: Observation for Severe allergic reactions
*/
define "CI Severe allergic reactions Observation":
  Elements."CI Severe allergic reactions Observation".encounterOrOnBefore(EncounterId, Today)

/*
@internal: Condition for Severe allergic reactions
*/
define "CI Severe allergic reactions Condition":
  Elements."CI Severe allergic reactions Condition" C
    where C.prevalenceInterval() includes Today

/*
@input: The client is severely immunocompromised
@pseudocode: "Potential contraindications" = "Severely immunocompromised"
*/
define "The client is severely immunocompromised":
  exists "CI Severely immunocompromised Observation"
    or exists "CI Severely immunocompromised Condition"
    
/*
@internal: Observation for Severely immunocompromised
*/
define "CI Severely immunocompromised Observation":
  Elements."CI Severely immunocompromised Observation".encounterOrOnBefore(EncounterId, Today)

/*
@internal: Condition for Severely immunocompromised
*/
define "CI Severely immunocompromised Condition":
  Elements."CI Severely immunocompromised Condition" C
    where C.prevalenceInterval() includes Today

/*
@input: The client is severely immunosuppressed
@pseudocode: "Potential contraindications" = "Severely immunosuppressed"
*/
define "The client is severely immunosuppressed":
  exists "CI Severely immunosuppressed Observation"
    or exists "CI Severely immunosuppressed Condition"
    
/*
@internal: Observation for Severely immunosuppressed
*/
define "CI Severely immunosuppressed Observation":
  Elements."CI Severely immunosuppressed Observation".encounterOrOnBefore(EncounterId, Today)

/*
@internal: Condition for Severely immunosuppressed
*/
define "CI Severely immunosuppressed Condition":
  Elements."CI Severely immunosuppressed Condition" C
    where C.prevalenceInterval() includes Today

/*
@input: The client has a symptomatic HIV infection
@pseudocode: "Potential contraindications" = "Symptomatic HIV infection"
*/
define "The client has a symptomatic HIV infection":
  exists "CI Symptomatic HIV infection Observation"
    or exists "CI Symptomatic HIV infection Condition"
    
/*
@internal: Observation for Symptomatic HIV infection
*/
define "CI Symptomatic HIV infection Observation":
  Elements."CI Symptomatic HIV infection Observation".encounterOrOnBefore(EncounterId, Today)

/*
@internal: Condition for Symptomatic HIV infection
*/
define "CI Symptomatic HIV infection Condition":
  Elements."CI Symptomatic HIV infection Condition" C
    where C.prevalenceInterval() includes Today

/*
@input: The client has immunodeficiency syndromes
@pseudocode: "Potential contraindications" = "Immunodeficiency syndromes"
*/
define "The client has immunodeficiency syndromes":
  exists "CI Immunodeficiency syndromes Observation"
    or exists "CI Immunodeficiency syndromes Condition"
    
/*
@internal: Observation for Immunodeficiency syndromes
*/
define "CI Immunodeficiency syndromes Observation":
  Elements."CI Immunodeficiency syndromes Observation".encounterOrOnBefore(EncounterId, Today)

/*
@internal: Condition for Immunodeficiency syndromes
*/
define "CI Immunodeficiency syndromes Condition":
  Elements."CI Immunodeficiency syndromes Condition" C
    where C.prevalenceInterval() includes Today

/*
@input: The client is exposed to immunosuppressive treatment
@pseudocode: "Potential contraindications" = "Exposed to immunosuppressive treatment"
*/
define "The client is exposed to immunosuppressive treatment":
  exists "CI Exposed to immunosuppressive treatment Observation"
    or exists "CI Exposed to immunosuppressive treatment Condition"
    
/*
@internal: Observation for Exposed to immunosuppressive treatment
*/
define "CI Exposed to immunosuppressive treatment Observation":
  Elements."CI Exposed to immunosuppressive treatment Observation".encounterOrOnBefore(EncounterId, Today)

/*
@internal: Condition for Exposed to immunosuppressive treatment
*/
define "CI Exposed to immunosuppressive treatment Condition":
  Elements."CI Exposed to immunosuppressive treatment Condition" C
    where C.prevalenceInterval() includes Today

/*
@input: The client currently has a severe acute illness
@pseudocode: "Potential contraindications" = "Severe acute illness"
*/
define "The client currently has a severe acute illness":
  exists "CI Severe acute illness Observation"
    or exists "CI Severe acute illness Condition"
    
/*
@internal: Observation for Severe acute illness
*/
define "CI Severe acute illness Observation":
  Elements."CI Severe acute illness Observation".encounterOrOnBefore(EncounterId, Today)

/*
@internal: Condition for Severe acute illness
*/
define "CI Severe acute illness Condition":
  Elements."CI Severe acute illness Condition" C
    where C.prevalenceInterval() includes Today

/*
@input: The client has prior history of intussusception
@pseudocode: "Potential contraindications" = "Prior history of intussusception"
*/
define "The client has prior history of intussusception":
  exists "CI Prior history of intussusception Observation"
    or exists "CI Prior history of intussusception Condition"
    
/*
@internal: Observation for Prior history of intussusception
*/
define "CI Prior history of intussusception Observation":
  Elements."CI Prior history of intussusception Observation".encounterOrOnBefore(EncounterId, Today)

/*
@internal: Condition for Prior history of intussusception
*/
define "CI Prior history of intussusception Condition":
  Elements."CI Prior history of intussusception Condition" C
    where C.prevalenceInterval() includes Today

/*
@input: The client has altered immunocompetence
@pseudocode: "Potential contraindications" = "Altered immunocompetence"
*/
define "The client has altered immunocompetence":
  exists "CI Altered immunocompetence Observation"
    or exists "CI Altered immunocompetence Condition"
    
/*
@internal: Observation for Altered immunocompetence
*/
define "CI Altered immunocompetence Observation":
  Elements."CI Altered immunocompetence Observation".encounterOrOnBefore(EncounterId, Today)

/*
@internal: Condition for Altered immunocompetence
*/
define "CI Altered immunocompetence Condition":
  Elements."CI Altered immunocompetence Condition" C
    where C.prevalenceInterval() includes Today

/*
@input: The client has spina bifida
@pseudocode: "Potential contraindications" = "Spina bifida"
*/
define "The client has spina bifida":
  exists "CI Spina bifida Observation"
    or exists "CI Spina bifida Condition"
    
/*
@internal: Observation for Spina bifida
*/
define "CI Spina bifida Observation":
  Elements."CI Spina bifida Observation".encounterOrOnBefore(EncounterId, Today)

/*
@internal: Condition for Spina bifida
*/
define "CI Spina bifida Condition":
  Elements."CI Spina bifida Condition" C
    where C.prevalenceInterval() includes Today

/*
@input: The client has bladder exstrophy
@pseudocode: "Potential contraindications" = "Bladder exstrophy"
*/
define "The client has bladder exstrophy":
  exists "CI Bladder exstrophy Observation"
    or exists "CI Bladder exstrophy Condition"
    
/*
@internal: Observation for Bladder exstrophy
*/
define "CI Bladder exstrophy Observation":
  Elements."CI Bladder exstrophy Observation".encounterOrOnBefore(EncounterId, Today)

/*
@internal: Condition for Bladder exstrophy
*/
define "CI Bladder exstrophy Condition":
  Elements."CI Bladder exstrophy Condition" C
    where C.prevalenceInterval() includes Today

/*
@input: The client is immunocompromised
@pseudocode: "Potential contraindications" = "Immunocompromised"
*/
define "The client is immunocompromised":
  "Client is immunocompromised"
    or exists "CI Immunocompromised Observation"
    or exists "CI Immunocompromised Condition"

/*
@internal: Observation for Immunocompromised
*/
define "CI Immunocompromised Observation":
  Elements."CI Immunocompromised Observation".encounterOrOnBefore(EncounterId, Today)

/*
@internal: Condition for Immunocompromised
*/
define "CI Immunocompromised Condition":
  Elements."CI Immunocompromised Condition" C
    where C.prevalenceInterval() includes Today

/*
@input: The client is planning to get pregnant in next month
@pseudocode: "Potential contraindications" = "Planning to get pregnant in the next month"
*/
define "The client is planning to get pregnant in next month":
  exists "CI Planning to get pregnant in the next month Observation"
    or exists "CI Planning to get pregnant in the next month Condition"

/*
@internal: Observation for Planning to get pregnant in the next month
*/
define "CI Planning to get pregnant in the next month Observation":
  Elements."CI Planning to get pregnant in the next month Observation".encounterOrOnBefore(EncounterId, Today)

/*
@internal: Condition for Planning to get pregnant in the next month
*/
define "CI Planning to get pregnant in the next month Condition":
  Elements."CI Planning to get pregnant in the next month Condition" C
    where C.prevalenceInterval() includes Today

/*
@input: The client is receiving blood products
@pseudocode: "Potential contraindications" = "Receiving blood products"
*/
define "The client is receiving blood products":
  exists "CI Receiving blood products Observation"
    or exists "CI Receiving blood products Condition"

/*
@internal: Observation for Receiving blood products
*/
define "CI Receiving blood products Observation":
  Elements."CI Receiving blood products Observation".encounterOrOnBefore(EncounterId, Today)

/*
@internal: Condition for Receiving blood products
*/
define "CI Receiving blood products Condition":
  Elements."CI Receiving blood products Condition" C
    where C.prevalenceInterval() includes Today

/*
@input: The client has TB disease
@pseudocode: "Potential contraindications" = "TB disease"
*/
define "The client has TB disease":
  exists "CI TB disease Observation"
    or exists "CI TB disease Condition"

/*
@internal: Observation for TB disease
*/
define "CI TB disease Observation":
  Elements."CI TB disease Observation".encounterOrOnBefore(EncounterId, Today)

/*
@internal: Condition for TB disease
*/
define "CI TB disease Condition":
  Elements."CI TB disease Condition" C
    where C.prevalenceInterval() includes Today

/*
@input: The client is lactating
@pseudocode: "Potential contraindications" = "Breastfeeding"
*/
define "The client is lactating":
  exists "CI Breastfeeding Observation"
    or exists "CI Breastfeeding Condition"

/*
@internal: Observation for Breastfeeding
*/
define "CI Breastfeeding Observation":
  Elements."CI Breastfeeding Observation".encounterOrOnBefore(EncounterId, Today)

/*
@internal: Condition for Breastfeeding
*/
define "CI Breastfeeding Condition":
  Elements."CI Breastfeeding Condition" C
    where C.prevalenceInterval() includes Today

/*
@input: The client has acute gastroenteritis
@pseudocode: "Potential contraindications" = "Acute gastroenteritis"
*/
define "The client has acute gastroenteritis":
  exists "CI Acute gastroenteritis Observation"
    or exists "CI Acute gastroenteritis Condition"

/*
@internal: Observation for Acute gastroenteritis
*/
define "CI Acute gastroenteritis Observation":
  Elements."CI Acute gastroenteritis Observation".encounterOrOnBefore(EncounterId, Today)

/*
@internal: Condition for Acute gastroenteritis
*/
define "CI Acute gastroenteritis Condition":
  Elements."CI Acute gastroenteritis Condition" C
    where C.prevalenceInterval() includes Today

/*
@input: The client has moderate to severe fever
@pseudocode: "Potential contraindications" = "Moderate to severe fever"
*/
define "The client has moderate to severe fever":
  exists "CI Moderate to severe fever Observation"
    or exists "CI Moderate to severe fever Condition"

/*
@internal: Observation for Moderate to severe fever
*/
define "CI Moderate to severe fever Observation":
  Elements."CI Moderate to severe fever Observation".encounterOrOnBefore(EncounterId, Today)

/*
@internal: Condition for Moderate to severe fever
*/
define "CI Moderate to severe fever Condition":
  Elements."CI Moderate to severe fever Condition" C
    where C.prevalenceInterval() includes Today

/*
@input: The client has hypersensitivity to any component of the vaccine
@pseudocode: "Potential contraindications" = "Hypersensitivity to vaccine components"
*/
define "The client has hypersensitivity to any component of the vaccine":
  exists "CI Hypersensitivity to vaccine components Observation"
    or exists "CI Hypersensitivity to vaccine components Condition"

/*
@internal: Observation for Hypersensitivity to vaccine components
*/
define "CI Hypersensitivity to vaccine components Observation":
  Elements."CI Hypersensitivity to vaccine components Observation".encounterOrOnBefore(EncounterId, Today)

/*
@internal: Condition for Hypersensitivity to vaccine components
*/
define "CI Hypersensitivity to vaccine components Condition":
  Elements."CI Hypersensitivity to vaccine components Condition" C
    where C.prevalenceInterval() includes Today

/*
@input: The client is currently taking antibiotics
@pseudocode: "Potential contraindications" = "Taking antibiotics"
*/
define "The client is currently taking antibiotics":
  exists "CI Taking antibiotics Observation"
    or exists "CI Taking antibiotics Condition"

/*
@internal: Observation for Taking antibiotics
*/
define "CI Taking antibiotics Observation":
  Elements."CI Taking antibiotics Observation".encounterOrOnBefore(EncounterId, Today)

/*
@internal: Condition for Taking antibiotics
*/
define "CI Taking antibiotics Condition":
  Elements."CI Taking antibiotics Condition" C
    where C.prevalenceInterval() includes Today

/*
@input: The client has chronic gastrointestinal disease
@pseudocode: "Potential contraindications" = "Chronic gastrointestinal disease"
*/
define "The client has chronic gastrointestinal disease":
  exists "CI Chronic gastrointestinal disease Observation"
    or exists "CI Chronic gastrointestinal disease Condition"

/*
@internal: Observation for Chronic gastrointestinal disease
*/
define "CI Chronic gastrointestinal disease Observation":
  Elements."CI Chronic gastrointestinal disease Observation".encounterOrOnBefore(EncounterId, Today)

/*
@internal: Condition for Chronic gastrointestinal disease
*/
define "CI Chronic gastrointestinal disease Condition":
  Elements."CI Chronic gastrointestinal disease Condition" C
    where C.prevalenceInterval() includes Today



/*
@input: Client's HIV status is negative or unknown
@pseudocode: "HIV status" ≠ "HIV-positive"
*/
define "Client's HIV status is negative or unknown":
  not "Client's HIV status is positive"

/*
@input: Client's HIV status is positive
@pseudocode: "HIV status" = "HIV-positive"
*/
define "Client's HIV status is positive":
  exists( (Elements."HIV status Observation".encounterOrOnBefore(EncounterId, Today)) O
    where O.value ~ Concepts."HIV-positive" )

/*
@input: Client is currently receiving antiretroviral therapy
@pseudocode: "Currently on ART" = TRUE
*/
define "Client is currently receiving antiretroviral therapy":
  Elements."Currently on ART Observation".encounterOrOnBefore(EncounterId, Today).mostRecent().value = true

/*
@input: Client is currently not receiving antiretroviral therapy
@pseudocode: "Currently on ART" = FALSE
*/
define "Client is currently not receiving antiretroviral therapy":
  not "Client is currently receiving antiretroviral therapy"

/*
@internal: Immunologically stable Observation
*/
define "Immunologically stable Observation":
  Elements."Immunologically stable Observation".encounterOrOnBefore(EncounterId, Today)

/*
@input: Client is immunologically stable
@pseudocode: "Immunologically stable" = TRUE
*/
define "Client is immunologically stable":
  First("Immunologically stable Observation").value = true

/*
@input: Client is not immunologically stable
@pseudocode: "Immunologically stable" = FALSE
*/
define "Client is not immunologically stable":
  First("Immunologically stable Observation").value = false

/*
@internal: Immunologically stable Observation
*/
define "TB infection test result Observation":
  Elements."TB infection test result Observation".encounterOrOnBefore(EncounterId, Today)

/*
@input: Client's TB infection test result is negative
@pseudocode: "TB infection test result" = "Negative"
*/
define "Client's TB infection test result is negative":
  First( "TB infection test result Observation" ).value ~ Concepts."TB-Negative"
/*
@input: Client's TB infection test result is unknown (test not done or no result yet)
@pseudocode: "TB infection test result" IS NULL
*/
define "Client's TB infection test result is unknown (test not done or no result yet)":
  not exists( "TB infection test result Observation" ) or (
    not ("Client's TB infection test result is negative") and not ("Client's TB infection test result is positive")
  )
/*
@input: Client's TB infection test result is positive
@pseudocode: "TB infection test result" = "Positive"
*/
define "Client's TB infection test result is positive":
  First( "TB infection test result Observation" ).value ~ Concepts."TB-Positive"

/*
@internal: Clinically well Observation
*/
define "Clinically well Observation":
  Elements."Clinically well Observation".encounterOrOnBefore(EncounterId, Today)

/*
@input: Client is not clinically well
@pseudocode: "Clinically well" = FALSE
*/
define "Client is not clinically well":
  First( "Clinically well Observation" ).value = false

/*
@input: Client is clinically well
@pseudocode: "Clinically well" = TRUE
*/
define "Client is clinically well":
  First( "Clinically well Observation" ).value = true 

/*
@internal: Immunocompromised Observation
*/
define "Immunocompromised Observation":
  ([Observation: Concepts."Immunocompromised"] O
    sort by end of effective.toInterval() desc).complete()

/*
@input: Client is immunocompromised
@pseudocode: "Immunocompromised" = TRUE
*/
define "Client is immunocompromised":
  exists( "Immunocompromised Observation" ) and
  First( "Immunocompromised Observation" ).value = true 

/*
@input: Client is not immunocompromised
@pseudocode: "Immunocompromised" ≠ TRUE
*/
define "Client is not immunocompromised":
  not "Client is immunocompromised"

/*
@internal: Birth weight in grams Observation
*/
define "Birth weight in grams Observation":
  Elements."Birth weight in grams Observation".encounterOrOnBefore(EncounterId, Today)

define "Birth weight in grams Value":
  First("Birth weight in grams Observation").value as FHIR.Quantity

define "Birth weight in grams":
  "Birth weight in grams Value".value as FHIR.decimal

/*
@input: Client's weight at birth was over 2000 g
@pseudocode: "Birth weight in grams"  ≥ 2000
*/
define "Client's weight at birth was over 2000 g":
  "Birth weight in grams" >= 2000

/*
@input: Client's weight at birth was below 2000 g
@pseudocode: "Birth weight in grams" < 2000
*/
define "Client's weight at birth was below 2000 g":
  "Birth weight in grams" < 2000

/*
@internal: Preterm birth Observation
*/
define "Preterm birth Observation":
  Elements."Preterm birth Observation".encounterOrOnBefore(EncounterId, Today)

/*
@input: Client was not a premature infant at birth
@pseudocode: "Preterm birth" ≠  TRUE
*/
define "Client was not a premature infant at birth":
  not("Client was a premature infant at birth")

/*
@input: Client was a premature infant at birth
@pseudocode: "Preterm birth" =  TRUE
*/
define "Client was a premature infant at birth":
  exists( "Preterm birth Observation" O where O.value = true )

/*
@internal: Completed the primary vaccination series Observation
*/
define "Completed the primary vaccination series Observation":
  Elements."Completed the primary vaccination series Observation".encounterOrOnBefore(EncounterId, Today)

/*
@internal: At high risk for pneumococcal infection Observation
*/
define "At high risk for pneumococcal infection Observation":
  Elements."At high risk for pneumococcal infection Observation".encounterOrOnBefore(EncounterId, Today)

/*
@input: Client is at high risk for pneumococcal infection
@pseudocode: "At high risk for pneumococcal infection" = TRUE
*/
define "Client is at high risk for pneumococcal infection":
  exists( "At high risk for pneumococcal infection Observation" O where O.value = true )

/*
@input: Client is not at high risk for pneumococcal infection
@pseudocode: "At high risk for pneumococcal infection" = FALSE
*/
define "Client is not at high risk for pneumococcal infection":
  exists( "At high risk for pneumococcal infection Observation" O where O.value = false )

/*
@internal: Date when primary vaccination series was completed Observation
*/
define "Date when primary vaccination series was completed Observation":
  Elements."Date when primary vaccination series was completed Observation".encounterOrOnBefore(EncounterId, Today)

/*
@internal: Completed the booster series Observation
*/
define "Completed the booster series Observation":
  Elements."Completed the booster series Observation".encounterOrOnBefore(EncounterId, Today)