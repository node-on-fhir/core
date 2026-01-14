Profile: ICSRAdverseEvent
Parent: AdverseEvent
Id: icsr-adverseevent
Title: "ICSR Adverse Event"
Description: "The fields needed to submit an AdverseEvent for a ICSR Report."
* ^abstract = true
* extension contains AgeAtTimeOfOnset named ageAtTimeOfOnset 0..1
* identifier MS
* actuality MS
* actuality = #actual (exactly)
* category 0..* MS
* encounter MS
* encounter only Reference(USCoreEncounter)
* event 1..1 MS // Restrict the system to MedDRA
* event.coding.system = MedDRA (exactly)
* subject MS
* subject only Reference(ICSRPatient)
* date 0..1 MS
* date.extension contains EventDuration named eventDuration 0..1 MS
* date.extension contains EventEndDate named endDate 0..1 MS
* recorder MS
* recorder only Reference(AuthorPractitioner)
* seriousness 1..1 MS
* seriousness from ICSRAESeriousness (required)
* seriousness.extension contains EventSeriousness named seriousness 0..1 MS
* outcome MS
* location MS
* location only Reference(USCoreLocation)
* suspectEntity 1..* MS
* suspectEntity.instance MS
* suspectEntity.instance only Reference(ICSRImmunization or ICSRMedicationAdministration or ICSRTransfusion)
* suspectEntity.causality 1..1 MS
* suspectEntity.causality.productRelatedness 1..1 MS

Profile: VaccinationAdverseEvent
Parent: ICSRAdverseEvent
Id: vaccination-adverseevent
Title: "Vaccination Adverse Event"
Description: "ICSR Adverse Event with a value set of vaccination-related events"
* event from MedDRAVaccinationAdverseEventVS (extensible)
* suspectEntity ^slicing.discriminator.type = #type
* suspectEntity ^slicing.discriminator.path = "instance.resolve()"
* suspectEntity ^slicing.rules = #open
* suspectEntity ^slicing.description = "Slice based on the allowed suspect entity."
* suspectEntity contains Immunization 1..1 MS
* suspectEntity[Immunization].instance only Reference(ICSRImmunization)

Profile: TransfusionAdverseEvent
Parent: ICSRAdverseEvent
Id: transfusion-adverseevent
Title: "Transfusion Adverse Event"
Description: "ICSR Adverse Event with a value set of transfusion-related events"
* event from MedDRATransfusionAdverseEventVS (extensible)
* suspectEntity ^slicing.discriminator.type = #type
* suspectEntity ^slicing.discriminator.path = "instance.resolve()"
* suspectEntity ^slicing.rules = #open
* suspectEntity ^slicing.description = "Slice based on the allowed suspect entity."
* suspectEntity contains Transfusion 1..1 MS
* suspectEntity[Transfusion].instance only Reference(ICSRTransfusion)

// Extension: duration of event
Extension: EventDuration
Id: icsr-ext-eventduration
Description: "The duration of the adverse event."
* ^context.type = #element
* ^context.expression = "AdverseEvent.date"
* value[x] 1..1 MS
* value[x] only Duration

// Extension: end of event
Extension: EventEndDate
Id: icsr-ext-eventenddate
Description: "When the event ended."
* ^context.type = #element
* ^context.expression = "AdverseEvent.date"
* value[x] 1..1 MS
* value[x] only dateTime

Extension: AgeAtTimeOfOnset
Id: icsr-ext-ageattimeofonset
Description: "The age of the patient when the event occurred."
* ^context.type = #element
* ^context.expression = "AdverseEvent"
* value[x] 1..1 MS
* value[x] only Age

Extension: EventSeriousness
Id: icsr-ext-eventseriousness
Description: "Additional codes that give more detail around the adverse event seriousness."
* ^context.type = #element
* ^context.expression = "AdverseEvent.seriousness"
* value[x] 1..1 MS
* value[x] only CodeableConcept
* valueCodeableConcept from ICSRSeriousness

ValueSet: ICSRAESeriousness
Title: "ICSR Top-Level Seriousness"
Description: "Used to indicate whether the event is serious or not."
* ^experimental = false
* http://terminology.hl7.org/CodeSystem/adverse-event-seriousness#non-serious
* http://terminology.hl7.org/CodeSystem/adverse-event-seriousness#serious

ValueSet: ICSRSeriousness
Title: "ICSR Seriousness Codes"
Description: "The set of codes that are used to describe seriousness in ICSR submissions."
* ^experimental = false
* Seriousness#34 "resultsInDeath"
* Seriousness#21 "isLifeThreatening"
* Seriousness#33 "requiresInpatientHospitalization"
* Seriousness#35 "resultsInPersistentOrSignificantDisability"
* Seriousness#12 "congenitalAnomalyBirthDefect"
* Seriousness#26 "otherMedicallyImportantCondition"
* NCIMeta#C53513 "Emergency Room"
* NCIMeta#C16988 "Physician Office"
* NCIMeta#C50414 "Hospitalization Required"
* NCIMeta#C102450 "Prolongation of Hospitalization"
* NCIMeta#C17649 "Other"
