// packages/hipaa-compliance/server/policyMethods.js

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import fs from 'fs';
import path from 'path';
const { marked } = require('marked');
import { PolicyRoutes } from '../lib/PolicyRoutes';
import { policyGenerator } from '../lib/PolicyGenerator';
import { HipaaLogger } from '../lib/HipaaLoggerAccess';

// Try to import Roles if available
let Roles;
try {
  Roles = Package['alanning:roles']?.Roles;
} catch (e) {
  // Roles package not available
}

// Get the policies directory path
const getPoliciesPath = () => {
  // In production, this would be configured differently
  const basePath = process.env.PWD || process.cwd();
  return path.join(basePath, 'packages', 'hipaa-compliance', 'client', 'policies');
};

Meteor.methods({
  // Get a specific policy content
  'hipaa.getPolicy': async function(policyId) {
    check(policyId, String);
    
    try {
      // Find the policy route
      const policyRoute = PolicyRoutes.find(route => 
        route.path === `/hipaa/policies/${policyId}` || 
        route.name === policyId
      );
      
      if (!policyRoute || !policyRoute.policyFile) {
        throw new Meteor.Error('policy-not-found', 'Policy not found');
      }
      
      // Read the policy file
      const policyPath = path.join(getPoliciesPath(), policyRoute.policyFile);
      const policyContent = fs.readFileSync(policyPath, 'utf8');
      
      // Process the policy with current settings
      const processedContent = policyGenerator.generatePolicy(policyContent, false);
      
      // Convert markdown to HTML
      const htmlContent = marked(processedContent);
      
      // Log policy access
      await HipaaLogger.logSystemEvent('policy-viewed', {
        policyId: policyId,
        policyName: policyRoute.name,
        userId: this.userId
      });
      
      return {
        id: policyId,
        title: policyRoute.name,
        content: htmlContent,
        markdown: processedContent,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error loading policy:', error);
      throw new Meteor.Error('policy-load-error', 'Failed to load policy');
    }
  },

  // Get all available policies
  'hipaa.getAllPolicies': async function() {
    try {
      const policies = PolicyRoutes
        .filter(route => route.policyFile)
        .map(route => {
          const policyId = route.path.split('/').pop();
          return {
            id: policyId,
            name: route.name,
            path: route.path,
            file: route.policyFile
          };
        });
      
      return policies;
    } catch (error) {
      console.error('Error getting policies:', error);
      throw new Meteor.Error('policies-load-error', 'Failed to load policies');
    }
  },

  // Generate a policy based on current settings
  'hipaa.generatePolicy': async function(policyType) {
    check(policyType, String);
    
    // Check permissions - only admins can generate policies
    if (!this.userId || (Roles && !Roles.userIsInRole(this.userId, ['admin']))) {
      throw new Meteor.Error('unauthorized', 'Not authorized to generate policies');
    }
    
    let generatedContent;
    
    switch(policyType) {
      case 'audit':
        generatedContent = policyGenerator.generateAuditPolicy();
        break;
      case 'data-retention':
        generatedContent = policyGenerator.generateDataRetentionPolicy();
        break;
      default:
        throw new Meteor.Error('invalid-policy-type', 'Invalid policy type');
    }
    
    // Add header and footer
    const fullPolicy = policyGenerator.generateHeader() + generatedContent + policyGenerator.generateFooter();
    
    // Convert to HTML
    const htmlContent = marked(fullPolicy);
    
    // Log policy generation
    await HipaaLogger.logSystemEvent('policy-generated', {
      policyType: policyType,
      userId: this.userId
    });
    
    return {
      type: policyType,
      content: htmlContent,
      markdown: fullPolicy,
      generated: new Date()
    };
  },

  // Check for policy updates needed
  'hipaa.checkPolicyUpdates': async function() {
    const updates = policyGenerator.checkPolicyUpdates();
    
    return {
      updatesNeeded: updates.length > 0,
      updates: updates,
      lastChecked: new Date()
    };
  }
});