Instance: SampleVaccinationMessageHeader
InstanceOf: ICSRMessageHeader
Title: "Sample MessageHeader for Vaccination"
Description: "A sample MessageHeader for ICSR Vaccination submissions."
* id = "US-IBM-Vaccination-fad94c04-29e7-5b37-e535-a8aad123cf9a"
* extension[messageProcessingCategory].valueCode = http://hl7.org/fhir/message-significance-category#notification
* destination.endpoint = "http://example.org/CBERVaccination"
* source.endpoint = "http://example.org/SENDER-IDENTIFIER"
* sender = Reference(SenderOrganization)
* eventCoding = HL7ActCode#PAT_ADV_EVNT "Patient Adverse Event"
* reason = http://hl7.org/fhir/us/medmorph/CodeSystem/us-ph-triggerdefinition-namedevents#received-public-health-report
* focus = Reference(SampleVaccinationReport)

Instance: SampleTransfusionMessageHeader
InstanceOf: ICSRMessageHeader
Title: "Sample MessageHeader for Transfusion"
Description: "A sample MessageHeader for Transfusion ICSR submissions."
* id = "US-IBM-Transfusion-fad94c04-29e7-5b37-e535-a8aad123cf9a"
* extension[messageProcessingCategory].valueCode = http://hl7.org/fhir/message-significance-category#notification
* destination.endpoint = "http://example.org/CBERTransfusion"
* destination.receiver = Reference(ReceiverOrganization)
* source.endpoint = "http://example.org/SENDER-IDENTIFIER"
* sender = Reference(SenderOrganization)
* eventCoding = HL7ActCode#PAT_ADV_EVNT "Patient Adverse Event"
* reason = http://hl7.org/fhir/us/medmorph/CodeSystem/us-ph-triggerdefinition-namedevents#received-public-health-report
* focus = Reference(SampleTransfusionReport)

Instance: ConnectathonTransfusionMessageHeader
InstanceOf: ICSRMessageHeader
Title: "Sample MessageHeader for Transfusion report for Connecathon"
Description: "MessageHeader for Connectathon Transfusion ICSR submission."
* id = "beafb541-3eab-eb9e-1bf1-5fa477d56e77"
* meta.lastUpdated = 2021-01-05T14:14:39+06:00
* extension[messageProcessingCategory].valueCode = http://hl7.org/fhir/message-significance-category#notification
* destination.endpoint = "http://example.org/ZZFDA"
* destination.receiver = Reference(FDA)
* source.endpoint = "http://example.org/BEST-Pilot"
* sender = Reference(BESTPrototype)
* eventCoding = HL7ActCode#PAT_ADV_EVNT "Patient Adverse Event"
* reason = http://hl7.org/fhir/us/medmorph/CodeSystem/us-ph-triggerdefinition-namedevents#received-public-health-report
* focus = Reference(TransfusionExample)

Instance: ConnectathonVaccinationMessageHeader
InstanceOf: ICSRMessageHeader
Title: "Sample MessageHeader for Vaccination report for Connecathon"
Description: "MessageHeader for Connectathon Vaccination ICSR submission."
* id = "US-IBM-e380bc14-2a03-7b64-c3f5-22daea2aa495"
* meta.lastUpdated = 2021-01-05T14:24:44+05:00
* extension[messageProcessingCategory].valueCode = http://hl7.org/fhir/message-significance-category#notification
* destination.endpoint = "http://example.org/CBERVaccination"
* source.endpoint = "http://example.org/BEST-Pilot"
* sender = Reference(VaccinationSender)
* eventCoding = HL7ActCode#PAT_ADV_EVNT "Patient Adverse Event"
* reason = http://hl7.org/fhir/us/medmorph/CodeSystem/us-ph-triggerdefinition-namedevents#received-public-health-report
* focus = Reference(VaccinationExample)

Instance: FDA
InstanceOf: MessageOrganization
Title: "Transfusion FDA Organization"
Description: "How to represent FDA in ICSR Transfusion submissions."
* extension[departmentName].valueString = "Office of Surveillance and Epidemiology"
* type = OrgType#2 "Regulatory Authority"
* active = true
* name = "FDA"
* telecom[Email].value = "faersesub@fda.hhs.gov"
* address.line = "10903 New Hampshire Avenue"
* address.city = "Silver Spring"
* address.state = "MD"
* address.postalCode = "20993"
* address.country = "US"
* contact.name.given = "Transfusion"

Instance: BESTPrototype
InstanceOf: MessageOrganization
Title: "Transfusion BEST Prototype"
Description: "The BEST organization that is sending ICSR submissions."
* active = true
* name = "BEST-Prototype"

Instance: TransfusionExample
InstanceOf: ICSRComposition
Title: "Transfusion Sample ICSR Report"
Description: "Connectathon Transfusion Sample Report."
* category = ReportType#1 "Spontaneous report"
* identifier.value = "BEST_beafb541-3eab-eb9e-1bf1-5fa477d56e77"
* subject = Reference(BESTPatient)
* date = 2021-01-05
* author = Reference(BESTAuthorRole)
* author.extension[primarySource].valueBoolean = true
* extension[firstReceiveDate].valueDateTime = 2021-01-05
* extension[mostRecentInfoDate].valueDateTime = 2021-01-05
* extension[additionalDocuments].extension[availableFlag].valueBoolean = false
* extension[expeditedReport].extension[localCriteriaFlag].valueBoolean = false
* extension[expeditedReport].extension[localCriteriaReportType].valueCodeableConcept = LocalCriteriaReportType#2 "Non-Expedited AE"
* extension[otherCaseIdentifier].valueIdentifier.system = "urn:oid:2.16.840.1.113883.3.989.2.1.3.2"
* extension[otherCaseIdentifier].valueIdentifier.value = "BEST_beafb541-3eab-eb9e-1bf1-5fa477d56e77"
* extension[firstSenderType].valueCodeableConcept = SenderType#2 "Other"
* extension[combinationProductReport].valueBoolean = false
* section[PatientInformation].entry = Reference(BESTPatientAgeGroup)
* section[RelevantMedicalHistory].text.status = #generated
* section[RelevantMedicalHistory].text.div = "<div xmlns='http://www.w3.org/1999/xhtml'>NI</div>"
* section[ReactionEvent].text.status = #generated
* section[ReactionEvent].text.div = "<div xmlns='http://www.w3.org/1999/xhtml'>Allergic transfusion reaction</div>"
* section[ReactionEvent].entry = Reference(TransfusionExampleEvent)
* section[DrugInformation].text.status = #generated
* section[DrugInformation].text.div = "<div xmlns='http://www.w3.org/1999/xhtml'>Description code for blood products: E7003,
Blood group and type: N/A
Blood processing type: Apheresis PLATELETS|ACD-A&gt;PAS-C/XX/20-24C|ResLeu:&amp;lt;5E6|2nd container
</div>"
* section[DrugInformation].entry[0] = Reference(TransfusionExampleTransfusion)
* section[DrugInformation].entry[1] = Reference(TransfusionEpinephrine)
* section[DrugInformation].entry[2] = Reference(TransfusionDiphenhydramine)
* section[CaseNarrative].text.status = #generated
* section[CaseNarrative].text.div = "<div xmlns='http://www.w3.org/1999/xhtml'>Header: FDA CBER BEST Automated AE Reporting Prototype Case
BEST Detection Phenotype Algorithm: Phenotype link: rules-cd
BEST Certainty: Definite
BEST Severity: Non-Severe
BEST Imputability: Probable
Form Type: 3500
Contact Method: Email
Adverse Event: 1
Center to which the case is being routed to: CBER
Whether the case is being sent to DQRS: false
Whether the report is related to drugs or food/cosmetics: 1
Whether the blood report is of type Transfusion or Collection: 2
Patient Race Code: 2f,
Blood group of patient: N/A,
Onset location for reaction: MedStar Location
Description code for blood products: N/A,
Blood group and type: N/A
Blood processing type: N/A
Product available for evaluation: 2
Volume of transfusion: NI
NHSN Workup: NI
Preliminary investigation results: Developed rash &amp;#38; stridor following transfusion prbc for anemia. Tx with benadryl &amp;#38; epinephrine &amp;#38; sx improved., Adverse Event Type Imputability: Blood Transfusion - Certainty: Definite;
Notes: 
	1. notes, Eval+Plan Note, For admission to Hosp with Dx Anemia.  Transfuse PRBC now., Date 20020109;
	2. notes, Eval+Plan Note, Patient has developed a new maculopapular rash following transfusion. Will give Benadryl 25 mg., Date 20020109;
	3. notes, Eval+Plan Note, New onset Stridor following transfusion. Will give Epinephrine .5mg, and do transfusion Rxn workup, Date 20020109;
	4. notes, Eval+Plan Note, RN note - Administered Benadryl 25mg IV for skin sx. After 30 min pt. reports some improvement in  skin symptoms, Date 20020109
Labs, Vitals, and Tests: 
	1. labs, Diastolic Blood Pressure, 75.918 mm[Hg], Date 20020109;
	2. labs, Systolic Blood Pressure, 123.08 mm[Hg], Date 20020109;
	3. labs, Physical findings of Skin, generalized rash, Date 20020109;
	4. labs, Respiratory status finding, Stridor, Date 20020109;
Illness at Time of Vaccination: 
	1. illness, Problem, Anemia, Date 20020109;</div>"

Instance: BESTAuthorRole
InstanceOf: AuthorPractitionerRole
Title: "BEST Author Role of ICSR reports"
Description: "The role of the reporter in an ICSR report"
* code = QualificationType#1 "Physician"
* practitioner = Reference(BESTAuthor)
* organization = Reference(BESTPrototype)
* telecom[0].system = #email
* telecom[0].value = "admin@admin.com"

Instance: BESTAuthor
InstanceOf: AuthorPractitioner
Title: "BEST Author of ICSR Reports"
Description: "The author information for an ICSR report"
* name.family = "NI"
* identifier.system = "http://hl7.org/fhir/sid/us-npi"
* identifier.value = "NI"

Instance: BESTPatient
InstanceOf: ICSRPatient
Title: "BEST Patient for Transfusion Sample"
Description: "A sample Patient for the Transfusion Sample Report."
* name.family = "CM"
* gender = #female
* birthDate = "1999-06-24"
* identifier.system = "http://hl7.org/fhir/sid/us-ssn"
* identifier.value = "123456789"

Instance: BESTPatientAgeGroup
InstanceOf: PatientAgeGroup
Title: "BEST Patient Age Group"
Description: "The age group of the BEST Patient."
* valueCodeableConcept = AgeGroup#5 "Adult"
* subject = Reference(BESTPatient)
* status = #final

Instance: TransfusionExampleEvent
InstanceOf: TransfusionAdverseEvent
Title: "Transfusion Sample Event"
Description: "Sample Transfusion Event created for Connectathon."
* extension[ageAtTimeOfOnset].valueAge = 1 'a'
* event = MedDRA#10066173 "Allergic transfusion reaction"
* subject = Reference(BESTPatient)
* date = 2000-01-01
* date.extension[endDate].valueDateTime = 2019-01-20
* date.extension[eventDuration].valueDuration = 19.05 'a'
* seriousness = http://terminology.hl7.org/CodeSystem/adverse-event-seriousness#serious
* suspectEntity[Transfusion].instance = Reference(TransfusionExampleTransfusion)
* suspectEntity[Transfusion].causality.productRelatedness = "Suspect"
* suspectEntity[1].instance = Reference(TransfusionEpinephrine)
* suspectEntity[1].causality.productRelatedness = "Concomitant"
* suspectEntity[2].instance = Reference(TransfusionDiphenhydramine)
* suspectEntity[2].causality.productRelatedness = "Concomitant"

Instance: TransfusionExampleTransfusion
InstanceOf: ICSRTransfusion
Title: "Transfusion Suspect Transfusion"
Description: "Sample Transfusion Transfusion for Connectathon."
* performedDateTime = 2002-01-09
* subject = Reference(BESTPatient)
* status = #completed
* code = CPT4#36430
* extension[usedProductAmount].valueQuantity = 1 '{unit}' "unit"
* usedReference.extension[usedProduct].valueReference = Reference(TransfusionBloodProduct)
* usedReference.display = "Apheresis PLATELETS|ACD-A>PAS-C/XX/20-24C|ResLeu:<5E6|2nd container"

Instance: TransfusionBloodProduct
InstanceOf: ICSRBloodProduct
Title: "Sample Blood Product"
Description: "Sample Transfusion Blood Product"
* productCategory = #cells
* productCode = ISBT#E7003 "Apheresis PLATELETS|ACD-A>PAS-C/XX/20-24C|ResLeu:<5E6|2nd container"
* collection.extension[donationIdentificationNumber].valueIdentifier.value = "G101610840386"
* collection.extension[donationIdentificationNumber].valueIdentifier.system = "http://example.org/bloodDonationNumber"

Instance: SampleConvalescentPlasma
InstanceOf: ICSRConvalescentPlasma
Title: "Sample Convalescent Plasma"
Description: "An example of COVID-19 Convalescent Plasma as a blood product"
* productCode = https://iccbba.org/standardterminology#E9754 "COVID-19 Convalescent Plasma"
* collection.extension[donationIdentificationNumber].valueIdentifier.value = "G101610840386"
* collection.extension[donationIdentificationNumber].valueIdentifier.system = "http://example.org/bloodDonationNumber"


Instance: TransfusionEpinephrine
InstanceOf: ICSRMedicationAdministration
Title: "Transfusion Epinephrine Administration"
Description: "Epinephrine Administration for Connectathon Transfusion report."
* subject = Reference(BESTPatient)
* status = #completed
* medicationCodeableConcept = RxNorm#3992 "Epinephrine"
* effectiveDateTime = 2002-01-09

Instance: TransfusionDiphenhydramine
InstanceOf: ICSRMedicationAdministration
Title: "Transfusion Diphenhydramine Administration"
Description: "Diphenhydramine Administration for Connectathon Transfusion report."
* subject = Reference(BESTPatient)
* status = #completed
* medicationCodeableConcept = RxNorm#3498 "Diphenhydramine"
* effectiveDateTime = 2002-01-09

Instance: ConnectathonTransfusionBundle
InstanceOf: ICSRBundle
Title: "Transfusion Bundle for Connectathon Sample"
Description: "The Transfusion Bundle for the Connecathon sample."
* entry[Message].fullUrl = "MessageHeader/beafb541-3eab-eb9e-1bf1-5fa477d56e77"
* entry[Message].resource = ConnectathonTransfusionMessageHeader
* entry[1].fullUrl = "Composition/TransfusionExample"
* entry[1].resource = TransfusionExample
* entry[2].fullUrl = "Organization/FDA"
* entry[2].resource = FDA
* entry[3].fullUrl = "Organization/BESTPrototype"
* entry[3].resource = BESTPrototype
* entry[4].fullUrl = "PractitionerRole/BESTAuthorRole"
* entry[4].resource = BESTAuthorRole
* entry[5].fullUrl = "Practitioner/BESTAuthor"
* entry[5].resource = BESTAuthor
* entry[6].fullUrl = "Patient/BESTPatient"
* entry[6].resource = BESTPatient
* entry[7].fullUrl = "Observation/BESTPatientAgeGroup"
* entry[7].resource = BESTPatientAgeGroup
* entry[8].fullUrl = "AdverseEvent/TransfusionExampleEvent"
* entry[8].resource = TransfusionExampleEvent
* entry[9].fullUrl = "Procedure/TransfusionExampleTransfusion"
* entry[9].resource = TransfusionExampleTransfusion
* entry[10].fullUrl = "BiologicallyDerivedProduct/TransfusionBloodProduct"
* entry[10].resource = TransfusionBloodProduct
* entry[11].fullUrl = "MedicationAdministration/TransfusionEpinephrine"
* entry[11].resource = TransfusionEpinephrine
* entry[12].fullUrl = "MedicationAdministration/TransfusionDiphenhydramine"
* entry[12].resource = TransfusionDiphenhydramine

Instance: VaccinationSender
InstanceOf: MessageOrganization
Title: "Vaccination Sending Organization"
Description: "Connecathon Vaccination Sender"
* extension[departmentName].valueString = "sender department"
* type = OrgType#1 "Pharmaceutical Company"
* active = true
* name = "sender organization"
* telecom[Phone].value = "+01 123 456 78"
* telecom[Fax].value = "+01 123 456 89"
* telecom[Email].value = "email@city.us"
* address.line = "street"
* address.city = "city"
* address.state = "CA"
* address.postalCode = "postcode"
* address.country = "US"
* contact.name.given = "sender gname"
* contact.name.family = "sender fname"
* contact.name.prefix = "sender title"

Instance: VaccinationExample
InstanceOf: ICSRComposition
Title: "Vaccination Sample ICSR Report"
Description: "Connectathon Vaccination Sample Report."
* category = ReportType#1 "Spontaneous report"
* identifier.value = "US-IBM-e380bc14-2a03-7b64-c3f5-22daea2aa495"
* subject = Reference(VaccinationPatient)
* date = 2021-01-05T14:24:44+05:00
* category = ReportType#1 "Spontaneous report"
* author = Reference(VaccinationAuthorRole)
* author.extension[primarySource].valueBoolean = true
* extension[firstReceiveDate].valueDateTime = 2021-01-05
* extension[mostRecentInfoDate].valueDateTime = 2021-01-05
* extension[additionalDocuments].extension[availableFlag].valueBoolean = false
* extension[expeditedReport].extension[localCriteriaFlag].valueBoolean = false
* extension[expeditedReport].extension[localCriteriaReportType].valueCodeableConcept = LocalCriteriaReportType#2 "Non-Expedited AE"
* extension[otherCaseIdentifier].valueIdentifier.system = "urn:oid:2.16.840.1.113883.3.989.2.1.3.2"
* extension[otherCaseIdentifier].valueIdentifier.value = "US-IBM-e380bc14-2a03-7b64-c3f5-22daea2aa495"
* extension[firstSenderType].valueCodeableConcept = SenderType#1 "Regulator"
* extension[combinationProductReport].valueBoolean = false
* section[RelevantMedicalHistory].text.status = #generated
* section[RelevantMedicalHistory].text.div = "<div xmlns='http://www.w3.org/1999/xhtml'>Long term (current) use of anticoagulants</div>"
* section[ReactionEvent].text.status = #generated
* section[ReactionEvent].text.div = "<div xmlns='http://www.w3.org/1999/xhtml'>Developed acute facial nerve paralysis after ED administration of influenza vaccine</div>"
* section[ReactionEvent].entry = Reference(VaccinationExampleEvent)

* section[DrugInformation].text.status = #generated
* section[DrugInformation].text.div = "<div xmlns='http://www.w3.org/1999/xhtml'>ED administration of influenza vaccine</div>"
* section[DrugInformation].entry[0] = Reference(VaccinationExampleImmunization)
* section[DrugInformation].entry[1] = Reference(VaccinationHydrocortisoneAdministration)

* section[CaseNarrative].text.status = #generated
* section[CaseNarrative].text.div = "<div xmlns='http://www.w3.org/1999/xhtml'>Header: FDA CBER BEST Automated AE Reporting Prototype Case
BEST Detection Phenotype Algorithm: sharepoint link
BEST Certainty: Definite
BEST Severity: Non-Severe
BEST Causality: Probable
Onset location for reaction:
Preliminary investigation results: Developed acute facial nerve paralysis after ED administration of influenza vaccine;
Reaction Type: vax_bells_palsy;
Illness at Time of Vaccination: 
	1. illness, Problem, Chronic systolic (congestive) heart failure, Date 20170430;
Notes: 
	1. notes, Progress Note - Nurse, Patient Care Documentation, Progress Note : Patient suffered  face weakness  from unknown cause. Patient had idiopathic facial nerve palsy and showed rapid progression. Palsy improved  lot facial paralysis identified., Date 20170423;</div>"

Instance: VaccinationAuthorRole
InstanceOf: AuthorPractitionerRole
Title: "Vaccination Author Role of ICSR reports"
Description: "The role of the reporter in an ICSR report"
* code = QualificationType#1 "Physician"
* practitioner = Reference(VaccinationAuthor)
* organization = Reference(VaccinationSender)
* telecom[0].system = #email
* telecom[0].value = "admin@admin.com"
* telecom[1].system = #phone
* telecom[1].value = "3333333333"

Instance: VaccinationAuthor
InstanceOf: AuthorPractitioner
Title: "Vaccination Author of ICSR Reports"
Description: "The author information for a Vaccination ICSR report"
* name.given = "asdhj"
* name.family = "Admin"
* identifier.system = "http://hl7.org/fhir/sid/us-npi"
* identifier.value = "NI"
* address.country = "US"

Instance: VaccinationPatient
InstanceOf: ICSRPatient
Title: "Vaccination Patient for Transfusion Sample"
Description: "A sample Patient for the Vaccination Sample Report."
* name.family = "LNAME"
* name.given = "FNAME"
* gender = #male
* birthDate = "1955-07-22"
* identifier.system = "http://hl7.org/fhir/sid/us-ssn"
* identifier.value = "123456789"

Instance: VaccinationExampleEvent
InstanceOf: VaccinationAdverseEvent
Title: "Vaccination Sample Event"
Description: "Sample Vaccination Event created for Connectathon."
* event = MedDRA#10004223 "Bell's Palsy"
* subject = Reference(VaccinationPatient)
* date = 2017-04-23
* seriousness = http://terminology.hl7.org/CodeSystem/adverse-event-seriousness#serious
* seriousness.extension[seriousness].valueCodeableConcept = Seriousness#26
* outcome = http://terminology.hl7.org/CodeSystem/adverse-event-outcome#recovering
* suspectEntity[Immunization].instance = Reference(VaccinationExampleImmunization)
* suspectEntity[Immunization].causality.productRelatedness = "Suspect"
* suspectEntity[1].instance = Reference(VaccinationHydrocortisoneAdministration)
* suspectEntity[1].causality.productRelatedness = "Concomitant"

Instance: VaccinationHydrocortisoneAdministration
InstanceOf: ICSRMedicationAdministration
Title: "Vaccination Hydrocortisone Administration"
Description: "Hydrocortisone Administration for Connectathon Vaccination report."
* subject = Reference(VaccinationPatient)
* status = #completed
* medicationCodeableConcept = RxNorm#197782
* effectiveDateTime = 2017-04-23

Instance: VaccinationExampleImmunization
InstanceOf: ICSRImmunization
Title: "Vaccination Sample Immunization for Connectathon Sample"
Description: "Sample Immunization information for Vaccination Sample"
* patient = Reference(VaccinationPatient)
* status = #completed
* vaccineCode = NDC#7046101903
* occurrenceDateTime = 2017-04-23
* primarySource = false
* extension[ageAtVaccination].valueAge = 12 'y' "years"

Instance: ConnectathonVaccinationBundle
InstanceOf: ICSRBundle
Title: "Vaccination Bundle for Connectathon Sample"
Description: "The Vaccination Bundle for the Connecathon sample."
* identifier.system = "urn:oid:2.16.840.1.113883.3.989.2.1.3.22"
* identifier.value = "BATCH20210105142444-0500533f2636-a404-13c5-10e3-7d293893227a"
* timestamp = 2021-01-05T14:24:44-05:00
* entry[Message].fullUrl = "MessageHeader/US-IBM-e380bc14-2a03-7b64-c3f5-22daea2aa495"
* entry[Message].resource = ConnectathonVaccinationMessageHeader
* entry[1].fullUrl = "Composition/VaccinationExample"
* entry[1].resource = VaccinationExample
* entry[2].fullUrl = "Organization/VaccinationSender"
* entry[2].resource = VaccinationSender
* entry[3].fullUrl = "PractitionerRole/VaccinationAuthorRole"
* entry[3].resource = VaccinationAuthorRole
* entry[4].fullUrl = "Practitioner/VaccinationAuthor"
* entry[4].resource = VaccinationAuthor
* entry[5].fullUrl = "Patient/VaccinationPatient"
* entry[5].resource = VaccinationPatient
* entry[6].fullUrl = "AdverseEvent/VaccinationExampleEvent"
* entry[6].resource = VaccinationExampleEvent
* entry[7].fullUrl = "Immunization/VaccinationExampleImmunization"
* entry[7].resource = VaccinationExampleImmunization
* entry[8].fullUrl = "MedicationAdministration/VaccinationHydrocortisoneAdministration"
* entry[8].resource = VaccinationHydrocortisoneAdministration
