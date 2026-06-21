import { get, set, has } from 'lodash';
import React, {Component} from 'react'

import moment from 'moment';


ImportAlgorithm = {
  name: "Clinical Document Architecture (C-CDA)",
  description: "Clinical documents such as progress notes and discharge summaries.",
  fileType: "xml",
  routeTo: "/clinical-documents",
  run: function (dataContent, callback){
    let result = [];
    let worksheet = [];
    console.log('Attempting to run the Clinical Document Architecture import algorithm.', dataContent)

    // replace the following with whatever import logic makes sense
    if(typeof ClinicalDocuments === "object"){
      ClinicalDocuments.insert(dataContent);
    }
  }
}

export default ImportAlgorithm;

