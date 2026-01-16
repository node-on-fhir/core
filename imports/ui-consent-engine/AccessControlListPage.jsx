
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
  
  function AccessControlListPage(props){
  
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
    function renderSecurityLabel(securityLabel){
      return (
        <TableCell className="securityLabel">{ securityLabel }</TableCell>
      );
    }
    function renderSecurityLabelHeader(){
      return (
        <TableCell className="securityLabel">Value</TableCell>
      );
    }
    function renderQualifier(qualifier){
      return (
        <TableCell className="qualifier">{ qualifier }</TableCell>
      );
    }
    function renderQualifierHeader(){
      return (
        <TableCell className="qualifier">Qualifier</TableCell>
      );
    }
    function renderArg(arg){
      return (
        <TableCell className="arg">{ arg }</TableCell>
      );
    }
    function renderArgHeader(){
      return (
        <TableCell className="arg">Argument</TableCell>
      );
    }
    function renderId(id){
      return (
        <TableCell className="id">{ id }</TableCell>
      );
    }
    function renderIdHeader(){
      return (
        <TableCell className="id">Id</TableCell>
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
        { renderId(get(accessControlRecord, 'ridole', '')) }
        { renderRole(get(accessControlRecord, 'role', '')) }
        { renderResource(get(accessControlRecord, 'resource', ''))}
        { renderAction(get(accessControlRecord, 'action', ''))}
        { renderAttribute(get(accessControlRecord, 'attributes', '')) }
        { renderArg(get(accessControlRecord, 'args', '')) }
        { renderQualifier(get(accessControlRecord, 'qualifier', '')) }
        { renderSecurityLabel(get(accessControlRecord, 'securityLabel', ''))}
      </TableRow>)

      });
    }

    return(
      <div id="AccessControlListPage" paddingLeft={20} paddingRight={20} style={{marginTop: '64px', marginBottom: '84px'}}>
          <Grid container spacing={3} justify="center">
            <Grid item md={10}>
              <CardHeader title="Access Control List" />            
              <Card>
                <CardContent>                
                <Table id="accessControlList" >
                  <TableHead>
                    <TableRow>
                      { renderIdHeader() } 
                      { renderRoleHeader() } 
                      { renderResourceHeader() }
                      { renderActionHeader() }
                      { renderAttributeHeader() } 
                      { renderArgHeader() }
                      { renderQualifierHeader() }
                      { renderSecurityLabelHeader() }
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
  
export default AccessControlListPage;
  
  