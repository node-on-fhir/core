import { 
  Grid, 
  Button, 
  Container,
  Typography,
  DatePicker,
  FormControl,
  InputLabel,
  Input,
  InputAdornment,
  FormControlLabel,
  Checkbox
} from '@mui/material';


import React from 'react';
import { useTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';

import { Meteor } from 'meteor/meteor';

import moment from 'moment';
import { get, set } from 'lodash';



function BasicDetail(props){

  let { 
    children, 
    basic,
    ...otherProps 
  } = props;

  return(
    <div className='BasicDetails'>

        <Grid container spacing={3}>
          <Grid item xs={6}>
            <FormControl style={{width: '100%', marginTop: '20px'}}>
              <InputAdornment>Title</InputAdornment>
              <Input
                id="titleInput"
                name="titleInput"
                placeholder="Lorem ipsum."              
                value={get(basic, 'title')}
                //onChange={handleFhirEndpointChange}
                fullWidth              
              />       
            </FormControl>   
            <FormControl style={{width: '100%', marginTop: '20px'}}>
              <InputAdornment>Publisher</InputAdornment>
              <Input
                id="publisherInput"
                name="publisherInput"
                value={get(basic, 'publisher')}
                //onChange={handleFhirEndpointChange}
                fullWidth              
              />       
            </FormControl>      
          </Grid>
          <Grid item xs={3}>
            <FormControl style={{width: '100%', marginTop: '20px'}}>
              <InputAdornment>Version</InputAdornment>
              <Input
                id="versionInput"
                name="versionInput"
                placeholder="2020.2"              
                value={get(basic, 'version')}
                //onChange={handleFhirEndpointChange}
                fullWidth              
              />          
            </FormControl>
            <FormControl style={{width: '100%', marginTop: '20px'}}>
              <InputAdornment>Identifier</InputAdornment>
              <Input
                id="identifierInput"
                name="identifierInput"
                placeholder="XYZ.1"              
                value={get(basic, 'identifier[0].value')}
                //onChange={handleFhirEndpointChange}
                fullWidth              
              />
            </FormControl>     
          </Grid>
          <Grid item xs={3}>
            <FormControl style={{width: '100%', marginTop: '20px'}}>
              <InputAdornment>Status</InputAdornment>
              <Input
                id="statusInput"
                name="statusInput"
                placeholder="active"              
                value={get(basic, 'status')}
                //onChange={handleFhirEndpointChange}
                fullWidth              
              />    
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl style={{width: '100%', marginTop: '20px'}}>
              <InputAdornment>Description</InputAdornment>
              <Input
                id="descriptionInput"
                name="descriptionInput"
                placeholder="Lorem ipsum."              
                value={get(basic, 'description')}
                //onChange={handleFhirEndpointChange}
                fullWidth           
                multiline   
              />
            </FormControl>
                             
          </Grid>

          
        </Grid>
    </div>
  );
}

BasicDetail.propTypes = {
  id: PropTypes.string,
  fhirVersion: PropTypes.string,
  basicId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  basic: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  showPatientInputs: PropTypes.bool,
  showHints: PropTypes.bool,
  onInsert: PropTypes.func,
  onUpsert: PropTypes.func,
  onRemove: PropTypes.func,
  onCancel: PropTypes.func
};


export default BasicDetail;