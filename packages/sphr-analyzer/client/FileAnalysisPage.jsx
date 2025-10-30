// packages/sphr-analyzer/client/FileAnalysisPage.jsx
import React from 'react';

import { Button, Container, Grid, CardHeader, CardContent, Typography, useTheme } from '@mui/material';

import { useTracker } from 'meteor/react-meteor-data';

import { cloneDeep, get } from 'lodash';

import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { Sunburst } from '@nivo/sunburst';

let useAppTheme;
Meteor.startup(function(){
  useAppTheme = Meteor.useTheme;
});


// //=============================================================================================================================================
// // COLLECTIONS


let collectionNames = [
      "AllergyIntolerances",
      "AuditEvents",
      "Bundles",
      "CodeSystems",
      "Conditions",
      "Consents",
      "Communications",
      "CommunicationRequests",
      "CarePlans",
      "CareTeams",
      "Compositions",
      "Devices",
      "DocumentReferences",
      "DocumentManifests",
      "Encounters",
      "Endpoints",
      "HealthcareServices",
      "Immunizations",
      "InsurancePlans",
      "Locations",
      "Medications",
      "Measure",
      "MeasureReports",
      "Networks",
      "OAuthClients",
      "Observations",
      "Organizations",
      "OrganizationAffiliations",
      "Patients",
      "Practitioners",
      "PractitionerRoles",
      "Procedures",
      "Provenances",
      "Questionnaires",
      "QuestionnaireResponses",
      "Restrictions",
      "SearchParameters",
      "StructureDefinitions",
      "Subscriptions",
      "Tasks",
      "ValueSets",
      "VerificationResults",
      "UdapCertificates"
  ];



// //=============================================================================================================================================
// // DATA VISUALIZATIONS

let sunburstData = {
  "name": "nivo",
  "color": "hsl(225, 70%, 50%)",
  "children": [
    {
      "name": "viz",
      "color": "hsl(246, 70%, 50%)",
      "children": [
        {
          "name": "stack",
          "color": "hsl(233, 70%, 50%)",
          "children": [
            {
              "name": "cchart",
              "color": "hsl(271, 70%, 50%)",
              "loc": 16184
            },
            {
              "name": "xAxis",
              "color": "hsl(233, 70%, 50%)",
              "loc": 90873
            },
            {
              "name": "yAxis",
              "color": "hsl(263, 70%, 50%)",
              "loc": 199478
            },
            {
              "name": "layers",
              "color": "hsl(18, 70%, 50%)",
              "loc": 56192
            }
          ]
        },
        {
          "name": "ppie",
          "color": "hsl(98, 70%, 50%)",
          "children": [
            {
              "name": "chart",
              "color": "hsl(16, 70%, 50%)",
              "children": [
                {
                  "name": "pie",
                  "color": "hsl(207, 70%, 50%)",
                  "children": [
                    {
                      "name": "outline",
                      "color": "hsl(200, 70%, 50%)",
                      "loc": 22907
                    },
                    {
                      "name": "slices",
                      "color": "hsl(274, 70%, 50%)",
                      "loc": 43338
                    },
                    {
                      "name": "bbox",
                      "color": "hsl(95, 70%, 50%)",
                      "loc": 194460
                    }
                  ]
                },
                {
                  "name": "donut",
                  "color": "hsl(323, 70%, 50%)",
                  "loc": 161812
                },
                {
                  "name": "gauge",
                  "color": "hsl(76, 70%, 50%)",
                  "loc": 77818
                }
              ]
            },
            {
              "name": "legends",
              "color": "hsl(300, 70%, 50%)",
              "loc": 146578
            }
          ]
        }
      ]
    },
    {
      "name": "colors",
      "color": "hsl(305, 70%, 50%)",
      "children": [
        {
          "name": "rgb",
          "color": "hsl(275, 70%, 50%)",
          "loc": 63913
        },
        {
          "name": "hsl",
          "color": "hsl(139, 70%, 50%)",
          "loc": 98827
        }
      ]
    },
    {
      "name": "utils",
      "color": "hsl(276, 70%, 50%)",
      "children": [
        {
          "name": "randomize",
          "color": "hsl(100, 70%, 50%)",
          "loc": 7476
        },
        {
          "name": "resetClock",
          "color": "hsl(216, 70%, 50%)",
          "loc": 43524
        },
        {
          "name": "noop",
          "color": "hsl(264, 70%, 50%)",
          "loc": 167935
        },
        {
          "name": "tick",
          "color": "hsl(86, 70%, 50%)",
          "loc": 23250
        },
        {
          "name": "forceGC",
          "color": "hsl(14, 70%, 50%)",
          "loc": 158067
        },
        {
          "name": "stackTrace",
          "color": "hsl(52, 70%, 50%)",
          "loc": 69330
        },
        {
          "name": "dbg",
          "color": "hsl(175, 70%, 50%)",
          "loc": 91758
        }
      ]
    },
    {
      "name": "generators",
      "color": "hsl(283, 70%, 50%)",
      "children": [
        {
          "name": "address",
          "color": "hsl(19, 70%, 50%)",
          "loc": 20382
        },
        {
          "name": "city",
          "color": "hsl(350, 70%, 50%)",
          "loc": 152008
        },
        {
          "name": "animal",
          "color": "hsl(52, 70%, 50%)",
          "loc": 114424
        },
        {
          "name": "movie",
          "color": "hsl(69, 70%, 50%)",
          "loc": 14969
        },
        {
          "name": "user",
          "color": "hsl(4, 70%, 50%)",
          "loc": 108934
        }
      ]
    },
    {
      "name": "set",
      "color": "hsl(275, 70%, 50%)",
      "children": [
        {
          "name": "clone",
          "color": "hsl(158, 70%, 50%)",
          "loc": 38771
        },
        {
          "name": "intersect",
          "color": "hsl(258, 70%, 50%)",
          "loc": 116234
        },
        {
          "name": "merge",
          "color": "hsl(269, 70%, 50%)",
          "loc": 182104
        },
        {
          "name": "reverse",
          "color": "hsl(216, 70%, 50%)",
          "loc": 120089
        },
        {
          "name": "toArray",
          "color": "hsl(359, 70%, 50%)",
          "loc": 129189
        },
        {
          "name": "toObject",
          "color": "hsl(78, 70%, 50%)",
          "loc": 66718
        },
        {
          "name": "fromCSV",
          "color": "hsl(234, 70%, 50%)",
          "loc": 180512
        },
        {
          "name": "slice",
          "color": "hsl(168, 70%, 50%)",
          "loc": 60551
        },
        {
          "name": "append",
          "color": "hsl(228, 70%, 50%)",
          "loc": 161691
        },
        {
          "name": "prepend",
          "color": "hsl(198, 70%, 50%)",
          "loc": 11545
        },
        {
          "name": "shuffle",
          "color": "hsl(249, 70%, 50%)",
          "loc": 101224
        },
        {
          "name": "pick",
          "color": "hsl(163, 70%, 50%)",
          "loc": 34222
        },
        {
          "name": "plouc",
          "color": "hsl(194, 70%, 50%)",
          "loc": 62190
        }
      ]
    },
    {
      "name": "text",
      "color": "hsl(102, 70%, 50%)",
      "children": [
        {
          "name": "trim",
          "color": "hsl(280, 70%, 50%)",
          "loc": 21528
        },
        {
          "name": "slugify",
          "color": "hsl(60, 70%, 50%)",
          "loc": 178945
        },
        {
          "name": "snakeCase",
          "color": "hsl(52, 70%, 50%)",
          "loc": 13588
        },
        {
          "name": "camelCase",
          "color": "hsl(172, 70%, 50%)",
          "loc": 71084
        },
        {
          "name": "repeat",
          "color": "hsl(303, 70%, 50%)",
          "loc": 45282
        },
        {
          "name": "padLeft",
          "color": "hsl(232, 70%, 50%)",
          "loc": 186162
        },
        {
          "name": "padRight",
          "color": "hsl(79, 70%, 50%)",
          "loc": 1745
        },
        {
          "name": "sanitize",
          "color": "hsl(148, 70%, 50%)",
          "loc": 84851
        },
        {
          "name": "ploucify",
          "color": "hsl(343, 70%, 50%)",
          "loc": 4911
        }
      ]
    },
    {
      "name": "misc",
      "color": "hsl(324, 70%, 50%)",
      "children": [
        {
          "name": "greetings",
          "color": "hsl(212, 70%, 50%)",
          "children": [
            {
              "name": "hey",
              "color": "hsl(26, 70%, 50%)",
              "loc": 129342
            },
            {
              "name": "HOWDY",
              "color": "hsl(68, 70%, 50%)",
              "loc": 92757
            },
            {
              "name": "aloha",
              "color": "hsl(111, 70%, 50%)",
              "loc": 98271
            },
            {
              "name": "AHOY",
              "color": "hsl(312, 70%, 50%)",
              "loc": 97363
            }
          ]
        },
        {
          "name": "other",
          "color": "hsl(314, 70%, 50%)",
          "loc": 88079
        },
        {
          "name": "path",
          "color": "hsl(239, 70%, 50%)",
          "children": [
            {
              "name": "pathA",
              "color": "hsl(62, 70%, 50%)",
              "loc": 54696
            },
            {
              "name": "pathB",
              "color": "hsl(273, 70%, 50%)",
              "children": [
                {
                  "name": "pathB1",
                  "color": "hsl(241, 70%, 50%)",
                  "loc": 166024
                },
                {
                  "name": "pathB2",
                  "color": "hsl(297, 70%, 50%)",
                  "loc": 56729
                },
                {
                  "name": "pathB3",
                  "color": "hsl(125, 70%, 50%)",
                  "loc": 139534
                },
                {
                  "name": "pathB4",
                  "color": "hsl(145, 70%, 50%)",
                  "loc": 117925
                }
              ]
            },
            {
              "name": "pathC",
              "color": "hsl(8, 70%, 50%)",
              "children": [
                {
                  "name": "pathC1",
                  "color": "hsl(158, 70%, 50%)",
                  "loc": 85164
                },
                {
                  "name": "pathC2",
                  "color": "hsl(287, 70%, 50%)",
                  "loc": 2193
                },
                {
                  "name": "pathC3",
                  "color": "hsl(277, 70%, 50%)",
                  "loc": 12547
                },
                {
                  "name": "pathC4",
                  "color": "hsl(173, 70%, 50%)",
                  "loc": 12484
                },
                {
                  "name": "pathC5",
                  "color": "hsl(27, 70%, 50%)",
                  "loc": 66777
                },
                {
                  "name": "pathC6",
                  "color": "hsl(71, 70%, 50%)",
                  "loc": 47981
                },
                {
                  "name": "pathC7",
                  "color": "hsl(112, 70%, 50%)",
                  "loc": 194479
                },
                {
                  "name": "pathC8",
                  "color": "hsl(71, 70%, 50%)",
                  "loc": 133957
                },
                {
                  "name": "pathC9",
                  "color": "hsl(358, 70%, 50%)",
                  "loc": 162455
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

let dynamicSunburstTemplate = {
  "name": "nivo",
  "color": "hsl(225, 70%, 50%)",
  "children": []
}

//=============================================================================================================================================
// MAIN COMPONENT


export function FileAnalysisPage(props){
  const theme = useTheme();
  const appTheme = useAppTheme ? useAppTheme() : { theme: 'light' };

  let headerHeight = 84;

  let noDataImagePath = get(Meteor, 'settings.public.defaults.noData.noDataImagePathPath', "NoData.png");


  if(get(Meteor, 'settings.public.defaults.prominantHeader')){
    headerHeight = 148;
  }

  function openLink(url){
    console.log("openLink", url);
    // Use window.location for navigation since this is only called from a simple button click
    window.location.href = url;
  }

  let imgHeight = (Session.get('appHeight') - 210) / 3;

    let data = {
      chart: {
        width: Session.get('appWidth') || 1200,  // Default width to prevent undefined
        height: 800
      },
      style: {
        page: {},
        coverImg: {
          maxWidth: 'inherit',
          maxHeight: 'inherit',
          height: 'inherit'
        },
        cards: {
          media: {
            height: (imgHeight - 1) + 'px',
            overflowY: 'hidden',
            objectFit: 'cover'
          },
          practitioners: {
            cursor: 'pointescale-downr',
            height: imgHeight + 'px',
            overflowY: 'hidden',
            objectFit: 'cover'
          },
          organizations: {
            cursor: 'pointer',
            height: imgHeight + 'px',
            overflowY: 'hidden',
            objectFit: 'cover'
          },
          locations: {
            cursor: 'pointer',
            height: imgHeight + 'px',
            overflowY: 'hidden',
            objectFit: 'cover'
          }
        },
        inactiveIndexCard: {
          opacity: .5,
          width: '100%',
          display: 'inline-block',
          paddingLeft: '10px',
          paddingRight: '10px',
          paddingBottom: '0px'
        },
        tile: {
          width: '100%',
          display: 'inline-block',
          paddingLeft: '10px',
          paddingRight: '10px',
          paddingBottom: '0px',
          marginBottom: '20px',
          height: imgHeight + 'px'
        },
        spacer: {
          display: 'block'
        }
      },
      organizations: {
        image: "/pages/provider-directory/organizations.jpg"
      }
    };

    const trackedWidth = useTracker(function(){
      return Session.get('appWidth') || 1200;
    }, [])

    let dynamicSunburstData = cloneDeep(dynamicSunburstTemplate);


    collectionNames.forEach(function(collectionName){
      if(typeof window[collectionName] === "object"){
        dynamicSunburstData.children.push({
          "name": collectionName,
          "color": "hsl(271, 70%, 50%)",
          "loc": window[collectionName].find().count()
        });  
      }        
    })

    let recordsExists = false;
    collectionNames.forEach(function(collectionName){
      if(typeof window[collectionName] === "object"){
        if(window[collectionName].find().count() > 0){
          recordsExists = true;
        }
      }
    })

    let layoutContent;
    if(recordsExists){
      layoutContent = <Grid container justifyContent="center" alignItems="center" style={{ paddingTop: '100px' }}>
        <Grid item xs={12} style={{ display: 'flex', justifyContent: 'center' }}>
          <Sunburst
            width={ trackedWidth }
            height={ data.chart.height}                      
            data={dynamicSunburstData}
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
            id="name"
            value="loc"
            cornerRadius={15}
            borderWidth={5}
            borderColor="#f2f2f2"
            colors={{ scheme: 'nivo' }}
            childColor={{
                from: 'color',
                modifiers: [
                    [
                        'brighter',
                        0.2
                    ]
                ]
            }}
            enableArcLabels={true}
            arcLabel={function(d){
              return `${d.id} (${d.value})`
            }}
            arcLabelsSkipAngle={10}
            arcLabelsTextColor={{
                from: 'color',
                modifiers: [
                    [
                        'darker',
                        2
                    ]
                ]
            }}
          />
        </Grid>
      </Grid>
  } else {
    
    let noDataImageElement;
    if(noDataImagePath){
      noDataImageElement = <img src={Meteor.absoluteUrl() + noDataImagePath} style={{width: '100%'}} />    
    }
    layoutContent = <Container maxWidth="sm" >
      {noDataImageElement}
      <CardContent>
        <CardHeader 
          title={get(Meteor, 'settings.public.defaults.noData.defaultTitle', "No Data Found")} 
          subheader={get(Meteor, 'settings.public.defaults.noData.defaultMessage', "No records appear to be loaded.  Click the following link to start the Import Data workflow.")} 
        />
        <Button 
          fullWidth
          variant="contained"
          color="primary"
          onClick={openLink.bind(this, '/import-data')}
          >Import Data</Button>
      </CardContent>
    </Container>
  }


  return (
    <div id='FileAnalysisPage' style={{
      minHeight: '100vh',
      paddingTop: '24px'
    }}>
      { layoutContent }
    </div>
  );
}


export default FileAnalysisPage;