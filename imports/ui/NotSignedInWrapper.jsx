import React, { useState } from 'react';

import { Button, Grid, CardHeader, CardContent, Typography } from '@mui/material';

import { ReactMeteorData, useTracker } from 'meteor/react-meteor-data';
import PropTypes from 'prop-types';

import { useNavigate } from "react-router-dom";

import { Session } from 'meteor/session';
import { Meteor } from 'meteor/meteor';

export function NotSignedInWrapper(props){

    const navigate = useNavigate();
    
    let { 
        children,
        dataCount,
        title,
        subheader,
        notSignedInImagePath,
        buttonLabel,
        marginTop,
        redirectPath,
        ...otherProps 
    } = props;
    
    // Meteor.absoluteUrl() + noDataImage

    let currentUser = null;
    currentUser = useTracker(function(){
        return Session.get("currentUser");
    }, []);
    
    function handleOpenPage(){
        if(redirectPath){
            navigate(redirectPath, { replace: true });
        } else {
            navigate("/", { replace: true });
        }
    }

    function toggleLoginDialog(){
        // console.log('Toggle login dialog open/close.')
        Session.set('mainAppDialogJson', false);
        Session.set('mainAppDialogMaxWidth', "sm");
    
        if(Session.get('currentUser')){
          Session.set('mainAppDialogTitle', "Logout");
          Session.set('mainAppDialogComponent', "LogoutDialog");
        } else {
          Session.set('mainAppDialogTitle', "Login");
          Session.set('mainAppDialogComponent', "LoginDialog");      
        }
    
        Session.toggle('mainAppDialogOpen');
    }
    
    let dataManagementElements = null;
    if(currentUser){
        if(children){
            dataManagementElements = children;    
        }       
    } else {
        let noUserMessageElement;
        if(notSignedInImagePath){
            noUserMessageElement = <img src={notSignedInImagePath} style={{width: '100%', marginTop: marginTop}} />;
        }
        dataManagementElements = <Grid justify="center" container spacing={8} style={{marginTop: '0px', marginBottom: '80px'}}>            
            <Grid item md={6}>
                <CardHeader title={title} subheader={subheader} />
                { noUserMessageElement }
                <CardContent>
                <Button 
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={toggleLoginDialog.bind(this)}
                >{buttonLabel}</Button>

                </CardContent>
            </Grid>
        </Grid>
    }

    return(dataManagementElements);
}



NotSignedInWrapper.propTypes = { 
    dataCount: PropTypes.number,
    title: PropTypes.string,
    subheader: PropTypes.string,
    buttonLabel: PropTypes.string,
    notSignedInImagePath: PropTypes.string,
    marginTop: PropTypes.string,
    redirectPath: PropTypes.string
};
  
NotSignedInWrapper.defaultProps = {
    dataCount: 0,
    title: "Not Signed In",
    subheader: "Lets get started.",
    buttonLabel: "Sign In",
    notSignedInImagePath: "",
    marginTop: "0px",
    redirectPath: "/import-data"
}
  
  export default NotSignedInWrapper