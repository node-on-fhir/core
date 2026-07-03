// imports/accounts/server/methods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import crypto from 'crypto';
import { get } from 'lodash';
import { CarePlans } from '../../lib/schemas/SimpleSchemas/CarePlans';
import { CareTeams } from '../../lib/schemas/SimpleSchemas/CareTeams';
import { Conditions } from '../../lib/schemas/SimpleSchemas/Conditions';
import { Devices } from '../../lib/schemas/SimpleSchemas/Devices';
import { Observations } from '../../lib/schemas/SimpleSchemas/Observations';
import { MedicationStatements } from '../../lib/schemas/SimpleSchemas/MedicationStatements';
import { Patients } from '../../lib/schemas/SimpleSchemas/Patients';
import { Practitioners } from '../../lib/schemas/SimpleSchemas/Practitioners';
import { Procedures } from '../../lib/schemas/SimpleSchemas/Procedures';
import { FhirUtilities } from '../../lib/FhirUtilities';

const log = (Meteor.Logger ? Meteor.Logger.for('AccountsMethods') : console);

Meteor.methods({
  // Removed custom accounts.createUser and accounts.login methods
  // These are handled by Meteor's built-in accounts-password package
  
  // Test method to verify connection
  'accounts.test'() {
    console.log('[Accounts] Test method called successfully');
    return {
      success: true,
      timestamp: new Date(),
      message: 'Accounts test method is working'
    };
  },
  
  // Test method to create user server-side
  'accounts.testCreateUser'(userData) {
    check(userData, {
      username: String,
      email: String,
      password: String
    });
    
    console.log('[Accounts] Test create user method called with:', {
      username: userData.username,
      email: userData.email
    });
    
    try {
      const userId = Accounts.createUser({
        username: userData.username,
        email: userData.email,
        password: userData.password
      });
      
      console.log('[Accounts] User created successfully with ID:', userId);
      return { success: true, userId };
    } catch (error) {
      console.error('[Accounts] Server-side user creation error:', error);
      throw error;
    }
  },
  
  async 'accounts.sendResetPasswordEmail'(email) {
    check(email, String);
    
    // Find user by email
    const user = await Accounts.findUserByEmail(email);
    if (!user) {
      throw new Meteor.Error(403, 'Email address not found');
    }
    
    // Send reset password email
    try {
      await Accounts.sendResetPasswordEmail(user._id, email);
    } catch (error) {
      console.error('Error sending reset password email:', error);
      throw new Meteor.Error(500, 'Failed to send reset email. Please try again later.');
    }
    
    return true;
  },
  
  'accounts.sendVerificationEmail'(userId) {
    check(userId, String);
    
    // Only allow users to send verification email for themselves
    if (this.userId !== userId) {
      throw new Meteor.Error(403, 'Not authorized');
    }
    
    try {
      Accounts.sendVerificationEmail(userId);
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Meteor.Error(500, 'Failed to send verification email. Please try again later.');
    }
    
    return true;
  },
  
  async 'accounts.checkEmailAvailability'(email) {
    check(email, String);
    
    const user = await Accounts.findUserByEmail(email);
    return !user; // true if email is available
  },
  
  async 'accounts.checkUsernameAvailability'(username) {
    check(username, String);
    
    const user = await Accounts.findUserByUsername(username);
    return !user; // true if username is available
  },
  
  // Check if email is configured
  'accounts.isEmailConfigured'() {
    const hasMailUrl = !!process.env.MAIL_URL;
    const smtpConfig = get(Meteor, 'settings.private.email.smtp', {});
    const hasSettingsSmtp = !!(
      smtpConfig.host &&
      smtpConfig.username &&
      smtpConfig.username !== 'YOUR_SMTP_USERNAME' &&
      smtpConfig.password
    );

    return {
      configured: hasMailUrl || hasSettingsSmtp,
      hasMailUrl: hasMailUrl
    };
  },

  // Send a test email to the current user to verify SMTP configuration
  async 'accounts.sendTestEmail'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authenticated', 'User not authenticated');
    }

    const user = await Meteor.users.findOneAsync(this.userId);
    const email = get(user, 'emails.0.address');

    if (!email) {
      throw new Meteor.Error('no-email', 'Your account has no email address');
    }

    const siteName = get(Meteor, 'settings.public.title', 'Honeycomb');

    try {
      Email.send({
        to: email,
        from: get(Accounts, 'emailTemplates.from', 'noreply@example.com'),
        subject: 'Test email from ' + siteName,
        text: 'This is a test email from ' + siteName + '.\n\nIf you received this, your email configuration is working correctly.'
      });

      console.log('[accounts.sendTestEmail] Test email sent to:', email);
      return { success: true, sentTo: email };
    } catch (error) {
      console.error('[accounts.sendTestEmail] Error sending test email:', error);
      throw new Meteor.Error('send-failed', error.message || 'Failed to send test email');
    }
  },

  async 'accounts.checkAvailability'(username, email) {
    check(username, String);
    check(email, String);
    
    console.log('[Debug] checkAvailability called with:', { username, email });
    
    const userByUsername = await Accounts.findUserByUsername(username);
    const userByEmail = await Accounts.findUserByEmail(email);
    
    console.log('[Debug] findUserByUsername result:', userByUsername);
    console.log('[Debug] findUserByEmail result:', userByEmail);
    
    // Direct database check
    const directUsername = await Meteor.users.findOneAsync({ username });
    const directEmail = await Meteor.users.findOneAsync({ 'emails.address': email });
    console.log('[Debug] Direct username check:', directUsername);
    console.log('[Debug] Direct email check:', directEmail);
    console.log('[Debug] Total users:', await Meteor.users.find({}).countAsync());
    
    return {
      usernameAvailable: !userByUsername,
      emailAvailable: !userByEmail,
      suggestions: !userByUsername ? [] : [
        username + '_' + Math.floor(Math.random() * 1000),
        username + new Date().getFullYear(),
        username.replace('@', '_').replace('.', '_')
      ]
    };
  },
  
  async 'accounts.checkUserExists'(usernameOrEmail) {
    check(usernameOrEmail, String);
    
    console.log('[Debug] checkUserExists called with:', usernameOrEmail);
    
    // Check if it's an email or username
    const isEmail = usernameOrEmail.includes('@');
    
    let user;
    if (isEmail) {
      console.log('[Debug] Checking by email...');
      user = await Accounts.findUserByEmail(usernameOrEmail);
      console.log('[Debug] findUserByEmail result:', user);
    } else {
      console.log('[Debug] Checking by username...');
      user = await Accounts.findUserByUsername(usernameOrEmail);
      console.log('[Debug] findUserByUsername result:', user);
    }
    
    // Also do a direct database check
    const directCheck = await Meteor.users.findOneAsync({
      $or: [
        { username: usernameOrEmail },
        { 'emails.address': usernameOrEmail }
      ]
    });
    console.log('[Debug] Direct database check:', directCheck);
    console.log('[Debug] Total users in database:', await Meteor.users.find({}).countAsync());
    
    return {
      exists: !!user,
      isEmail: isEmail,
      hasPassword: user ? !!(user.services && user.services.password) : null
    };
  },

  async 'deleteMyAccount'() {
    console.log('[deleteMyAccount] Starting account deletion process');
    
    // Get current user from the access token
    // In Meteor 3, we use this.userId for the logged-in user
    const userId = this.userId;
    
    if (!userId) {
      throw new Meteor.Error(401, 'Unauthorized - User not logged in');
    }
    
    const currentUser = await Meteor.users.findOneAsync(userId);
    
    if (!currentUser) {
      throw new Meteor.Error(404, 'User not found');
    }
    
    // Get patientId from user record
    let selectedPatientId = get(currentUser, 'patientId');
    let selectedPatient = null;
    
    // Get patient record if patientId exists
    if (selectedPatientId) {
      selectedPatient = await Patients.findOneAsync({
        $or: [
          { id: selectedPatientId },
          { _id: selectedPatientId }
        ]
      });
    }
    
    console.log('[deleteMyAccount] Deleting user:', userId);
    log.debug('[deleteMyAccount] Patient ID', { selectedPatientId });
    
    // Log HIPAA audit event if enabled
    if (get(Meteor, 'settings.private.accessControl.enableHipaaLogging')) {
      const newAuditEvent = {
        "resourceType": "AuditEvent",
        "type": {
          'code': 'DeactivateUser',
          'display': 'Deactivate User'
        },
        "action": 'Deactivation',
        "recorded": new Date(),
        "outcome": [{
          "code": {
            "display": "Operation Successful",
            "code": "success",
            "system": "http://hl7.org/fhir/issue-severity"
          }
        }],
        "agent": [{
          "name": selectedPatient ? FhirUtilities.pluckName(selectedPatient) : get(currentUser, 'fullLegalName', 'Unknown User'),
          "who": {
            "display": selectedPatient ? FhirUtilities.pluckName(selectedPatient) : get(currentUser, 'fullLegalName', 'Unknown User'),
            "reference": selectedPatientId ? `Patient/${selectedPatientId}` : ''
          },
          "requestor": false
        }],
        "source": {
          "site": Meteor.absoluteUrl(),
          "identifier": {
            "value": Meteor.absoluteUrl()
          }
        },
        "entity": [{
          "reference": {
            "reference": ''
          }
        }]
      };
      
      console.log('[deleteMyAccount] Logging HIPAA event:', newAuditEvent);
      // Use the auditEvents.log method instead
      await Meteor.callAsync("auditEvents.log", 
        'DeactivateUser',
        userId,
        selectedPatientId ? `Patient/${selectedPatientId}` : null,
        'User account and health data deleted',
        { fhirResource: newAuditEvent }
      );
    }
    
    // Delete all patient-related data
    if (selectedPatientId) {
      const patientQuery = FhirUtilities.addPatientFilterToQuery(selectedPatientId);
      
      // Delete Conditions
      const conditionsDeleted = await Conditions.removeAsync(patientQuery);
      console.log(`[deleteMyAccount] Deleted ${conditionsDeleted} conditions`);
      
      // Delete CarePlans
      const carePlansDeleted = await CarePlans.removeAsync(patientQuery);
      console.log(`[deleteMyAccount] Deleted ${carePlansDeleted} care plans`);
      
      // Delete CareTeams
      const careTeamsDeleted = await CareTeams.removeAsync(patientQuery);
      console.log(`[deleteMyAccount] Deleted ${careTeamsDeleted} care teams`);
      
      // Delete Devices
      const devicesDeleted = await Devices.removeAsync(patientQuery);
      console.log(`[deleteMyAccount] Deleted ${devicesDeleted} devices`);
      
      // Delete MedicationStatements
      const medicationStatementsDeleted = await MedicationStatements.removeAsync(patientQuery);
      console.log(`[deleteMyAccount] Deleted ${medicationStatementsDeleted} medication statements`);
      
      // Delete Observations
      const observationsDeleted = await Observations.removeAsync(patientQuery);
      console.log(`[deleteMyAccount] Deleted ${observationsDeleted} observations`);
      
      // Delete Procedures
      const proceduresDeleted = await Procedures.removeAsync(patientQuery);
      console.log(`[deleteMyAccount] Deleted ${proceduresDeleted} procedures`);
      
      // Delete Patient record
      const patientsDeleted = await Patients.removeAsync({
        $or: [
          { id: selectedPatientId },
          { _id: selectedPatientId }
        ]
      });
      log.debug('[deleteMyAccount] Deleted patient records', { patientsDeleted });
    }
    
    // Delete the user account
    await Meteor.users.removeAsync(userId);
    console.log('[deleteMyAccount] User account deleted successfully');
    
    return "User health data deleted, and account deactivated.";
  },

  async 'users.linkPatient'(patientId) {
    // Validate patientId before check() to provide clearer error message
    if (!patientId || typeof patientId !== 'string') {
      log.warn('[users.linkPatient] Invalid patientId', { patientId });
      throw new Meteor.Error(400, 'Patient ID is required and must be a string');
    }

    check(patientId, String);

    // Ensure user is logged in
    if (!this.userId) {
      throw new Meteor.Error(401, 'User must be logged in');
    }

    try {
      // Update the current user's patientId
      const result = await Meteor.users.updateAsync(
        { _id: this.userId },
        { $set: { patientId: patientId } }
      );

      log.debug('[users.linkPatient] Linked patient to user', { patientId, userId: this.userId });
      return result;
    } catch (error) {
      console.error('[users.linkPatient] Error:', error); // phi-audit: ok
      throw new Meteor.Error(500, 'Failed to link patient to user');
    }
  },

  async 'users.clearPatientLink'() {
    // Ensure user is logged in
    if (!this.userId) {
      throw new Meteor.Error(401, 'User must be logged in');
    }

    try {
      const result = await Meteor.users.updateAsync(
        { _id: this.userId },
        { $unset: { patientId: "" } }
      );

      log.debug('[users.clearPatientLink] Cleared patient link for user', { userId: this.userId });
      return result;
    } catch (error) {
      console.error('[users.clearPatientLink] Error:', error); // phi-audit: ok
      throw new Meteor.Error(500, 'Failed to clear patient link');
    }
  },

  async 'users.clearPractitionerLink'() {
    // Ensure user is logged in
    if (!this.userId) {
      throw new Meteor.Error(401, 'User must be logged in');
    }

    try {
      const result = await Meteor.users.updateAsync(
        { _id: this.userId },
        { $unset: { practitionerId: "", practitionerRoleId: "" } }
      );

      console.log(`[users.clearPractitionerLink] Cleared practitioner link for user ${this.userId}`);
      return result;
    } catch (error) {
      console.error('[users.clearPractitionerLink] Error:', error);
      throw new Meteor.Error(500, 'Failed to clear practitioner link');
    }
  },

  async 'users.updatePhoneNumber'(phoneNumber) {
    check(phoneNumber, String);

    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'User must be logged in');
    }

    try {
      const result = await Meteor.users.updateAsync(
        { _id: this.userId },
        { $set: { 'profile.phoneNumber': phoneNumber } }
      );

      console.log(`[users.updatePhoneNumber] Updated phone for user ${this.userId}`);
      return result;
    } catch (error) {
      console.error('[users.updatePhoneNumber] Error:', error);
      throw new Meteor.Error(500, 'Failed to update phone number');
    }
  },

  async 'users.setWelcomeSeen'(hasSeen) {
    check(hasSeen, Boolean);

    if (!this.userId) {
      throw new Meteor.Error(401, 'User must be logged in');
    }

    try {
      const result = await Meteor.users.updateAsync(
        { _id: this.userId },
        { $set: { 'profile.hasSeenWelcome': hasSeen } }
      );

      console.log(`[users.setWelcomeSeen] Set hasSeenWelcome=${hasSeen} for user ${this.userId}`);
      return result;
    } catch (error) {
      console.error('[users.setWelcomeSeen] Error:', error);
      throw new Meteor.Error(500, 'Failed to update welcome status');
    }
  }
});