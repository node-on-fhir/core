### Scope

This FHIR Implementation Guide details a process where adverse event (AE) reports are generated from EHR data. The report data elements are based from the Food and Drug Administration's Individual Case Safety Reports specifications.  These specifications can be found at [FDA's website](https://www.fda.gov/industry/fda-data-standards-advisory-board/individual-case-safety-reports).
In this guide, there are two main components to the generation process: detection and reporting. To support AE detection, this IG includes a set of Clinical Quality Language (CQL) algorithms which can be run on FHIR data. To support AE reporting, this IG includes a set of profiles that enables the creation of a FHIR case report document along with mappings to the ICH ICSR specifications. This work was developed as part of the FDA's Center for Biologic Evaluation and Research (CBER) Biologics Effectiveness and Safety (BEST) initiative. This IG currently focuses on post-vaccination and post-tranfusion AE reporting.

### Rationale
Adverse events due to biological products are underreported to regulatory authorities and the data reported may not always contain adequate information for decision-making.  Use of EHR FHIR data could improve reporting of adverse events and minimize the burden of identification on practitioners.

### Dependencies
This IG depends on:
* <a href="{{site.data.fhir.hl7_fhir_us_core}}">US Core</a>
* <a href="{{site.data.fhir.hl7_fhir_us_medmorph}}/2021Jan/index.html">Making EHR Data More available for Research and Public Health (MedMorph)</a>

### Adverse Event Detection and Submission Workflow
We consider the AE Detection and Submission workflow to be a combination of MedMorph's <a href="{{site.data.fhir.hl7_fhir_us_medmorph}}/2021Jan/usecases.html#report-creation-workflow">Report Creation</a> and <a href="{{site.data.fhir.hl7_fhir_us_medmorph}}/2021Jan/usecases.html#data-submission-workflow">Data Submission</a> workflows.

NOTE: The diagram below is a UML activity diagram.  The <<use>> stereotypes indicate data that is used by the associated activity.  If the arrow is pointing to the activity, then the activity is reading that data.  If the arrow is pointing away from the activity, then the activity is generating that data.
{::options parse_block_html="false" /}
<figure>
  <img src="AE_Process.png" alt="Adverse Event Detection and Submission Process"/>
  <figcaption>Figure 1.1 - Adverse Event Detection and Submission Process</figcaption>
</figure>
{::options parse_block_html="true" /}

The activities from Detect Adverse Event Case to Generate Adverse Event Resource are part of the Report Creation workflow while the remaining activities are part of the Data Submission workflow.

#### Detect Adverse Event Case
A system can detect AE cases automatically using the FHIR-based CQL <a href="algorithms.html">algorithms</a> referenced in this IG.

#### Confirm Adverse Event
Once an Adverse Event has been detected, a practitioner can review the relevant data and confirm that it is an actual Adverse Event that should be reported.

#### Generate AdverseEvent Resource
Once an Adverse Event has been confirmed or if a practitioner manually determines there is an Adverse Event to report, a system can generate an instance of the FHIR AdverseEvent resource.

#### Generate FHIR-based Adverse Event Document
A system can generate a FHIR-based Adverse Event document using the <a href="profile_listing.html">profiles</a> referenced in this IG.

### FHIR Safety Requirements
As with implementations of FHIR and FHIR Implementation Guides, implementers should consult the <a href="{{site.data.fhir.path}}safety.html">FHIR Implementer's Safety Check List</a> in the core FHIR specification.

### Authors

The development of this Implementation Guide was funded by FDA CBER BEST initiative.

* FDA CBER BEST IBM Project Team
* Jean Duteau
* Shayan Hobbi
* Will Rosenfeld

### Contact Information

For more information about this guide or if you have any questions or comments about it, either use the "Propose a change" link found at the bottom of every page or visit the [BEST Initiative website](https://bestinitiative.org/best/data-and-surveillance-activities/best-innovative-methods-exchange-platform).
