# /Volumes/SonicMagic/Code/honeycomb-public-release/certification/bdd/170.315-b-3-electronic-prescribing.feature
# § 170.315(b)(3) - Electronic Prescribing

# REGULATORY TEXT FROM 45 CFR § 170.315(b)(3)
#
# (3) Electronic prescribing.
#
# (i) For technology certified prior to June 30, 2020, subject to the real world testing provisions at § 170.405(b)(5),
#
# (A) Enable a user to perform the following prescription-related electronic transactions in accordance with, at a minimum, the version of the standard specified in § 170.207(d)(3) as follows:
#
# (1) Create new prescriptions (NEWRX).
#
# (2) Change prescriptions (RXCHG, CHGRES).
#
# (3) Cancel prescriptions (CANRX, CANRES).
#
# (4) Refill prescriptions (REFREQ, REFRES).
#
# (5) Receive fill status notifications (RXFILL).
#
# (6) Request and receive medication history information (RXHREQ, RXHRES).
#
# (B) For each transaction listed in paragraph (b)(3)(i)(A) of this section, the technology must be able to receive and transmit the reason for the prescription using the diagnosis elements in the DRU Segment.
#
# (C) Optional:  For each transaction listed in paragraph (b)(3)(i)(A) of this section, the technology must be able to receive and transmit the reason for prescription using the indication elements in the SIG Segment.
#
# (D) Limit a user's ability to prescribe all oral liquid medications in only metric standard units of mL (i.e., not cc).
#
# (E) Always insert leading zeroes before the decimal point for amounts less than one and must not allow trailing zeroes after a decimal point when a user prescribes medications.
#
# (ii) For technology certified subsequent to June 30, 2020:
#
# (A) Enable a user to perform the following prescription-related electronic transactions in accordance with the standard specified in § 170.205(b)(1) and, at a minimum, the version of the standard specified in § 170.207(d)(1) as follows:
#
# (1) Create new prescriptions (NewRx).
#
# (2) Request and respond to change prescriptions (RxChangeRequest, RxChangeResponse).
#
# (3) Request and respond to cancel prescriptions (CancelRx, CancelRxResponse).
#
# (4) Request and respond to renew prescriptions (RxRenewalRequest, RxRenewalResponse).
#
# (5) Receive fill status notifications (RxFill).
#
# (6) Request and receive medication history (RxHistoryRequest, RxHistoryResponse).
#
# (7) Relay acceptance of a transaction back to the sender (Status).
#
# (8) Respond that there was a problem with the transaction (Error).
#
# (9) Respond that a transaction requesting a return receipt has been received (Verify).
#
# (B) Optionally, enable a user to perform the following prescription-related electronic transactions in accordance with the standard specified in § 170.205(b)(1) and, at a minimum, the version of the standard specified in § 170.207(d)(3) as follows:
#
# (1) Create and respond to new prescriptions (NewRxRequest, NewRxResponseDenied).
#
# (2) Send fill status notifications (RxFillIndicatorChange).
#
# (3) Ask the Mailbox if there are any transactions (GetMessage).
#
# (4) Request to send an additional supply of medication (Resupply).
#
# (5) Communicate drug administration events (DrugAdministration).
#
# (6) Request and respond to transfer one or more prescriptions between pharmacies (RxTransferRequest, RxTransferResponse, RxTransferConfirm).
#
# (7) Recertify the continued administration of a medication order (Recertification).
#
# (8) Complete Risk Evaluation and Mitigation Strategy (REMS) transactions (REMSInitiationRequest, REMSInitiationResponse, REMSRequest, and REMSResponse).
#
# (9) Electronic prior authorization transactions (PAInitiationRequest, PAInitiationResponse, PARequest, PAResponse, PAAppealRequest, PAAppealResponse, PACancelRequest, and PACancelResponse).
#
# (C) For the following prescription-related transactions, the technology must be able to receive and transmit the reason for prescription using the diagnosis elements: <Diagnosis> <Primary> or <Secondary>:
#
# (1) Required transactions:
#
# (i) Create new prescriptions (NewRx).
#
# (ii) Request and respond to change prescriptions (RxChangeRequest, RxChangeResponse).
#
# (iii) Cancel prescriptions (CancelRx).
#
# (iv) Request and respond to renew prescriptions (RxRenewalRequest, RxRenewalResponse).
#
# (v) Receive fill status notifications (RxFill).
#
# (vi) Receive medication history (RxHistoryResponse).
#
# (2) Optional transactions:
#
# (i) Request to send an additional supply of medication (Resupply)
#
# (ii) Request and respond to transfer one or more prescriptions between pharmacies (RxTransferRequest, RxTransferResponse)
#
# (iii) Complete Risk Evaluation and Mitigation Strategy (REMS) transactions (REMSInitiationRequest, REMSInitiationResponse, REMSRequest, and REMSResponse).
#
# (iv) Electronic prior authorization (ePA) transactions (PAInitiationRequest, PAInitiationResponse, PARequest, PAResponse, PAAppealRequest, PAAppealResponse and PACancelRequest, PACancelResponse).
#
# (D) Optional:  For each transaction listed in paragraph (b)(3)(ii)(C) of this section, the technology must be able to receive and transmit reason for prescription using the <IndicationforUse> element in the SIG segment.
#
# (E) Limit a user's ability to prescribe all oral liquid medications in only metric standard units of mL (i.e., not cc).
#
# (F) Always insert leading zeroes before the decimal point for amounts less than one and must not allow trailing zeroes after a decimal point when a user prescribes medications.

@170.315-b-3 @eprescribing @erx @care-coordination
Feature: Electronic Prescribing
  As a prescribing provider
  I want to electronically transmit prescriptions
  So that I can improve medication safety, reduce errors, and enhance efficiency

  Background:
    Given I am authenticated as a prescribing provider
    And I am connected to an e-prescribing network
    And the technology was certified after June 30, 2020

  # ------ Create New Prescriptions ------

  Scenario: Create new prescription electronically (NewRx)
    Given I am prescribing a new medication
    When I transmit the prescription electronically
    Then the system shall enable NewRx transaction per § 170.207(d)(1)
    And the system shall comply with § 170.205(b)(1) standard
    And the prescription shall be transmitted to the pharmacy

  Scenario: Include reason for prescription using diagnosis elements
    Given I am creating a new prescription
    When I include the indication for the medication
    Then the system shall receive and transmit reason using <Diagnosis><Primary> or <Secondary> elements
    And the diagnosis shall be coded appropriately

  # ------ Change Prescriptions ------

  Scenario: Request change to prescription (RxChangeRequest)
    Given an active prescription exists
    When I need to modify the prescription
    Then the system shall enable RxChangeRequest transaction
    And the request shall be sent to the pharmacy

  Scenario: Respond to change request (RxChangeResponse)
    Given a pharmacy has responded to change request
    When I receive the response
    Then the system shall enable receipt of RxChangeResponse transaction
    And I shall be able to review the pharmacy's response

  Scenario: Include reason for prescription change
    Given I am requesting a prescription change
    When I transmit the change request
    Then the system shall receive and transmit reason using diagnosis elements
    And the reason shall be clinically appropriate

  # ------ Cancel Prescriptions ------

  Scenario: Cancel prescription (CancelRx)
    Given an active prescription exists
    When I need to cancel the prescription
    Then the system shall enable CancelRx transaction
    And the cancellation shall be sent to the pharmacy

  Scenario: Receive cancellation response (CancelRxResponse)
    Given I have cancelled a prescription
    When the pharmacy responds
    Then the system shall receive CancelRxResponse transaction
    And the cancellation status shall be updated

  Scenario: Include reason for prescription cancellation
    Given I am cancelling a prescription
    When I transmit the cancellation
    Then the system shall receive and transmit reason using diagnosis elements
    And the reason shall be documented

  # ------ Renew Prescriptions ------

  Scenario: Request prescription renewal (RxRenewalRequest)
    Given a prescription is expiring
    When the pharmacy or patient requests renewal
    Then the system shall receive RxRenewalRequest transaction
    And I shall be able to review the renewal request

  Scenario: Respond to renewal request (RxRenewalResponse)
    Given I have reviewed a renewal request
    When I approve or deny the renewal
    Then the system shall enable RxRenewalResponse transaction
    And the response shall be sent to the pharmacy

  Scenario: Include reason for prescription renewal
    Given I am approving a prescription renewal
    When I transmit the renewal response
    Then the system shall receive and transmit reason using diagnosis elements
    And the indication shall be current

  # ------ Fill Status Notifications ------

  Scenario: Receive fill status notification (RxFill)
    Given a prescription has been dispensed
    When the pharmacy sends fill notification
    Then the system shall enable receipt of RxFill transaction
    And fill information shall be stored in patient record

  Scenario: Include reason in fill status notification
    Given a fill status notification is received
    When processing the notification
    Then the system shall receive reason using diagnosis elements
    And fill history shall include indication

  # ------ Medication History ------

  Scenario: Request medication history (RxHistoryRequest)
    Given I need to review patient's medication fill history
    When I request medication history
    Then the system shall enable RxHistoryRequest transaction
    And the request shall be sent to the health information exchange

  Scenario: Receive medication history (RxHistoryResponse)
    Given medication history has been requested
    When the response is received
    Then the system shall enable receipt of RxHistoryResponse transaction
    And medication history shall be displayed for review

  Scenario: Include reason in medication history
    Given medication history response is received
    When reviewing the fill history
    Then the system shall receive reason using diagnosis elements
    And indications shall be visible in history

  # ------ Status and Error Handling ------

  Scenario: Relay acceptance of transaction (Status)
    Given a prescription transaction has been received
    When acknowledging receipt
    Then the system shall enable Status transaction
    And acceptance shall be relayed back to sender

  Scenario: Respond to transaction problem (Error)
    Given a prescription transaction has a problem
    When an error occurs
    Then the system shall enable Error transaction
    And error details shall be communicated to sender

  Scenario: Respond to return receipt request (Verify)
    Given a transaction requests return receipt
    When the transaction is received
    Then the system shall enable Verify transaction
    And receipt confirmation shall be sent

  # ------ Medication Safety Features ------

  Scenario: Limit oral liquid medications to metric units
    Given I am prescribing an oral liquid medication
    When I specify the dosage
    Then the system shall limit prescribing to metric standard units of mL
    And the system shall not allow units of cc
    And this applies to all oral liquid medications

  Scenario: Insert leading zeroes for amounts less than one
    Given I am prescribing a medication with dose less than one
    When I enter the dosage
    Then the system shall always insert leading zeroes before decimal point
    And dosage shall display as "0.5" not ".5"

  Scenario: Prohibit trailing zeroes after decimal point
    Given I am prescribing a medication
    When I enter a dosage with decimal point
    Then the system shall not allow trailing zeroes after decimal point
    And dosage shall display as "1.5" not "1.50"

