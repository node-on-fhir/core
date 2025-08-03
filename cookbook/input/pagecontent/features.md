

#### Layout


#### Theming


#### SMART Healthcards


#### QR Codes & Cameras


#### EHR Launch


#### Cron Scheduler


#### FHIR Schemas


#### Proxy Server


#### Server Side Rendering


#### Websockets and Streaming Data


#### Accounts  


```json
{
  "public": {
    "title": "Custom Workflow",
    "defaults": {  
      "prominentHeader": true,
      "showPatientNameInHeader": true,
      "displayUserNameInHeader": true,
      "displayPollingRefreshIcon": true,
      "displayNavbars": true,
      "registration": {
        "signInWith": true,
        "displayFullLegalName": true,
        "displayNickname": true,
        "displayUsername": true,
        "displayEmail": true,
        "displayPassword": true,
        "displayInventationCode": true
      },
    
      "sidebar": {
        "menuItems": {
          "Registration": true,
          "Login": true
        }
      }
    },
    "interfaces": {
      "fhirServer": {
        "channel": {
          "endpoint": "http://localhost:3000/baseR4"
        }
      },
      "fhirRelay": {
        "channel": {
          "endpoint": "http://localhost:3000/baseR4"
        }
      },
      "ehrServer": {
        "channel": {
          "endpoint": "http://localhost:3000/baseR4"
        }
      },
      "oauthServer": {
        "name": "OAuth Server",
        "status": "active",
        "channel": {
          "endpoint": "http://localhost:3000/"
        }
      },
      "accountsServer": {      
        "name": "Accounts Server",
        "database": "meteor",
        "host": "http://localhost",
        "port": 3000
      }
    }
  },
  "private": {
    "invitationCode": "   QWERTY invitationCode   ",
    "clinicianInvitationCode": "   QWERTY clinicianInvitationCode   "
  }
}
```


```
```


#### Async Behavior


