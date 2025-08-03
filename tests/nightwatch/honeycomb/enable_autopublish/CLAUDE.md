These CRUD tests have been developed over nearly a decade of use.  Check with the user before making major updates to them.  They contain business logic, and the intent of Test Driven Development (TDD) is to adjust application code to meet business requirements; not to adjust business requirements to accomodate test code.  

IMPORTANT:  we are rebuilding a large app, after a multi-year rewrite.  Always propose alternative ways we could improve the code to meet the tests, rather than rewrite the tests on your own.  Get user agreement before updating tests.  

It is easy to abuse the `browser.execute()` function.  Always ask the user before:
-  implement publication/subscriptions