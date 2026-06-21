# mitre:leaderboard-starter

This is a very simple utility that generates a leaderboard of 1000 patients.


#### Installation


```bash
# install the meteor compiler; this will take care of node, nvm, npm, yarn, etc.
# it will also set up debugging tools, a compiler build tool, etc
npm install -g meteor

# download the node-on-fhir application
git clone https://gitlab.mitre.org/awatson/honeycomb3
cd honeycomb3

# install dependencies
meteor npm install

# alternative, use yarn if you'd like a more modern package manager
meteor yarn install

# run the application in local development mode
# this will automatically launch a mongo instance
meteor run --settings configs/settings.honeycomb.localhost.json 

# can we get to the FHIR server yet?
open http://localhost:3000/metadata

# stop the application with Ctrl-C

# now try running it with some server configs
meteor run --settings configs/settings.fhir.server.json 

# does it run?  can we get to the FHIR server?  To the Patient route?
open http://localhost:3000/baseR4/metadata
open http://localhost:3000/baseR4/Patient

# stop the application with Ctrl-C

meteor add mitre:leaderboard-starter

# after adding the plugin, you can simply run the following
meteor run 
```



#### License  
This project is licensed under the Apache License. See the `LICENSE` file for details.