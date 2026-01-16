


#### Development Workflow

Recommended development pathway:

1.  Enable the following settings.  Estimated effort:  <1 hour.

```
settings.public.defaults.sidebar.menuItems.FhirResources
settings.public.defaults.sidebar.menuItems.DynamicModules
``` 

2. Load data into the system, and display in the FhirResources CRUD pages.  Estimated effort:  1 day.

3.  Develop custom workflow pages, import them into the package `index.jsx` file, and then export them as a `DynamicModule`.  Estimated effort:  weeks or months.

4.  Once workflow is shaped, you may wish additional control over the sidebar layout, in which case refactor the `DynamicModules` from the `index.jsx` file into the `settings.public.defaults.sidebar.customWorkflow` array of the settings file.  

5.  To lock down the sidebar workflow and not confuse users, set `settings.public.defaults.sidebar.menuItems.DynamicModules` to false.   

6.  To further reduce confusion among users, set `settings.public.defaults.sidebar.menuItems.FhirResources` to false to remove the CRUD pages.  




#### Sidebar Icons Values

- fire
- user
- userMd
- suitcase
- notepad
- heartbeat
- dashboard
- ic_devices
- ic_local_pharmacy
- ic_transfer_within_a_station
- eyedropper
- location
- erlenmeyerFlask
- iosPulseStrong
- hospitalO
- users
- document
- bath
- list
- addressCardO
- ic_hearing
- ic_fingerprint
- ic_accessible
- thermometer3
- stethoscope
- umbrella
- envelopeO
- ic_question_answer
- picnic_basket
- map
- mapO
- lifeRing
- dotCircle
- sun
- info
- question
- ic_account_balance_wallet
- ticket
- ic_album
- qrcode
- ic_playlist_add_check
- ic_list
- balanceScale
- heartO

