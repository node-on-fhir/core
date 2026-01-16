Invariant:    IMMZ-D-reqVType-1
Description:  "Required if input in IMMZ.D.DE19 vaccine type is Hepatitis B-containing vaccines OR Poliovirus-containing vaccines."
Expression:   "(%resource.vaccineType.value != 'DE6' and %resource.vaccineType.value != 'DE14') or $this.exists()"
Severity:     #error

Invariant:    IMMZ-D-reqVType-2
Description:  "Required if input in IMMZ.D.DE19 vaccine type is BCG vaccines"
Expression:   "%resource.vaccineType.value != 'DE1' or $this.exists()"
Severity:     #error

Invariant:    IMMZ-D-reqVType-3
Description:  "Required if input in IMMZ.D.DE19 vaccine type is BCG vaccines OR Typhoid vaccines"
Expression:   "(%resource.vaccineType.value != 'DE1' and %resource.vaccineType.value != 'DE21') or $this.exists()"
Severity:     #error

Invariant:    IMMZ-D-reqVType-4
Description:  "Required if input in IMMZ.D.DE19 vaccine type is BCG vaccines OR Hepatitis B-containing vaccines"
Expression:   "(%resource.vaccineType.value != 'DE1' and %resource.vaccineType.value != 'DE6') or $this.exists()"
Severity:     #error

Invariant:    IMMZ-D-reqVType-5
Description:  "Required if input in IMMZ.D.DE19 vaccine type is Poliovirus-containing vaccines"
Expression:   "%resource.vaccineType.value != 'DE14' or $this.exists()"
Severity:     #error

Invariant:    IMMZ-D-reqVType-6
Description:  "Required if input in IMMZ.D.DE19 vaccine type is Measles-containing vaccines"
Expression:   "%resource.vaccineType.value != 'DE9' or $this.exists()"
Severity:     #error

Invariant:    IMMZ-D-reqVType-7
Description:  "Required if input in IMMZ.D.DE19 vaccine type is Pneumococcal vaccines"
Expression:   "%resource.vaccineType.value != 'DE13' or $this.exists()"
Severity:     #error

Invariant:    IMMZ-D-reqVType-8
Description:  "Required if input in IMMZ.D.DE19 vaccine type is JE vaccines"
Expression:   "%resource.vaccineType.value != 'DE8' or $this.exists()"
Severity:     #error

Invariant:    IMMZ-D-reqVType-9
Description:  "Required if input in IMMZ.D.DE19 vaccine type is TBE vaccines"
Expression:   "%resource.vaccineType.value != 'DE20' or $this.exists()"
Severity:     #error

Invariant:    IMMZ-D-reqVType-10
Description:  "Required if input in IMMZ.D.DE19 vaccine type is Typhoid vaccines"
Expression:   "%resource.vaccineType.value != 'DE21' or $this.exists()"
Severity:     #error

Invariant:    IMMZ-D-reqVType-11
Description:  "Required if input in IMMZ.D.DE19 vaccine type is Cholera vaccines"
Expression:   "%resource.vaccineType.value != 'DE2' or $this.exists()"
Severity:     #error

Invariant:    IMMZ-D-reqVType-12
Description:  "Required if input in IMMZ.D.DE19 vaccine type is Meningococcal vaccines"
Expression:   "%resource.vaccineType.value != 'DE10' or $this.exists()"
Severity:     #error

Invariant:    IMMZ-D-reqVType-13
Description:  "Required if input in IMMZ.D.DE19 vaccine type is Hepatitis A-containing vaccines"
Expression:   "%resource.vaccineType.value != 'DE5' or $this.exists()"
Severity:     #error

Invariant:    IMMZ-D-reqVType-14
Description:  "Required if input in IMMZ.D.DE6 vaccine type is Hepatitis B-containing vaccines"
Expression:   "%resource.vaccineType.value != 'DE6' or $this.exists()"
Severity:     #error

Invariant:    IMMZ-D-reqVType-15
Description:  "Required if input in IMMZ.D.DE19 vaccine type is Rabies vaccines"
Expression:   "%resource.vaccineType.value != 'DE15' or $this.exists()"
Severity:     #error

Invariant:    IMMZ-D-reqVType-16
Description:  "Required if input in IMMZ.D.DE19 vaccine type is Dengue vaccines"
Expression:   "%resource.vaccineType.value != 'DE25' or $this.exists()"
Severity:     #error

Invariant:    IMMZ-D-reqPrimaryCompleted-1
Description:  "Required if input in IMMZ.D.DE203 Completed the primary vaccination series is Yes"
Expression:   "%resource.completedTheBoosterSeries.value = false or $this.exists()"
Severity:     #error

Invariant:    IMMZ-D-dateOccurred-1
Description:  "Date ≤ current date"
Expression:   "not($this.exists()) or $this.value <= today()"
Severity:     #error

Invariant:    IMMZ-D-dateTimeOccurred-1
Description:  "DateTime ≤ current DateTime"
Expression:   "not($this.exists()) or $this.value <= now()"
Severity:     #error

Invariant:    IMMZ-D-reqHIVPositive-1
Description:  "Required if input in IMMZ.D.DE204 HIV status is HIV-positive"
Expression:   "%resource.hivStatus.value != 'DE11' or $this.exists()"
Severity:     #error

Invariant:    IMMZ-D-reqTBTest-1
Description:  "Required if  input in IMMZ.D.DE243 Type of TB infection test performed IS NOT NULL"
Expression:   "not(%resource.typeOfTbInfectionTestPerformed.exists()) or $this.exists()"
Severity:     #error

Invariant:    IMMZ-D-reqGTEZero-1
Description:  "Must be positive decimal value greater than or equal to zero (≥0)"
Expression:   "not($this.exists()) or $this.value >= 0"
Severity:     #error



Logical:      IMMZD1
Title:        "IMMZ.D1.Capture or update client history"
Description:  "Data elements for the IMMZ.D1.Capture or update client history Data Dictionary Activity."

* ^name = "IMMZ_D1_Capture_or_update_client_history"
* ^status = #active
* ^meta.profile[+] = "http://hl7.org/fhir/uv/crmi/StructureDefinition/crmi-shareablestructuredefinition"
* ^meta.profile[+] = "http://hl7.org/fhir/uv/crmi/StructureDefinition/crmi-publishablestructuredefinition"
* ^version = "0.2.0"
* ^experimental = false
* ^publisher = "WHO"
* ^extension[+].url = "http://hl7.org/fhir/StructureDefinition/cqf-knowledgeCapability"
* ^extension[=].valueCode = #shareable
* ^extension[+].url = "http://hl7.org/fhir/StructureDefinition/artifact-versionAlgorithm"
* ^extension[=].valueCoding = http://hl7.org/fhir/version-algorithm#semver
* ^extension[+].url = "http://hl7.org/fhir/StructureDefinition/artifact-versionPolicy"
* ^extension[=].valueCodeableConcept = http://terminology.hl7.org/CodeSystem/artifact-version-policy-codes#metadata
* ^date = "2025-01-10"

* patient 1..1 Reference "Patient" "The patient."
* birthDose 0..1 boolean "Birth dose" "Indicates if the client received a dose within 24 hours of birth. Whether a birth dose is counted as part of the primary series will depend on the antigen"
  * obeys IMMZ-D-reqVType-1
  * ^code[+] = IMMZ.D#DE263
* typeOfDose 1..1 Coding "Type of dose" "The type of dose in a series that the client received "
* typeOfDose from IMMZ.D.DE258 (required)
  * ^code[+] = IMMZ.D#DE258
* completedThePrimaryVaccinationSeries 0..1 boolean "Completed the primary vaccination series" "Indicates if the client has completed the primary vaccination series of a product/antigen. If the client has not yet completed their primary series, it means they may be expected to receive more doses to complete their vaccination regimen for the respective product/antigen"
  * ^code[+] = IMMZ.D#DE203
* completedTheBoosterSeries 0..1 boolean "Completed the booster series" "Indicates if the client has completed the booster series of a product/antigen"
  * ^code[+] = IMMZ.D#DE257
* dateWhenPrimaryVaccinationSeriesWasCompleted 0..1 date "Date when primary vaccination series was completed" "The date when the client completed the primary vaccination series (per product/antigen)"
  * obeys IMMZ-D-reqPrimaryCompleted-1 and IMMZ-D-dateOccurred-1
  * ^code[+] = IMMZ.D#DE242
* hivStatus 0..1 Coding "HIV status" "The current HIV status of the client"
* hivStatus from IMMZ.D.DE204 (required)
  * ^code[+] = IMMZ.D#DE204
  * ^code[+] = $LNC#55277-8 "HIV Status"
  * ^code[+] = $SCT#278977008 "HIV status"
* pretermBirth 0..1 boolean "Preterm birth" "The infant was preterm; the mother gave birth to the infant when gestational age was less than 37 weeks"
  * ^code[+] = IMMZ.D#DE208
  * ^code[+] = $ICD11#KA21.4 "Preterm newborn"
  * ^code[+] = $LNC#76517-2 "Premature infant"
  * ^code[+] = $SCT#395507008 "Premature infant (finding)"
* immunocompromised 0..1 boolean "Immunocompromised" "The client is known to be immunocompromised. This means the client has a weakened immune system and having a reduced ability to fight infections and other diseases"
  * ^code[+] = IMMZ.D#DE209
  * ^code[+] = $ICD11#4B4Z "Diseases of the immune system, unspecified"
  * ^code[+] = $LNC#96381-9 "Immune status"
  * ^code[+] = $SCT#370388006 "Patient immunocompromised (finding)"
* currentlyOnArt 0..1 boolean "Currently on ART" "The client is currently receiving antiretroviral therapy (ART)"
  * obeys IMMZ-D-reqHIVPositive-1
  * ^code[+] = IMMZ.D#DE210
* typeOfTbInfectionTestPerformed 0..1 Coding "Type of TB infection test performed" "The type of tuberculosis (TB) infection test performed"
* typeOfTbInfectionTestPerformed from IMMZ.D.DE243 (required)
  * obeys IMMZ-D-reqVType-2
  * ^code[+] = IMMZ.D#DE243
* tbInfectionTestResult 0..1 Coding "TB infection test result" "Records the result of the TB infection test"
* tbInfectionTestResult from IMMZ.D.DE246 (required)
  * obeys IMMZ-D-reqTBTest-1
  * ^code[+] = IMMZ.D#DE246
* immunologicallyStable 0..1 boolean "Immunologically stable" "The client is living with HIV and is immunologically stable with CD4 count or percentage above a minimum as defined in the HIV guidelines"
  * obeys IMMZ-D-reqVType-3
  * ^code[+] = IMMZ.D#DE249
* clinicallyWell 0..1 boolean "Clinically well" "The client is living with HIV and is clinically well, as defined in HIV guidelines and WHO clinical staging"
  * obeys IMMZ-D-reqVType-2
  * ^code[+] = IMMZ.D#DE250
* birthWeightInGrams 0..1 decimal "Birth weight in grams" "Represents the client's birth weight value measures in grams"
  * obeys IMMZ-D-reqVType-4 and IMMZ-D-reqGTEZero-1
  * ^code[+] = IMMZ.D#DE211
  * ^code[+] = $ICD11#KA21 "Disorders of newborn related to short gestation or low birth weight, not elsewhere classified"
  * ^code[+] = $LNC#8339-4 "Birth weight measured"
* typeOfPoliovirusDose 0..1 Coding "Type of poliovirus dose" "The type of the poliovirus vaccine dose administered to the client"
* typeOfPoliovirusDose from IMMZ.D.DE212 (required)
  * obeys IMMZ-D-reqVType-5
  * ^code[+] = IMMZ.D#DE212
  * ^code[+] = $ICD11#XM0N50 "Poliomyelitis vaccines"
* artStartDate 0..1 date "ART start date" "The date on which the client started or restarted ART"
  * obeys IMMZ-D-reqVType-6 and IMMZ-D-dateOccurred-1
  * ^code[+] = IMMZ.D#DE215
* highRiskOfPneumococcalInfection  0..1 boolean "High risk of pneumococcal infection" "The client is at high risk for pneumococcal infection because of underlying medical conditions (i.e. HIV infection or sickle-cell disease)"
  * obeys IMMZ-D-reqVType-7
  * ^code[+] = IMMZ.D#DE251
* typeOfJeDose 0..1 Coding "Type of JE dose" "The type of Japanese encephalitis (JE) vaccine dose administered to the client"
* typeOfJeDose from IMMZ.D.DE216 (required)
  * obeys IMMZ-D-reqVType-8
  * ^code[+] = IMMZ.D#DE216
* typeOfTbeDose 0..1 Coding "Type of TBE dose" "The type of tick-borne encephalitis (TBE) vaccine dose administered"
* typeOfTbeDose from IMMZ.D.DE220 (required)
  * obeys IMMZ-D-reqVType-9
  * ^code[+] = IMMZ.D#DE220
* typeOfTyphoidDose 0..1 Coding "Type of typhoid dose" "The type of typhoid vaccine dose administered to the client"
* typeOfTyphoidDose from IMMZ.D.DE225 (required)
  * obeys IMMZ-D-reqVType-10
  * ^code[+] = IMMZ.D#DE225
* typeOfCholeraDose 0..1 Coding "Type of cholera dose" "The type of cholera vaccine dose administered to the client"
* typeOfCholeraDose from IMMZ.D.DE229 (required)
  * obeys IMMZ-D-reqVType-11
  * ^code[+] = IMMZ.D#DE229
* typeOfMeningococcalDose 0..1 Coding "Type of meningococcal dose" "The type of meningococcal vaccine dose administered to the client"
* typeOfMeningococcalDose from IMMZ.D.DE232 (required)
  * obeys IMMZ-D-reqVType-12
  * ^code[+] = IMMZ.D#DE232
* ageInMonthsWhenClientReceivedFirstMeningococcalDose 0..1 decimal "Age in months when client received first meningococcal dose" "The age in months when client received their first meningococcal dose"
  * obeys IMMZ-D-reqVType-12 and IMMZ-D-reqGTEZero-1
  * ^code[+] = IMMZ.D#DE236
* typeOfHepatitisADose 0..1 Coding "Type of hepatitis A dose" "The type of hepatitis A-containing vaccine dose administered to the client"
* typeOfHepatitisADose from IMMZ.D.DE237 (required)
  * obeys IMMZ-D-reqVType-13
  * ^code[+] = IMMZ.D#DE237
* typeOfHepatitisBDose 0..1 Coding "Type of hepatitis B dose" "The type of hepatitis B-containing vaccine dose administered to the client"
* typeOfHepatitisBDose from IMMZ.D.DE254 (required)
  * obeys IMMZ-D-reqVType-14
  * ^code[+] = IMMZ.D#DE254
* vnaLevel 0..1 decimal "VNA level" "Vaccine-induced neutralizing antibody (VNA) level, measured as a serum antibody concentration from the result of the concentrated, purified cell culture-derived and embryonated egg-based rabies vaccines (CCEEV)"
  * obeys IMMZ-D-reqVType-15
  * ^code[+] = IMMZ.D#DE240
* riskOfOccupationalExposureToRabiesVirus 0..1 boolean "Risk of occupational exposure to rabies virus" "Professional at risk of occupational exposure to rabies virus, particularly animal health workers. Also considered for medical professionals who regularly provide care to persons with rabies"
  * obeys IMMZ-D-reqVType-15
  * ^code[+] = IMMZ.D#DE253
* dengueSerostatus 0..1 Coding "Dengue serostatus" "Indicates the result of a serological test determining whether the client has antibodies against the dengue virus"
* dengueSerostatus from IMMZ.D.DE241 (required)
  * obeys IMMZ-D-reqVType-16
  * ^code[+] = IMMZ.D#DE241
* vaccineType 1..* Coding "Vaccine type" "Vaccine type/category that was administered or was to be administered. Any vaccine code available in the IMMZ.Z Vaccine library list of codes applies in this data element"
* vaccineType from IMMZ.Z.VS (required)
  * ^code[+] = IMMZ.D#DE19
  * ^code[+] = $LNC#39236-5 "Vaccine code (CPT [Current Procedural Terminology]) CPHS (Children's Preventative Health System)"
  * ^code[+] = $SCT#787859002 "Vaccine product (medicinal product)"
* dateAndTimeOfVaccination 1..1 dateTime "Date and time of vaccination" "Represents the visit/encounter date, which is the date and time when each vaccine was administered to the client"
  * ^code[+] = IMMZ.D#DE20
  * ^code[+] = $LNC#30952-6 "Date and time of vaccination"
* contactDate 0..1 dateTime "Contact date" "The date and time of the client's contact"
  * obeys IMMZ-D-dateTimeOccurred-1
  * ^code[+] = IMMZ.D#DE201
  * ^code[+] = $LNC#21975-8 "Date last contact"
  * ^code[+] = $SCT#406543005 "Date of visit"
* ancContactNumber 0..1 integer "ANC contact number" "The antenatal care (ANC) contact or visit number "
  * ^code[+] = IMMZ.D#DE202
  * ^code[+] = $LNC#75612-2 "Number of visits to this health-care entity in the last 12 months"
  * ^code[+] = $SCT#3401000175105 "Total number of prenatal care visits"
* doseNumber 1..1 integer "Dose number" "Vaccine dose number including dose number within series"
  * obeys IMMZ-D-reqGTEZero-1
  * ^code[+] = IMMZ.D#DE124


Mapping:    IMMZD1.to.Observation
Source:     IMMZD1
Target:     "http://smart.who.int/immunizations/StructureDefinition/IMMZObservation"
Title:      "Mapping from the IMMZ.D1 to the IMMZObservation profile"

* -> "Observation"
* patient -> "Observation.subject"
* birthDose -> "Observation.valueBoolean"
* completedThePrimaryVaccinationSeries -> "Observation.valueBoolean"
* completedTheBoosterSeries -> "Observation.valueBoolean"
* dateWhenPrimaryVaccinationSeriesWasCompleted -> "Observation.valueDateTime"
* hivStatus -> "Observation.valueCodeableConcept.coding"
* pretermBirth -> "Observation.valueBoolean"
* immunocompromised -> "Observation.valueBoolean"
* currentlyOnArt -> "Observation.valueBoolean"
* typeOfTbInfectionTestPerformed -> "Observation.valueCodeableConcept.coding"
* tbInfectionTestResult -> "Observation.valueCodeableConcept.coding"
* immunologicallyStable -> "Observation.valueBoolean"
* clinicallyWell -> "Observation.valueBoolean"
* birthWeightInGrams -> "Observation.valueQuantity.value"
* artStartDate -> "Observation.valueDateTime"
* highRiskOfPneumococcalInfection -> "Observation.valueBoolean"
* ageInMonthsWhenClientReceivedFirstMeningococcalDose -> "Observation.valueQuantity.value"
* vnaLevel -> "Observation.valueQuantity.value"
* riskOfOccupationalExposureToRabiesVirus -> "Observation.valueBoolean"
* dengueSerostatus -> "Observation.valueCodeableConcept.coding"
* contactDate -> "Observation.valueDateTime"
* ancContactNumber -> "Observation.valueInteger"


Mapping:    IMMZD1.to.Immunization
Source:     IMMZD1
Target:     "http://smart.who.int/immunizations/StructureDefinition/IMMZImmunization"
Title:      "Mapping from the IMMZ.D1 to the IMMZImmunization profile"

* -> "Immunization"
* patient -> "Immunization.patient"
* typeOfDose -> "Immunization.protocolApplied.series"
* typeOfPoliovirusDose -> "Immunization.extension[typeOfPolio].valueCodeableConcept.coding"
* typeOfJeDose -> "Immunization.extension[typeOfJe].valueCodeableConcept.coding"
* typeOfTbeDose -> "Immunization.extension[typeOfTbe].valueCodeableConcept.coding"
* typeOfTyphoidDose -> "Immunization.extension[typeOfTyphoid].valueCodeableConcept.coding"
* typeOfCholeraDose -> "Immunization.extension[typeOfCholera].valueCodeableConcept.coding"
* typeOfMeningococcalDose -> "Immunization.extension[typeOfMeningococcal].valueCodeableConcept.coding"
* typeOfHepatitisADose -> "Immunization.extension[typeOfHepatitisA].valueCodeableConcept.coding"
* typeOfHepatitisBDose -> "Immunization.extension[typeOfHepatitisB].valueCodeableConcept.coding"
* vaccineType -> "Immunization.vaccineCode"
* dateAndTimeOfVaccination -> "Immunization.occurrenceDateTime"
* doseNumber -> "Immunization.protocolApplied.doseNumberString"