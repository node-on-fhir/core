// imports/ui/extensible/NoDataPage.jsx
//
// Default "no data yet" card rendered by DataGuard when its dataCount is 0.
// Brand packages can replace this app-wide via
// components: { NoDataPage: ... } on their workflow default export
// (see extensions/API.md).
//
// Extracted from the legacy NoDataWrapper (imports/ui/NoDataWrapper.jsx,
// now a deprecated alias of DataGuard). Prop names and defaults preserved.

import React from 'react';
import { Button, CardContent, Typography, Card, Box } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import PropTypes from 'prop-types';
import { useNavigate } from "react-router-dom";

export function NoDataPage({
    title = "No Data",
    subheader = "Click the button to begin importing data.",
    buttonLabel = "Import Data",
    noDataImagePath = "NoData.png",
    marginTop = "0px",
    redirectPath = "/import-data",
    titleVariant = "h5"
}){

    const navigate = useNavigate();

    function handleOpenPage(){
        if(redirectPath){
            navigate(redirectPath, { replace: true });
        } else {
            navigate("/", { replace: true });
        }
    }

    let noDataImageElement;
    if(noDataImagePath){
        noDataImageElement = <img src={noDataImagePath} style={{width: '100%', marginTop: marginTop}} />;
    }

    return (
        <Box
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
                        onClick={handleOpenPage}
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
    );
}

NoDataPage.propTypes = {
    title: PropTypes.string,
    subheader: PropTypes.string,
    buttonLabel: PropTypes.string,
    noDataImagePath: PropTypes.string,
    marginTop: PropTypes.string,
    redirectPath: PropTypes.string,
    titleVariant: PropTypes.string
};

export default NoDataPage;
