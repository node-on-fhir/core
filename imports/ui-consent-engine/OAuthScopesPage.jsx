
import { 
    Grid,
    Card,
    Button,
    CardHeader,
    CardContent,
    CardActions,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TablePagination
  } from '@mui/material';
  
  import { Meteor } from 'meteor/meteor';
  import { Session } from 'meteor/session';
  
  import React, {Component} from 'react'
  import { get, has, sortBy } from 'lodash';
  
  import { useTracker } from 'meteor/react-meteor-data';
  
  import moment from 'moment';
  
  import { Consents } from '../imports/lib/schemas/SimpleSchemas/Consents';

  
  function OAuthScopesPage(props){
  
    let data = {
      currentUser: null,
      consents: [],
      selectedConsent: false,
      accessControlList: []
    }
    
    data.currentUser = useTracker(function(){
      return Session.get('currentUser');
    })
  
    data.consents = useTracker(function(){
      return Consents.find().fetch()
    })
    data.selectedConsent = useTracker(function(){
      return Consents.findOne();
    })
    data.accessControlList = useTracker(function(){
      return Session.get('masterAccessControlList');
    })



    function renderRole(city){
      return (
        <TableCell className="city ">{ city }</TableCell>
      );
    }
    function renderRoleHeader(){
      return (
        <TableCell className="city">Role</TableCell>
      );
    }
    function renderResource(city){
      return (
        <TableCell className="city ">{ city }</TableCell>
      );
    }
    function renderResourceHeader(){
      return (
        <TableCell className="city">Resource</TableCell>
      );
    }



    function renderAttribute(attribute){
      return (
        <TableCell className="attribute">{ attribute }</TableCell>
      );
    }
    function renderAttributeHeader(){
      return (
        <TableCell className="attribute">Attributes</TableCell>
      );
    }
    function renderAction(city){
      return (
        <TableCell className="city ">{ city }</TableCell>
      );
    }
    function renderActionHeader(){
      return (
        <TableCell className="city">Action</TableCell>
      );
    }


    function handleClickRow(index){
      // // let selectedValue = get(codeSystem, 'concept.' + index);
      // // // setSelectedValue(selectedValue);
      // // Session.set('CodeSystem.selectedValue', selectedValue )

      // // console.log(selectedValue);

      // if(typeof onSelection === "function"){
      //   onSelection(selectedValue)
      // }
    }

    let renderElements = [];
    let conceptsTable;
    let rowStyle = {
      cursor: 'pointer'
    }

    if(Array.isArray(data.accessControlList)){
      data.accessControlList.forEach(function(accessControlRecord, accessControlIndex){
        renderElements.push(<TableRow className="practitionerRow" key={accessControlIndex} style={rowStyle} onClick={ handleClickRow.bind(this, accessControlIndex)} hover={true} >                      
        { renderRole(get(accessControlRecord, 'role')) }
        { renderResource(get(accessControlRecord, 'resource'))}
        { renderAttribute(get(accessControlRecord, 'attributes')) }
        { renderAction(get(accessControlRecord, 'action'))}
      </TableRow>)

      });
    }

    return(
      <div id="OAuthScopesPage" paddingLeft={20} paddingRight={20} style={{marginTop: '64px', marginBottom: '84px'}}>
          <Grid container spacing={3} justify="center">
            <Grid item md={6}>
            <CardHeader title="OAuth Scopes" />
              <Card>
                <CardContent>                
                <Table id="accessControlList" >
                  <TableHead>
                    <TableRow>
                      { renderRoleHeader() } 
                      { renderResourceHeader() }
                      { renderAttributeHeader() } 
                      { renderActionHeader() }
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    { renderElements }
                  </TableBody>
                </Table>
                  
                </CardContent>
              </Card>            
            </Grid>
          </Grid>
      </div>
    );
}
  
export default OAuthScopesPage;
  
  