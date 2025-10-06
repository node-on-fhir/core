### Overview
The Center for Biologics Evaluation and Research (CBER) Office of Biostatistics and Pharmacovigilance (OBPV) Biologics Effectiveness and Safety (BEST) Initiative tasked IBM with the development of the BEST Platform, a solution to improve post-biologic safety adverse event reporting and analysis. Through this system, the FDA can request clinical data for further validation of a potential adverse event case reported to the FDA and CDC’s Vaccine Adverse Event Reporting System (VAERS). The clinical data is requested from individual health providers to the FDA through eHealth Exchange, a Health Information Exchange (HIE), which standardizes the process of sending and receiving interoperable HL7 Fast Healthcare Interoperability Resources (FHIR) data. This exchange helps FDA reviewers analyze reported potential adverse events and their biologic products with all relevant clinical data available.

The team developed an exchange pilot platform to  be able to query for patients with reported post-biologic AEs from EHR databases across the United States and pull all relevent, clinical, real-world data (RWD) data into a chart review application for validation by FDA reviewers. The pilot platform – 
1.	Can receive data in interoperable FHIR format on a HIPAA-compliant platform.
2.	Can scale to querying data across a large health data exchange that covers 77% of the nation’s healthcare providers, as well as all major state and regional health information exchanges.
3.	Allows clinicians to view and search extensive EHR data for a given patient to validate a potential AE and document supporting evidence using a custom-designed chart review application.
4.	Organizes case reviews between teams of clinicians and helps document and review progress and results using a case management tool.



### Pull Use Case
The pull use case allows FDA to query additional clinical information for a case that has already been reported to VAERS. This provides data elements for all the required or optional fields of a VAERS form, as well as all the other data available in the provided FHIR resources. These additional data can help inform the FDA VAERS team by including optional VAERS data that may not have been filled out on the original submitted form, such as medications being taken at the time of vaccination; allergies to medications, food, or other products; or additional information on the immunization, like manufacturer, lot, dose, or route. The additional data could also include helpful information that is not asked on a VAERS form, such as AE severity or clinical notes about the encounter, that can give a clearer narrative. 
Currently, when FDA needs this information for a VAERS reported case, it must set up a new ad-hoc process with the reporting entity for each request. The BEST Platform, by using the exchange to pull data from the reporting entity, will improve speed, security, and standardization compared to current FDA data transactions. Data transfers will be quicker without the partner needing to figure out how to translate the data to a common data model (CDM) for transfer to FDA. It will improve security of the transaction through a system-to-system connection that eliminates human-in-the-loop steps, such as a person looking up a VAERS record to pull and send the data to FDA. Lastly, the process will improve standardization of the transfer through the exchange’s required FHIR standard rather than dealing with individual partners’ conversions to a CDM.

### Required FHIR Resources

|Resource name|	Is this a minimum required resource for FDA adverse event validation?	| Is this a desired core resource for FDA adverse event validation? |
|---|---|---|
|ActivityDefinition	 	|||
|AllergyIntolerance	| Yes | Yes |
|BiologicallyDerivedProduct	 	|| Yes |
|Binary	| Yes | Yes |
|CarePlan	 	|| Yes |
|ClinicalImpression	 	|| Yes |
|Composition	 	|| Yes |
|Condition	| Yes | Yes |
|DetectedIssue	 |	| Yes | 
|Device	 	|||
|DeviceMetric	 |	| Yes | 
|DeviceRequest |||	 	 
|DiagnosticReport	| Yes | Yes |
|DocumentReference	| Yes | Yes |
|Encounter	| Yes | Yes |
|EpisodeOfCare	 |	| Yes | 
|Goal	 	 |||
|Group	 	 |||
|HealthcareService	| 	| Yes | 
|ImagingStudy	| Yes	| Yes |
|Immunization	| Yes	| Yes |
|ImmunizationRecommendation	||| 	 
|Location	| Yes | Yes |
|Measure	 	|||
|Medication	| Yes	| Yes |
|MedicationAdministration	|At least one of these	| Yes |
|MedicationDispense	|	| Yes | 
|MedicationRequest	|	| Yes | 
|MedicationStatement|||	
|MolecularSequence	 ||| 
|NutritionOrder	 	 |||
|Observation	| Yes | Yes |
|Patient	| Yes |	Yes |
|Practitioner	| Yes | Yes |
|PractitionerRole	 |	| Yes |
|Procedure	| Yes |	Yes |
|Provenance	 	 |||
|Questionnaire	 	||| 
|QuestionnaireResponse|||	 	 
|RelatedPerson	 	 |||
|RequestGroup	 	 |||
|ResearchStudy	 	 |||
|ServiceRequest	 	 |||
|Specimen	 	 |||
|Substance	 	 |||
|ValueSet	 |	| Yes | 

NOTE: All resources listed without a | Yes | in the desired core resource column are desired when referenced by the core resources
