[//]: #  ## Security, Privacy, and Consent 

### General Considerations

Transitions of Care (TOC) information contains patient specific information, which means that it needs to be protected with proper security and privacy protections to avoid malicious or unintentional exposure of such information. All Advance Directive Interoperability exchanges must be appropriately secured in transit and access limited only to authorized individuals.

The TOC IG focuses on providing a structure to share data and information. Policy, legal, and regulatory differences across states and local areas may impact the workflow and requirements associated with Advance Directives Information. Implementors should review the current context for where this IG is expected to be used to ensure those requirements are met.


#### Security Considerations and Guidance

All implementers of the Transitions of Care Implementation Guide (IG) **SHOULD** follow the FHIR Security guidance, Security and Privacy Module, and the FHIR Implementer’s Safety Checklist guidance as defined in the FHIR standard where applicable and not otherwise superseded by this Section of the TOC IG.

1.	The FHIR Security specification provides guidance related to communication security, authentication, authorization/access control, audit, digital signatures, attachments, labels, narrative, and input validation. The FHIR security specification is available [here](http://hl7.org/fhir/R4/security.html).
2.	The FHIR Security and Privacy Module describes access control and authorization considerations to protect a FHIR server, how to document permissions granted, and hot to keep records of performed events. The FHIR Security and privacy module can be found [here](http://hl7.org/fhir/R4/secpriv-module.html).
3.	The FHIR Implementer’s Safety Checklist helps implementers be sure that they have considered all the parts of FHIR that impact their system design regarding safety. The FHIR safety check list is available [here](http://hl7.org/fhir/R4/safety.html).

#### Security Requirements

For the purposes of Transitions of Care, additional security conformance requirements are as follows:

##### Exchange Security

1.	The exchange of information **SHALL** support [Transport Layer Security (TLS) Protocol Version 1.2 (RFC5246)](https://www.rfc-editor.org/rfc/rfc5246) or a more recent version of TLS for transport layer security.
2.	Implementers of this Implementation Guide **SHALL** support [SMART on FHIR STU 2.1 App Launch Framework](http://hl7.org/fhir/smart-app-launch/STU2.1/index.html) and **MAY** support [SMART on FHIR STU 2.1 Backend Services](https://www.hl7.org/fhir/smart-app-launch/STU2.1/backend-services.html).
3.	Implementers of this Implementation Guide **SHOULD** support mutually authenticated TLS.
4.	Server implementations that expect to support browser-based javascript applications SHOULD enable [Cross-Origin Resource Sharing (CORS)](https://www.w3.org/TR/cors/) for REST operations. Many client web-based apps use javascript for API calls which requires CORS. However, CORS could present security concerns if not implemented correctly or is not continually updated as new security issues are found and addressed. Implementers of CORS **SHOULD** consider advice about CORS from sources such as [Enable-CORS](http://enable-cors.org/) and [Moesif blog on Guide to CORS Pitfalls](https://www.moesif.com/blog/technical/cors/Authoritative-Guide-to-CORS-Cross-Origin-Resource-Sharing-for-REST-APIs/).

##### Authentication and Authorization Requirements

###### SMART App Launch

The following only applies to servers supporting app launch:

1.	Implementations **SHALL** support the FHIR US Core [Patient Privacy and Security requirements](https://hl7.org/fhir/us/core/STU6.1/security.html).
2.	Server systems **SHALL** publish their authorization and token endpoints for discovery in accordance with the SMART App Launch STU2 framework and publicly publish the [Well-Known Uniform Resource Identifiers (URIs)](http://hl7.org/fhir/smart-app-launch/STU2.1/conformance.html) JSON file with scopes defined in the `scopes_supported` property.
3.	Implementations **SHOULD** consider the [SMART on FHIR STU2 Best Practices in Authorization](https://hl7.org/fhir/smart-app-launch/STU2.1/best-practices.html)
4.  Implementation **MAY** support [Health Relationship Trust Profile for User-Managed Access (HEART)](https://openid.net/specs/openid-heart-uma2-1_0.html).
5.  This guide defines the following server requirements for [SMART on FHIR Core Capabilities](https://hl7.org/fhir/smart-app-launch/STU2.1/conformance.html#capability-sets):

    1.  **SHALL** support [Patient Access for Standalone Apps](http://hl7.org/fhir/smart-app-launch/STU2.1/conformance.html#patient-access-for-standalone-apps)
    2.  **SHOULD** support [Patient Access for EHR Launch](http://hl7.org/fhir/smart-app-launch/STU2.1/conformance.html#patient-access-for-ehr-launch-ie-from-portal)
    3.  **SHALL** support [Clinician Access for Standalone Apps](http://hl7.org/fhir/smart-app-launch/STU2.1/conformance.html#clinician-access-for-standalone)
    4.  **SHOULD** support: [Clinician Access for EHR Launch](http://hl7.org/fhir/smart-app-launch/STU2.1/conformance.html#clinician-access-for-ehr-launch)
    5.  In addition to the guidance above, there are additional requirements for other SMART on FHIR capabilities not included above, including:
        <br />
        <table>
            <tr>
                <th style="margin-left: 5px; margin-right: 5px;">Element</th>
                <th style="margin-left: 5px; margin-right: 5px;">Requirement</th>
                <th style="margin-left: 5px; margin-right: 5px;">Reason</th>
            </tr>
            <tr>
                <td>sso-openid-connect</td>
                <td>SHALL</td>
                <td>Transitions of Care information is sensitive information, so authorization using SMART's OpenID Connect profile is required</td>
            </tr>
            <tr>
                <td>scopes</td>
                <td>SHALL</td>
                <td>
                    <table>
                        <tr>
                            <td>openid:</td>
                            <td>Permission to retrieve information about the current logged-in user</td>
                        </tr>
                        <tr>
                            <td>fhirUser:</td>
                            <td>Permission to retrieve information about the current logged-in user</td>
                        </tr>
                        <tr>
                            <td>launch/patient:</td>
                            <td>When launching outside EHR, ask for patient to be selected at launch time</td>
                        </tr>
                        <tr>
                            <td>patient/Patient.read:</td>
                            <td>Permission to read any resource for the current patient</td>
                        </tr>
                        <tr>
                            <td>user/Patient.read:</td>
                            <td>Allows the client app to select the patient</td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td>context-banner</td>
                <td>SHOULD</td>
                <td>The banner helps provides the patient context for the data</td>
            </tr>
            <tr>
                <td>permission-offline</td>
                <td>SHOULD</td>
                <td>Support for refresh tokens, which allow a session to be extended without repeated logins</td>
            </tr>
        </table>

###### SMART Backend Systems

The following applies to servers that support backend services:

1.  Implementations **SHALL** support the [SMART Backend Services: Authorization Guide](https://hl7.org/fhir/uv/bulkdata/STU1.0.1/authorization/index.html)

<!--  TODO
#### Individual-Authorized Exchange
1.	http://hl7.org/fhir/us/davinci-pdex/Member-AuthorizedOAuth2Exchange.html
-->

#### Privacy Requirement

For the purposes of Transitions of Care, privacy conformance requirements are as follows:
- Implementers **SHOULD** support data sharing policies with use of the Consent resource.

#### Provenance

1.	Server implementations **SHOULD** support the ability to directly record and/or enable clients to assert (store) provenance associated with transitions of care information using the [Provenance](http://hl7.org/fhir/R4/provenance.html) resource.

<!-- TODO Consider US Core requirements
https://www.hl7.org/fhir/us/core/security.html
-->