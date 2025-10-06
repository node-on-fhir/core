### Phenotype Algorithm Overview 

A computable phenotype is a clinical condition or characteristic that can be ascertained by means of a computerized query to an electronic health record (EHR) system or clinical data repository using a defined set of data elements and logical expressions<sup>1</sup>. 

This implementation guide contains FHIR CQL queries for phenotypes that can be used to identify cases for review and reporting using data available in FHIR formats. In addition, it includes code lists that are used by each algorithm to identify different pieces of evidence (conditions, immunizations, etc.) of adverse event or biologic product in the EHR's structured data.

Currently, the algorithms below focus on identification of adverse events temporally associated with COVID-19 or influenza vaccine exposure, however future versions will include algorithms for identification of adverse events related to other biologics. Additionally future versions may include other algorithm components, such as unstructured data, along with other mediums for expressing the algorithm logic, such as FHIR search.  

Reference:
 1. <a href="https://sites.duke.edu/rethinkingclinicaltrials/ehr-phenotyping/">EHR Phenotyping from Duke University</a>

#### Claims Comparable

These algorithms are named “claims comparable” because they are designed to mimic phenotypes built by epidemiologists on medical claim data sources. These phenotypes are limited to using data that would be available in those sources including condition diagnoses (ICD-10), immunizations (NDC, CPT, RxNorm), and encounter data. The algorithm consists of codelists to identify the adverse event and vaccine exposure combined with additional logic requiring the adverse event to occur during a post vaccination risk window and not have the adverse event diagnosis initially be made during a clean window prior to the vaccine exposure.

The claims comparable algorithms utilize interoperable codes and condition, encounter, and immunization data elements to identify potential adverse events following immunizations (AEFIs).  In a FHIR Server, these algorithms query the following resources: Condition, Immunization, Procedure, and Encounter. 

##### Logic Overview
These algorithms apply rules-based claims-comparable algorithm logic. These phenotypes are built using interoperable condition diagnoses (ICD-10, SNOMED-CT), immunization (CVX, NDC, CPT, RxNorm) data, and encounter type (Inpatient, Outpatient, etc.) data. These phenotypes can be used to find incident cases of adverse events or a case observed in the risk window of a vaccine exposure. 

The components of the phenotype algorithms include:

* **Vaccination** - Exposure is defined as receipt of a vaccination of interest, as identified interoperable codes (NDC, RxNorm, CPT). The claims comparable algorithm logic can be replicated using the condition diagnosis codes found in each codelist, combined with the vaccine exposure codes for [Covid-19](ValueSet-COVID19VaccineCodeVS.html) or [Influenza](ValueSet-InfluenzaVaccineCodeVS.html), and risk/clean window interval logic defined in the table below.
* **Risk window** - The length of the period after an identified vaccine exposure to observe an adverse event outcome. Risk windows will be defined on an outcome-by-outcome basis.
* **Clean window** -  For each case observed within the risk window of interest, a clean window restriction will be implemented to identify incident cases more accurately. The clean window requirement is met if there are no condition diagnosis codes found prior to the vaccine exposure date, within the length of the clean window. Clean windows will also be defined on an outcome-by-outcome basis and are listed in the Algorithm Overview table. 
* **Care Setting** - For each diagnosis that meets risk/clean window requirements, a care setting filter will be applied to the encounter relating to the diagnosis. The included care setting types are defined in the Algortihm Overivew table, in the "Care Setting" column.  
* **Positive Diagnosis** - Phenotype algorithms will make a positive diagnoses when they find a code in the specified codelists in the vaccine risk windows. The clean window will be implemented to exclude cases with historical diagnoses prior to the exposure.

<p align="center"><img width="100%" src="phenotype_overview.png" /></p>

#### **FHIR CQL Queries**

Clinical Quality Language (CQL) is an HL7 language standard that is meant to be human readable and structured enough to run the logic specified in the file. For more information on CQL, you can visit the [HL7 CQL site](https://cql.hl7.org). 

There are many projects being developed for [CQL implementation](https://cql.hl7.org/10-c-referenceimplementations.html).

### Algorithms 

The following tables list the available phenotypes for each algorithm type. The tables include links to the relevant CQL file for that algorithm, as well as the location of codelists or termsets (if applicable) used to develop the algorithm. NOTE: all of the code lists are found in the US National Library of Medicine Value Set Authority Center (VSAC) and require a VSAC login to view.

| Adverse Event        | Care Setting*|  Clean Window   | Risk Window| Vaccine Relevance| FHIR CQL File| Codelists |
| ------------- |:-----:|:-----:|:-----:|:-----:|:-----:|:---------:|
| Guillain-Barre Syndrome | IP | 365 days| 1-42 days| Influenza and Covid-19|[CQL](cql_files/gbs.cql.txt) |[Diagnosis Codes](https://vsac.nlm.nih.gov/valueset/2.16.840.1.113762.1.4.1234.60/definition) |
| Immune Thrombocytopenic Purpura (ITP) | IP, OP/PB, OP-ED| 365 days| 1-42 days|Covid-19|[CQL](cql_files/thrombocytopenic_purpura.cql.txt) |[Diagnosis Codes](https://vsac.nlm.nih.gov/valueset/2.16.840.1.113762.1.4.1234.53/definition) |
| Bell's Palsy |IP, OP/PB, OP-ED| 183 days| 1-42 days| Influenza and Covid-19|[CQL](cql_files/bells_palsy.cql.txt) |[Diagnosis Codes](https://vsac.nlm.nih.gov/valueset/2.16.840.1.113762.1.4.1234.65/definition) |
| Anaphylaxis | IP,OP-ED| 30 days| 0-2 days| Influenza and Covid-19|[CQL](cql_files/anaphylaxis.cql.txt) |[Diagnosis Codes](https://vsac.nlm.nih.gov/valueset/2.16.840.1.113762.1.4.1234.67/definition) |
| Appendicitis |IP, OP-ED| 365 days| 1-42 days| Covid-19|  [CQL](cql_files/appendicitis.cql.txt) |[Diagnosis Codes](https://vsac.nlm.nih.gov/valueset/2.16.840.1.113762.1.4.1234.66/definition) |
| Encephalomyelitis |IP| 183 days| 1-42 days| Influenza and Covid-19|[CQL](cql_files/encephalomyelitis.cql.txt) |[Diagnosis Codes](https://vsac.nlm.nih.gov/valueset/2.16.840.1.113762.1.4.1234.62/definition) |
| Narcolepsy | IP, OP/PB, OP-ED| 365 days| 1-42 days|Covid-19|[CQL](cql_files/narcolepsy.cql.txt) |[Diagnosis Codes](https://vsac.nlm.nih.gov/valueset/2.16.840.1.113762.1.4.1234.56/definition) |
| Disseminated Intravascular Coagulation (DIC) | IP, OP-ED, OP/PB| 365 days| 1-28 days| Covid-19|[CQL](cql_files/disseminated_intravascular_coagulation.cql.txt) |[Diagnosis Codes](https://vsac.nlm.nih.gov/valueset/2.16.840.1.113762.1.4.1234.63/definition) |
| Transverse Myelitis| IP, OP-ED| 365 days| 1-90 days| Covid-19|[CQL](cql_files/transverse_myelitis.cql.txt)|[Diagnosis Codes](https://vsac.nlm.nih.gov/valueset/2.16.840.1.113762.1.4.1234.52/definition) |
| Multisystem Inflammatory Syndrome (MIS)|IP, OP-ED| 365 days| 1-42 days| Covid-19|[CQL](cql_files/mis.cql.txt) | [Diagnosis Codes](https://vsac.nlm.nih.gov/valueset/2.16.840.1.113762.1.4.1234.70/definition) |
| Febrile Seizures| IP, OP/PB, OP-ED| 42 days| 0-1 days| Influenza and Covid-19|[CQL](cql_files/febrile_seizure.cql.txt) | [Diagnosis Codes](https://vsac.nlm.nih.gov/valueset/2.16.840.1.113762.1.4.1234.61/definition) |
| Kawasaki Disease|IP, OP/PB, OP-ED| 365 days| 1-28 days| Covid-19| [CQL](cql_files/kawasaki_disease.cql.txt)| [Diagnosis Codes](https://vsac.nlm.nih.gov/valueset/2.16.840.1.113762.1.4.1234.58/definition) |
| Non-hemorrhagic Stroke|IP| 365 days| 1-28 days| Covid-19| [CQL](cql_files/non_hemorrhagic_stroke.cql.txt) | [Diagnosis Codes](https://vsac.nlm.nih.gov/valueset/2.16.840.1.113762.1.4.1234.55/definition) |
| Hemorrhagic Stroke|IP| 365 days| 1-28 days| Covid-19|[CQL](cql_files/hemorrhagic_stroke.cql.txt) | [Diagnosis Codes](https://vsac.nlm.nih.gov/valueset/2.16.840.1.113762.1.4.1234.59/definition) |
| Acute Myocardial Infarction|IP| 365 days| 1-28 days| Covid-19| [CQL](cql_files/acute_myocardial_infarction.cql.txt) | [Diagnosis Codes](https://vsac.nlm.nih.gov/valueset/2.16.840.1.113762.1.4.1234.68/definition) |
| Deep Vein Thrombosis|IP, OP/PB, OP-ED| 365 days| 1-28 days| Covid-19| [CQL](cql_files/deep_vein_thrombosis.cql.txt) | [Diagnosis Codes](https://vsac.nlm.nih.gov/valueset/2.16.840.1.113762.1.4.1234.64/definition) |
| Pulmonary Embolism|IP, OP/PB,OP-ED| 365 days| 1-28 days| Covid-19|[CQL](cql_files/pulmonary_embolism.cql.txt) | [Diagnosis Codes](https://vsac.nlm.nih.gov/valueset/2.16.840.1.113762.1.4.1234.54/definition) |
| Myocarditis |IP, OP/PB,OP-ED| 365 days| 1-42 days| Covid-19|[CQL](cql_files/mrna_myo.cql.txt) | [Diagnosis Codes](cql_files/mrna_myo_value_sets-1.0.0.cql.txt) |
| Pericarditis |IP, OP/PB,OP-ED| 365 days| 1-42 days| Covid-19|[CQL](cql_files/mrna_peri.cql.txt) | [Diagnosis Codes](cql_files/mrna_peri_value_sets-1.0.0.cql.txt) |
| Hypogammaglobulinemia |IP, OP/PB,OP-ED| 365 days| 1-42 days| CAR-T |[CQL](cql_files/cart_hgg.cql.txt) | [Diagnosis Codes](cql_files/cart_hgg_value_sets-1.0.0.cql.txt) |



*IP - inpatient stays, OP/PB - all outpatient visits and professional/provider services including clinics, OP-ED - subset of outpatient visits occurring in the emergency department
