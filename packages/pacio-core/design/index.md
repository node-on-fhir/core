### Background 

The purpose of the LTPAC Transitions of Care (TOC) Implementation Guide is to provide a standards-based solution to support care transitions and coordination for LTPAC patients across all settings of care. The five traditional Post-Acute Care (PAC) settings, Hospice, Home Health, Skilled Nursing, Long Term Care Hospitals, and Inpatient Rehab facilities employ many types of clinicians, practitioners, therapists, and allied professionals who each require different information to provide the best and most efficient services to their patients. This information may include **standardized assessments, patient preferences, observations,** and other important data. Many of these items are valuable during a transition of care from one setting to another, including settings outside of Post-Acute Care such as Acute Inpatient, Emergency Department, and Home- and Community-Based Organizations (HCBOs). This critical information is often not exchanged, resulting in gaps in care information during initial assessments and reassessments in new or parallel settings, and the data is never available as a specific role-based data set. This leads directly to potentially unsafe transition and coordination of care for these most vulnerable patients as well as information overload, additional documentation, errors in the patient record, incorrectly reconciled data, and a burden on families and patients to carry physical records with them during transitions. 

The CMS Data Element Library provides the reference data (questions and answers) for key quality instruments in post-acute care, notably the MDS and OASIS. Today, most if not all information that could help inform the completion of these assessments is captured at the referral source, but not in a manner that can be meaningfully presented to the post-acute provider. Without this context and properly mapped information, providers in Post-acute care settings are piecing together information from scratch through clinical observation or laborious review of narrative and other documentation that accompanies a referral. The challenge is similar outside of these instruments&mdash;stretching into areas like Advance Directives or Personal Care preferences.   

### Why PACIO 

The PACIO Project is a collaborative effort to advance interoperable health data exchange between PAC and other providers, patients, their caregivers, and key stakeholders across healthcare and to promote health data exchange in collaboration with policy makers, standards organizations, and industry through a consensus-based approach. 

The primary goal of the PACIO Project is to establish the technical foundation for data exchange within PAC and partner organizations across the spectrum of care. It seeks to do so by creating a framework for and community through the development of Fast Healthcare Interoperability Resource (FHIR&copy;) technical implementation guides (IGs) and reference implementations that will facilitate health data exchange through standards-based use case-driven application programming interfaces (APIs). 

Information covered in this IG is relevant to providers across the full spectrum of patient care, including acute, sub-acute, long-term post-acute care (LTPAC), community-based organizations, and private practice practitioners. The PACIO community brings together healthcare providers with a deep understanding of patient functioning that makes them uniquely suited to author this IG. This understanding comes out of each provider's: 
* goal of helping individuals in these settings return to living in their homes and communities. 
* knowledge of the activities that individuals need to perform and how to help them regain the ability to perform these activities by leveraging the necessary treatments and supports. 

### Domains 

The scope of this guide is intentionally broad, as the nature of specific conditions and the disciplines required to care for them require varying sets of information. This guide relies predominantly upon the existing body of work supported by the PACIO project using CMS’s data element library and using these structures to define key pieces of information needed by a post-acute provider receiving a referral.  
* [CMS Data Element Library](https://del.cms.gov/DELWeb/pubHome)
* [PACIO Personal Functioning and Engagement](https://hl7.org/fhir/us/pacio-pfe)
* [Personal Health Records](https://build.fhir.org/ig/HL7/personal-health-record-format-ig/)
* [FHIR Composition](https://hl7.org/fhir/R4/composition.html)

### The IMPACT act 

One impetus for this IG is the amendment to the Social Security Act in 2014 to include the Improving Medicare Post-Acute Care Transformation (IMPACT) Act. The IMPACT Act requires the standardization and interoperability of patient assessments in specific categories for PAC settings, including long-term care hospitals (LTCHs), home health agencies (HHAs), SNFs, and inpatient rehabilitation facilities (IRFs). It focuses on the standardization of data elements in specified quality measure and patient assessment domains for cross-setting comparison and clinical information exchange, respectively. 

The Act requires: 
* Reporting of standardized patient assessment data through commonly used PAC assessment instruments: 
  * Minimum Data Set (MDS) for SNFs
  * Inpatient Rehabilitation Facility – Patient Assessment Information (IRF – PAI) for IRFs
  * LTCH Continuity Assessment Record and Evaluation (CARE) Data Set (LCDS) for LTCHs
  * Outcome and Assessment Information Set (OASIS) for HHAs 
* Implementation of data elements specified in each domain using standardized data elements to be nested within the assessment instruments currently required for submission by LTCH, IRF, SNF, and HHA providers. 

Data to be standardized and interoperable to allow exchange of data between PAC providers, among others, using common standards and definitions to provide access to longitudinal information and facilitate coordinated care. 

### How to read this guide 
This Guide is divided into several pages which are listed at the top of each page in the menu bar.

* Home: The home page provides the introduction and background information to set context for the use of the HL7 FHIR® Transitions of Care Implementation Guide.

* Guidance: These pages provide overall guidance in using the profiles and transactions defined in this guide.

  * Personas and Scenarios: Personas and scenarios give context to the data exchange standards detailed in the technical areas of the guide. They allow the non-technical reader to envision situations in which the implementation guide provisions would apply, and ensure that the guide meets the intended needs for exchange of this type of information.

  * Use Cases: A use case is a list of technical actions or event steps typically defining the interactions between a role and a system to achieve a goal. The actor can be a human or other external system. Technical scenarios that describe systems interactions between technical actors to implement the use case.

  * Discipline-Specific Information: The discipline-specific information contains the select list of Centers for Medicare and Medicaid Services (CMS) data element library (DEL) information that is rated high importance by seven different role types across post-acute care settings. 

  * General Guidance: Information about the structure and relationships between the profiles in this guide.

  * Formal Specification: Information about conformance to the guide including Must Support requirements, document signatures, and document workflow.

  * Underlying Technologies: Information about the terminologies, notations, and design principles, specific to FHIR, that this specification uses.

  * Security, Privacy, and Consent: General security requirements and recommendations for Transitions of Care mplementation Guide actors, including authentication, authorization, and logging requirements and guidance.

* FHIR Artifacts: These sections provide detailed descriptions and formal definitions for all the FHIR objects defined in this guide.

  * Capability Statement: This artifact defines the specific capabilities that different types of systems are expected to have in order to comply with this guide. Systems conforming to this guide are expected to declare conformance with this capability statement.

  * Profiles: This section lists the set of Profiles that are defined in this guide to exchange transitions of care information. Each linked Profile page includes a narrative introduction and a formal definition.

  * Extension Definitions: This section lists the set of Extensions defined in and used by the Profiles in this guide. Each linked Extension page includes a formal definition.
  
  * Terminology: This section lists the value sets and code system defined for  Transtions of Care Implementation Guide profiles.

  * Examples: The section that contains examples of transitions of care information that is conformant to the profiles of this guide.

  * Search Parameters and Operations: This section lists the Transtions of Care Implementation Guide defined Operations and Search Parameters that are used in TOC transactions.

* Downloads: This page provides links to downloadable artifacts.

### Global Profiles
{% include globals-table.xhtml %}
 
### Package Dependencies
{% include dependency-table.xhtml %}
 
### Cross-Version Analysis
{% include cross-version-analysis.xhtml %}
 
### Intellectual Property Considerations
{% include ip-statements.xhtml %}