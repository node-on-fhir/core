// // tests/nightwatch/honeycomb/test-helpers.js
// // Helper functions for authentication tests

// module.exports = {
//   // Wait for and click a button by text content
//   clickButtonByText: function(client, buttonText, timeout = 5000) {
//     return client
//       .waitForElementPresent('button', timeout)
//       .execute(function(text) {
//         const buttons = document.querySelectorAll('button');
//         for (let button of buttons) {
//           if (button.textContent.includes(text)) {
//             button.click();
//             return { clicked: true, text: button.textContent };
//           }
//         }
//         return { clicked: false, searched: text };
//       }, [buttonText], function(result) {
//         console.log('Button click result:', result.value);
//       });
//   },

//   // Set field value even if disabled
//   setFieldValue: function(client, selector, value) {
//     return client.execute(function(sel, val) {
//       const field = document.querySelector(sel);
//       if (field) {
//         field.value = val;
//         // Trigger various events to ensure React updates
//         field.dispatchEvent(new Event('input', { bubbles: true }));
//         field.dispatchEvent(new Event('change', { bubbles: true }));
//         return { success: true, disabled: field.disabled };
//       }
//       return { success: false };
//     }, [selector, value], function(result) {
//       console.log(`Set ${selector} value:`, result.value);
//     });
//   },

//   // Check authentication state
//   checkAuthState: function(client) {
//     return client.execute(function() {
//       return {
//         url: window.location.pathname,
//         userId: typeof Meteor !== 'undefined' ? Meteor.userId() : null,
//         username: typeof Meteor !== 'undefined' && Meteor.user() ? Meteor.user().username : null,
//         loggedIn: typeof Meteor !== 'undefined' ? !!Meteor.userId() : false
//       };
//     }, function(result) {
//       console.log('Auth state:', result.value);
//     });
//   },

//   // Wait for element and get its state
//   getElementState: function(client, selector) {
//     return client.execute(function(sel) {
//       const element = document.querySelector(sel);
//       if (!element) return null;
      
//       return {
//         exists: true,
//         disabled: element.disabled,
//         value: element.value,
//         type: element.type,
//         name: element.name,
//         visible: element.offsetParent !== null
//       };
//     }, [selector]);
//   },

//   // Create test user via Meteor method
//   createTestUser: function(client, username, email, password) {
//     return client.executeAsync(function(user, mail, pass, done) {
//       if (typeof Meteor !== 'undefined') {
//         Meteor.call('test.createTestUser', {
//           username: user,
//           email: mail,
//           password: pass
//         }, function(error, result) {
//           done({ error: error, result: result });
//         });
//       } else {
//         done({ error: 'Meteor not available' });
//       }
//     }, [username, email, password], function(result) {
//       console.log('Create test user result:', result.value);
//     });
//   },

//   // Logout current user
//   logout: function(client) {
//     return client.executeAsync(function(done) {
//       if (typeof Meteor !== 'undefined' && Meteor.userId()) {
//         Meteor.logout(function() {
//           done({ loggedOut: true });
//         });
//       } else {
//         done({ loggedOut: false, reason: 'Not logged in' });
//       }
//     }, function(result) {
//       console.log('Logout result:', result.value);
//     });
//   }
// };