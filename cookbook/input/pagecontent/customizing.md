

## Creating a Custom Plugin (aka module, package)

#### Step 1 - Clone the example plugin

```bash
cd my-app/packages
git clone https://github.com/clinical-meteor/example-plugin myapp-plugin

cd example-plugin/configs
cp settings.example.json settings.myapp.json

cd ../../..
```

#### Step 2 - Create a custom config file

```bash
cd example-plugin/configs
cp settings.example.json settings.myapp.json
```

#### Step 3 - Customize the package.js file

```js
Package.describe({
    name: 'myorg:my-app
    version: '0.1.0',
    summary: 'Add a summary here',
    git: 'https://github.com/myorg/my-app',
    documentation: 'README.md'
});
```

#### Step 4 - Add the plugin to your app

```bash
meteor add myorg:my-app

meteor npm install

meteor run --settings packages/myapp-plugin/configs/settings.myapp.json
```


## Step 5 - Edit the sidebar by adding a custom workflow

```json
{
  "public": {
    "title": "Custom Workflow",
    "defaults": {      
      "sidebar": {
        "menuItems": {
          "SidebarWorkflows": false,
        },
        "customWorkflows": [
          {"label": "Patient Lookup", "link": "/patient-lookup", "icon": "ic_list"}, 
          {"label": "Patient Chart", "link": "/patient-chart", "icon": "document"},
          {"label": "Patient Summary", "link": "/patient-summary", "icon": "document"},
          {"label": "Clinical Story", "link": "/clinical-story", "icon": "dashboard"},          
          {"label": "Vital Signs", "link": "/vital-signs", "icon": "iosPulseStrong"},
          {"label": "Cohort Analysis", "link": "/cohort-analysis", "icon": "users"},
          {"label": "Import Wearables Data", "link": "/wearables-import", "icon": "fire"},
          {"label": "Report Generator", "link": "/report-generator-page", "icon": "users"},
          {"label": "Health Record Analysis", "link": "/health-record-analysis", "icon": "users"},
          {"label": "Consent To Access", "link": "/access-control-consent", "icon": "ic_accesible"}
        ],
        "customSettings": [
          {"label": "Server Configuration", "link": "/server-configuration", "icon": "fire"}, 
          {"label": "OAuth Clients", "link": "/oauth-clients", "icon": "fire"},
          {"label": "UDAP Registration", "link": "/udap-registration", "icon": "fire"}
        ]
      }
    }
  },
  "private": {}
}
```


## Step 6 - Debugging  

```bash
DEBUG=true meteor run --settings packages/myapp-plugin/configs/settings.myapp.json
```