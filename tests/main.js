import assert from "assert";

import '/imports/startup/both/loggingSetup.js';
if (Meteor.isServer) { require('/server/lib/loggingMethods.js'); }
import "/tests/mocha/validatedCollection.test.js";
import "/tests/mocha/outboundValidation.test.js";
import "/tests/mocha/loggingMethods.test.js";
import "/imports/ui/customThemeProvider.tests.js";

describe("meteor-app", function () {
  it("package.json has correct name", async function () {
    const { name } = await import("../package.json");
    assert.strictEqual(name, "meteor-app");
  });

  if (Meteor.isClient) {
    it("client is not server", function () {
      assert.strictEqual(Meteor.isServer, false);
    });
  }

  if (Meteor.isServer) {
    it("server is not client", function () {
      assert.strictEqual(Meteor.isClient, false);
    });
  }
});
