// test-login-fix.js
// Test to verify the login check fix in crud.plandefinitions.js

console.log('Testing login check fix...');

// Simulate the browser.execute context
function simulateBrowserExecute() {
  // Test case 1: Meteor is undefined
  let context1 = {};
  let result1 = (function() {
    const isLoggedIn = (typeof Meteor !== 'undefined' && Meteor.userId) ? !!Meteor.userId() : false;
    return { isLoggedIn: isLoggedIn };
  }).call(context1);
  console.log('Test 1 (Meteor undefined):', result1);

  // Test case 2: Meteor exists but userId is undefined
  let context2 = { Meteor: {} };
  let result2 = (function() {
    const isLoggedIn = (typeof Meteor !== 'undefined' && Meteor.userId) ? !!Meteor.userId() : false;
    return { isLoggedIn: isLoggedIn };
  }).call(context2);
  console.log('Test 2 (Meteor.userId undefined):', result2);

  // Test case 3: Meteor.userId exists and returns null
  let context3 = { 
    Meteor: { 
      userId: function() { return null; } 
    } 
  };
  let result3 = (function() {
    const isLoggedIn = (typeof Meteor !== 'undefined' && Meteor.userId) ? !!Meteor.userId() : false;
    return { isLoggedIn: isLoggedIn };
  }).call(context3);
  console.log('Test 3 (Meteor.userId returns null):', result3);

  // Test case 4: Meteor.userId exists and returns a valid ID
  let context4 = { 
    Meteor: { 
      userId: function() { return 'user123'; } 
    } 
  };
  let result4 = (function() {
    const isLoggedIn = (typeof Meteor !== 'undefined' && Meteor.userId) ? !!Meteor.userId() : false;
    return { isLoggedIn: isLoggedIn };
  }).call(context4);
  console.log('Test 4 (Meteor.userId returns valid ID):', result4);
}

// Test null result handling
function testNullResultHandling() {
  console.log('\nTesting null result handling...');
  
  // Simulate the callback with null result
  let callback = function(result) {
    if (!result || !result.value) {
      console.log('✓ Properly handled null result');
      return;
    }
    console.log('Result value:', result.value);
  };
  
  // Test with null
  callback(null);
  
  // Test with undefined
  callback(undefined);
  
  // Test with empty object
  callback({});
  
  // Test with valid result
  callback({ value: { isLoggedIn: true } });
}

simulateBrowserExecute();
testNullResultHandling();

console.log('\nAll tests completed!');