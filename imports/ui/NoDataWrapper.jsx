import React, { useState } from 'react';

import { Button, Grid, CardHeader, CardContent, Typography, Card, Box } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';


import PropTypes from 'prop-types';

import { useNavigate } from "react-router-dom";

export function NoDataWrapper(props){

    const navigate = useNavigate();

    let { 
        children,
        dataCount,
        title,
        subheader,
        noDataImagePath,
        buttonLabel,
        marginTop,
        redirectPath,
        titleVariant = 'h5',
        ...otherProps 
    } = props;
    
    // Meteor.absoluteUrl() + noDataImage
    
    function handleOpenPage(){
        if(redirectPath){
            navigate(redirectPath, { replace: true });
        } else {
            navigate("/", { replace: true });
        }
    }
    
    let dataManagementElements = null;
    if(dataCount > 0){
        if(children){
            dataManagementElements = children;
        }
    } else {
    let noDataImageElement;
    if(noDataImagePath){
        noDataImageElement = <img src={noDataImagePath} style={{width: '100%', marginTop: marginTop}} />;
    }
    dataManagementElements = <Box 
        sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            textAlign: 'center'
        }}
    >
        <Card 
            sx={{ 
                maxWidth: '600px',
                width: '100%',
                borderRadius: 3,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'background.paper'
            }}
        >
            <CardContent sx={{ p: 6 }}>
                <Box sx={{ mb: 3 }}>
                    <Typography 
                        variant={titleVariant}
                        sx={{ 
                            fontWeight: 500,
                            color: 'text.primary',
                            mb: 2
                        }}
                    >
                        {title}
                    </Typography>
                    {subheader && (
                        <Typography 
                            variant="body1" 
                            sx={{ 
                                color: 'text.secondary',
                                lineHeight: 1.7,
                                maxWidth: '480px',
                                mx: 'auto'
                            }}
                        >
                            {subheader}
                        </Typography>
                    )}
                </Box>
                { noDataImageElement }
                <Button 
                    variant="contained"
                    color="primary"
                    size="large"
                    startIcon={<GroupIcon />}
                    onClick={handleOpenPage.bind(this)}
                    sx={{
                        mt: 2,
                        px: 4,
                        py: 1.5,
                        fontSize: '1rem',
                        fontWeight: 500,
                        borderRadius: 2,
                        textTransform: 'none',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        '&:hover': {
                            boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
                        }
                    }}
                >
                    {buttonLabel}
                </Button>
            </CardContent>
        </Card>
    </Box>
    }

    return(dataManagementElements);
}



NoDataWrapper.propTypes = { 
    dataCount: PropTypes.number,
    title: PropTypes.string,
    subheader: PropTypes.string,
    buttonLabel: PropTypes.string,
    noDataImagePath: PropTypes.string,
    marginTop: PropTypes.string,
    redirectPath: PropTypes.string,
    titleVariant: PropTypes.string
};
  
NoDataWrapper.defaultProps = {
    dataCount: 0,
    title: "No Data",
    subheader: "Click the button to begin importing data.",
    buttonLabel: "Import Data",
    noDataImagePath: "NoData.png",
    marginTop: "0px",
    redirectPath: "/import-data",
    titleVariant: "h5"
}
  
  export default NoDataWrapper