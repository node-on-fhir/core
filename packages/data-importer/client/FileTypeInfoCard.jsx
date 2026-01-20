import { Meteor } from 'meteor/meteor';
import React, { useState } from 'react';
import PropTypes from 'prop-types';

export function FileTypeInfoCard(props){

  return(
    <div>
        <CardHeader title="FHIR" subheader="Fast Healthcare Interoperability Resources" />
        <CardHeader title="CCD" subheader="Continuity of Care Document" />
        <CardHeader title="PDF" subheader="Portable Document Format" />
        <CardHeader title="DCM" subheader="Digital Imaging and Communications in Medicine (DICOM)" />
        <CardHeader title="JSON" subheader="Javascript Object Notation" />
        <CardHeader title="XML" subheader="eXtended Markup Language" />
        <CardHeader title="PNG" subheader="Portable Network Graphics" />
        <CardHeader title="JPEG" subheader="Joint Photography Experts Group" />
        <CardHeader title="GEOJSON" subheader="Geographic JSON" />
        <CardHeader title="23ANDME" subjeader="Genomics Summary" />
    </div>
  )
}