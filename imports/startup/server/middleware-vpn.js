// imports/startup/server/middleware-vpn.js

import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { Accounts } from 'meteor/accounts-base';
import { get } from 'lodash';

console.log('Loading VPN authentication middleware...');

// VPN authentication configuration
const vpnConfig = get(Meteor, 'settings.private.accounts.vpn', {
  enabled: true,
  networks: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'],
  userHeader: 'x-remote-user',
  groupsHeader: 'x-remote-groups',
  emailHeader: 'x-remote-email',
  nameHeader: 'x-remote-name',
  autoCreateUsers: true,
  defaultRole: 'vpn-user',
  requireGroups: [],
  mapGroupsToRoles: {}
});

// IP range checking utility
function isIPInRange(ip, range) {
  // Simple implementation - in production use a proper IP range library
  if (range.includes('/')) {
    const [network, bits] = range.split('/');
    // Simplified check - just check if IP starts with network prefix
    return ip.startsWith(network.split('.').slice(0, -1).join('.'));
  }
  return ip === range;
}

// VPN authentication middleware
WebApp.connectHandlers.use((req, res, next) => {
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0] || req.connection.remoteAddress;
  
  // Check if request is from VPN network
  const isVPN = vpnConfig.networks.some(network => isIPInRange(clientIP, network));
  
  if (isVPN) {
    // Extract user information from headers
    const vpnUser = req.headers[vpnConfig.userHeader];
    const vpnGroups = req.headers[vpnConfig.groupsHeader]?.split(',') || [];
    const vpnEmail = req.headers[vpnConfig.emailHeader];
    const vpnName = req.headers[vpnConfig.nameHeader];
    
    if (vpnUser) {
      // Check required groups
      if (vpnConfig.requireGroups.length > 0) {
        const hasRequiredGroup = vpnConfig.requireGroups.some(group => vpnGroups.includes(group));
        if (!hasRequiredGroup) {
          res.writeHead(403, { 'Content-Type': 'text/plain' });
          res.end('Access denied: Missing required group membership');
          return;
        }
      }
      
      // Set VPN user context
      req.vpnContext = {
        username: vpnUser,
        groups: vpnGroups,
        email: vpnEmail,
        name: vpnName,
        ip: clientIP
      };
      
      // Auto-create or update user if enabled
      if (vpnConfig.autoCreateUsers) {
        Meteor.defer(() => {
          createOrUpdateVPNUser(req.vpnContext);
        });
      }
      
      // Add VPN authentication headers to response
      res.setHeader('X-VPN-Authenticated', 'true');
      res.setHeader('X-VPN-User', vpnUser);
    }
  }
  
  next();
});

// Create or update VPN user
async function createOrUpdateVPNUser(vpnContext) {
  try {
    let user = Meteor.users.findOne({ 'services.vpn.username': vpnContext.username });
    
    if (user) {
      // Update existing user
      const updates = {
        'services.vpn.lastLoginAt': new Date(),
        'services.vpn.lastIP': vpnContext.ip,
        'services.vpn.groups': vpnContext.groups
      };
      
      if (vpnContext.email && !user.emails) {
        updates.emails = [{ address: vpnContext.email, verified: true }];
      }
      
      if (vpnContext.name) {
        updates['profile.name'] = vpnContext.name;
      }
      
      Meteor.users.update(user._id, { $set: updates });
      
      // Update roles based on groups
      updateUserRoles(user._id, vpnContext.groups);
    } else {
      // Create new user
      const userId = Accounts.insertUserDoc({}, {
        username: vpnContext.username,
        emails: vpnContext.email ? [{ address: vpnContext.email, verified: true }] : undefined,
        profile: {
          name: vpnContext.name || vpnContext.username,
          source: 'vpn'
        },
        services: {
          vpn: {
            username: vpnContext.username,
            groups: vpnContext.groups,
            createdAt: new Date(),
            lastLoginAt: new Date(),
            lastIP: vpnContext.ip
          }
        }
      });
      
      // Assign default role
      if (vpnConfig.defaultRole && Package['alanning:roles']) {
        Roles.addUsersToRoles(userId, [vpnConfig.defaultRole]);
      }
      
      // Map groups to roles
      updateUserRoles(userId, vpnContext.groups);
      
      console.log(`Created VPN user: ${vpnContext.username} (${userId})`);
    }
  } catch (error) {
    console.error('Error creating/updating VPN user:', error);
  }
}

// Update user roles based on VPN groups
function updateUserRoles(userId, groups) {
  if (!Package['alanning:roles'] || !vpnConfig.mapGroupsToRoles) return;
  
  const rolesToAdd = [];
  
  // Map VPN groups to application roles
  groups.forEach(group => {
    const mappedRole = vpnConfig.mapGroupsToRoles[group];
    if (mappedRole) {
      if (Array.isArray(mappedRole)) {
        rolesToAdd.push(...mappedRole);
      } else {
        rolesToAdd.push(mappedRole);
      }
    }
  });
  
  if (rolesToAdd.length > 0) {
    Roles.addUsersToRoles(userId, rolesToAdd);
  }
}

// Custom login handler for VPN authentication
Accounts.registerLoginHandler('vpn', (loginRequest) => {
  // Check if this is a VPN login request
  if (!loginRequest.vpn) {
    return undefined; // Let other handlers try
  }
  
  const { username, ip } = loginRequest.vpn;
  
  // Verify request is from VPN network
  const isVPN = vpnConfig.networks.some(network => isIPInRange(ip, network));
  if (!isVPN) {
    throw new Meteor.Error('vpn-network-required', 'Login must be from VPN network');
  }
  
  // Find user
  const user = Meteor.users.findOne({ 'services.vpn.username': username });
  if (!user) {
    throw new Meteor.Error('vpn-user-not-found', 'VPN user not found');
  }
  
  // Update last login
  Meteor.users.update(user._id, {
    $set: {
      'services.vpn.lastLoginAt': new Date(),
      'services.vpn.lastIP': ip
    }
  });
  
  return { userId: user._id };
});

// Methods for VPN authentication
Meteor.methods({
  'vpn.getCurrentUser': function() {
    // This would be called by client to get VPN user info
    const connection = this.connection;
    const headers = connection.httpHeaders;
    
    const vpnUser = headers[vpnConfig.userHeader];
    if (vpnUser) {
      return {
        username: vpnUser,
        groups: headers[vpnConfig.groupsHeader]?.split(',') || [],
        email: headers[vpnConfig.emailHeader],
        name: headers[vpnConfig.nameHeader]
      };
    }
    
    return null;
  },
  
  'vpn.login': function() {
    // Automatic login for VPN users
    const connection = this.connection;
    const vpnUser = connection.httpHeaders[vpnConfig.userHeader];
    
    if (!vpnUser) {
      throw new Meteor.Error('no-vpn-user', 'No VPN user detected');
    }
    
    // Use custom login handler
    const result = Accounts._loginMethod(this, 'vpn', [{ 
      vpn: { 
        username: vpnUser,
        ip: connection.clientAddress
      } 
    }]);
    
    return result;
  }
});

// Publish VPN user status
Meteor.publish('vpn.status', function() {
  const connection = this.connection;
  const vpnUser = connection?.httpHeaders?.[vpnConfig.userHeader];
  
  if (vpnUser) {
    this.added('vpn_status', 'current', {
      authenticated: true,
      username: vpnUser,
      groups: connection.httpHeaders[vpnConfig.groupsHeader]?.split(',') || []
    });
  } else {
    this.added('vpn_status', 'current', {
      authenticated: false
    });
  }
  
  this.ready();
});

console.log('VPN authentication middleware loaded');