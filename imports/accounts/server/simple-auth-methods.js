// imports/accounts/server/simple-auth-methods.js

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { Random } from 'meteor/random';
import bcrypt from 'bcrypt';

// Create users collection if it doesn't exist
const Users = new Mongo.Collection('users');

// Simple methods that don't depend on accounts-base package
Meteor.methods({
  'accounts.createUser': async function(userData) {
    check(userData, {
      username: String,
      email: String,
      password: String
    });
    
    // Check if user already exists
    const existingUser = await Users.findOneAsync({
      $or: [
        { username: userData.username },
        { 'emails.address': userData.email }
      ]
    });
    
    if (existingUser) {
      if (existingUser.username === userData.username) {
        throw new Meteor.Error(403, 'Username already exists');
      } else {
        throw new Meteor.Error(403, 'Email address already registered');
      }
    }
    
    // Hash the password securely using bcrypt
    const saltRounds = 10;
    const hashedPassword = bcrypt.hashSync(userData.password, saltRounds);
    
    // Create the user
    const userId = await Users.insertAsync({
      _id: Random.id(),
      username: userData.username,
      emails: [{
        address: userData.email,
        verified: false
      }],
      services: {
        password: {
          bcrypt: hashedPassword
        },
        resume: {
          loginTokens: []
        }
      },
      createdAt: new Date(),
      profile: {}
    });
    
    // Auto-login the user by creating a token
    const stampedLoginToken = {
      token: Random.secret(),
      when: new Date()
    };
    
    await Users.updateAsync(userId, {
      $push: {
        'services.resume.loginTokens': stampedLoginToken
      }
    });
    
    // Return success with login token
    return {
      userId,
      token: stampedLoginToken.token
    };
  },
  
  'accounts.login': async function(credentials) {
    check(credentials, {
      username: String,
      password: String
    });
    
    // Find user by username or email
    const user = await Users.findOneAsync({
      $or: [
        { username: credentials.username },
        { 'emails.address': credentials.username }
      ]
    });
    
    if (!user) {
      throw new Meteor.Error(403, 'User not found');
    }
    
    // Check password securely using bcrypt
    const passwordMatch = bcrypt.compareSync(credentials.password, user.services?.password?.bcrypt);
    if (!passwordMatch) {
      throw new Meteor.Error(403, 'Incorrect password');
    }
    
    // Create login token
    const stampedLoginToken = {
      token: Random.secret(),
      when: new Date()
    };
    
    // Initialize services.resume.loginTokens if it doesn't exist
    if (!user.services.resume) {
      await Users.updateAsync(user._id, {
        $set: { 'services.resume': { loginTokens: [] } }
      });
    }
    
    await Users.updateAsync(user._id, {
      $push: {
        'services.resume.loginTokens': stampedLoginToken
      }
    });
    
    return {
      userId: user._id,
      token: stampedLoginToken.token
    };
  }
});

console.log('Simple auth methods registered');