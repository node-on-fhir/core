This section defines additional requirements and guidance relevant to this IG as a whole. The FHIR Conformance Rules define the conformance verbs - **SHALL**, **SHOULD**, **MAY** - used in this IG.

### System Role Definitions

**Data Sources** are defined as systems that originate transition of care-related documents & resources. These systems may be personal health records, clinical records, or even consumer-facing platforms.

**Data Consumers** are defined as systems retrieving or receiving transitions of care information for direct use or integration into their application platform (as opposed to acting as a server or intermediary).

**Servers** are defined as systems that make transitions of care information available through query or retrieval.

### Claiming Conformance to a Transitions of Care Profile
To claim conformance to a Profile in this IG, servers **SHALL**:

- Be able to populate all Profile data elements that have a minimum cardinality >= 1 and/or flagged as Must Support as defined by that profile’s StructureDefinition.
- Conform to the [Transitions of Care Capability Statement](CapabilityStatement-toc.html) expectations for that Profile’s type.

### Must Support
The following rules apply to all Transitions of Care Profile elements marked as Must Support. A system that is incapable of ever sharing the element for a required profile, as defined in the [Transitions of Care Capability Statement](CapabilityStatement-toc.html) is considered to be non-conformant to this implementation guide. Must Support on any profile data element **SHALL** be interpreted as follows:

#### Data Source System Requirements

- Data Sources **SHALL** be capable of populating the data element for profiles the system is claiming conformance to. In other words, the system must be able to demonstrate the population and communication of the element if the profile is supported by that system, but it is acceptable to omit the element if the system doesn't have values in a particular instance. 

#### Data Consumer System Requirements

- Data Consumer Systems **SHALL** be capable of displaying the data elements for human use.
- Data Consumer Systems **SHOULD** be capable of storing the data elements for other uses (such as record keeping of data used for clinical use).
- Data Consumer Systems **SHALL** be capable of processing resource instances containing the data element without generating an error or causing the application to fail.
- Data Consumer Systems **SHALL** interpret missing data elements within resources instances as not being present on the Data Sources system’s or as being withheld for privacy or business reasons.

Profiles used by this IG, but defined in other IGs, inherit the definition of Must Support from their respective guides.
