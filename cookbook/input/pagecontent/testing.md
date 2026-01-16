
## Testing  
```bash
# run the app
meteor --settings configs/settings.nodeonfhir.localhost.json 

# in a second terminal, run static code analysis tools
meteor npm run-script lint

# in a second terminal, run the verification tests
TEST_BROWSER_DRIVER=chrome meteor test --driver-package meteortesting:mocha --port 3002 --once --full-app

# in a second terminal, run the vaildation tests
meteor npm run-script nightwatch -- --tag circle 
```

